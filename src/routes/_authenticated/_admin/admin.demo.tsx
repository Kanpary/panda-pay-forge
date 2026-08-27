import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { AdminCard, AdminEmpty, AdminRow, AdminShell, adminNoIndex, smallBtn } from "@/components/AdminShell";
import { Field, inputClass } from "@/components/AuthShell";
import { listDemoAccounts } from "@/lib/admin-lists.functions";
import { createDemoAccount } from "@/lib/admin.functions";
import { brl, dateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/_admin/admin/demo")({
  head: () => ({
    meta: [
      { title: "Contas demo — PandaPix Admin" },
      { name: "description", content: "Criação e listagem de contas demonstração." },
      adminNoIndex,
    ],
  }),
  component: AdminDemo,
});

function AdminDemo() {
  const queryClient = useQueryClient();
  const load = useServerFn(listDemoAccounts);
  const create = useServerFn(createDemoAccount);

  const query = useQuery({
    queryKey: ["admin-demo"],
    queryFn: () => load({ data: { limit: 100 } }),
  });

  const [form, setForm] = useState({ email: "", password: "", nome: "", saldo: 1000 });

  const mutation = useMutation({
    mutationFn: () => create({ data: form }),
    onSuccess: async () => {
      toast.success("Conta demo criada.");
      setForm({ email: "", password: "", nome: "", saldo: 1000 });
      await queryClient.invalidateQueries({ queryKey: ["admin-demo"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = query.data ?? [];

  return (
    <AdminShell title="Contas demo" description="Crie e visualize contas de demonstração.">
      <AdminCard title="Nova conta demo">
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <Field label="E-mail">
            <input
              className={inputClass}
              type="email"
              value={form.email}
              onChange={(event) => setForm((f) => ({ ...f, email: event.target.value }))}
            />
          </Field>
          <Field label="Senha">
            <input
              className={inputClass}
              type="password"
              value={form.password}
              onChange={(event) => setForm((f) => ({ ...f, password: event.target.value }))}
            />
          </Field>
          <Field label="Nome">
            <input
              className={inputClass}
              value={form.nome}
              onChange={(event) => setForm((f) => ({ ...f, nome: event.target.value }))}
            />
          </Field>
          <Field label="Saldo inicial (R$)">
            <input
              className={inputClass}
              type="number"
              step="0.01"
              min="0"
              value={form.saldo}
              onChange={(event) => setForm((f) => ({ ...f, saldo: Number(event.target.value) }))}
            />
          </Field>
          <div className="sm:col-span-2">
            <button type="submit" className={smallBtn} disabled={mutation.isPending}>
              {mutation.isPending ? "Criando…" : "Criar conta demo"}
            </button>
          </div>
        </form>
      </AdminCard>

      <AdminCard title="Contas demo">
        {query.isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando…</p>
        ) : query.error ? (
          <p className="text-xs text-destructive">{(query.error as Error).message}</p>
        ) : rows.length === 0 ? (
          <AdminEmpty text="Nenhuma conta demo encontrada." />
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <AdminRow
                key={row.id}
                title={row.nome ?? row.email ?? row.id}
                subtitle={`${row.email} • Saldo: ${brl(row.saldo)} • ${dateTime(row.created_at)}`}
              />
            ))}
          </div>
        )}
      </AdminCard>
    </AdminShell>
  );
}
