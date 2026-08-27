import { Link, useRouter } from "@tanstack/react-router";
import { ArrowDownToLine, ArrowUpFromLine, Gamepad2, Home, LogOut, Users } from "lucide-react";
import type { ReactNode } from "react";

import { useAuth } from "@/hooks/useAuth";
import { brl } from "@/lib/format";

const navItems = [
  { to: "/painel", label: "Início", icon: Home },
  { to: "/jogo", label: "Jogo", icon: Gamepad2 },
  { to: "/deposito", label: "Depositar", icon: ArrowDownToLine },
  { to: "/saque", label: "Sacar", icon: ArrowUpFromLine },
  { to: "/afiliado", label: "Afiliado", icon: Users },
] as const;

export function AppLayout({ children, title }: { children: ReactNode; title?: string }) {
  const { profile, isAdmin, signOut } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/painel" className="flex min-w-0 items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-lg">
              🐼
            </span>
            <span className="truncate text-base font-bold tracking-tight">PandaPix</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-secondary px-3 py-1.5 text-right">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Saldo</p>
              <p className="text-sm font-semibold text-primary">{brl(profile?.saldo)}</p>
            </div>
            {isAdmin ? (
              <Link
                to="/admin"
                className="rounded-lg border border-accent/50 px-2 py-1.5 text-xs font-medium text-accent"
              >
                Admin
              </Link>
            ) : null}
            <button
              type="button"
              aria-label="Sair"
              onClick={async () => {
                await signOut();
                await router.navigate({ to: "/login", replace: true });
              }}
              className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-5">
        {title ? <h1 className="mb-4 text-xl font-bold tracking-tight">{title}</h1> : null}
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-stretch">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: true }}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
