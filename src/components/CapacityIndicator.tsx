import { TrendingUp } from "lucide-react";

interface CapacityIndicatorProps {
  scheduled: number;
  total: number;
}

export const CapacityIndicator = ({ scheduled, total }: CapacityIndicatorProps) => {
  const percentage = (scheduled / total) * 100;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Today's Capacity</h3>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Scheduled</span>
          <span className="font-semibold text-foreground">
            {scheduled.toFixed(1)} / {total} hrs
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
