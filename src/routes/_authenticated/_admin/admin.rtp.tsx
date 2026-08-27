import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminCard, AdminShell, adminNoIndex, smallBtn } from "@/components/AdminShell";
import { Field, inputClass } from "@/components/AuthShell";
import { getAdminSettings } from "@/lib/admin-lists.functions";
import { changeAdminPassword, saveGameSettings } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/_admin/admin/rtp")({
  head: () => ({
    meta: [
      { title: "RTP, limites e senha — PandaPix Admin" },
      { name: "description", content: "Configurações do jogo e troca de senha do administrador." },
      adminNoIndex,
    ],
  }),
  component: AdminRtp,
});

function AdminRtp() {
  const queryClient = useQueryClient();
  const loadSettings = useServerFn(getAdminSettings);
  const saveSettings = useServerFn(saveGameSettings);
  const changePassword = useServerFn(changeAdminPassword);

  const query = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => loadSettings(),
  });

  const [game, setGame] = useState({ rtp: 96, min_bet: 1, max_bet: 1000 });
  const [password, setPassword] = useState({ current_password: "", new_password: "" });

  useEffect(() => {
    const g = query.data?.games ?? {};
    setGame({
      rtp: Number(g["rtp"] ?? 96),
      min_bet: Number(g["min_bet"] ?? 1),
      max_bet: Number(g["max_bet"] ?? 1000),
    });
  }, [query.data]);

  const gameMutation = useMutation({
    mutationFn: () =>
      saveSettings({
        data: {
          items: [
            { slug: "rtp", value: game.rtp },
            { slug: "min_bet", value: game.min_bet },
            { slug: "max_bet", value: game.max_bet },
          ],
        },
      }),
    onSuccess: async () => {
      toast.success("Configurações do jogo salvas.");
      await queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const passwordMutation = useMutation({
    mutationFn: () => changePassword({ data: password }),
    onSuccess: () => {
      toast.success("Senha alterada.");
      setPassword({ current_password: "", new_password: "" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AdminShell title="RTP, limites e senha" description="Configure o jogo e a senha da conta admin.">
      <AdminCard title="RTP e limites de aposta">
        {query.isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando…</p>
        ) : (
          <form
            className="grid gap-3 sm:grid-cols-3"
            onSubmit={(event) => {
              event.preventDefault();
              gameMutation.mutate();
            }}
          >
            <Field label="RTP (%)">
              <input
                className={inputClass}
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={game.rtp}
                onChange={(event) => setGame((g) => ({ ...g, rtp: Number(event.target.value) }))}
              />
            </Field>
            <Field label="Aposta mínima (R$)">
              <input
                className={inputClass}
                type="number"
                step="0.01"
                min="0"
                value={game.min_bet}
                onChange={(event) => setGame((g) => ({ ...g, min_bet: Number(event.target.value) }))}
              />
            </Field>
            <Field label="Aposta máxima (R$)">
              <input
                className={inputClass}
                type="number"
                step="0.01"
                min="0"
                value={game.max_bet}
                onChange={(event) => setGame((g) => ({ ...g, max_bet: Number(event.target.value) }))}
              />
            </Field>
            <div className="sm:col-span-3">
              <button type="submit" className={smallBtn} disabled={gameMutation.isPending}>
                {gameMutation.isPending ? "Salvando…" : "Salvar configurações do jogo"}
              </button>
            </div>
          </form>
        )}
      </AdminCard>

      <AdminCard title="Trocar senha do admin">
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            passwordMutation.mutate();
          }}
        >
          <Field label="Senha atual">
            <input
              className={inputClass}
              type="password"
              value={password.current_password}
              onChange={(event) =>
                setPassword((p) => ({ ...p, current_password: event.target.value }))
              }
            />
          </Field>
          <Field label="Nova senha">
            <input
              className={inputClass}
              type="password"
              value={password.new_password}
              onChange={(event) => setPassword((p) => ({ ...p, new_password: event.target.value }))}
            />
          </Field>
          <div className="sm:col-span-2">
            <button type="submit" className={smallBtn} disabled={passwordMutation.isPending}>
              {passwordMutation.isPending ? "Alterando…" : "Alterar senha"}
            </button>
          </div>
        </form>
      </AdminCard>
    </AdminShell>
  );
}
