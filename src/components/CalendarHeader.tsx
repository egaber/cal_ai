import { ChevronLeft, ChevronRight, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: 'day' | 'week' | 'workweek' | 'month';
  onViewModeChange: (mode: 'day' | 'week' | 'workweek' | 'month') => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  onNewEvent: () => void;
  onAutoOptimize: () => void;
}

export const CalendarHeader = ({
  currentDate,
  viewMode,
  onViewModeChange,
  onNavigate,
  onNewEvent,
  onAutoOptimize
}: CalendarHeaderProps) => {
  const formatMonthLabel = () => {
    return currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const formatRangeLabel = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }

    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    }

    // For week and workweek views
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());

    const end = new Date(start);
    if (viewMode === 'workweek') {
      // Work week: Sunday to Thursday (5 days)
      end.setDate(start.getDate() + 4);
    } else {
      // Regular week: Sunday to Saturday (7 days)
      end.setDate(start.getDate() + 6);
    }

    const startLabel = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const endLabel = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    return `${startLabel} – ${endLabel}`;
  };

  return (
    <header className="rounded-2xl border border-border/60 bg-white/70 px-5 py-4 backdrop-blur">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15">
              <img src="/logo.png" alt="Life OS" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">Schedule</p>
              <h2 className="text-lg font-semibold text-foreground">{formatMonthLabel()}</h2>
              <p className="text-xs text-muted-foreground">{formatRangeLabel()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAutoOptimize()}
              className="rounded-full border border-primary/30 bg-primary/10 px-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary hover:bg-primary/20"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" /> Boost with AI
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onNewEvent}
              className="rounded-full bg-primary px-4 text-sm font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" /> New Event
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate('prev')}
              className="h-9 w-9 rounded-full border-border/70"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => onNavigate('today')}
              className="h-9 rounded-full px-4 text-sm font-semibold uppercase tracking-[0.2em]"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate('next')}
              className="h-9 w-9 rounded-full border-border/70"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-secondary/60 p-1 backdrop-blur sm:self-auto">
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('day')}
              className={`rounded-full px-3 text-sm font-medium transition ${viewMode === 'day' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-white/70'}`}
            >
              Day
            </Button>
            <Button
              variant={viewMode === 'workweek' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('workweek')}
              className={`rounded-full px-3 text-sm font-medium transition ${viewMode === 'workweek' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-white/70'}`}
            >
              Work Week
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('week')}
              className={`rounded-full px-3 text-sm font-medium transition ${viewMode === 'week' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-white/70'}`}
            >
              Week
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
