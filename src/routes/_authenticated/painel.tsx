import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownToLine, ArrowUpFromLine, Gamepad2 } from "lucide-react";

import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { brl, dateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Meu painel — PandaPix" },
      {
        name: "description",
        content: "Veja saldo, bônus, depósitos, saques e rodadas da sua conta PandaPix.",
      },
      { property: "og:title", content: "Meu painel — PandaPix" },
      { property: "og:description", content: "Saldo, histórico e atalhos de depósito e saque." },
    ],
  }),
  component: PainelPage,
});

function PainelPage() {
  const { profile, user } = useAuth();

  const depositsQuery = useQuery({
    queryKey: ["my-deposits", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposits")
        .select("id, amount, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const withdrawalsQuery = useQuery({
    queryKey: ["my-withdrawals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("id, amount, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const historyQuery = useQuery({
    queryKey: ["my-history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_history")
        .select("id, aposta, ganho, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppLayout>
      <section className="panda-gradient rounded-2xl border border-border p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Olá, {profile?.nome ?? "jogador"}
        </p>
        <p className="mt-1 text-3xl font-extrabold text-primary">{brl(profile?.saldo)}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>Bônus: {brl(profile?.saldo_bonus)}</span>
          <span>Comissão: {brl(profile?.saldo_comissao)}</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Link
            to="/deposito"
            className="flex flex-col items-center gap-1 rounded-xl bg-primary px-2 py-3 text-[11px] font-bold text-primary-foreground"
          >
            <ArrowDownToLine className="size-4" /> Depositar
          </Link>
          <Link
            to="/saque"
            className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card px-2 py-3 text-[11px] font-semibold"
          >
            <ArrowUpFromLine className="size-4" /> Sacar
          </Link>
          <Link
            to="/jogo"
            className="flex flex-col items-center gap-1 rounded-xl border border-accent/40 bg-card px-2 py-3 text-[11px] font-semibold text-accent"
          >
            <Gamepad2 className="size-4" /> Jogar
          </Link>
        </div>
      </section>

      <ListCard title="Últimos depósitos" empty="Nenhum depósito ainda.">
        {(depositsQuery.data ?? []).map((d) => (
          <Row key={d.id} label={brl(d.amount)} sub={dateTime(d.created_at)} status={d.status} />
        ))}
      </ListCard>

      <ListCard title="Últimos saques" empty="Nenhum saque ainda.">
        {(withdrawalsQuery.data ?? []).map((w) => (
          <Row key={w.id} label={brl(w.amount)} sub={dateTime(w.created_at)} status={w.status} />
        ))}
      </ListCard>

      <ListCard title="Últimas rodadas" empty="Você ainda não jogou.">
        {(historyQuery.data ?? []).map((h) => (
          <Row
            key={h.id}
            label={`Aposta ${brl(h.aposta)}`}
            sub={dateTime(h.created_at)}
            right={<span className="text-sm font-semibold text-primary">{brl(h.ganho)}</span>}
          />
        ))}
      </ListCard>
    </AppLayout>
  );
}

function ListCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.flat().filter(Boolean).length > 0;
  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-4">
      <h2 className="text-sm font-bold">{title}</h2>
      <div className="mt-3 space-y-2">
        {hasItems ? children : <p className="text-xs text-muted-foreground">{empty}</p>}
      </div>
    </section>
  );
}

function Row({
  label,
  sub,
  status,
  right,
}: {
  label: string;
  sub: string;
  status?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-secondary px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{label}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
      {status ? <StatusBadge status={status} /> : right}
    </div>
  );
}
