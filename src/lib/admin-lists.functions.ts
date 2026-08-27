import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/admin-guard";

const listSchema = z.object({
  status: z.string().trim().max(20).optional(),
  search: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(200).default(50),
});

export const listDeposits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => listSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let query = context.supabase
      .from("deposits")
      .select("id, user_id, amount, bonus, status, gateway, created_at, paid_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.status) query = query.eq("status", data.status as "pending");
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const ids = [...new Set((rows ?? []).map((r) => r.user_id))];
    const { data: people } = ids.length
      ? await context.supabase.from("profiles").select("id, nome, email").in("id", ids)
      : { data: [] as { id: string; nome: string | null; email: string | null }[] };

    return (rows ?? []).map((r) => {
      const p = (people ?? []).find((x) => x.id === r.user_id);
      return { ...r, nome: p?.nome ?? null, email: p?.email ?? null };
    });
  });

export const listWithdrawals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => listSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let query = context.supabase
      .from("withdrawals")
      .select(
        "id, user_id, amount, taxa, status, tipo, pix_type, pix_key, nome, cpf, motivo_rejeicao, created_at, processed_at",
      )
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.status) query = query.eq("status", data.status as "pending");
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listCommissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => listSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let query = context.supabase
      .from("affiliate_commissions")
      .select("id, affiliate_id, referred_user_id, tipo, amount, status, created_at, released_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.status) query = query.eq("status", data.status as "pending");
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const ids = [
      ...new Set(
        (rows ?? []).flatMap(
          (r) => [r.affiliate_id, r.referred_user_id].filter(Boolean) as string[],
        ),
      ),
    ];
    const { data: people } = ids.length
      ? await context.supabase.from("profiles").select("id, nome, email").in("id", ids)
      : { data: [] as { id: string; nome: string | null; email: string | null }[] };

    return (rows ?? []).map((r) => ({
      ...r,
      afiliado: (people ?? []).find((p) => p.id === r.affiliate_id)?.email ?? null,
      indicado: (people ?? []).find((p) => p.id === r.referred_user_id)?.email ?? null,
    }));
  });

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => listSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let query = context.supabase
      .from("profiles")
      .select(
        "id, nome, email, telefone, saldo, saldo_bonus, saldo_comissao, tipo_conta, is_demo, bloqueado, total_depositado, total_apostado, affiliate_code, referred_by, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.search) {
      const term = `%${data.search}%`;
      query = query.or(`email.ilike.${term},nome.ilike.${term}`);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const idSchema = z.object({ id: z.string().uuid() });

export const getUserDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: profile, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);

    const { data: limits } = await context.supabase
      .from("player_game_limits")
      .select("rtp, min_bet, max_bet, daily_bet_limit, daily_loss_limit, enabled, updated_at")
      .eq("user_id", data.id)
      .maybeSingle();

    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.id);
    const { data: deposits } = await context.supabase
      .from("deposits")
      .select("id, amount, status, created_at")
      .eq("user_id", data.id)
      .order("created_at", { ascending: false })
      .limit(10);
    const { data: withdrawals } = await context.supabase
      .from("withdrawals")
      .select("id, amount, status, created_at")
      .eq("user_id", data.id)
      .order("created_at", { ascending: false })
      .limit(10);

    return {
      profile,
      limits,
      roles: (roles ?? []).map((r) => r.role),
      deposits: deposits ?? [],
      withdrawals: withdrawals ?? [],
    };
  });

export const listRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => listSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: roles, error } = await context.supabase
      .from("user_roles")
      .select("id, user_id, role, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);

    const ids = [...new Set((roles ?? []).map((r) => r.user_id))];
    const { data: people } = ids.length
      ? await context.supabase.from("profiles").select("id, nome, email").in("id", ids)
      : { data: [] as { id: string; nome: string | null; email: string | null }[] };

    return (roles ?? []).map((r) => {
      const p = (people ?? []).find((x) => x.id === r.user_id);
      return { ...r, nome: p?.nome ?? null, email: p?.email ?? null };
    });
  });

export const listDemoAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => listSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("profiles")
      .select("id, nome, email, saldo, created_at")
      .eq("is_demo", true)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listAffiliates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => listSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("profiles")
      .select(
        "id, nome, email, affiliate_code, saldo_comissao, comissao_cpa, comissao_revshare, tipo_conta, created_at",
      )
      .not("affiliate_code", "is", null)
      .order("saldo_comissao", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);

    const { data: refs } = await context.supabase.from("profiles").select("referred_by");
    const counts = new Map<string, number>();
    for (const r of refs ?? []) {
      if (r.referred_by) counts.set(r.referred_by, (counts.get(r.referred_by) ?? 0) + 1);
    }

    return (rows ?? []).map((r) => ({ ...r, indicados: counts.get(r.id) ?? 0 }));
  });

export const listGameHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => listSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("game_history")
      .select("id, user_id, aposta, ganho, resultado, is_demo, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);

    const ids = [...new Set((rows ?? []).map((r) => r.user_id))];
    const { data: people } = ids.length
      ? await context.supabase.from("profiles").select("id, email").in("id", ids)
      : { data: [] as { id: string; email: string | null }[] };

    return (rows ?? []).map((r) => ({
      ...r,
      email: (people ?? []).find((p) => p.id === r.user_id)?.email ?? null,
    }));
  });

export const getAdminSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data: settings, error } = await context.supabase
      .from("app_settings")
      .select("key, value");
    if (error) throw new Error(error.message);
    const { data: gameSettings } = await context.supabase
      .from("game_settings")
      .select("slug, value")
      .is("user_id", null);

    const map: Record<string, Record<string, string | number | boolean>> = {};
    for (const row of settings ?? []) {
      map[row.key] = (row.value ?? {}) as Record<string, string | number | boolean>;
    }
    const games: Record<string, number> = {};
    for (const row of gameSettings ?? []) games[row.slug] = Number(row.value);

    return { settings: map, games };
  });
