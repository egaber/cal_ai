import { useEffect, useRef } from "react";
import { CalendarEvent, FamilyMember } from "@/types/calendar";
import { DraggableEventCard } from "./DraggableEventCard";

interface CalendarGridProps {
  viewMode: 'day' | 'week' | 'workweek' | 'month';
  currentDate: Date;
  events: CalendarEvent[];
  familyMembers: FamilyMember[];
  onEventClick: (event: CalendarEvent, clickX: number, clickY: number) => void;
  onEventUpdate: (eventId: string, newStartTime: string, newEndTime: string) => void;
  onTimeSlotClick: (date: Date, hour: number, minute: number, clickX: number, clickY: number) => void;
}

const START_HOUR = 0; // 12 AM - start of day
const END_HOUR = 23; // 11 PM - end of day
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const TIME_SLOT_HEIGHT = 100; // pixels per hour - increased for better readability
const DEFAULT_VISIBLE_START_HOUR = 6; // Start scroll at 6 AM (viewport shows 6am-6pm)
const GRID_HEIGHT = 24 * TIME_SLOT_HEIGHT; // Full 24-hour height for calculations
const visibleHoursCount = 12;

export const CalendarGrid = ({
  viewMode,
  currentDate,
  events,
  familyMembers,
  onEventClick,
  onEventUpdate,
  onTimeSlotClick,
}: CalendarGridProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getWeekDates = () => {
    const week = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const daysToShow = viewMode === 'workweek' ? 5 : 7; // Work week: Sun-Thu (5 days), Regular week: Sun-Sat (7 days)

    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      week.push(date);
    }
    return week;
  };

  const getDayDates = () => {
    return [currentDate];
  };

  const dates = viewMode === 'week' || viewMode === 'workweek' ? getWeekDates() : getDayDates();
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const now = new Date();
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  const currentTimePosition = (minutesSinceMidnight / 60) * TIME_SLOT_HEIGHT;
  const currentDayIndex = dates.findIndex((date) => date.toDateString() === now.toDateString());
  const showCurrentTimeIndicator = currentDayIndex !== -1;
  const dotLeftPercent = showCurrentTimeIndicator
    ? ((currentDayIndex + 0.5) / dates.length) * 100
    : 0;

  const formatTime = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const handleTimeSlotClick = (date: Date, hour: number, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const minuteFraction = clickY / TIME_SLOT_HEIGHT;
    const minutes = Math.round(minuteFraction * 60);
    onTimeSlotClick(date, hour, minutes, e.clientX, e.clientY);
  };

  useEffect(() => {
    if (viewMode === 'month') return;

    const container = scrollContainerRef.current;
    if (container) {
      // Scroll to 6 AM at the start
      const scrollOffset = (DEFAULT_VISIBLE_START_HOUR - START_HOUR) * TIME_SLOT_HEIGHT;
      container.scrollTop = scrollOffset;
    }
  }, [currentDate, viewMode]);

  
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-secondary/40 select-none">
      {/* Day headers - Fixed outside scroll container */}
      <div className="z-20 flex border-b border-border/60 bg-white/80 backdrop-blur">
        <div className="w-20 flex-shrink-0 border-r border-border/60 bg-white/80" />
        {dates.map((date, idx) => (
          <div
            key={idx}
            className="flex flex-1 flex-col items-center justify-center border-r border-border/60 py-3 last:border-r-0"
            style={{ minWidth: '200px' }}
          >
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {DAYS_OF_WEEK[date.getDay()]}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold transition-all ${
                  isToday(date)
                    ? 'scale-110 bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                    : 'bg-white text-foreground shadow border border-border/60'
                }`}
              >
                {date.getDate()}
              </div>
            </div>
            <p className="mt-1 text-[0.65rem] font-medium uppercase tracking-[0.25em] text-muted-foreground">
              {date.toLocaleDateString('en-US', { month: 'short' })}
            </p>
          </div>
        ))}
      </div>

      {/* Time grid - Scrollable container with fixed viewport */}
      <div 
        ref={scrollContainerRef} 
        className="overflow-y-scroll overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        style={{ height: `${visibleHoursCount * TIME_SLOT_HEIGHT}px` }}
      >
        <div ref={gridRef} className="calendar-grid relative">
          {showCurrentTimeIndicator && (
            <div
              className="pointer-events-none absolute z-30"
              style={{
                top: `${currentTimePosition}px`,
                left: '5rem',
                right: '0',
              }}
            >
              <div className="relative">
                <div className="h-px w-full bg-primary/50" />
                <div
                  className="absolute top-1/2 -translate-y-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary-foreground shadow-md"
                  style={{ left: `${dotLeftPercent}%`, transform: 'translate(-50%, -50%)' }}
                >
                  Now
                </div>
              </div>
            </div>
          )}

          {HOURS.map((hour) => (
            <div
              key={hour}
              className="flex border-b border-border/60"
              style={{ height: `${TIME_SLOT_HEIGHT}px` }}
            >
              {/* Time label */}
              <div className="sticky left-0 z-10 w-20 flex-shrink-0 border-r border-border/60 bg-white/80 backdrop-blur">
                <div className="px-2 py-2 text-right">
                  <div className="flex flex-col items-end text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                    <span>{formatTime(hour)}</span>
                  </div>
                </div>
              </div>

              {/* Time slots for each day */}
              {dates.map((date, dateIdx) => {
                // Define night hours (before 6 AM and after 8 PM)
                const isNightHour = hour < 6 || hour >= 20;
                
                return (
                  <div
                    key={dateIdx}
                    className={`group relative flex-1 cursor-pointer border-r border-border/60 transition-colors last:border-r-0 ${
                      isToday(date)
                        ? isNightHour
                          ? 'bg-slate-100/90 hover:bg-slate-200/70'
                          : 'bg-primary/5 hover:bg-primary/10'
                        : isNightHour
                        ? 'bg-slate-50/80 hover:bg-slate-100/60'
                        : 'bg-white/70 hover:bg-secondary/30'
                    }`}
                    style={{ minWidth: '200px' }}
                    onClick={(e) => handleTimeSlotClick(date, hour, e)}
                  >
                  {/* 15-minute grid lines */}
                  <div className="absolute inset-0 flex flex-col">
                    <div className="flex-1 border-b border-border/40" />
                    <div className="flex-1 border-b border-border/40" />
                    <div className="flex-1 border-b border-border/40" />
                    <div className="flex-1" />
                  </div>

                  {/* Hover indicator */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute inset-x-2 top-1 h-0.5 rounded bg-primary/40" />
                  </div>

                    {/* Events container for this time slot */}
                    {hour === START_HOUR && (
                      <div className="absolute inset-0" style={{ height: `${GRID_HEIGHT}px` }}>
                        {getEventsForDate(date).map((event) => {
                          const member = familyMembers.find(m => m.id === event.memberId);
                          return (
                            <DraggableEventCard
                              key={event.id}
                              event={event}
                              onClick={(e) => onEventClick(event, e.clientX, e.clientY)}
                              onMove={onEventUpdate}
                              gridHeight={GRID_HEIGHT}
                              columnWidth={100}
                              timeSlotHeight={TIME_SLOT_HEIGHT}
                              columnIndex={dateIdx}
                              dates={dates}
                              member={member}
                              familyMembers={familyMembers}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
