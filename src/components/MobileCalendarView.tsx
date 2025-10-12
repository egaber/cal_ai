import { useEffect, useRef, useState, useMemo } from "react";
import { CalendarEvent, FamilyMember } from "@/types/calendar";
import { DraggableEventCard } from "./DraggableEventCard";
import { calculateEventLayouts, EventLayout } from "@/utils/eventLayoutUtils";

interface MobileCalendarViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  familyMembers: FamilyMember[];
  onEventClick: (event: CalendarEvent, clickX: number, clickY: number) => void;
  onEventUpdate: (eventId: string, newStartTime: string, newEndTime: string) => void;
  onTimeSlotClick: (date: Date, hour: number, minute: number, clickX: number, clickY: number) => void;
  onDateChange: (date: Date) => void;
}

const TIME_SLOT_HEIGHT = 80;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const MobileCalendarView = ({
  currentDate,
  events,
  familyMembers,
  onEventClick,
  onEventUpdate,
  onTimeSlotClick,
  onDateChange,
}: MobileCalendarViewProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  const now = new Date();
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  const currentTimePosition = (minutesSinceMidnight / 60) * TIME_SLOT_HEIGHT;
  const isToday = currentDate.toDateString() === now.toDateString();

  const formatTime = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      if (event.isAllDay) return false;
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Get events for current, previous, and next day
  const nextDate = new Date(currentDate);
  nextDate.setDate(currentDate.getDate() + 1);
  const prevDate = new Date(currentDate);
  prevDate.setDate(currentDate.getDate() - 1);

  const currentDayEvents = useMemo(() => getEventsForDate(currentDate), [currentDate, events]);
  const nextDayEvents = useMemo(() => getEventsForDate(nextDate), [nextDate, events]);
  const prevDayEvents = useMemo(() => getEventsForDate(prevDate), [prevDate, events]);

  const currentEventLayouts = useMemo(() => calculateEventLayouts(events, currentDate), [events, currentDate]);
  const nextEventLayouts = useMemo(() => calculateEventLayouts(events, nextDate), [events, nextDate]);
  const prevEventLayouts = useMemo(() => calculateEventLayouts(events, prevDate), [events, prevDate]);

  // Auto-scroll to current time on mount and when returning to today
  useEffect(() => {
    if (scrollContainerRef.current && isToday) {
      const container = scrollContainerRef.current;
      const containerHeight = container.clientHeight;
      const scrollTarget = currentTimePosition - containerHeight / 2;
      
      setTimeout(() => {
        container.scrollTo({
          top: Math.max(0, scrollTarget),
          behavior: 'smooth'
        });
      }, 100);
    } else if (scrollContainerRef.current) {
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: 6 * TIME_SLOT_HEIGHT,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [currentDate, isToday, currentTimePosition]);

  const handleTimeSlotClick = (date: Date, hour: number, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const minuteFraction = clickY / TIME_SLOT_HEIGHT;
    const minutes = Math.round(minuteFraction * 60);
    onTimeSlotClick(date, hour, minutes, e.clientX, e.clientY);
  };

  // Swipe gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isAnimating) return;
    
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
    
    if (Math.abs(deltaX) > 20 && Math.abs(deltaX) > deltaY) {
      isSwiping.current = true;
      setSwipeOffset(deltaX);
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) {
      setSwipeOffset(0);
      return;
    }

    const threshold = 100;
    
    if (Math.abs(swipeOffset) > threshold) {
      setIsAnimating(true);
      
      // Create stable date reference at the moment of swipe completion
      const targetDate = new Date(currentDate);
      if (swipeOffset > 0) {
        // Swipe right = next day
        targetDate.setDate(targetDate.getDate() + 1);
      } else {
        // Swipe left = previous day
        targetDate.setDate(targetDate.getDate() - 1);
      }
      
      setTimeout(() => {
        onDateChange(targetDate);
        setSwipeOffset(0);
        setIsAnimating(false);
      }, 200);
    } else {
      setSwipeOffset(0);
    }
    
    isSwiping.current = false;
  };

  const getSwipeTransform = () => {
    if (isAnimating) {
      return swipeOffset > 0 ? 'translateX(100%)' : 'translateX(-100%)';
    }
    return `translateX(${swipeOffset}px)`;
  };

  const formatDateLabel = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderDayColumn = (date: Date, dayEvents: CalendarEvent[], eventLayouts: Map<string, EventLayout>, offset: number) => {
    const isCurrentDay = date.toDateString() === currentDate.toDateString();
    const isTodayDate = date.toDateString() === now.toDateString();
    
    return (
      <div
        className="absolute inset-0 flex flex-col"
        style={{
          transform: `translateX(${offset}px)`,
          transition: isAnimating ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        <div
          ref={isCurrentDay ? scrollContainerRef : null}
          className="h-full overflow-y-auto overflow-x-hidden ios-scroll hide-scrollbar"
        >
          <div className="relative">
            {/* Current time indicator */}
            {isTodayDate && (
              <div
                className="pointer-events-none absolute z-30 w-full"
                style={{ top: `${currentTimePosition}px` }}
              >
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 right-10 h-0.5 bg-red-500" />
                  <div className="absolute flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-1 " />
                    <div className="text-[10px] font-bold text-red-500 uppercase tracking-wide">
                      NOW
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Time slots */}
            {HOURS.map((hour) => {
              const isNightHour = hour < 6 || hour >= 20;
              
              return (
                <div
                  key={hour}
                  className="flex border-b border-gray-200"
                  style={{ height: `${TIME_SLOT_HEIGHT}px` }}
                >
                  <div 
                    className={`relative flex-1 cursor-pointer transition-colors ${
                      isTodayDate
                        ? isNightHour
                          ? 'bg-slate-50 active:bg-slate-100'
                          : 'bg-blue-50/30 active:bg-blue-50/50'
                        : isNightHour
                        ? 'bg-gray-50 active:bg-gray-100'
                        : 'bg-white active:bg-gray-50'
                    }`}
                    onClick={(e) => isCurrentDay && handleTimeSlotClick(date, hour, e)}
                  >
                    {/* 15-minute grid lines */}
                    <div className="absolute inset-0 flex flex-col pointer-events-none">
                      <div className="flex-1 border-b border-gray-100" />
                      <div className="flex-1 border-b border-gray-100" />
                      <div className="flex-1 border-b border-gray-100" />
                      <div className="flex-1" />
                    </div>

                    {/* Events */}
                    {hour === 0 && (
                      <div className="absolute inset-0" style={{ height: `${24 * TIME_SLOT_HEIGHT}px` }}>
                        {dayEvents.map((event) => {
                          const member = familyMembers.find(m => m.id === event.memberId);
                          const layout = eventLayouts.get(event.id);
                          
                          return (
                            <DraggableEventCard
                              key={event.id}
                              event={event}
                              onClick={(e) => isCurrentDay && onEventClick(event, e.clientX, e.clientY)}
                              onMove={onEventUpdate}
                              gridHeight={24 * TIME_SLOT_HEIGHT}
                              columnWidth={100}
                              timeSlotHeight={TIME_SLOT_HEIGHT}
                              columnIndex={0}
                              dates={[date]}
                              member={member}
                              familyMembers={familyMembers}
                              layout={layout}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;

  return (
    <div 
      className="relative h-full w-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Calendar days container - shows prev/current/next */}
      <div className="absolute inset-0 right-20">
        {/* Previous day - on the left */}
        {swipeOffset < 0 && renderDayColumn(prevDate, prevDayEvents, prevEventLayouts, swipeOffset - screenWidth)}
        
        {/* Current day */}
        {renderDayColumn(currentDate, currentDayEvents, currentEventLayouts, swipeOffset)}
        
        {/* Next day - on the right */}
        {swipeOffset > 0 && renderDayColumn(nextDate, nextDayEvents, nextEventLayouts, swipeOffset + screenWidth)}
      </div>

      {/* Scrollable time labels on the right */}
      <div className="absolute top-0 right-0 bottom-0 w-20 bg-white/95 backdrop-blur border-l border-gray-200 pointer-events-none overflow-hidden">
        <div
          className="h-full overflow-y-scroll hide-scrollbar"
          ref={(el) => {
            if (el && scrollContainerRef.current) {
              // Sync scroll position with main calendar
              const syncScroll = () => {
                if (scrollContainerRef.current) {
                  el.scrollTop = scrollContainerRef.current.scrollTop;
                }
              };
              scrollContainerRef.current.addEventListener('scroll', syncScroll);
              return () => scrollContainerRef.current?.removeEventListener('scroll', syncScroll);
            }
          }}
        >
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="flex items-start justify-end px-2 py-2 border-b border-gray-200"
              style={{ height: `${TIME_SLOT_HEIGHT}px` }}
            >
              <div className="text-right">
                <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  {formatTime(hour)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Date separator during swipe */}
      {swipeOffset !== 0 && (
        <div
          className="absolute top-0 bottom-0 z-50 flex items-center pointer-events-none"
          style={{
            left: swipeOffset < 0 ? 'auto' : `${swipeOffset}px`,
            right: swipeOffset < 0 ? `${-swipeOffset + 80}px` : 'auto',
          }}
        >
          <div className="w-0.5 h-full bg-gray-300" />
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-1 bg-gray-200/90 backdrop-blur rounded text-[10px] text-gray-600 font-medium whitespace-nowrap"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
            }}
          >
            {swipeOffset > 0 ? formatDateLabel(nextDate) : formatDateLabel(prevDate)}
          </div>
        </div>
      )}
    </div>
  );
};
