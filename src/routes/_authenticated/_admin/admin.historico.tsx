import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { AdminCard, AdminEmpty, AdminRow, AdminShell, adminNoIndex } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { listGameHistory } from "@/lib/admin-lists.functions";
import { brl, dateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/_admin/admin/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de jogo — PandaPix Admin" },
      { name: "description", content: "Auditoria de rodadas e resultados do jogo." },
      adminNoIndex,
    ],
  }),
  component: AdminGameHistory,
});

function AdminGameHistory() {
  const [search, setSearch] = useState("");
  const load = useServerFn(listGameHistory);

  const query = useQuery({
    queryKey: ["admin-history", search],
    queryFn: () => load({ data: { search: search || undefined, limit: 100 } }),
  });

  const rows = query.data ?? [];

  return (
    <AdminShell
      title="Histórico de jogo"
      description="Últimas rodadas e resultados dos jogadores."
      actions={
        <input
          type="search"
          placeholder="Buscar por e-mail"
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
          <AdminEmpty text="Nenhuma rodada encontrada." />
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <AdminRow
                key={row.id}
                title={
                  <span className="flex items-center gap-2">
                    Aposta {brl(row.aposta)}
                    {row.is_demo ? (
                      <span className="rounded-full border border-accent/30 px-2 py-0.5 text-[10px] text-accent">
                        Demo
                      </span>
                    ) : null}
                  </span>
                }
                subtitle={
                  <>
                    Ganho: {brl(row.ganho)} • Resultado: {row.resultado ?? "-"} • Jogador: {row.email ?? row.user_id} •{" "}
                    {dateTime(row.created_at)}
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
