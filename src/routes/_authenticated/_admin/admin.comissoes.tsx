import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import {
  AdminCard,
  AdminEmpty,
  AdminRow,
  AdminShell,
  adminNoIndex,
  smallBtn,
  smallBtnDanger,
  statusFilters,
} from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { listCommissions } from "@/lib/admin-lists.functions";
import { decideCommission } from "@/lib/admin.functions";
import { brl, dateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/_admin/admin/comissoes")({
  head: () => ({
    meta: [
      { title: "Comissões — PandaPix Admin" },
      { name: "description", content: "Liberação e rejeição de comissões de afiliados." },
      adminNoIndex,
    ],
  }),
  component: AdminCommissions,
});

function AdminCommissions() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("pending");
  const load = useServerFn(listCommissions);
  const decide = useServerFn(decideCommission);

  const query = useQuery({
    queryKey: ["admin-commissions", status],
    queryFn: () => load({ data: { status } }),
  });

  const mutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approved" | "paid" | "rejected" }) =>
      decide({ data: { id, decision } }),
    onSuccess: async () => {
      toast.success("Comissão processada.");
      await queryClient.invalidateQueries({ queryKey: ["admin-commissions"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = query.data ?? [];

  return (
    <AdminShell
      title="Comissões"
      description="Libere ou rejeite comissões de afiliados."
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
          <AdminEmpty text="Nenhuma comissão encontrada." />
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <AdminRow
                key={row.id}
                title={
                  <span className="flex items-center gap-2">
                    {brl(row.amount)}
                    <StatusBadge status={row.status} />
                    <span className="text-[10px] uppercase text-muted-foreground">{row.tipo}</span>
                  </span>
                }
                subtitle={
                  <>
                    Afiliado: {row.afiliado ?? row.affiliate_id} • Indicado:{" "}
                    {row.indicado ?? row.referred_user_id} • {dateTime(row.created_at)}
                    {row.released_at ? ` • liberado em ${dateTime(row.released_at)}` : null}
                  </>
                }
                right={
                  row.status === "pending" ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={smallBtn}
                        onClick={() => mutation.mutate({ id: row.id, decision: "approved" })}
                        disabled={mutation.isPending}
                      >
                        Liberar
                      </button>
                      <button
                        type="button"
                        className={smallBtnDanger}
                        onClick={() => mutation.mutate({ id: row.id, decision: "rejected" })}
                        disabled={mutation.isPending}
                      >
                        Rejeitar
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
