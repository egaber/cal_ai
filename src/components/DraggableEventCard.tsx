import { useState, useRef, useEffect, useMemo } from "react";
import { CalendarEvent } from "@/types/calendar";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraggableEventCardProps {
  event: CalendarEvent;
  onClick: (e: React.MouseEvent) => void;
  onMove: (eventId: string, newStartTime: string, newEndTime: string) => void;
  gridHeight: number;
  columnWidth: number;
  timeSlotHeight: number;
  columnIndex: number;
  dates: Date[];
}

const CATEGORY_STYLES: Record<CalendarEvent["category"], {
  background: string;
  ring: string;
  accent: string;
  text: string;
  badge: string;
  bar: string;
}> = {
  health: {
    background: 'from-emerald-400/90 via-emerald-500/90 to-emerald-600/95',
    ring: 'ring-emerald-200/30',
    accent: 'bg-emerald-300',
    text: 'text-white',
    badge: 'bg-white/20 text-white',
    bar: 'bg-emerald-500',
  },
  work: {
    background: 'from-sky-400/90 via-sky-500/90 to-blue-600/95',
    ring: 'ring-sky-200/30',
    accent: 'bg-sky-300',
    text: 'text-white',
    badge: 'bg-white/20 text-white',
    bar: 'bg-sky-500',
  },
  personal: {
    background: 'from-amber-400/90 via-orange-400/85 to-orange-500/90',
    ring: 'ring-amber-200/30',
    accent: 'bg-amber-300',
    text: 'text-slate-900',
    badge: 'bg-white/50 text-amber-900',
    bar: 'bg-amber-500',
  },
  family: {
    background: 'from-fuchsia-400/90 via-fuchsia-500/90 to-purple-600/95',
    ring: 'ring-fuchsia-200/30',
    accent: 'bg-fuchsia-300',
    text: 'text-white',
    badge: 'bg-white/20 text-white',
    bar: 'bg-fuchsia-500',
  },
};

