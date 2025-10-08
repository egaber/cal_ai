import { useState, useRef, useEffect } from "react";
import { CalendarEvent } from "@/types/calendar";
import { GripVertical } from "lucide-react";

interface DraggableEventCardProps {
  event: CalendarEvent;
  onClick: () => void;
  onMove: (eventId: string, newStartTime: string, newEndTime: string) => void;
  gridHeight: number;
  columnWidth: number;
  timeSlotHeight: number;
  columnIndex: number;
  dates: Date[];
}

const CATEGORY_COLORS = {
  health: 'bg-event-green',
  work: 'bg-event-blue',
  personal: 'bg-event-orange',
  family: 'bg-event-purple',
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

  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
  
  const startHour = startDate.getHours();
  const startMinutes = startDate.getMinutes();
  const topPosition = (startHour * 60 + startMinutes) * (timeSlotHeight / 60);
  const height = (durationMinutes / 60) * timeSlotHeight;

  const colorClass = CATEGORY_COLORS[event.category] || 'bg-event-blue';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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
        const timeColumnWidth = 80; // w-20 in pixels
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
  }, [isDragging, isResizing, dragOffset, event, onMove, startDate, endDate, durationMinutes, timeSlotHeight, topPosition]);

  return (
    <div
      ref={cardRef}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        if (!isDragging) onClick();
      }}
      className={`${colorClass} absolute left-1 right-1 rounded-lg shadow-md transition-shadow hover:shadow-lg ${
        isDragging || isResizing ? 'opacity-80 shadow-xl z-50' : 'z-10'
      } cursor-move select-none`}
      style={{
        top: `${topPosition}px`,
        height: `${height}px`,
        minHeight: '30px',
      }}
    >
      {/* Top resize handle */}
      <div
        className="resize-handle absolute left-0 right-0 top-0 h-1 cursor-ns-resize hover:bg-white/30"
        onMouseDown={(e) => handleResizeMouseDown(e, 'top')}
      />

      <div className="flex h-full flex-col justify-between p-2 text-white select-none">
        <div className="flex items-start gap-1">
          <GripVertical className="h-4 w-4 flex-shrink-0 opacity-60 pointer-events-none" />
          <div className="flex-1 overflow-hidden">
            <h4 className="truncate text-sm font-semibold pointer-events-none">{event.title}</h4>
            <p className="text-xs opacity-90 pointer-events-none">
              {formatTime(startDate)} - {formatTime(endDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom resize handle */}
      <div
        className="resize-handle absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-white/30"
        onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
      />
    </div>
  );
};
