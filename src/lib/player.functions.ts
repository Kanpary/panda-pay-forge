import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const depositSchema = z.object({ amount: z.number().min(1).max(100000) });

const withdrawalSchema = z.object({
  amount: z.number().min(1).max(100000),
  pix_type: z.enum(["cpf", "email", "telefone", "aleatoria"]),
  pix_key: z.string().trim().min(3).max(120),
  tipo: z.enum(["jogador", "afiliado"]).default("jogador"),
});

async function readSetting(key: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("app_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value ?? {}) as Record<string, number | string | boolean>;
}

export const createDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => depositSchema.parse(input))
  .handler(async ({ data, context }) => {
    const gateway = await readSetting("gateway");
    const min = Number(gateway["deposito_min"] ?? 10);
    const max = Number(gateway["deposito_max"] ?? 5000);
    if (data.amount < min || data.amount > max) {
      throw new Error(`Valor deve estar entre R$ ${min} e R$ ${max}`);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: deposit, error } = await supabaseAdmin
      .from("deposits")
      .insert({ user_id: context.userId, amount: data.amount, status: "pending", gateway: "manual" })
      .select("id, amount, status, created_at")
      .single();
    if (error) throw new Error(error.message);
    return deposit;
  });

export const requestWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => withdrawalSchema.parse(input))
  .handler(async ({ data, context }) => {
    const gateway = await readSetting("gateway");
    const min = Number(gateway["saque_min"] ?? 30);
    const max = Number(gateway["saque_max"] ?? 5000);
    const taxa = Number(gateway["taxa_saque"] ?? 0);
    if (data.amount < min || data.amount > max) {
      throw new Error(`Saque deve estar entre R$ ${min} e R$ ${max}`);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("saldo, saldo_comissao, nome, cpf, bloqueado")
      .eq("id", context.userId)
      .single();
    if (profileError) throw new Error(profileError.message);
    if (profile.bloqueado) throw new Error("Conta bloqueada. Fale com o suporte.");

    const available = data.tipo === "afiliado" ? Number(profile.saldo_comissao) : Number(profile.saldo);
    if (data.amount > available) throw new Error("Saldo insuficiente.");

    const { error: debitError } = await supabaseAdmin
      .from("profiles")
      .update(
        data.tipo === "afiliado"
          ? { saldo_comissao: available - data.amount }
          : { saldo: available - data.amount },
      )
      .eq("id", context.userId);
    if (debitError) throw new Error(debitError.message);

    const { data: withdrawal, error } = await supabaseAdmin
      .from("withdrawals")
      .insert({
        user_id: context.userId,
        amount: data.amount,
        taxa,
        pix_type: data.pix_type,
        pix_key: data.pix_key,
        nome: profile.nome,
        cpf: profile.cpf,
        tipo: data.tipo,
        status: "pending",
      })
      .select("id, amount, status, created_at")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("profiles")
      .update({ pix_type: data.pix_type, pix_key: data.pix_key })
      .eq("id", context.userId);

    return withdrawal;
  });
