import { useState, useRef, useEffect } from "react";
import { CalendarEvent, FamilyMember } from "@/types/calendar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

interface AllDayEventsBarProps {
  dates: Date[];
  events: CalendarEvent[];
  familyMembers: FamilyMember[];
  onEventClick: (event: CalendarEvent, clickX: number, clickY: number) => void;
  onEventUpdate?: (eventId: string, newStartTime: string, newEndTime: string) => void;
}

export const AllDayEventsBar = ({
  dates,
  events,
  familyMembers,
  onEventClick,
  onEventUpdate,
}: AllDayEventsBarProps) => {
  const [resizableHeight, setResizableHeight] = useState(60);
  const minHeight = 40;
  const maxHeight = 200;

  // Filter only all-day events
  const allDayEvents = events.filter(event => event.isAllDay);

  // Helper to check if date is within event range
  const isDateInEventRange = (date: Date, event: CalendarEvent) => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    // Set to start of day for comparison
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    
    const eventStartDay = new Date(eventStart);
    eventStartDay.setHours(0, 0, 0, 0);
    
    const eventEndDay = new Date(eventEnd);
    eventEndDay.setHours(0, 0, 0, 0);
    
    return dateStart >= eventStartDay && dateStart <= eventEndDay;
  };

  // Calculate which days an event spans
  const getEventSpan = (event: CalendarEvent) => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    eventStart.setHours(0, 0, 0, 0);
    eventEnd.setHours(0, 0, 0, 0);
    
    // Find first and last visible dates
    const firstVisibleIndex = dates.findIndex(date => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() >= eventStart.getTime();
    });
    
    const lastVisibleIndex = dates.findIndex(date => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() > eventEnd.getTime();
    });
    
    const startIndex = firstVisibleIndex === -1 ? 0 : firstVisibleIndex;
    const endIndex = lastVisibleIndex === -1 ? dates.length - 1 : lastVisibleIndex - 1;
    
    return {
      startIndex,
      endIndex,
      span: endIndex - startIndex + 1,
    };
  };

  // Group events by row to avoid overlaps
  const organizeEventsInRows = () => {
    const rows: CalendarEvent[][] = [];
    
    allDayEvents.forEach(event => {
      const { startIndex, endIndex } = getEventSpan(event);
      
      // Find a row where this event fits
      let placedInRow = false;
      for (const row of rows) {
        const hasConflict = row.some(existingEvent => {
          const existingSpan = getEventSpan(existingEvent);
          return !(endIndex < existingSpan.startIndex || startIndex > existingSpan.endIndex);
        });
        
        if (!hasConflict) {
          row.push(event);
          placedInRow = true;
          break;
        }
      }
      
      // If no suitable row found, create a new one
      if (!placedInRow) {
        rows.push([event]);
      }
    });
    
    return rows;
  };

  const eventRows = organizeEventsInRows();
  const rowHeight = 24; // Height of each event bar
  const rowGap = 4; // Gap between rows
  const contentHeight = eventRows.length * (rowHeight + rowGap) + 8; // +8 for padding

  // Auto-adjust height based on content
  useEffect(() => {
    if (allDayEvents.length > 0) {
      const idealHeight = Math.min(Math.max(contentHeight, minHeight), maxHeight);
      setResizableHeight(idealHeight);
    } else {
      setResizableHeight(minHeight);
    }
  }, [eventRows.length, contentHeight, allDayEvents.length]);

  const getCategoryColor = (category: CalendarEvent['category']) => {
    const colors: Record<CalendarEvent['category'], string> = {
      health: 'bg-red-500',
      work: 'bg-blue-500',
      personal: 'bg-purple-500',
      family: 'bg-pink-500',
      education: 'bg-indigo-500',
      social: 'bg-green-500',
      finance: 'bg-emerald-500',
      home: 'bg-orange-500',
      travel: 'bg-cyan-500',
      fitness: 'bg-lime-500',
      food: 'bg-amber-500',
      shopping: 'bg-violet-500',
      entertainment: 'bg-fuchsia-500',
      sports: 'bg-teal-500',
      hobby: 'bg-rose-500',
      volunteer: 'bg-sky-500',
      appointment: 'bg-slate-500',
      maintenance: 'bg-stone-500',
      celebration: 'bg-yellow-500',
      meeting: 'bg-blue-600',
      childcare: 'bg-pink-400',
      pet: 'bg-amber-600',
      errand: 'bg-gray-500',
      transport: 'bg-cyan-600',
      project: 'bg-indigo-600',
      deadline: 'bg-red-600',
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <div 
      className="relative border-b border-border/60 bg-white/90"
      style={{ height: `${resizableHeight}px`, minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px` }}
    >
      {/* Resize handle */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-primary/20 transition-colors z-10 group"
        onMouseDown={(e) => {
          e.preventDefault();
          const startY = e.clientY;
          const startHeight = resizableHeight;
          
          const handleMouseMove = (e: MouseEvent) => {
            const deltaY = e.clientY - startY;
            const newHeight = Math.min(Math.max(startHeight + deltaY, minHeight), maxHeight);
            setResizableHeight(newHeight);
          };
          
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      >
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-border/40 rounded-full group-hover:bg-primary/40 transition-colors" />
      </div>

      {/* Events container */}
      <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent px-2 py-1">
        <div className="flex h-full">
          {/* Time label spacer */}
          <div className="w-20 flex-shrink-0 flex items-center justify-end pr-2">
            {allDayEvents.length === 0 && (
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">All Day</span>
            )}
          </div>
          
          {/* Event bars grid */}
          <div className="flex-1 relative" style={{ minHeight: `${contentHeight}px` }}>
            {allDayEvents.length === 0 && (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground/50">
                No all-day events
              </div>
            )}
            {eventRows.map((row, rowIndex) => (
              <div 
                key={rowIndex} 
                className="absolute left-0 right-0"
                style={{ 
                  top: `${rowIndex * (rowHeight + rowGap) + 4}px`,
                  height: `${rowHeight}px`
                }}
              >
                <div className="flex relative h-full">
                  {dates.map((date, dateIndex) => (
                    <div 
                      key={dateIndex}
                      className="flex-1 relative"
                      style={{ minWidth: '200px' }}
                    >
                      {row.map(event => {
                        const { startIndex, span } = getEventSpan(event);
                        
                        // Only render the event on its starting date
                        if (startIndex !== dateIndex) return null;
                        
                        const member = familyMembers.find(m => m.id === event.memberId);
                        const categoryColor = getCategoryColor(event.category);
                        
                        return (
                          <div
                            key={event.id}
                            className={`absolute top-0 h-full ${categoryColor} rounded-md shadow-sm cursor-pointer hover:shadow-md transition-all flex items-center px-2 text-white text-xs font-medium overflow-hidden`}
                            style={{
                              left: '2px',
                              right: span > 1 ? `calc(-${(span - 1) * 100}% - ${(span - 1) * 2}px)` : '2px',
                              width: span > 1 ? `calc(${span * 100}% + ${(span - 1) * 4}px)` : 'calc(100% - 4px)',
                            }}
                            onClick={(e) => onEventClick(event, e.clientX, e.clientY)}
                          >
                            <span className="truncate">
                              {event.emoji && <span className="mr-1">{event.emoji}</span>}
                              {event.title}
                            </span>
                            {span > 1 && (
                              <span className="ml-auto text-[10px] opacity-80">
                                {span} days
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
