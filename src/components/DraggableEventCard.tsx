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
  card: string;
  bar: string;
  badge: string;
}> = {
  health: {
    card: 'border-emerald-100/80 hover:border-emerald-200 shadow-emerald-100/70',
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  work: {
    card: 'border-sky-100/80 hover:border-sky-200 shadow-sky-100/70',
    bar: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-700',
  },
  personal: {
    card: 'border-amber-100/80 hover:border-amber-200 shadow-amber-100/70',
    bar: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700',
  },
  family: {
    card: 'border-fuchsia-100/80 hover:border-fuchsia-200 shadow-fuchsia-100/70',
    bar: 'bg-fuchsia-500',
    badge: 'bg-fuchsia-100 text-fuchsia-700',
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
    if (!isDragging && cardRef.current) {
      // Pass the actual card position instead of mouse position
      const rect = cardRef.current.getBoundingClientRect();
      // Create a synthetic event with the card's right edge and vertical center
      const syntheticEvent = {
        ...e,
        clientX: rect.right,
        clientY: rect.top + rect.height / 2,
      } as React.MouseEvent;
      onClick(syntheticEvent);
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
        'absolute left-1 right-1 cursor-move select-none overflow-hidden rounded-2xl border bg-white/90 shadow-sm transition-all hover:shadow-md',
        styles.card,
        isDragging && 'scale-[1.01] border-primary/40',
        isResizing && 'scale-[1.01] border-primary/40',
        isHappening && 'scale-[1.01] border-primary/40',
        isUpcoming && 'ring-1 ring-primary/20',
        isDragging || isResizing ? 'z-50' : 'z-20',
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
        className="resize-handle absolute left-4 right-4 top-1 h-1 rounded-full bg-gray-300/50 opacity-0 transition-opacity cursor-ns-resize hover:opacity-100"
        onMouseDown={(e) => handleResizeMouseDown(e, 'top')}
      />

      <div className="flex h-full flex-col gap-0.5 pl-5 pr-4 py-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-foreground leading-tight flex-1">
            {event.title}
          </h4>
          <GripVertical className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/40 pointer-events-none" />
        </div>

        <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {formatTime(startDate)} – {formatTime(endDate)}
        </p>

        {event.description && height > 80 && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {event.description}
          </p>
        )}

        {height > 60 && (
          <div className="mt-auto flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
            <span className="uppercase tracking-[0.25em]">{formatDuration(startDate, endDate)}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em]', styles.badge)}>
              {event.category}
            </span>
            {isHappening && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-primary-foreground">
                <span className="h-1 w-1 animate-pulse rounded-full bg-white" />
                Now
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom resize handle */}
      <div
        className="resize-handle absolute bottom-1 left-4 right-4 h-1 rounded-full bg-gray-300/50 opacity-0 transition-opacity cursor-ns-resize hover:opacity-100"
        onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
      />
    </div>
  );
};
