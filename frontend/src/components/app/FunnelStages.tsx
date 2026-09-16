import { num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";

export type FunnelStage = { label: string; value: number; display?: string };

const colors = [
  "bg-primary",
  "bg-violet",
  "bg-indigo",
  "bg-coral",
  "bg-teal",
  "bg-warning",
];

export function FunnelStages({ stages }: { stages: FunnelStage[] }) {
  const top = stages[0]?.value ?? 1;
  return (
    <div className="space-y-3">
      {stages.map((stage, i) => {
        const width = Math.max(8, (stage.value / top) * 100);
        const prev = i === 0 ? stage.value : stages[i - 1].value;
        return (
          <div key={stage.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{stage.label}</span>
              <span className="text-muted-foreground">
                {stage.display ?? num(stage.value)}
                {i > 0 ? (
                  <span className="ml-2 text-xs">{pct((stage.value / prev) * 100, 1)} step</span>
                ) : null}
              </span>
            </div>
            <div className="mt-1.5 h-9 rounded-lg bg-muted">
              <div
                className={cn(
                  "flex h-9 items-center rounded-lg px-3 text-xs font-semibold text-primary-foreground transition-all",
                  colors[i % colors.length],
                )}
                style={{ width: `${width}%` }}
              >
                {pct((stage.value / top) * 100, 1)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
