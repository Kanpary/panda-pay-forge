import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-8">
      <Link to="/" className="mx-auto flex items-center gap-2">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-xl">🐼</span>
        <span className="text-lg font-bold tracking-tight">PandaPix</span>
      </Link>

      <div className="mx-auto mt-8 w-full max-w-sm rounded-2xl border border-border bg-card p-5">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        <div className="mt-5">{children}</div>
      </div>

      {footer ? <div className="mx-auto mt-4 max-w-sm text-center text-sm">{footer}</div> : null}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string | undefined;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/40";

export const buttonClass =
  "w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60";
