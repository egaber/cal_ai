import { useEffect, useRef, useMemo, useState } from "react";
import { CalendarEvent, FamilyMember } from "@/types/calendar";
import { DraggableEventCard } from "./DraggableEventCard";
import { calculateEventLayouts, EventLayout } from "@/utils/eventLayoutUtils";
import { InlineEventCreator } from "./InlineEventCreator";
import { DraggableEventPlaceholder } from "./DraggableEventPlaceholder";

interface MobileCalendarViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  familyMembers: FamilyMember[];
  onEventClick: (event: CalendarEvent, clickX: number, clickY: number) => void;
  onEventUpdate: (eventId: string, newStartTime: string, newEndTime: string) => void;
  onTimeSlotClick: (date: Date, hour: number, minute: number, clickX: number, clickY: number) => void;
  onDateChange: (date: Date) => void;
  inlineDraft?: { date: Date; hour: number; minute: number };
  onInlineSave?: (title: string, isAllDay?: boolean) => void;
  onInlineCancel?: () => void;
  highlightEventId?: string | null;
  onLongPressComplete?: (date: Date, hour: number, minute: number) => void;
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
  inlineDraft,
  onInlineSave,
  onInlineCancel,
  highlightEventId,
  onLongPressComplete,
}: MobileCalendarViewProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Long-press state
  const [longPressActive, setLongPressActive] = useState(false);
  const [placeholderPosition, setPlaceholderPosition] = useState<{ top: number; hour: number; minute: number } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressing = useRef(false);
  const touchStartY = useRef<number>(0);
  const initialScrollTop = useRef<number>(0);
  const [eventDragActive, setEventDragActive] = useState(false);

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

  const currentDayEvents = useMemo(() => getEventsForDate(currentDate), [currentDate, events]);
  const currentEventLayouts = useMemo(() => calculateEventLayouts(events, currentDate), [events, currentDate]);

  // Lock body scroll and prevent pull-to-refresh when long-press OR event drag is active
  useEffect(() => {
    if (longPressActive || eventDragActive) {
      // Store original styles
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalTouchAction = document.body.style.touchAction;
      const originalOverscrollBehavior = document.body.style.overscrollBehavior;
      const htmlOriginalOverscrollBehavior = document.documentElement.style.overscrollBehavior;
      
      // Lock scroll and prevent pull-to-refresh
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.touchAction = 'none';
      document.body.style.width = '100%';
      document.body.style.overscrollBehavior = 'none'; // Prevents pull-to-refresh
      document.documentElement.style.overscrollBehavior = 'none'; // Also on html element
      
      // Cleanup on unmount or when long-press ends
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.touchAction = originalTouchAction;
        document.body.style.width = '';
        document.body.style.overscrollBehavior = originalOverscrollBehavior;
        document.documentElement.style.overscrollBehavior = htmlOriginalOverscrollBehavior;
      };
    }
  }, [longPressActive, eventDragActive]);

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
    // Don't handle click if long-press was active
    if (isLongPressing.current) {
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const minuteFraction = clickY / TIME_SLOT_HEIGHT;
    const minutes = Math.round(minuteFraction * 60);
    onTimeSlotClick(date, hour, minutes, e.clientX, e.clientY);
  };

  const calculateTimeFromY = (clientY: number): { hour: number; minute: number; top: number } => {
    if (!scrollContainerRef.current) {
      return { hour: 0, minute: 0, top: 0 };
    }

    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const relativeY = clientY - rect.top + scrollTop;
    
    // Calculate total minutes from midnight
    const totalMinutes = Math.max(0, (relativeY / TIME_SLOT_HEIGHT) * 60);
    
    // Snap to 15-minute intervals
    const snappedMinutes = Math.round(totalMinutes / 15) * 15;
    const hour = Math.min(23, Math.floor(snappedMinutes / 60));
    const minute = snappedMinutes % 60;
    
    // Calculate top position (in pixels from midnight)
    const top = (hour * 60 + minute) * (TIME_SLOT_HEIGHT / 60);
    
    return { hour, minute, top };
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // Don't start long-press if there's already inline draft or if touching an event
    if (inlineDraft) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('[data-event-card]') || target.closest('[data-inline-creator]')) {
      return;
    }

    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    initialScrollTop.current = scrollContainerRef.current?.scrollTop || 0;
    
    // Start long-press timer
    longPressTimer.current = setTimeout(() => {
      isLongPressing.current = true;
      setLongPressActive(true);
      
      const { hour, minute, top } = calculateTimeFromY(touch.clientY);
      setPlaceholderPosition({ top, hour, minute });
      
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const moveDistance = Math.abs(touch.clientY - touchStartY.current);
    
    if (isLongPressing.current) {
      // CRITICAL: Prevent scrolling AND text selection while dragging placeholder
      // Use both preventDefault and stopPropagation to block all scroll behavior
      e.preventDefault();
      e.stopPropagation();
      
      const { hour, minute, top } = calculateTimeFromY(touch.clientY);
      setPlaceholderPosition({ top, hour, minute });
      
      // Additional haptic feedback during drag
      if (Math.abs(top - (placeholderPosition?.top || 0)) > 20 && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } else if (longPressTimer.current && moveDistance > 10) {
      // Cancel long-press if user moves more than 10px before threshold
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (isLongPressing.current && placeholderPosition && onLongPressComplete) {
      // Complete the long-press - open drawer with selected time
      onLongPressComplete(currentDate, placeholderPosition.hour, placeholderPosition.minute);
    }
    
    // Reset state
    isLongPressing.current = false;
    setLongPressActive(false);
    setPlaceholderPosition(null);
  };

  const renderDayColumn = (date: Date, dayEvents: CalendarEvent[], eventLayouts: Map<string, EventLayout>) => {
    const isTodayDate = date.toDateString() === now.toDateString();
    
    return (
      <div className="absolute inset-0 flex flex-col">
        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto overflow-x-hidden ios-scroll hide-scrollbar"
          style={(longPressActive || eventDragActive) ? { 
            overflow: 'hidden',
            touchAction: 'pan-y',
          } : undefined}
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
                    className={`relative flex-1 cursor-pointer transition-colors select-none ${
                      isTodayDate
                        ? isNightHour
                          ? 'bg-slate-50 active:bg-slate-100'
                          : 'bg-blue-50/30 active:bg-blue-50/50'
                        : isNightHour
                        ? 'bg-gray-50 active:bg-gray-100'
                        : 'bg-white active:bg-gray-50'
                    }`}
                    onClick={(e) => handleTimeSlotClick(date, hour, e)}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
                  >
                    {/* 15-minute grid lines */}
                    <div className="absolute inset-0 flex flex-col pointer-events-none">
                      <div className="flex-1 border-b border-gray-100" />
                      <div className="flex-1 border-b border-gray-100" />
                      <div className="flex-1 border-b border-gray-100" />
                      <div className="flex-1" />
                    </div>

                    {/* Long-press placeholder */}
                    {hour === 0 && longPressActive && placeholderPosition && (
                      <DraggableEventPlaceholder
                        top={placeholderPosition.top}
                        hour={placeholderPosition.hour}
                        minute={placeholderPosition.minute}
                        timeSlotHeight={TIME_SLOT_HEIGHT}
                      />
                    )}

                    {/* Events */}
                    {hour === 0 && (
                      <div className="absolute inset-0 pointer-events-none" style={{ height: `${24 * TIME_SLOT_HEIGHT}px` }}>
                        {dayEvents.map((event) => {
                          const member = familyMembers.find(m => m.id === event.memberId);
                          const layout = eventLayouts.get(event.id);
                          
                          return (
                            <div
                              key={event.id}
                              className={`pointer-events-auto ${
                                highlightEventId === event.id
                                  ? 'animate-pulse-highlight'
                                  : ''
                              }`}
                            >
                              <DraggableEventCard
                                event={event}
                                onClick={(e) => onEventClick(event, e.clientX, e.clientY)}
                                onMove={onEventUpdate}
                                gridHeight={24 * TIME_SLOT_HEIGHT}
                                columnWidth={100}
                                timeSlotHeight={TIME_SLOT_HEIGHT}
                                columnIndex={0}
                                dates={[date]}
                                member={member}
                                familyMembers={familyMembers}
                                layout={layout}
                                onDragStateChange={setEventDragActive}
                              />
                            </div>
                          );
                        })}

                        {inlineDraft && inlineDraft.date.toDateString() === date.toDateString() && (
                          <div
                            className="absolute left-1 right-1 rounded-lg border-2 border-primary bg-white shadow-lg z-30"
                            style={{
                              top: `${(inlineDraft.hour * 60 + inlineDraft.minute) * (TIME_SLOT_HEIGHT / 60)}px`,
                              height: `${TIME_SLOT_HEIGHT * 2.5}px`,
                              minHeight: '180px',
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                            onTouchEnd={(e) => e.stopPropagation()}
                          >
                            <InlineEventCreator
                              date={inlineDraft.date}
                              hour={inlineDraft.hour}
                              minute={inlineDraft.minute}
                              onSave={(title, isAllDay) => onInlineSave && onInlineSave(title, isAllDay)}
                              onCancel={() => onInlineCancel && onInlineCancel()}
                            />
                          </div>
                        )}
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

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Calendar day container */}
      <div className="absolute inset-0 right-20">
        {renderDayColumn(currentDate, currentDayEvents, currentEventLayouts)}
      </div>

      {/* Scrollable time labels on the right */}
      <div className="absolute top-0 right-0 bottom-0 w-20 bg-white/95 backdrop-blur border-l border-gray-200 pointer-events-none overflow-hidden">
        <div
          className="h-full overflow-y-scroll hide-scrollbar"
          ref={useRef((el: HTMLDivElement | null) => {
            if (el && scrollContainerRef.current) {
              // Sync scroll position with main calendar
              const syncScroll = () => {
                if (scrollContainerRef.current) {
                  el.scrollTop = scrollContainerRef.current.scrollTop;
                }
              };
              scrollContainerRef.current.addEventListener('scroll', syncScroll);
              // Store cleanup function but don't return it from ref callback
              el.dataset.cleanup = 'registered';
            }
          }).current}
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
    </div>
  );
};
