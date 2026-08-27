import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { buttonClass, Field, inputClass } from "@/components/AuthShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { brl, dateTime } from "@/lib/format";
import { requestWithdrawal } from "@/lib/player.functions";

export const Route = createFileRoute("/_authenticated/afiliado")({
  head: () => ({
    meta: [
      { title: "Área do afiliado — PandaPix" },
      { name: "description", content: "Compartilhe seu link, acompanhe indicados e saque suas comissões." },
      { property: "og:title", content: "Área do afiliado — PandaPix" },
      { property: "og:description", content: "Ganhe comissão por cada jogador indicado." },
    ],
  }),
  component: AfiliadoPage,
});

function AfiliadoPage() {
  const { profile, user, refresh } = useAuth();
  const queryClient = useQueryClient();
  const requestWithdrawalFn = useServerFn(requestWithdrawal);
  const [amount, setAmount] = useState(50);

  const link =
    typeof window !== "undefined" && profile?.affiliate_code
      ? `${window.location.origin}/register?ref=${profile.affiliate_code}`
      : "";

  const referralsQuery = useQuery({
    queryKey: ["my-referrals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("referred_by", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const commissionsQuery = useQuery({
    queryKey: ["my-commissions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_commissions")
        .select("id, tipo, amount, status, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });

  const totals = (commissionsQuery.data ?? []).reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + Number(c.amount);
      return acc;
    },
    {} as Record<string, number>,
  );

  const mutation = useMutation({
    mutationFn: async () =>
      requestWithdrawalFn({
        data: {
          amount,
          pix_type: (profile?.pix_type as "cpf") ?? "cpf",
          pix_key: profile?.pix_key ?? "",
          tipo: "afiliado",
        },
      }),
    onSuccess: async () => {
      toast.success("Saque de comissão solicitado!");
      await refresh();
      void queryClient.invalidateQueries({ queryKey: ["my-withdrawals-full"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppLayout title="Afiliado">
      <section className="panda-gradient rounded-2xl border border-border p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Saldo de comissão</p>
        <p className="text-2xl font-extrabold text-accent">{brl(profile?.saldo_comissao)}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat label="Indicados" value={String(referralsQuery.data ?? 0)} />
          <Stat label="Pendente" value={brl(totals["pending"] ?? 0)} />
          <Stat label="Liberado" value={brl((totals["approved"] ?? 0) + (totals["paid"] ?? 0))} />
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold">Seu link de indicação</h2>
        <p className="mt-2 break-all rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground">
          {link || "Gerando..."}
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              toast.success("Link copiado!");
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold"
          >
            <Copy className="size-3.5" /> Copiar link
          </button>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(profile?.affiliate_code ?? "");
              toast.success("Código copiado!");
            }}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-border px-3 py-2 text-xs font-semibold"
          >
            Copiar código {profile?.affiliate_code ?? ""}
          </button>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold">Sacar comissão</h2>
        <div className="mt-3 space-y-3">
          <Field label="Valor" hint={`Chave Pix usada: ${profile?.pix_key || "cadastre na tela de saque"}`}>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </Field>
          <button
            type="button"
            disabled={mutation.isPending || !profile?.pix_key}
            onClick={() => mutation.mutate()}
            className={buttonClass}
          >
            {mutation.isPending ? "Enviando..." : "Solicitar saque de comissão"}
          </button>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold">Comissões</h2>
        <div className="mt-3 space-y-2">
          {(commissionsQuery.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma comissão ainda.</p>
          ) : (
            (commissionsQuery.data ?? []).map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2">
                <div>
                  <p className="text-sm font-semibold">
                    {brl(c.amount)} · {c.tipo.toUpperCase()}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{dateTime(c.created_at)}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))
          )}
        </div>
      </section>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card/70 px-2 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
