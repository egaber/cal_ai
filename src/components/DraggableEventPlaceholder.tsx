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
  // Center the placeholder on the touch point by offsetting by half its height
  const centeredTop = top - (height / 2);

  return (
    <div
      className="absolute left-2 right-2 rounded-2xl z-40 pointer-events-none select-none"
      style={{
        top: `${centeredTop}px`,
        height: `${height}px`,
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {/* Enhanced glass effect with better transparency */}
      <div className="h-full w-full rounded-2xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-xl border-2 border-white/40 shadow-2xl flex flex-col items-center justify-center gap-2 p-4">
        {/* Large time display with icon */}
        <div className="flex items-center gap-2.5">
          <Clock className="h-6 w-6 text-white/90 animate-pulse flex-shrink-0" />
          <div className="text-3xl font-bold text-white drop-shadow-lg">
            {formatTime(hour, minute)}
          </div>
        </div>

        {/* "New Event" text */}
        <div className="text-base font-semibold text-white/95 drop-shadow">
          New Event
        </div>

        {/* Duration with better spacing */}
        <div className="text-sm font-medium text-white/80 drop-shadow-sm">
          {formatTime(hour, minute)} - {formatEndTime(hour, minute)}
        </div>

        {/* Visual hint */}
        <div className="text-[10px] text-white/70 text-center mt-1 font-medium">
          Release to confirm
        </div>
      </div>
    </div>
  );
};
