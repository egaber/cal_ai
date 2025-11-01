import { Clock } from "lucide-react";

interface DraggableEventPlaceholderProps {
  top: number;
  hour: number;
  minute: number;
  timeSlotHeight: number;
}

export const DraggableEventPlaceholder = ({
  top,
  hour,
  minute,
  timeSlotHeight,
}: DraggableEventPlaceholderProps) => {
  const formatTime = (h: number, m: number) => {
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 || 12;
    return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
  };

  const formatEndTime = (startHour: number, startMinute: number) => {
    let endHour = startHour + 1;
    const endMinute = startMinute;
    if (endHour >= 24) endHour = 23;
    return formatTime(endHour, endMinute);
  };

  const height = timeSlotHeight; // 1 hour
  // Center the placeholder on the touch point by offsetting by half its height
  const centeredTop = top - height / 2;
  const clampedTop = Math.max(8, centeredTop);

  return (
    <div
      className="absolute left-2 right-2 z-50 pointer-events-none select-none"
      style={{
        top: `${clampedTop}px`,
        height: `${height}px`,
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/96 dark:bg-slate-800/96 px-4 py-3 text-slate-900 dark:text-slate-100 shadow-[0_32px_60px_-24px_rgba(15,23,42,0.65)] dark:shadow-[0_32px_60px_-24px_rgba(0,0,0,0.85)] backdrop-blur-xl ring-1 ring-white/35 dark:ring-slate-700/35 before:absolute before:inset-0 before:-z-10 before:bg-white/35 dark:before:bg-slate-800/35 before:backdrop-blur-2xl">
        <div className="flex flex-col gap-3">
          <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-primary/10 dark:bg-primary/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary dark:text-primary-400">
            New Event
          </span>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary dark:text-primary-400" />
            <span className="text-2xl font-semibold leading-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
              {formatTime(hour, minute)}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/70 dark:border-slate-600/70 bg-slate-50/95 dark:bg-slate-700/95 px-3 py-2 text-left">
          <div className="text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
            Starts • {formatTime(hour, minute)}
          </div>
          <div className="text-[13px] font-medium leading-tight text-slate-600 dark:text-slate-400">
            Ends • {formatEndTime(hour, minute)}
          </div>
        </div>
      </div>
    </div>
  );
};
