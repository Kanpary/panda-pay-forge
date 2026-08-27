import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { AdminCard, AdminEmpty, AdminRow, AdminShell, adminNoIndex, smallBtn, smallBtnDanger, statusFilters } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { listWithdrawals } from "@/lib/admin-lists.functions";
import { decideWithdrawal } from "@/lib/admin.functions";
import { brl, dateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/_admin/admin/saques")({
  head: () => ({
    meta: [
      { title: "Saques — PandaPix Admin" },
      { name: "description", content: "Aprovação, pagamento e rejeição de saques." },
      adminNoIndex,
    ],
  }),
  component: AdminWithdrawals,
});

function AdminWithdrawals() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("pending");
  const [motivo, setMotivo] = useState("");
  const load = useServerFn(listWithdrawals);
  const decide = useServerFn(decideWithdrawal);

  const query = useQuery({
    queryKey: ["admin-withdrawals", status],
    queryFn: () => load({ data: { status } }),
  });

  const mutation = useMutation({
    mutationFn: ({
      id,
      decision,
      motivo,
    }: {
      id: string;
      decision: "approved" | "paid" | "rejected";
      motivo?: string;
    }) => decide({ data: { id, decision, motivo } }),
    onSuccess: async () => {
      toast.success("Saque processado.");
      setMotivo("");
      await queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = query.data ?? [];

  return (
    <AdminShell
      title="Saques"
      description="Aprove, pague ou rejeite saques dos jogadores e afiliados."
      actions={
        <select
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          {statusFilters.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      }
    >
      <AdminCard>
        {query.isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando…</p>
        ) : query.error ? (
          <p className="text-xs text-destructive">{(query.error as Error).message}</p>
        ) : rows.length === 0 ? (
          <AdminEmpty text="Nenhum saque encontrado." />
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <AdminRow
                key={row.id}
                title={
                  <span className="flex items-center gap-2">
                    {brl(row.amount)}
                    <StatusBadge status={row.status} />
                  </span>
                }
                subtitle={
                  <>
                    {row.tipo === "afiliado" ? "Afiliado" : "Jogador"} • {row.pix_type}: {row.pix_key}
                    {row.nome ? ` • ${row.nome}` : null} • {dateTime(row.created_at)}
                    {row.processed_at ? ` • processado em ${dateTime(row.processed_at)}` : null}
                  </>
                }
                right={
                  row.status === "pending" ? (
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                      {mutation.isPending ? null : (
                        <>
                          <button
                            type="button"
                            className={smallBtn}
                            onClick={() => mutation.mutate({ id: row.id, decision: "approved" })}
                          >
                            Aprovar
                          </button>
                          <button
                            type="button"
                            className={smallBtn}
                            onClick={() => mutation.mutate({ id: row.id, decision: "paid" })}
                          >
                            Pagar
                          </button>
                          <button
                            type="button"
                            className={smallBtnDanger}
                            onClick={() => {
                              const reason = window.prompt("Motivo da rejeição:");
                              if (reason === null) return;
                              mutation.mutate({ id: row.id, decision: "rejected", motivo: reason });
                            }}
                          >
                            Rejeitar
                          </button>
                        </>
                      )}
                    </div>
                  ) : null
                }
              />
            ))}
          </div>
        )}
      </AdminCard>
    </AdminShell>
  );
}
