import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  positive: "bg-teal/10 text-teal border-teal/25",
  info: "bg-primary/10 text-primary border-primary/25",
  creator: "bg-coral/10 text-coral border-coral/25",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-destructive/10 text-destructive border-destructive/25",
  neutral: "bg-muted text-muted-foreground border-border",
};

const map: Record<string, keyof typeof tones> = {
  active: "positive",
  paid: "positive",
  approved: "positive",
  completed: "positive",
  delivered: "positive",
  connected: "positive",
  verified: "positive",
  live: "positive",
  operational: "positive",
  healthy: "positive",
  success: "positive",
  pending: "warning",
  processing: "info",
  review: "warning",
  applied: "info",
  draft: "neutral",
  scheduled: "info",
  shipped: "info",
  degraded: "warning",
  paused: "neutral",
  inactive: "neutral",
  disconnected: "neutral",
  unverified: "neutral",
  reversed: "danger",
  failed: "danger",
  rejected: "danger",
  cancelled: "danger",
  refunded: "danger",
  suspended: "danger",
  down: "danger",
  open: "info",
  resolved: "positive",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = tones[map[status.toLowerCase()] ?? "neutral"];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        tone,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
