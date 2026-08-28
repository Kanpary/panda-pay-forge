import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { buttonClass, Field, inputClass } from "@/components/AuthShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { brl, dateTime } from "@/lib/format";
import { requestWithdrawal } from "@/lib/player.functions";

export const Route = createFileRoute("/_authenticated/saque")({
  head: () => ({
    meta: [
      { title: "Sacar via Pix — PandaPix" },
      { name: "description", content: "Solicite o saque do seu saldo direto na sua chave Pix." },
      { property: "og:title", content: "Sacar via Pix — PandaPix" },
      { property: "og:description", content: "Saque rápido para sua chave Pix." },
    ],
  }),
  component: SaquePage,
});

const pixTypes = [
  { value: "cpf", label: "CPF" },
  { value: "email", label: "E-mail" },
  { value: "telefone", label: "Telefone" },
  { value: "aleatoria", label: "Aleatória" },
] as const;

function SaquePage() {
  const { profile, refresh } = useAuth();
  const queryClient = useQueryClient();
  const requestWithdrawalFn = useServerFn(requestWithdrawal);
  const mountedRef = useRef(false);

  const [amount, setAmount] = useState(30);
  const [pixType, setPixType] = useState<(typeof pixTypes)[number]["value"]>("cpf");
  const [pixKey, setPixKey] = useState("");

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!profile) return;
    setPixType((profile.pix_type as (typeof pixTypes)[number]["value"]) || "cpf");
    setPixKey(profile.pix_key ?? "");
  }, [profile]);

  const settingsQuery = useQuery({
    queryKey: ["settings", "gateway-public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "gateway")
        .maybeSingle();
      return (data?.value ?? {}) as Record<string, number>;
    },
  });

  const listQuery = useQuery({
    queryKey: ["my-withdrawals-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("id, amount, taxa, status, tipo, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () =>
      requestWithdrawalFn({
        data: { amount, pix_type: pixType, pix_key: pixKey.trim(), tipo: "jogador" },
      }),
    onSuccess: async () => {
      if (!mountedRef.current) return;
      toast.success("Saque solicitado! Acompanhe o status abaixo.");
      await refresh();
      void queryClient.invalidateQueries({ queryKey: ["my-withdrawals-full"] });
      void queryClient.invalidateQueries({ queryKey: ["my-withdrawals"] });
    },
    onError: (error: Error) => {
      if (!mountedRef.current) return;
      toast.error(error.message);
    },
  });

  const min = Number(settingsQuery.data?.["saque_min"] ?? 30);
  const max = Number(settingsQuery.data?.["saque_max"] ?? 5000);
  const taxa = Number(settingsQuery.data?.["taxa_saque"] ?? 0);

  return (
    <AppLayout title="Sacar">
      <section className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Saldo disponível</p>
        <p className="text-2xl font-extrabold text-primary">{brl(profile?.saldo)}</p>

        <div className="mt-4 space-y-3">
          <Field label="Valor" hint={`Mínimo ${brl(min)} · máximo ${brl(max)} · taxa ${brl(taxa)}`}>
            <input
              type="number"
              min={min}
              max={max}
              className={inputClass}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </Field>

          <Field label="Tipo de chave Pix">
            <select
              className={inputClass}
              value={pixType}
              onChange={(e) => setPixType(e.target.value as (typeof pixTypes)[number]["value"])}
            >
              {pixTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Chave Pix">
            <input
              className={inputClass}
              value={pixKey}
              maxLength={120}
              onChange={(e) => setPixKey(e.target.value)}
            />
          </Field>

          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className={buttonClass}
          >
            {mutation.isPending ? "Enviando..." : "Solicitar saque"}
          </button>
          <p className="text-[11px] text-muted-foreground">
            O valor é reservado do seu saldo na solicitação e devolvido caso o saque seja recusado.
          </p>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold">Meus saques</h2>
        <div className="mt-3 space-y-2">
          {(listQuery.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum saque ainda.</p>
          ) : (
            (listQuery.data ?? []).map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold">{brl(w.amount)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {dateTime(w.created_at)} · {w.tipo}
                  </p>
                </div>
                <StatusBadge status={w.status} />
              </div>
            ))
          )}
        </div>
      </section>
    </AppLayout>
  );
}
