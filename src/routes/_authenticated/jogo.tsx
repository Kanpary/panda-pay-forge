import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
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
  const { profile, user, session } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let active = true;

    const sendSession = async () => {
      // getSession can return an access token that expired while the tab was open.
      // Refresh immediately before the iframe handshake so game API calls never
      // receive a stale JWT and fail with "Unauthorized: invalid token".
      const { data } = await supabase.auth.refreshSession();
      if (!active) return;
      const accessToken = data.session?.access_token ?? session?.access_token ?? null;
      iframeRef.current?.contentWindow?.postMessage(
        { type: "pandapix:session", access_token: accessToken },
        window.location.origin,
      );
    };

    void sendSession();
    const handleReady = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data?.type === "pandapix:ready") {
        void sendSession();
      }
    };
    window.addEventListener("message", handleReady);
    return () => {
      active = false;
      window.removeEventListener("message", handleReady);
    };
  }, [session?.access_token]);

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
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Saldo disponível
            </p>
            <p className="mt-1 text-3xl font-extrabold text-primary">{brl(profile?.saldo)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Bônus: {brl(profile?.saldo_bonus)}</p>
          </div>
          <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-accent">
            Em breve
          </span>
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <h2 className="sr-only">Jogo PandaPix</h2>
        <iframe
          title="Jogo do PandaPix"
          ref={iframeRef}
          src="/game/index.html"
          onLoad={() => {
            // Reuse the same refresh-aware handshake used by pandapix:ready.
            void supabase.auth.refreshSession().then(({ data }) => {
              iframeRef.current?.contentWindow?.postMessage(
                {
                  type: "pandapix:session",
                  access_token: data.session?.access_token ?? session?.access_token ?? null,
                },
                window.location.origin,
              );
            });
          }}
          className="block h-[min(720px,calc(100vh-12rem))] min-h-[560px] w-full border-0"
          loading="eager"
          allow="autoplay"
        />
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
