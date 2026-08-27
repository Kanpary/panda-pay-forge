import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { AdminCard, AdminShell, adminNoIndex } from "@/components/AdminShell";
import { adminOverview } from "@/lib/admin.functions";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/_admin/admin/")({
  head: () => ({
    meta: [
      { title: "Visão geral do admin — PandaPix" },
      { name: "description", content: "Indicadores de depósitos, saques, comissões e usuários." },
      adminNoIndex,
    ],
  }),
  component: AdminHome,
});

const cards: { key: string; label: string; money?: boolean }[] = [
  { key: "usuarios", label: "Usuários" },
  { key: "usuarios_hoje", label: "Novos hoje" },
  { key: "depositos_pendentes", label: "Depósitos pendentes" },
  { key: "depositos_pagos", label: "Depósitos pagos" },
  { key: "total_depositado", label: "Total depositado", money: true },
  { key: "saques_pendentes", label: "Saques pendentes" },
  { key: "total_sacado", label: "Total sacado", money: true },
  { key: "comissoes_pendentes", label: "Comissões pendentes" },
  { key: "total_comissoes", label: "Total em comissões", money: true },
  { key: "total_apostado", label: "Total apostado", money: true },
];

function AdminHome() {
  const overviewFn = useServerFn(adminOverview);
  const query = useQuery({ queryKey: ["admin-overview"], queryFn: () => overviewFn() });

  const data = (query.data ?? {}) as Record<string, number>;

  return (
    <AdminShell title="Visão geral" description="Resumo operacional da plataforma.">
      {query.isLoading ? (
        <AdminCard>
          <p className="text-xs text-muted-foreground">Carregando indicadores…</p>
        </AdminCard>
      ) : query.error ? (
        <AdminCard>
          <p className="text-xs text-destructive">{(query.error as Error).message}</p>
        </AdminCard>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {cards
            .filter((card) => data[card.key] !== undefined)
            .map((card) => (
              <div key={card.key} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {card.label}
                </p>
                <p className="mt-1 text-xl font-extrabold text-primary">
                  {card.money ? brl(data[card.key]) : (data[card.key] ?? 0)}
                </p>
              </div>
            ))}
        </div>
      )}

      <AdminCard title="Atalhos">
        <div className="flex flex-wrap gap-2">
          {[
            { to: "/admin/depositos", label: "Aprovar depósitos" },
            { to: "/admin/saques", label: "Decidir saques" },
            { to: "/admin/comissoes", label: "Liberar comissões" },
            { to: "/admin/usuarios", label: "Usuários" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </AdminCard>
    </AdminShell>
  );
}
