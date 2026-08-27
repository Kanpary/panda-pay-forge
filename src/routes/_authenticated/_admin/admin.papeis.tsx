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
} from "@/components/AdminShell";
import { listRoles } from "@/lib/admin-lists.functions";
import { setUserRole } from "@/lib/admin.functions";
import { dateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/_admin/admin/papeis")({
  head: () => ({
    meta: [
      { title: "Papéis de acesso — PandaPix Admin" },
      { name: "description", content: "Gerenciamento de papéis de usuários." },
      adminNoIndex,
    ],
  }),
  component: AdminRoles,
});

const roles = ["admin", "agente", "afiliado", "user"] as const;

function AdminRoles() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const load = useServerFn(listRoles);
  const setRole = useServerFn(setUserRole);

  const query = useQuery({
    queryKey: ["admin-roles", search],
    queryFn: () => load({ data: { search: search || undefined, limit: 100 } }),
  });

  const mutation = useMutation({
    mutationFn: ({ userId, role, grant }: { userId: string; role: string; grant: boolean }) =>
      setRole({ data: { userId, role: role as (typeof roles)[number], grant } }),
    onSuccess: async () => {
      toast.success("Papel atualizado.");
      await queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = query.data ?? [];

  return (
    <AdminShell
      title="Papéis de acesso"
      description="Conceda ou revogue papéis de admin, agente, afiliado e usuário."
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
          <AdminEmpty text="Nenhum papel encontrado." />
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <AdminRow
                key={row.id}
                title={row.email ?? row.user_id}
                subtitle={`${row.role} • ${dateTime(row.created_at)}`}
                right={
                  <button
                    type="button"
                    className={smallBtn}
                    onClick={() =>
                      mutation.mutate({ userId: row.user_id, role: row.role, grant: false })
                    }
                    disabled={mutation.isPending}
                  >
                    Remover
                  </button>
                }
              />
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard title="Conceder papel">
        <GrantForm onGrant={(userId, role) => mutation.mutate({ userId, role, grant: true })} />
      </AdminCard>
    </AdminShell>
  );
}

function GrantForm({ onGrant }: { onGrant: (userId: string, role: string) => void }) {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<(typeof roles)[number]>("agente");

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        if (!userId.trim()) return;
        onGrant(userId.trim(), role);
        setUserId("");
      }}
    >
      <input
        type="text"
        placeholder="ID do usuário (UUID)"
        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        value={userId}
        onChange={(event) => setUserId(event.target.value)}
      />
      <select
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        value={role}
        onChange={(event) => setRole(event.target.value as (typeof roles)[number])}
      >
        {roles.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <button type="submit" className={smallBtn}>
        Conceder
      </button>
    </form>
  );
}
