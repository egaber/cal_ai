import { useState, useRef } from "react";
import { CalendarEvent } from "@/types/calendar";
import { DraggableEventCard } from "./DraggableEventCard";

interface CalendarGridProps {
  viewMode: 'day' | 'week' | 'month';
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onEventUpdate: (eventId: string, newStartTime: string, newEndTime: string) => void;
  onTimeSlotClick: (date: Date, hour: number, minute: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const TIME_SLOT_HEIGHT = 60; // pixels per hour

export const CalendarGrid = ({
  viewMode,
  currentDate,
  events,
  onEventClick,
  onEventUpdate,
  onTimeSlotClick,
}: CalendarGridProps) => {
  const gridRef = useRef<HTMLDivElement>(null);

  const getWeekDates = () => {
    const week = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      week.push(date);
    }
    return week;
  };

  const getDayDates = () => {
    return [currentDate];
  };

  const dates = viewMode === 'week' ? getWeekDates() : getDayDates();
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

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
    onTimeSlotClick(date, hour, minutes);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden select-none">
      {/* Day headers */}
      <div className="flex border-b border-border bg-background sticky top-0 z-20">
        <div className="w-20 flex-shrink-0 border-r border-border bg-background" />
        {dates.map((date, idx) => (
          <div
            key={idx}
            className="flex flex-1 flex-col items-center justify-center py-3 border-r border-border last:border-r-0"
          >
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {DAYS_OF_WEEK[date.getDay()]}
            </div>
            <div
              className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold transition-all ${
                isToday(date)
                  ? 'bg-primary text-primary-foreground scale-110'
                  : 'text-foreground hover:bg-secondary'
              }`}
            >
              {date.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div ref={gridRef} className="calendar-grid relative">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="flex border-b border-border"
              style={{ height: `${TIME_SLOT_HEIGHT}px` }}
            >
              {/* Time label */}
              <div className="w-20 flex-shrink-0 border-r border-border bg-background sticky left-0 z-10">
                <div className="px-3 py-1 text-right">
                  <span className="text-xs font-medium text-muted-foreground">
                    {formatTime(hour)}
                  </span>
                </div>
              </div>

              {/* Time slots for each day */}
              {dates.map((date, dateIdx) => (
                <div
                  key={dateIdx}
                  className="relative flex-1 border-r border-border last:border-r-0 transition-colors hover:bg-secondary/30 cursor-pointer group"
                  onClick={(e) => handleTimeSlotClick(date, hour, e)}
                >
                  {/* 15-minute grid lines */}
                  <div className="absolute inset-0 flex flex-col">
                    <div className="flex-1 border-b border-border/30" />
                    <div className="flex-1 border-b border-border/30" />
                    <div className="flex-1 border-b border-border/30" />
                    <div className="flex-1" />
                  </div>

                  {/* Hover indicator */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute inset-x-1 top-1 h-0.5 bg-primary/40 rounded" />
                  </div>

                  {/* Events container for this time slot */}
                  {hour === 0 && (
                    <div className="absolute inset-0" style={{ height: `${24 * TIME_SLOT_HEIGHT}px` }}>
                      {getEventsForDate(date).map((event) => (
                        <DraggableEventCard
                          key={event.id}
                          event={event}
                          onClick={() => onEventClick(event)}
                          onMove={onEventUpdate}
                          gridHeight={24 * TIME_SLOT_HEIGHT}
                          columnWidth={100}
                          timeSlotHeight={TIME_SLOT_HEIGHT}
                          columnIndex={dateIdx}
                          dates={dates}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
