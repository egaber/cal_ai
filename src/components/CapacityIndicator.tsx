import { TrendingUp } from "lucide-react";

interface CapacityIndicatorProps {
  scheduled: number;
  total: number;
}

export const CapacityIndicator = ({ scheduled, total }: CapacityIndicatorProps) => {
  const percentage = (scheduled / total) * 100;

  return (
    <div className="rounded-3xl border border-white/60 bg-gradient-to-br from-primary/12 via-white/70 to-secondary/60 p-5 shadow-lg backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Utilization
            </p>
            <h3 className="text-base font-semibold text-foreground">Today's capacity</h3>
          </div>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground shadow">
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Scheduled</span>
          <span className="font-semibold text-foreground">
            {scheduled.toFixed(1)} / {total} hrs
          </span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-secondary/70">
          <div
            className="absolute inset-y-0 left-0 h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent transition-all"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          >
            <div className="absolute inset-y-0 right-0 w-1 bg-white/60" />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Under capacity</span>
          <span>Over capacity</span>
        </div>
      </div>
    </div>
  );
};