export const DraggableEventCard = ({
  event,
  onClick,
  onMove,
  gridHeight,
  columnWidth,
  timeSlotHeight,
  columnIndex,
  dates,
}: DraggableEventCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const startDate = useMemo(() => new Date(event.startTime), [event.startTime]);
  const endDate = useMemo(() => new Date(event.endTime), [event.endTime]);
  const durationMinutes = useMemo(
    () => (endDate.getTime() - startDate.getTime()) / (1000 * 60),
    [endDate, startDate]
  );
  
  const startHour = startDate.getHours();
  const startMinutes = startDate.getMinutes();
  const topPosition = (startHour * 60 + startMinutes) * (timeSlotHeight / 60);
  const height = (durationMinutes / 60) * timeSlotHeight;

  const styles = CATEGORY_STYLES[event.category] ?? CATEGORY_STYLES.work;

  const now = new Date();
  const isHappening = now >= startDate && now <= endDate;
  const isUpcoming = now < startDate;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (start: Date, end: Date) => {
    const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (remainder === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${hours}h ${remainder}m`;
  };

  const snapToGrid = (minutes: number) => {
    const snapInterval = 15; // 15-minute intervals
    return Math.round(minutes / snapInterval) * snapInterval;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.classList.contains('resize-handle')) {
      return;
    }
    
    e.stopPropagation();
    setIsDragging(true);
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      // Pass click coordinates to parent
      onClick(e);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, direction: 'top' | 'bottom') => {
    e.stopPropagation();
    setIsResizing(direction);
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && cardRef.current) {
        const gridContainer = cardRef.current.closest('.calendar-grid');
        if (!gridContainer) return;

        const gridRect = gridContainer.getBoundingClientRect();
        const newY = e.clientY - gridRect.top - dragOffset.y;
        const newX = e.clientX - gridRect.left;
        
        // Calculate which column/day we're over
        const timeColumnWidth = 80; // matches w-20 time label width
        const availableWidth = gridRect.width - timeColumnWidth;
        const columnWidthPx = availableWidth / dates.length;
        const newColumnIndex = Math.floor((newX - timeColumnWidth) / columnWidthPx);
        
        // Calculate new time based on position
        const totalMinutes = snapToGrid((newY / timeSlotHeight) * 60);
        const newHour = Math.floor(totalMinutes / 60);
        const newMinute = totalMinutes % 60;

        if (newHour >= 0 && newHour < 24 && newColumnIndex >= 0 && newColumnIndex < dates.length) {
          const targetDate = dates[newColumnIndex];
          const newStartDate = new Date(targetDate);
          newStartDate.setHours(newHour, newMinute, 0, 0);
          
          const newEndDate = new Date(newStartDate);
          newEndDate.setTime(newStartDate.getTime() + durationMinutes * 60000);

          onMove(event.id, newStartDate.toISOString(), newEndDate.toISOString());
        }
      } else if (isResizing && cardRef.current) {
        const gridContainer = cardRef.current.closest('.calendar-grid');
        if (!gridContainer) return;

        const gridRect = gridContainer.getBoundingClientRect();
        const mouseY = e.clientY - gridRect.top;

        if (isResizing === 'bottom') {
          const newHeight = mouseY - topPosition;
          const newDurationMinutes = snapToGrid((newHeight / timeSlotHeight) * 60);
          
          if (newDurationMinutes >= 15) {
            const newEndDate = new Date(startDate);
            newEndDate.setTime(startDate.getTime() + newDurationMinutes * 60000);
            onMove(event.id, event.startTime, newEndDate.toISOString());
          }
        } else if (isResizing === 'top') {
          const newTopMinutes = snapToGrid((mouseY / timeSlotHeight) * 60);
          const newStartHour = Math.floor(newTopMinutes / 60);
          const newStartMinute = newTopMinutes % 60;
          
          const newStartDate = new Date(startDate);
          newStartDate.setHours(newStartHour, newStartMinute, 0, 0);
          
          if (newStartDate < endDate && newStartHour >= 0) {
            onMove(event.id, newStartDate.toISOString(), event.endTime);
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, event, onMove, startDate, endDate, durationMinutes, timeSlotHeight, topPosition, dates]);

  return (
    <div
      ref={cardRef}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className={cn(
        'absolute left-1 right-1 cursor-move select-none overflow-hidden rounded-2xl border border-white/20 shadow-lg shadow-black/10 transition-all',
        'bg-gradient-to-br backdrop-blur-sm',
        styles.background,
        styles.ring,
        isDragging || isResizing ? 'z-50 scale-[1.01] opacity-90 ring-2' : 'z-20 hover:shadow-xl hover:ring-1',
      )}
      style={{
        top: `${topPosition}px`,
        height: `${height}px`,
        minHeight: '30px',
      }}
    >
      {/* Vertical color bar on the left */}
      <div className={cn('absolute left-0 top-0 h-full w-1.5', styles.bar)} />

      {/* Top resize handle */}
      <div
        className="resize-handle absolute left-4 right-4 top-1 h-1 rounded-full bg-white/20 opacity-0 transition-opacity cursor-ns-resize hover:opacity-100"
        onMouseDown={(e) => handleResizeMouseDown(e, 'top')}
      />

      <div className={cn('flex h-full flex-col gap-2 p-3 pl-4 text-xs text-white', styles.text)}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={cn('h-2.5 w-2.5 rounded-full border border-white/40', styles.accent)} />
            <p className="font-semibold uppercase tracking-[0.32em] opacity-80">
              {formatTime(startDate)} – {formatTime(endDate)}
            </p>
          </div>
          <GripVertical className="h-4 w-4 flex-shrink-0 opacity-60 pointer-events-none" />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-base font-semibold leading-tight pointer-events-none">
              {event.title}
            </h4>
            {isHappening && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                Now
              </span>
            )}
            {!isHappening && isUpcoming && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
                Next
              </span>
            )}
          </div>

          {event.description && (
            <p className="max-h-12 overflow-hidden text-sm leading-relaxed opacity-90 pointer-events-none">
              {event.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] opacity-85">
          <span>{formatDuration(startDate, endDate)}</span>
          <span className="h-1 w-1 rounded-full bg-white/60 opacity-70" />
          <span className={cn('rounded-full px-2 py-1', styles.badge)}>{event.category}</span>
          <span className="h-1 w-1 rounded-full bg-white/60 opacity-70" />
          <span>Priority {event.priority}</span>
        </div>
      </div>

      {/* Bottom resize handle */}
      <div
        className="resize-handle absolute bottom-1 left-4 right-4 h-1 rounded-full bg-white/20 opacity-0 transition-opacity cursor-ns-resize hover:opacity-100"
        onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
      />
    </div>
  );
};
