import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Gamepad2, ShieldCheck, Zap } from "lucide-react";
import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PandaPix — Jogue e saque via Pix na hora" },
      {
        name: "description",
        content:
          "Cadastre-se no PandaPix, deposite via Pix, jogue o slot do panda e saque seus ganhos em minutos.",
      },
      { property: "og:title", content: "PandaPix — Jogue e saque via Pix na hora" },
      {
        property: "og:description",
        content: "Depósitos e saques via Pix, bônus de boas-vindas e programa de afiliados.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Zap, title: "Pix instantâneo", text: "Depósito confirmado em segundos e saque rápido." },
  { icon: Gamepad2, title: "Jogo do panda", text: "Rodadas rápidas, bônus e multiplicadores." },
  { icon: ShieldCheck, title: "Conta protegida", text: "Seus dados e seu saldo com segurança." },
];

function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/painel", replace: true });
  }, [loading, session, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-xs font-black tracking-tighter text-primary-foreground">
            PX
          </span>
          <span className="text-base font-black tracking-tight">
            PANDA<span className="text-accent">/</span>ONIX
          </span>
        </div>
        <Link
          to="/login"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground"
        >
          Entrar
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16">
        <section className="panda-gradient rounded-3xl border border-border p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Bem-vindo</p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Jogue com o panda e saque via Pix
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Depósito a partir de R$ 10, rodadas rápidas e saque direto na sua chave Pix.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              to="/register"
              search={{ ref: undefined }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              Criar conta grátis <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-semibold"
            >
              Já tenho conta
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-border bg-card p-4">
              <Icon className="size-5 text-primary" />
              <h2 className="mt-3 text-sm font-bold">{title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{text}</p>
            </article>
          ))}
        </section>

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          Proibido para menores de 18 anos. Jogue com responsabilidade.
        </p>
      </main>
    </div>
  );
}
