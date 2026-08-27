import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Gamepad2 } from "lucide-react";

import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { brl, dateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/jogo")({
  head: () => ({
    meta: [
      { title: "Jogo — PandaPix" },
      {
        name: "description",
        content: "Área do jogo PandaPix: saldo disponível, bônus e histórico das suas rodadas.",
      },
      { property: "og:title", content: "Jogo — PandaPix" },
      { property: "og:description", content: "Saldo, bônus e histórico de rodadas." },
    ],
  }),
  component: JogoPage,
});

function JogoPage() {
  const { profile, user } = useAuth();

  const historyQuery = useQuery({
    queryKey: ["game-history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_history")
        .select("id, aposta, ganho, resultado, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const rows = historyQuery.data ?? [];

  return (
    <AppLayout title="Jogo">
      <section className="panda-gradient rounded-2xl border border-border p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Saldo disponível</p>
            <p className="mt-1 text-3xl font-extrabold text-primary">{brl(profile?.saldo)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Bônus: {brl(profile?.saldo_bonus)}</p>
          </div>
          <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-accent">
            Em breve
          </span>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-dashed border-border bg-card p-6 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Gamepad2 className="size-7" />
        </span>
        <h2 className="mt-3 text-base font-bold">O jogo entra em breve</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Estamos finalizando o motor de rodadas. Seu saldo já está pronto e as apostas serão liberadas
          nesta tela.
        </p>
        <button
          type="button"
          disabled
          className="mt-4 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground opacity-60"
        >
          Apostar — Em breve
        </button>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold">Últimas rodadas</h2>
        <div className="mt-3 space-y-2">
          {historyQuery.isLoading ? (
            <p className="text-xs text-muted-foreground">Carregando…</p>
          ) : rows.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Você ainda não jogou. Assim que o jogo abrir, suas rodadas aparecem aqui.
            </p>
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-secondary px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">Aposta {brl(row.aposta)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {dateTime(row.created_at)}
                    {row.resultado ? ` · ${row.resultado}` : ""}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    Number(row.ganho) > 0 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {brl(row.ganho)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </AppLayout>
  );
}
