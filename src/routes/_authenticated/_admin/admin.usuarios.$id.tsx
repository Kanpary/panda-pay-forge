import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AdminCard,
  AdminEmpty,
  AdminRow,
  AdminShell,
  adminNoIndex,
  smallBtn,
} from "@/components/AdminShell";
import { Field, inputClass } from "@/components/AuthShell";
import { getUserDetail } from "@/lib/admin-lists.functions";
import { savePlayerGameLimits, updateUser } from "@/lib/admin.functions";
import { brl, dateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/_admin/admin/usuarios/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe do usuário — PandaPix Admin" },
      { name: "description", content: "Edição de saldos, bloqueio e percentuais do usuário." },
      adminNoIndex,
    ],
  }),
  component: AdminUserDetail,
});

function AdminUserDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const load = useServerFn(getUserDetail);
  const save = useServerFn(updateUser);
  const saveLimits = useServerFn(savePlayerGameLimits);

  const query = useQuery({
    queryKey: ["admin-user", id],
    queryFn: () => load({ data: { id } }),
  });

  const [form, setForm] = useState({
    saldo: 0,
    rtp: 96,
    min_bet: 1,
    max_bet: 1000,
    daily_bet_limit: 0,
    daily_loss_limit: 0,
    limits_enabled: true,
    saldo_bonus: 0,
    saldo_comissao: 0,
    comissao_cpa: 0,
    comissao_cpa_nivel2: 0,
    comissao_revshare: 0,
    bloqueado: false,
    is_demo: false,
    tipo_conta: "jogador" as "jogador" | "afiliado" | "agente",
  });

  useEffect(() => {
    if (!query.data?.profile) return;
    const p = query.data.profile;
    const limits = query.data.limits;
    setForm({
      saldo: Number(p.saldo ?? 0),
      rtp: Number(limits?.rtp ?? 96),
      min_bet: Number(limits?.min_bet ?? 1),
      max_bet: Number(limits?.max_bet ?? 1000),
      daily_bet_limit: Number(limits?.daily_bet_limit ?? 0),
      daily_loss_limit: Number(limits?.daily_loss_limit ?? 0),
      limits_enabled: limits?.enabled !== false,
      saldo_bonus: Number(p.saldo_bonus ?? 0),
      saldo_comissao: Number(p.saldo_comissao ?? 0),
      comissao_cpa: Number(p.comissao_cpa ?? 0),
      comissao_cpa_nivel2: Number(p.comissao_cpa_nivel2 ?? 0),
      comissao_revshare: Number(p.comissao_revshare ?? 0),
      bloqueado: Boolean(p.bloqueado),
      is_demo: Boolean(p.is_demo),
      tipo_conta: (p.tipo_conta as "jogador" | "afiliado" | "agente") ?? "jogador",
    });
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: () => save({ data: { id, saldo: form.saldo, saldo_bonus: form.saldo_bonus, saldo_comissao: form.saldo_comissao, comissao_cpa: form.comissao_cpa, comissao_cpa_nivel2: form.comissao_cpa_nivel2, comissao_revshare: form.comissao_revshare, bloqueado: form.bloqueado, is_demo: form.is_demo, tipo_conta: form.tipo_conta } }),
    onSuccess: async () => {
      toast.success("Usuário atualizado.");
      await queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const limitsMutation = useMutation({
    mutationFn: () => saveLimits({ data: { userId: id, rtp: form.rtp, min_bet: form.min_bet, max_bet: form.max_bet, daily_bet_limit: form.daily_bet_limit, daily_loss_limit: form.daily_loss_limit, enabled: form.limits_enabled } }),
    onSuccess: async () => { toast.success("RTP e limites salvos."); await queryClient.invalidateQueries({ queryKey: ["admin-user", id] }); },
    onError: (error: Error) => toast.error(error.message),
  });

  const p = query.data?.profile;

  return (
    <AdminShell
      title="Detalhe do usuário"
      description={p ? (p.email ?? p.id) : "Carregando…"}
      actions={
        <Link
          to="/admin/usuarios"
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
        >
          Voltar
        </Link>
      }
    >
      {query.isLoading ? (
        <AdminCard>
          <p className="text-xs text-muted-foreground">Carregando…</p>
        </AdminCard>
      ) : query.error ? (
        <AdminCard>
          <p className="text-xs text-destructive">{(query.error as Error).message}</p>
        </AdminCard>
      ) : !p ? null : (
        <>
          <AdminCard title="Informações">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Nome:</span> {p.nome ?? "-"}
              </p>
              <p>
                <span className="text-muted-foreground">E-mail:</span> {p.email ?? "-"}
              </p>
              <p>
                <span className="text-muted-foreground">Telefone:</span> {p.telefone ?? "-"}
              </p>
              <p>
                <span className="text-muted-foreground">CPF:</span> {p.cpf ?? "-"}
              </p>
              <p>
                <span className="text-muted-foreground">Cadastro:</span> {dateTime(p.created_at)}
              </p>
              <p>
                <span className="text-muted-foreground">Código afiliado:</span>{" "}
                {p.affiliate_code ?? "-"}
              </p>
            </div>
          </AdminCard>

          <AdminCard title="Saldos e percentuais">
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate();
              }}
            >
              <Field label="Saldo real (R$)">
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.saldo}
                  onChange={(event) =>
                    setForm((f) => ({ ...f, saldo: Number(event.target.value) }))
                  }
                />
              </Field>
              <Field label="Saldo bônus (R$)">
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.saldo_bonus}
                  onChange={(event) =>
                    setForm((f) => ({ ...f, saldo_bonus: Number(event.target.value) }))
                  }
                />
              </Field>
              <Field label="Saldo comissão (R$)">
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.saldo_comissao}
                  onChange={(event) =>
                    setForm((f) => ({ ...f, saldo_comissao: Number(event.target.value) }))
                  }
                />
              </Field>
              <Field label="CPA (R$)">
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.comissao_cpa}
                  onChange={(event) =>
                    setForm((f) => ({ ...f, comissao_cpa: Number(event.target.value) }))
                  }
                />
              </Field>
              <Field label="CPA nível 2 (R$)">
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.comissao_cpa_nivel2}
                  onChange={(event) =>
                    setForm((f) => ({ ...f, comissao_cpa_nivel2: Number(event.target.value) }))
                  }
                />
              </Field>
              <Field label="Revshare (%)">
                <input
                  className={inputClass}
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.comissao_revshare}
                  onChange={(event) =>
                    setForm((f) => ({ ...f, comissao_revshare: Number(event.target.value) }))
                  }
                />
              </Field>
              <Field label="Tipo de conta">
                <select
                  className={inputClass}
                  value={form.tipo_conta}
                  onChange={(event) =>
                    setForm((f) => ({
                      ...f,
                      tipo_conta: event.target.value as typeof f.tipo_conta,
                    }))
                  }
                >
                  <option value="jogador">Jogador</option>
                  <option value="afiliado">Afiliado</option>
                  <option value="agente">Agente</option>
                </select>
              </Field>
              <label className="flex items-center gap-2 py-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={form.bloqueado}
                  onChange={(event) => setForm((f) => ({ ...f, bloqueado: event.target.checked }))}
                />
                Conta bloqueada
              </label>
              <label className="flex items-center gap-2 py-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={form.is_demo}
                  onChange={(event) => setForm((f) => ({ ...f, is_demo: event.target.checked }))}
                />
                Conta demo
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className={smallBtn} disabled={mutation.isPending}>
                  {mutation.isPending ? "Salvando…" : "Salvar alterações"}
                </button>
              </div>
            </form>
          </AdminCard>

          <AdminCard title="RTP e limites individuais">
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); limitsMutation.mutate(); }}>
              <Field label="RTP (%)"><input className={inputClass} type="number" min="0" max="100" step="0.01" value={form.rtp} onChange={(event) => setForm((f) => ({ ...f, rtp: Number(event.target.value) }))} /></Field>
              <Field label="Aposta mínima (R$)"><input className={inputClass} type="number" min="0.01" step="0.01" value={form.min_bet} onChange={(event) => setForm((f) => ({ ...f, min_bet: Number(event.target.value) }))} /></Field>
              <Field label="Aposta máxima (R$)"><input className={inputClass} type="number" min="0.01" step="0.01" value={form.max_bet} onChange={(event) => setForm((f) => ({ ...f, max_bet: Number(event.target.value) }))} /></Field>
              <Field label="Limite diário de apostas (R$)"><input className={inputClass} type="number" min="0" step="0.01" value={form.daily_bet_limit} onChange={(event) => setForm((f) => ({ ...f, daily_bet_limit: Number(event.target.value) }))} /></Field>
              <Field label="Limite diário de perdas (R$)"><input className={inputClass} type="number" min="0" step="0.01" value={form.daily_loss_limit} onChange={(event) => setForm((f) => ({ ...f, daily_loss_limit: Number(event.target.value) }))} /></Field>
              <label className="flex items-center gap-2 py-2 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={form.limits_enabled} onChange={(event) => setForm((f) => ({ ...f, limits_enabled: event.target.checked }))} /> Jogo habilitado para este usuário</label>
              <div className="sm:col-span-2"><button type="submit" className={smallBtn} disabled={limitsMutation.isPending}>{limitsMutation.isPending ? "Salvando…" : "Salvar RTP e limites"}</button></div>
            </form>
          </AdminCard>

          <AdminCard title="Últimos depósitos">
            {(query.data?.deposits ?? []).length === 0 ? (
              <AdminEmpty text="Sem depósitos." />
            ) : (
              <div className="space-y-2">
                {(query.data?.deposits ?? []).map((d) => (
                  <AdminRow
                    key={d.id}
                    title={brl(d.amount)}
                    subtitle={`${d.status} • ${dateTime(d.created_at)}`}
                  />
                ))}
              </div>
            )}
          </AdminCard>

          <AdminCard title="Últimos saques">
            {(query.data?.withdrawals ?? []).length === 0 ? (
              <AdminEmpty text="Sem saques." />
            ) : (
              <div className="space-y-2">
                {(query.data?.withdrawals ?? []).map((w) => (
                  <AdminRow
                    key={w.id}
                    title={brl(w.amount)}
                    subtitle={`${w.status} • ${dateTime(w.created_at)}`}
                  />
                ))}
              </div>
            )}
          </AdminCard>
        </>
      )}
    </AdminShell>
  );
}
