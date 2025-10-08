import { useMemo, useState } from "react";
import { CalendarHeader } from "@/components/CalendarHeader";
import { CalendarGrid } from "@/components/CalendarGrid";
import { FamilyMembersSidebar } from "@/components/FamilyMembersSidebar";
import { MiniCalendar } from "@/components/MiniCalendar";
import { CapacityIndicator } from "@/components/CapacityIndicator";
import { AIAssistant } from "@/components/AIAssistant";
import { EventDetailsDialog } from "@/components/EventDetailsDialog";
import { NewEventDialog } from "@/components/NewEventDialog";
import { EventPopover } from "@/components/EventPopover";
import { InlineEventCreator } from "@/components/InlineEventCreator";
import { TodayOverview } from "@/components/TodayOverview";
import { CalendarEvent, FamilyMember } from "@/types/calendar";
import { useToast } from "@/hooks/use-toast";
import { CalendarService, CalendarOperations } from "@/services/calendarService";

const Index = () => {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'workweek' | 'month'>('week');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventPopoverOpen, setIsEventPopoverOpen] = useState(false);
  const [eventPopoverPosition, setEventPopoverPosition] = useState({ x: 0, y: 0 });
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [isInlineCreatorOpen, setIsInlineCreatorOpen] = useState(false);
  const [inlineCreatorData, setInlineCreatorData] = useState<{
    date: Date;
    hour: number;
    minute: number;
    position: { x: number; y: number };
  } | null>(null);
  const [newEventDefaults, setNewEventDefaults] = useState<{
    date?: Date;
    hour?: number;
    minute?: number;
  }>({});

  // Mock data for family members
  const [familyMembers] = useState<FamilyMember[]>([
    {
      id: '1',
      name: 'Eyal Gaber',
      role: 'Parent',
      color: 'bg-event-blue',
      isYou: true,
    },
    {
      id: '2',
      name: 'Sarah Gaber',
      role: 'Parent',
      color: 'bg-event-purple',
      isYou: false,
    },
    {
      id: '3',
      name: 'Alex Gaber',
      role: 'Child',
      color: 'bg-event-green',
      isYou: false,
    },
  ]);

  const [selectedMembers, setSelectedMembers] = useState<string[]>(['1']);

  // Mock events data
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Hip Hop Class (Hili)',
      startTime: new Date(2025, 9, 8, 10, 30).toISOString(),
      endTime: new Date(2025, 9, 8, 13, 45).toISOString(),
      category: 'health',
      priority: 'high',
      memberId: '3',
      description: 'Weekly hip hop class',
    },
    {
      id: '2',
      title: 'Team Meeting',
      startTime: new Date(2025, 9, 8, 14, 0).toISOString(),
      endTime: new Date(2025, 9, 8, 15, 0).toISOString(),
      category: 'work',
      priority: 'medium',
      memberId: '1',
      description: 'Weekly team sync',
    },
    {
      id: '3',
      title: 'Grocery Shopping',
      startTime: new Date(2025, 9, 9, 16, 0).toISOString(),
      endTime: new Date(2025, 9, 9, 17, 0).toISOString(),
      category: 'personal',
      priority: 'medium',
      memberId: '1',
    },
  ]);

  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(currentDate);
    
    if (direction === 'today') {
      setCurrentDate(new Date());
    } else if (direction === 'prev') {
      if (viewMode === 'week' || viewMode === 'workweek') {
        newDate.setDate(currentDate.getDate() - 7);
      } else {
        newDate.setDate(currentDate.getDate() - 1);
      }
      setCurrentDate(newDate);
    } else {
      if (viewMode === 'week' || viewMode === 'workweek') {
        newDate.setDate(currentDate.getDate() + 7);
      } else {
        newDate.setDate(currentDate.getDate() + 1);
      }
      setCurrentDate(newDate);
    }
  };

  const handleToggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleNewEvent = () => {
    setNewEventDefaults({});
    setIsNewEventDialogOpen(true);
  };

  const handleTimeSlotClick = (date: Date, hour: number, minute: number, clickX: number, clickY: number) => {
    setInlineCreatorData({
      date,
      hour,
      minute,
      position: { x: clickX, y: clickY },
    });
    setIsInlineCreatorOpen(true);
  };

  const handleInlineEventSave = (title: string) => {
    if (inlineCreatorData) {
      const { date, hour, minute } = inlineCreatorData;
      const startDate = new Date(date);
      startDate.setHours(hour, minute, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(hour + 1, minute, 0, 0); // Default 1 hour duration

      const newEvent: CalendarEvent = {
        id: `event_${Date.now()}`,
        title,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        category: 'personal',
        priority: 'medium',
        memberId: selectedMembers[0] || '1',
      };

      setEvents([...events, newEvent]);
      setIsInlineCreatorOpen(false);
      setInlineCreatorData(null);
      
      toast({
        title: "Event Created",
        description: `"${title}" has been added to your calendar`,
      });
    }
  };

  const handleInlineCreatorCancel = () => {
    setIsInlineCreatorOpen(false);
    setInlineCreatorData(null);
  };

  const handleCreateEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `event_${Date.now()}`,
    };
    setEvents([...events, newEvent]);
    toast({
      title: "Event Created",
      description: `"${newEvent.title}" has been added to your calendar`,
    });
  };

  const handleEventUpdate = (eventId: string, newStartTime: string, newEndTime: string) => {
    setEvents(events.map(event =>
      event.id === eventId
        ? { ...event, startTime: newStartTime, endTime: newEndTime }
        : event
    ));
  };

  const handleEventUpdatePartial = (eventId: string, updates: Partial<CalendarEvent>) => {
    setEvents(events.map(event =>
      event.id === eventId
        ? { ...event, ...updates }
        : event
    ));
  };

  const handleMoveEvent = (eventId: string, newStartTime: string, newEndTime: string) => {
    handleEventUpdate(eventId, newStartTime, newEndTime);
    toast({
      title: "Event Moved",
      description: "The event has been rescheduled",
    });
  };

  const handleEventSave = (updatedEvent: CalendarEvent) => {
    setEvents(events.map(event =>
      event.id === updatedEvent.id ? updatedEvent : event
    ));
    toast({
      title: "Event Updated",
      description: `"${updatedEvent.title}" has been updated`,
    });
  };

  const handleEventDelete = (eventId: string) => {
    const deletedEvent = events.find(e => e.id === eventId);
    setEvents(events.filter(event => event.id !== eventId));
    toast({
      title: "Event Deleted",
      description: deletedEvent ? `"${deletedEvent.title}" has been removed` : "Event removed",
    });
  };

  const handleAutoOptimize = () => {
    toast({
      title: "AI Schedule Optimization",
      description: "Analyzing your calendar for optimization opportunities...",
    });
  };

  const handleEventClick = (event: CalendarEvent, clickX: number, clickY: number) => {
    setSelectedEvent(event);
    setEventPopoverPosition({ x: clickX, y: clickY });
    setIsEventPopoverOpen(true);
  };

  const handleEditFromPopover = (event: CalendarEvent) => {
    setIsEventPopoverOpen(false);
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const filteredEvents = useMemo(
    () => events.filter(event => selectedMembers.includes(event.memberId)),
    [events, selectedMembers]
  );

  const todaysEvents = useMemo(() => {
    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === currentDate.toDateString();
    });
  }, [filteredEvents, currentDate]);

  const totalMinutesToday = useMemo(() => {
    return todaysEvents.reduce((total, event) => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      return total + (end.getTime() - start.getTime()) / (1000 * 60);
    }, 0);
  }, [todaysEvents]);

  const focusMinutesToday = useMemo(() => {
    return todaysEvents
      .filter((event) => event.category === 'work')
      .reduce((total, event) => {
        const start = new Date(event.startTime);
        const end = new Date(event.endTime);
        return total + (end.getTime() - start.getTime()) / (1000 * 60);
      }, 0);
  }, [todaysEvents]);

  const upcomingEvent = useMemo(() => {
    if (!todaysEvents.length) return null;

    const sorted = [...todaysEvents].sort((a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    const todayString = new Date().toDateString();
    const isCurrentDay = currentDate.toDateString() === todayString;

    if (isCurrentDay) {
      const now = new Date();
      return (
        sorted.find((event) => new Date(event.startTime) >= now) ?? sorted[0]
      );
    }

    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    return (
      sorted.find((event) => new Date(event.startTime) >= dayStart) ?? sorted[0]
    );
  }, [todaysEvents, currentDate]);

  // Get week's events for calendar context
  const weekEvents = useMemo(() => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate >= weekStart && eventDate < weekEnd;
    });
  }, [filteredEvents, currentDate]);

  // Create calendar service with operations
  const calendarOperations: CalendarOperations = useMemo(() => ({
    createEvent: handleCreateEvent,
    updateEvent: handleEventUpdatePartial,
    deleteEvent: handleEventDelete,
    moveEvent: handleMoveEvent,
  }), []);

  const calendarService = useMemo(
    () => new CalendarService(calendarOperations),
    [calendarOperations]
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(101,84,192,0.16),_transparent_60%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 px-6 pb-10 pt-6 md:px-12">
        {/* Compact Top Bar - Date and Stats */}
        <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 px-6 py-3 shadow-lg backdrop-blur">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold">
              {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{todaysEvents.length} tasks</span>
              <span>•</span>
              <span>{(totalMinutesToday / 60).toFixed(1)}h total</span>
            </div>
          </div>
          {upcomingEvent && (
            <div className="text-sm text-muted-foreground">
              Next: <span className="font-medium text-foreground">{upcomingEvent.title}</span>
            </div>
          )}
        </div>

        {/* AI Assistant - Wide Bar on Top */}
        <div className="w-full">
          <AIAssistant 
            calendarService={calendarService}
            currentDate={currentDate}
            todayEvents={todaysEvents}
            weekEvents={weekEvents}
            familyMembers={familyMembers}
          />
        </div>

        <div className="flex flex-1 flex-col gap-4 lg:flex-row">
          {/* Left Sidebar - Mini Calendar and Family Members */}
          <aside className="w-full lg:w-64 space-y-4 flex-shrink-0">
            <MiniCalendar
              currentDate={currentDate}
              onDateSelect={setCurrentDate}
            />

            <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-lg backdrop-blur">
              <h3 className="mb-3 text-sm font-semibold text-foreground/70">Family Members</h3>
              <div className="space-y-2">
                {familyMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleToggleMember(member.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      selectedMembers.includes(member.id)
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <div className={`h-3 w-3 rounded-full ${member.color}`} />
                    <span className="flex-1">{member.name}</span>
                    {member.isYou && (
                      <span className="text-xs text-muted-foreground">(You)</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <CapacityIndicator scheduled={4.5} total={8} />
          </aside>

          {/* Main Calendar View - Center, Most Important */}
          <section className="flex min-h-[0] flex-1 flex-col gap-4">
            <div className="flex h-full flex-1 flex-col rounded-3xl border border-white/60 bg-white/80 p-6 shadow-2xl shadow-primary/5 backdrop-blur">
              <CalendarHeader
                currentDate={currentDate}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onNavigate={handleNavigate}
                onNewEvent={handleNewEvent}
                onAutoOptimize={handleAutoOptimize}
              />

              <div className="mt-6 flex min-h-[600px] flex-1 overflow-hidden rounded-2xl border border-border/60 bg-white/90 shadow-inner">
                <EventPopover
                  event={selectedEvent}
                  isOpen={isEventPopoverOpen}
                  position={eventPopoverPosition}
                  onClose={() => setIsEventPopoverOpen(false)}
                  onEdit={handleEditFromPopover}
                  onDelete={handleEventDelete}
                >
                  <div className="h-full w-full">
                    <CalendarGrid
                      viewMode={viewMode}
                      currentDate={currentDate}
                      events={filteredEvents}
                      onEventClick={handleEventClick}
                      onEventUpdate={handleEventUpdate}
                      onTimeSlotClick={handleTimeSlotClick}
                    />
                  </div>
                </EventPopover>
              </div>
            </div>
          </section>
        </div>
      </div>

      <EventDetailsDialog
        event={selectedEvent}
        isOpen={isEventDialogOpen}
        onClose={() => setIsEventDialogOpen(false)}
        onSave={handleEventSave}
        onDelete={handleEventDelete}
      />

      <NewEventDialog
        isOpen={isNewEventDialogOpen}
        onClose={() => setIsNewEventDialogOpen(false)}
        onSave={handleCreateEvent}
        defaultDate={newEventDefaults.date}
        defaultHour={newEventDefaults.hour}
        defaultMinute={newEventDefaults.minute}
        members={familyMembers}
      />

      {isInlineCreatorOpen && inlineCreatorData && (
        <InlineEventCreator
          date={inlineCreatorData.date}
          hour={inlineCreatorData.hour}
          minute={inlineCreatorData.minute}
          position={inlineCreatorData.position}
          onSave={handleInlineEventSave}
          onCancel={handleInlineCreatorCancel}
        />
      )}
    </div>
  );
};

export default Index;
