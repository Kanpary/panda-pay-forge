import { statusLabel } from "@/lib/format";

const tone: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  paid: "bg-primary/15 text-primary border-primary/30",
  approved: "bg-primary/15 text-primary border-primary/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  expired: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        tone[status] ?? "bg-muted text-muted-foreground border-border"
      }`}
    >
      {statusLabel[status] ?? status}
    </span>
  );
}
