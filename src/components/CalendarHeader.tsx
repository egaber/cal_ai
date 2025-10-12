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
    <header className="rounded-xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/80">
      <div className="grid w-full gap-3 md:grid-cols-[auto_1fr_auto_auto] md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700">
            <img src="/cal_ai.png" alt="cal.ai" className="h-6 w-6 object-contain" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-slate-400 dark:text-slate-500">Schedule</p>
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatMonthLabel()}</h2>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{formatRangeLabel()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-100/60 p-1 shadow-inner dark:border-slate-700 dark:bg-slate-800/70">
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('day')}
              className={`rounded-full px-3 text-sm font-medium transition ${viewMode === 'day' ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-200 dark:text-slate-900' : 'text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-700/80'}`}
            >
              Day
            </Button>
            <Button
              variant={viewMode === 'workweek' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('workweek')}
              className={`rounded-full px-3 text-sm font-medium transition ${viewMode === 'workweek' ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-200 dark:text-slate-900' : 'text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-700/80'}`}
            >
              Work Week
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('week')}
              className={`rounded-full px-3 text-sm font-medium transition ${viewMode === 'week' ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-200 dark:text-slate-900' : 'text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-700/80'}`}
            >
              Week
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate('prev')}
            className="h-9 w-9 rounded-full border-slate-200/80 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            onClick={() => onNavigate('today')}
            className="h-9 rounded-full border border-slate-200/80 bg-white px-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate('next')}
            className="h-9 w-9 rounded-full border-slate-200/80 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAutoOptimize()}
            className="rounded-full border border-slate-200/80 bg-white px-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 shadow-sm transition hover:border-sky-300 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:text-sky-400"
          >
            <Sparkles className="mr-2 h-3.5 w-3.5 text-sky-500" /> Boost with AI
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onNewEvent}
            className="rounded-full bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
          >
            <Plus className="mr-2 h-4 w-4" /> New Event
          </Button>
        </div>
      </div>
    </header>
  );
};
