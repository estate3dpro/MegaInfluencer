import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Accent = "primary" | "teal" | "coral" | "indigo" | "violet";

const accents: Record<Accent, string> = {
  primary: "bg-primary/10 text-primary",
  teal: "bg-teal/10 text-teal",
  coral: "bg-coral/10 text-coral",
  indigo: "bg-indigo/10 text-indigo",
  violet: "bg-violet/10 text-violet",
};

export function StatCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  accent = "primary",
  className,
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  icon?: LucideIcon;
  accent?: Accent;
  className?: string;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 shadow-card transition-shadow hover:shadow-elevated",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span className={cn("grid h-9 w-9 place-items-center rounded-lg", accents[accent])}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-card-foreground">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta !== undefined ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
              up ? "bg-teal/10 text-teal" : "bg-destructive/10 text-destructive",
            )}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        ) : null}
        {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  );
}
