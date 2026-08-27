import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { AdminCard, AdminEmpty, AdminRow, AdminShell, adminNoIndex } from "@/components/AdminShell";
import { listUsers } from "@/lib/admin-lists.functions";
import { brl, dateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/_admin/admin/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — PandaPix Admin" },
      { name: "description", content: "Busca e listagem de usuários da plataforma." },
      adminNoIndex,
    ],
  }),
  component: AdminUsers,
});

function AdminUsers() {
  const [search, setSearch] = useState("");
  const load = useServerFn(listUsers);

  const query = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => load({ data: { search: search || undefined, limit: 100 } }),
  });

  const rows = query.data ?? [];

  return (
    <AdminShell
      title="Usuários"
      description="Busque e gerencie contas de jogadores, afiliados e agentes."
      actions={
        <input
          type="search"
          placeholder="Buscar por e-mail ou nome"
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
          <AdminEmpty text="Nenhum usuário encontrado." />
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <AdminRow
                key={row.id}
                title={
                  <span className="flex items-center gap-2">
                    {row.nome ?? row.email ?? row.id}
                    {row.bloqueado ? (
                      <span className="rounded-full border border-destructive/30 px-2 py-0.5 text-[10px] text-destructive">
                        Bloqueado
                      </span>
                    ) : null}
                    {row.is_demo ? (
                      <span className="rounded-full border border-accent/30 px-2 py-0.5 text-[10px] text-accent">
                        Demo
                      </span>
                    ) : null}
                  </span>
                }
                subtitle={
                  <>
                    {row.email} • {row.tipo_conta} • Saldo: {brl(row.saldo)} • Bônus: {brl(row.saldo_bonus)} •{" "}
                    {dateTime(row.created_at)}
                  </>
                }
                right={
                  <Link
                    to={"/admin/usuarios/$id" as any}
                    params={{ id: row.id } as any}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                  >
                    Editar
                  </Link>
                }
              />
            ))}
          </div>
        )}
      </AdminCard>
    </AdminShell>
  );
}
