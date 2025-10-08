import { useState } from "react";
import { CalendarHeader } from "@/components/CalendarHeader";
import { CalendarGrid } from "@/components/CalendarGrid";
import { FamilyMembersSidebar } from "@/components/FamilyMembersSidebar";
import { MiniCalendar } from "@/components/MiniCalendar";
import { CapacityIndicator } from "@/components/CapacityIndicator";
import { AIAssistant } from "@/components/AIAssistant";
import { EventDetailsDialog } from "@/components/EventDetailsDialog";
import { NewEventDialog } from "@/components/NewEventDialog";
import { EventPopover } from "@/components/EventPopover";
import { CalendarEvent, FamilyMember } from "@/types/calendar";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventPopoverOpen, setIsEventPopoverOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
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
      if (viewMode === 'week') {
        newDate.setDate(currentDate.getDate() - 7);
      } else {
        newDate.setDate(currentDate.getDate() - 1);
      }
      setCurrentDate(newDate);
    } else {
      if (viewMode === 'week') {
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

  const handleTimeSlotClick = (date: Date, hour: number, minute: number) => {
    setNewEventDefaults({ date, hour, minute });
    setIsNewEventDialogOpen(true);
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

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventPopoverOpen(true);
  };

  const handleEditFromPopover = (event: CalendarEvent) => {
    setIsEventPopoverOpen(false);
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const filteredEvents = events.filter(event => 
    selectedMembers.includes(event.memberId)
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNavigate={handleNavigate}
        onNewEvent={handleNewEvent}
        onAutoOptimize={handleAutoOptimize}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main calendar area */}
        <div className="flex-1 overflow-hidden border-r border-border">
          <EventPopover
            event={selectedEvent}
            isOpen={isEventPopoverOpen}
            onClose={() => setIsEventPopoverOpen(false)}
            onEdit={handleEditFromPopover}
            onDelete={handleEventDelete}
          >
            <div className="h-full">
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

        {/* Right sidebar */}
        <div className="w-80 space-y-4 overflow-y-auto bg-secondary/30 p-4">
          <FamilyMembersSidebar
            members={familyMembers}
            selectedMembers={selectedMembers}
            onToggleMember={handleToggleMember}
          />

          <CapacityIndicator scheduled={4.5} total={8} />

          <MiniCalendar
            currentDate={currentDate}
            onDateSelect={setCurrentDate}
          />

          <AIAssistant />
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
    </div>
  );
};

export default Index;
