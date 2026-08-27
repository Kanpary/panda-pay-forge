import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { AdminCard, AdminEmpty, AdminRow, AdminShell, adminNoIndex } from "@/components/AdminShell";
import { listAffiliates } from "@/lib/admin-lists.functions";
import { brl, dateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/_admin/admin/afiliados")({
  head: () => ({
    meta: [
      { title: "Afiliados — PandaPix Admin" },
      { name: "description", content: "Rede de afiliados e desempenho." },
      adminNoIndex,
    ],
  }),
  component: AdminAffiliates,
});

function AdminAffiliates() {
  const [search, setSearch] = useState("");
  const load = useServerFn(listAffiliates);

  const query = useQuery({
    queryKey: ["admin-affiliates", search],
    queryFn: () => load({ data: { search: search || undefined, limit: 100 } }),
  });

  const rows = query.data ?? [];

  return (
    <AdminShell
      title="Afiliados"
      description="Rede de indicação e saldo de comissões."
      actions={
        <input
          type="search"
          placeholder="Buscar por e-mail ou código"
          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm sm:w-72"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      }
    >
      <AdminCard>
        {query.isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando…</p>
        ) : query.error ? (
          <p className="text-xs text-destructive">{(query.error as Error).message}</p>
        ) : rows.length === 0 ? (
          <AdminEmpty text="Nenhum afiliado encontrado." />
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <AdminRow
                key={row.id}
                title={
                  <span className="flex items-center gap-2">
                    {row.nome ?? row.email ?? row.id}
                    <span className="text-[10px] text-muted-foreground">{row.affiliate_code}</span>
                  </span>
                }
                subtitle={
                  <>
                    Indicados: {row.indicados} • CPA: {brl(row.comissao_cpa)} • Revshare: {row.comissao_revshare}% •
                    Saldo comissão: {brl(row.saldo_comissao)} • {dateTime(row.created_at)}
                  </>
                }
              />
            ))}
          </div>
        )}
      </AdminCard>
    </AdminShell>
  );
}
