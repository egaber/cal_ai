import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface MiniCalendarProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
}

export const MiniCalendar = ({ currentDate, onDateSelect }: MiniCalendarProps) => {
  const [viewDate, setViewDate] = useState(currentDate);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const days = getDaysInMonth(viewDate);
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === currentDate.toDateString();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewDate);
    if (direction === 'prev') {
      newDate.setMonth(viewDate.getMonth() - 1);
    } else {
      newDate.setMonth(viewDate.getMonth() + 1);
    }
    setViewDate(newDate);
  };

  return (
    <div className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-lg backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Mini view
          </p>
          <h3 className="text-base font-semibold text-foreground">{monthName}</h3>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('prev')}
            className="h-8 w-8 rounded-full border border-border/60 bg-white/70 hover:bg-secondary/40"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('next')}
            className="h-8 w-8 rounded-full border border-border/60 bg-white/70 hover:bg-secondary/40"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <div key={idx} className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {day}
          </div>
        ))}
        {days.map((date, idx) => (
          <button
            key={idx}
            onClick={() => date && onDateSelect(date)}
            disabled={!date}
            className={`flex h-9 items-center justify-center rounded-xl text-sm transition-all ${
              !date
                ? 'cursor-default text-transparent'
                : isSelected(date)
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                : isToday(date)
                ? 'border border-primary/40 bg-primary/10 text-foreground'
                : 'text-foreground hover:border hover:border-border/60 hover:bg-secondary/30'
            }`}
          >
            {date?.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
};
