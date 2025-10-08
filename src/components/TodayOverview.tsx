import { CalendarEvent } from "@/types/calendar";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Sparkles, Share2, ListTodo, ArrowRight } from "lucide-react";

interface TodayOverviewProps {
  currentDate: Date;
  totalTasks: number;
  totalHours: number;
  focusHours: number;
  upcomingEvent?: CalendarEvent | null;
}

const formatDateLabel = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

const formatTimeRange = (event?: CalendarEvent | null) => {
  if (!event) return "Nothing else on the calendar";

  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${formatter.format(start)} – ${formatter.format(end)}`;
};

export const TodayOverview = ({
  currentDate,
  totalTasks,
  totalHours,
  focusHours,
  upcomingEvent,
}: TodayOverviewProps) => {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-secondary/60 p-6 shadow-lg ring-1 ring-primary/10">
      <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-primary/25 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-accent/20 blur-3xl" aria-hidden />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Today</p>
          <h1 className="mt-1 text-3xl font-semibold text-foreground md:text-4xl">{formatDateLabel(currentDate)}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Shape the day before it shapes you. Review your schedule, lock focus blocks, and make room for what matters most.
          </p>
        </div>

        <div className="flex gap-2 self-start">
          <Button variant="outline" className="rounded-full border-border/70 bg-white/70 backdrop-blur">
            <Share2 className="mr-2 h-4 w-4" /> Share plan
          </Button>
          <Button className="rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Sparkles className="mr-2 h-4 w-4" /> Focus mode
          </Button>
        </div>
      </div>

      <div className="relative mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/40 bg-white/80 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <ListTodo className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tasks</p>
              <p className="text-lg font-semibold text-foreground">{totalTasks} scheduled</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/40 bg-white/80 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Booked time</p>
              <p className="text-lg font-semibold text-foreground">{totalHours.toFixed(1)} hrs</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/40 bg-white/80 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Focus blocks</p>
              <p className="text-lg font-semibold text-foreground">{focusHours.toFixed(1)} hrs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-6 flex flex-col gap-4 rounded-2xl border border-white/40 bg-white/75 p-5 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Plan highlight</p>
          <h2 className="mt-2 text-lg font-semibold text-foreground">Plan for the week</h2>
          <p className="text-sm text-muted-foreground">
            {upcomingEvent ? `${upcomingEvent.title} · ${formatTimeRange(upcomingEvent)}` : formatTimeRange()}
          </p>
        </div>
        <Button variant="ghost" className="group self-start rounded-full border border-primary/30 bg-primary/10 px-5 text-primary hover:bg-primary/20">
          Open planner
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </section>
  );
};
