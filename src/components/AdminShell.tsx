import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const adminNav = [
  { to: "/admin", label: "Visão geral" },
  { to: "/admin/depositos", label: "Depósitos" },
  { to: "/admin/saques", label: "Saques" },
  { to: "/admin/comissoes", label: "Comissões" },
  { to: "/admin/usuarios", label: "Usuários" },
  { to: "/admin/papeis", label: "Papéis" },
  { to: "/admin/demo", label: "Contas demo" },
  { to: "/admin/afiliados", label: "Afiliados" },
  { to: "/admin/historico", label: "Histórico" },
  { to: "/admin/gateway", label: "Gateway" },
  { to: "/admin/aparencia", label: "Aparência" },
  { to: "/admin/pixel", label: "Pixel" },
  { to: "/admin/regras", label: "Afiliados e bônus" },
  { to: "/admin/rtp", label: "RTP e conta" },
] as const;

export const adminNoIndex = { name: "robots", content: "noindex, nofollow" } as const;

export function AdminShell({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className="grid size-9 place-items-center rounded-xl bg-accent/15 text-lg"
              aria-hidden="true"
            >
              Admin
            </span>
            <span className="text-sm font-bold tracking-tight">PandaPix Admin</span>
          </div>
          <Link
            to="/painel"
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground"
          >
            Voltar ao jogo
          </Link>
        </div>
        <nav className="overflow-x-auto border-t border-border md:hidden">
          <div className="flex w-max gap-1 px-3 py-2">
            {adminNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/admin" }}
                activeProps={{ className: "bg-primary/15 text-primary" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-5">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="sticky top-24 space-y-1">
            {adminNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/admin" }}
                activeProps={{ className: "bg-primary/15 text-primary" }}
                inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
                className="block rounded-lg px-3 py-2 text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight">{title}</h1>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {actions}
          </div>
          <div className="mt-5 space-y-4">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AdminCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      {title ? <h2 className="mb-3 text-sm font-bold">{title}</h2> : null}
      {children}
    </section>
  );
}

export function AdminEmpty({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground">{text}</p>;
}

export function AdminRow({
  title,
  subtitle,
  right,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        {subtitle ? <p className="text-[11px] text-muted-foreground">{subtitle}</p> : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}

export const smallBtn =
  "rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-60";
export const smallBtnGhost =
  "rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-60";
export const smallBtnDanger =
  "rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-60";
export const statusFilters = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendentes" },
  { value: "approved", label: "Aprovados" },
  { value: "paid", label: "Pagos" },
  { value: "rejected", label: "Rejeitados" },
] as const;
