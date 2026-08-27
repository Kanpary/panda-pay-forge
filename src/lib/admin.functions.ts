import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: unknown; userId: string }) {
  const supabase = context.supabase as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
  };
  const { data } = await supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (data !== true) throw new Error("Acesso restrito a administradores.");
}

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.rpc("admin_overview");
    if (error) throw new Error(error.message);
    return data as Record<string, number>;
  });

const depositDecisionSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["paid", "cancelled"]),
});

export const decideDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => depositDecisionSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: deposit, error } = await supabaseAdmin
      .from("deposits")
      .select("id, user_id, amount, status")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    if (deposit.status !== "pending") throw new Error("Depósito já processado.");

    if (data.decision === "cancelled") {
      await supabaseAdmin.from("deposits").update({ status: "cancelled" }).eq("id", deposit.id);
      return { ok: true };
    }

    const { data: bonusSetting } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "bonus")
      .maybeSingle();
    const bonusCfg = (bonusSetting?.value ?? {}) as Record<string, number | boolean>;
    const bonus = bonusCfg["ativo"] ? (Number(deposit.amount) * Number(bonusCfg["percentual"] ?? 0)) / 100 : 0;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("saldo, saldo_bonus, total_depositado, referred_by")
      .eq("id", deposit.user_id)
      .single();

    await supabaseAdmin
      .from("profiles")
      .update({
        saldo: Number(profile?.saldo ?? 0) + Number(deposit.amount),
        saldo_bonus: Number(profile?.saldo_bonus ?? 0) + bonus,
        total_depositado: Number(profile?.total_depositado ?? 0) + Number(deposit.amount),
      })
      .eq("id", deposit.user_id);

    await supabaseAdmin
      .from("deposits")
      .update({ status: "paid", bonus, paid_at: new Date().toISOString() })
      .eq("id", deposit.id);

    if (profile?.referred_by) {
      const { data: affCfgRow } = await supabaseAdmin
        .from("app_settings")
        .select("value")
        .eq("key", "afiliados")
        .maybeSingle();
      const affCfg = (affCfgRow?.value ?? {}) as Record<string, number>;
      const minCpa = Number(affCfg["deposito_minimo_cpa"] ?? 20);

      const { count } = await supabaseAdmin
        .from("affiliate_commissions")
        .select("id", { count: "exact", head: true })
        .eq("referred_user_id", deposit.user_id)
        .eq("tipo", "cpa");

      if (Number(deposit.amount) >= minCpa && (count ?? 0) === 0) {
        await supabaseAdmin.from("affiliate_commissions").insert({
          affiliate_id: profile.referred_by,
          referred_user_id: deposit.user_id,
          deposit_id: deposit.id,
          tipo: "cpa",
          amount: Number(affCfg["cpa"] ?? 0),
          status: "pending",
        });
      }

      const revshare = Number(affCfg["revshare"] ?? 0);
      if (revshare > 0) {
        await supabaseAdmin.from("affiliate_commissions").insert({
          affiliate_id: profile.referred_by,
          referred_user_id: deposit.user_id,
          deposit_id: deposit.id,
          tipo: "revshare",
          amount: (Number(deposit.amount) * revshare) / 100,
          status: "pending",
        });
      }
    }

    return { ok: true };
  });

const withdrawalDecisionSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "paid", "rejected"]),
  motivo: z.string().trim().max(300).optional(),
});

export const decideWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => withdrawalDecisionSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: w, error } = await supabaseAdmin
      .from("withdrawals")
      .select("id, user_id, amount, status, tipo")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    if (w.status === "paid" || w.status === "rejected") throw new Error("Saque já finalizado.");

    if (data.decision === "rejected") {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("saldo, saldo_comissao")
        .eq("id", w.user_id)
        .single();
      await supabaseAdmin
        .from("profiles")
        .update(
          w.tipo === "afiliado"
            ? { saldo_comissao: Number(profile?.saldo_comissao ?? 0) + Number(w.amount) }
            : { saldo: Number(profile?.saldo ?? 0) + Number(w.amount) },
        )
        .eq("id", w.user_id);
    }

    await supabaseAdmin
      .from("withdrawals")
      .update({
        status: data.decision,
        motivo_rejeicao: data.decision === "rejected" ? (data.motivo ?? null) : null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", w.id);

    return { ok: true };
  });

const commissionSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "paid", "rejected"]),
});

export const decideCommission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => commissionSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: commission, error } = await supabaseAdmin
      .from("affiliate_commissions")
      .select("id, affiliate_id, amount, status")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    if (commission.status !== "pending") throw new Error("Comissão já processada.");

    if (data.decision !== "rejected") {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("saldo_comissao")
        .eq("id", commission.affiliate_id)
        .single();
      await supabaseAdmin
        .from("profiles")
        .update({ saldo_comissao: Number(profile?.saldo_comissao ?? 0) + Number(commission.amount) })
        .eq("id", commission.affiliate_id);
    }

    await supabaseAdmin
      .from("affiliate_commissions")
      .update({ status: data.decision, released_at: new Date().toISOString() })
      .eq("id", commission.id);

    return { ok: true };
  });

const userUpdateSchema = z.object({
  id: z.string().uuid(),
  saldo: z.number().min(0).max(1000000).optional(),
  saldo_bonus: z.number().min(0).max(1000000).optional(),
  saldo_comissao: z.number().min(0).max(1000000).optional(),
  bloqueado: z.boolean().optional(),
  is_demo: z.boolean().optional(),
  tipo_conta: z.enum(["jogador", "afiliado", "agente"]).optional(),
  comissao_cpa: z.number().min(0).max(10000).optional(),
  comissao_cpa_nivel2: z.number().min(0).max(10000).optional(),
  comissao_revshare: z.number().min(0).max(100).optional(),
});

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => userUpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const cleanPatch = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined),
    );
    if (Object.keys(cleanPatch).length === 0) return { ok: true };
    const { error } = await supabaseAdmin
      .from("profiles")
      .update(cleanPatch as any)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "agente", "afiliado", "user"]),
  grant: z.boolean(),
});

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => roleSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

const demoSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  nome: z.string().trim().min(2).max(80),
  saldo: z.number().min(0).max(1000000).default(1000),
});

export const createDemoAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => demoSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { nome: data.nome },
    });
    if (error) throw new Error(error.message);
    const userId = created.user!.id;

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (existingProfile) {
      await supabaseAdmin
        .from("profiles")
        .update({ is_demo: true, saldo: data.saldo, nome: data.nome })
        .eq("id", userId);
    } else {
      await supabaseAdmin.from("profiles").insert({
        id: userId,
        email: data.email,
        nome: data.nome,
        saldo: data.saldo,
        is_demo: true,
        affiliate_code: "aff" + userId.replace(/-/g, "").slice(0, 10),
      });
    }

    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "user" }, { onConflict: "user_id,role" });

    return { ok: true, id: userId };
  });

const settingsSchema = z.object({
  key: z.enum(["gateway", "aparencia", "pixel", "afiliados", "bonus"]),
  value: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});

export const saveAppSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => settingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert({ key: data.key, value: data.value }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const gameSettingSchema = z.object({
  items: z
    .array(z.object({ slug: z.string().trim().min(1).max(40), value: z.number().min(0).max(1000000) }))
    .max(20),
  userId: z.string().uuid().nullish(),
});

export const saveGameSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => gameSettingSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    for (const item of data.items) {
      const query = supabaseAdmin.from("game_settings").select("id").eq("slug", item.slug);
      const { data: existing } = await (data.userId
        ? query.eq("user_id", data.userId)
        : query.is("user_id", null)
      ).maybeSingle();

      if (existing) {
        await supabaseAdmin.from("game_settings").update({ value: item.value }).eq("id", existing.id);
      } else {
        await supabaseAdmin
          .from("game_settings")
          .insert({ slug: item.slug, value: item.value, user_id: data.userId ?? null });
      }
    }
    return { ok: true };
  });

const passwordSchema = z.object({
  current_password: z.string().min(6).max(72),
  new_password: z.string().min(8).max(72),
});

export const changeAdminPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => passwordSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.auth.updateUser({
      password: data.new_password,
      current_password: data.current_password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
