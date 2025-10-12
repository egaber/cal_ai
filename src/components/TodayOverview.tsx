import { CalendarEvent } from "@/types/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarDays, Clock, Sparkles, Share2, ListTodo, ArrowRight } from "lucide-react";

interface TodayOverviewProps {
  currentDate: Date;
  totalTasks: number;
  totalHours: number;
  focusHours: number;
  events: CalendarEvent[];
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

const CATEGORY_STYLES: Record<CalendarEvent["category"], { dot: string; badge: string; card: string }> = {
  work: {
    dot: "bg-sky-500",
    badge: "bg-sky-100 text-sky-700",
    card: "border-sky-100/80 hover:border-sky-200 shadow-sky-100/70",
  },
  health: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
    card: "border-emerald-100/80 hover:border-emerald-200 shadow-emerald-100/70",
  },
  personal: {
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700",
    card: "border-amber-100/80 hover:border-amber-200 shadow-amber-100/70",
  },
  family: {
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
    card: "border-blue-100/80 hover:border-blue-200 shadow-blue-100/70",
  },
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `${hours} hr${hours > 1 ? "s" : ""}`;
  return `${hours}h ${remainder}m`;
};

export const TodayOverview = ({
  currentDate,
  totalTasks,
  totalHours,
  focusHours,
  events,
  upcomingEvent,
}: TodayOverviewProps) => {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const isToday = new Date().toDateString() === currentDate.toDateString();
  const now = new Date();

  return (
  <section className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/80 p-8 shadow-[0_30px_120px_-60px_rgba(79,70,229,0.45)] backdrop-blur">
      <div className="pointer-events-none absolute -top-40 -right-32 h-72 w-72 rounded-full bg-primary/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-36 -left-24 h-64 w-64 rounded-full bg-secondary/30 blur-3xl" aria-hidden />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Today</p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground md:text-4xl">
            {formatDateLabel(currentDate)}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Ground the day with a glance: your focus blocks, meetings, and personal picks lined up in one serene view.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] text-foreground shadow-sm">{totalTasks} tasks</span>
            <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] text-foreground shadow-sm">{totalHours.toFixed(1)} hrs booked</span>
            <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] text-foreground shadow-sm">{focusHours.toFixed(1)} hrs focus</span>
          </div>
        </div>

        <div className="flex gap-2 self-start">
          <Button variant="outline" className="rounded-full border-border/70 bg-white/70 backdrop-blur">
            <Share2 className="mr-2 h-4 w-4" /> Share plan
          </Button>
          <Button className="rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/25">
            <Sparkles className="mr-2 h-4 w-4" /> Focus mode
          </Button>
        </div>
      </div>

      <div className="relative mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/50 bg-white/80 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <ListTodo className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Tasks scheduled</p>
                  <p className="text-xl font-semibold text-foreground">{totalTasks}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/50 bg-white/80 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Booked time</p>
                  <p className="text-xl font-semibold text-foreground">{totalHours.toFixed(1)} hrs</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/50 bg-white/80 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Focus blocks</p>
                  <p className="text-xl font-semibold text-foreground">{focusHours.toFixed(1)} hrs</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/80 p-6 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Next highlight</p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">
                {upcomingEvent ? upcomingEvent.title : "Nothing else on the calendar"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {upcomingEvent ? formatTimeRange(upcomingEvent) : "Enjoy the breathing room or add something meaningful."}
              </p>
            </div>
            <Button variant="ghost" className="group self-start rounded-full border border-primary/30 bg-primary/10 px-6 text-primary hover:bg-primary/20">
              Open planner
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>

        <div className="relative rounded-3xl border border-white/60 bg-white/90 p-6 shadow-inner">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">Today's agenda</p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">Meetings & commitments</h3>
            </div>
            <Button variant="secondary" className="rounded-full bg-secondary/40 text-secondary-foreground">
              Plan day
            </Button>
          </div>

          <div className="relative mt-6 space-y-6">
            <span className="pointer-events-none absolute left-5 top-0 h-full w-[2px] bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" aria-hidden />

            {sortedEvents.length === 0 ? (
              <div className="relative rounded-2xl border border-dashed border-border/60 bg-white/80 p-6 text-center text-sm text-muted-foreground">
                Your day is wide open. Add a focus block or invite to craft the rhythm you want.
              </div>
            ) : (
              sortedEvents.map((event) => {
                const start = new Date(event.startTime);
                const end = new Date(event.endTime);
                const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
                const style = CATEGORY_STYLES[event.category];
                const isActive = isToday && now >= start && now <= end;
                const isNextUp = upcomingEvent?.id === event.id;

                return (
                  <div key={event.id} className="relative">
                    <div
                      className={cn(
                        "relative overflow-hidden rounded-2xl border bg-white/90 shadow-sm transition-all hover:shadow-md",
                        style.card,
                        isActive && "scale-[1.01] border-primary/40",
                        isNextUp && "ring-1 ring-primary/20"
                      )}
                    >
                      {/* Vertical color bar on the left */}
                      <div className={cn("absolute left-0 top-0 h-full w-1.5", style.dot)} />
                      
                      <div className="pl-6 pr-5 py-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                            {formatTimeRange(event)}
                          </p>
                          <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]", style.badge)}>
                            {event.category}
                          </span>
                        </div>

                        <h4 className="mt-3 text-lg font-semibold text-foreground">{event.title}</h4>

                        {event.description && (
                          <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="uppercase tracking-[0.3em]">{formatDuration(durationMinutes)}</span>
                          <span className="uppercase tracking-[0.3em]">Priority · {event.priority}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
