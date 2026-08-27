import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { AdminCard, AdminEmpty, AdminRow, AdminShell, adminNoIndex, smallBtn, smallBtnDanger, statusFilters } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { listDeposits } from "@/lib/admin-lists.functions";
import { decideDeposit } from "@/lib/admin.functions";
import { brl, dateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/_admin/admin/depositos")({
  head: () => ({
    meta: [
      { title: "Depósitos — PandaPix Admin" },
      { name: "description", content: "Aprovação e gestão de depósitos dos jogadores." },
      adminNoIndex,
    ],
  }),
  component: AdminDeposits,
});

function AdminDeposits() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("pending");
  const load = useServerFn(listDeposits);
  const decide = useServerFn(decideDeposit);

  const query = useQuery({
    queryKey: ["admin-deposits", status],
    queryFn: () => load({ data: { status } }),
  });

  const mutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "paid" | "cancelled" }) =>
      decide({ data: { id, decision } }),
    onSuccess: async () => {
      toast.success("Depósito processado.");
      await queryClient.invalidateQueries({ queryKey: ["admin-deposits"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = query.data ?? [];

  return (
    <AdminShell
      title="Depósitos"
      description="Aprove ou cancele depósitos dos jogadores."
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
          <AdminEmpty text="Nenhum depósito encontrado." />
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
                    {row.nome ?? row.email ?? row.user_id} • {row.gateway} • {dateTime(row.created_at)}
                    {row.paid_at ? ` • pago em ${dateTime(row.paid_at)}` : null}
                  </>
                }
                right={
                  row.status === "pending" ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={smallBtn}
                        onClick={() => mutation.mutate({ id: row.id, decision: "paid" })}
                        disabled={mutation.isPending}
                      >
                        Aprovar
                      </button>
                      <button
                        type="button"
                        className={smallBtnDanger}
                        onClick={() => mutation.mutate({ id: row.id, decision: "cancelled" })}
                        disabled={mutation.isPending}
                      >
                        Cancelar
                      </button>
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
