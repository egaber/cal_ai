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
    let endMinute = startMinute;
    if (endHour >= 24) endHour = 23;
    return formatTime(endHour, endMinute);
  };

  const height = timeSlotHeight; // 1 hour

  return (
    <div
      className="absolute left-2 right-2 rounded-xl z-40 pointer-events-none select-none overflow-hidden"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {/* Glass effect container inspired by the attached images */}
      <div className="h-full w-full rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-2 border-primary/50 shadow-xl flex flex-col items-center justify-center gap-1.5 p-3 overflow-hidden">
        {/* Large time display */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Clock className="h-5 w-5 text-primary animate-pulse flex-shrink-0" />
          <div className="text-2xl font-bold text-primary whitespace-nowrap">
            {formatTime(hour, minute)}
          </div>
        </div>

        {/* "New Event" text */}
        <div className="text-sm font-semibold text-primary/90 whitespace-nowrap flex-shrink-0">
          New Event
        </div>

        {/* Duration */}
        <div className="text-xs font-medium text-primary/70 whitespace-nowrap flex-shrink-0">
          {formatTime(hour, minute)} - {formatEndTime(hour, minute)}
        </div>

        {/* Visual hint */}
        <div className="text-[9px] text-primary/60 text-center whitespace-nowrap flex-shrink-0 mt-0.5 px-2 truncate max-w-full">
          Release to confirm
        </div>
      </div>
    </div>
  );
};
