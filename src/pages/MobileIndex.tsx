import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { CalendarGrid } from "@/components/CalendarGrid";
import { EventDetailsDialog } from "@/components/EventDetailsDialog";
import { NewEventDialog } from "@/components/NewEventDialog";
import { EventPopover } from "@/components/EventPopover";
import { InlineEventCreator } from "@/components/InlineEventCreator";
import { CalendarEvent, FamilyMember } from "@/types/calendar";
import { useToast } from "@/hooks/use-toast";
import { StorageService } from "@/services/storageService";
import { generateRecurringEvents } from "@/utils/recurrenceUtils";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const MobileIndex = () => {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'workweek'>('day');
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
  const [isMembersSheetOpen, setIsMembersSheetOpen] = useState(false);
  
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { id: '1', name: 'Eyal', role: 'Parent', color: 'bg-event-blue', isYou: true },
    { id: '2', name: 'Ella', role: 'Parent', color: 'bg-event-purple', isYou: false },
    { id: '3', name: 'Hilly', role: 'Child', color: 'bg-event-green', isYou: false },
    { id: '4', name: 'Yael', role: 'Child', color: 'bg-event-orange', isYou: false },
    { id: '5', name: 'Alon', role: 'Child', color: 'bg-event-pink', isYou: false },
  ]);

  const [selectedMembers, setSelectedMembers] = useState<string[]>(['1']);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const loadedEvents = StorageService.loadEvents();
    const loadedSettings = StorageService.loadSettings();
    const loadedFamilyMembers = StorageService.loadFamilyMembers();

    if (loadedFamilyMembers && loadedFamilyMembers.length > 0) {
      setFamilyMembers(loadedFamilyMembers);
    }

    if (loadedEvents.length > 0) {
      setEvents(loadedEvents);
    }

    if (loadedSettings) {
      setSelectedMembers(loadedSettings.selectedMembers);
      if (loadedSettings.viewMode === 'day' || loadedSettings.viewMode === 'workweek') {
        setViewMode(loadedSettings.viewMode);
      }
    }
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      StorageService.saveEvents(events);
    }
  }, [events]);

  useEffect(() => {
    StorageService.saveFamilyMembers(familyMembers);
  }, [familyMembers]);

  useEffect(() => {
    StorageService.saveSettings({ selectedMembers, viewMode });
  }, [selectedMembers, viewMode]);

  const handleNavigate = (direction: 'prev' | 'next' | 'today' | Date) => {
    if (direction === 'today') {
      setCurrentDate(new Date());
    } else if (direction instanceof Date) {
      setCurrentDate(direction);
    } else {
      const newDate = new Date(currentDate);
      if (direction === 'prev') {
        if (viewMode === 'workweek') {
          newDate.setDate(currentDate.getDate() - 3);
        } else {
          newDate.setDate(currentDate.getDate() - 1);
        }
      } else {
        if (viewMode === 'workweek') {
          newDate.setDate(currentDate.getDate() + 3);
        } else {
          newDate.setDate(currentDate.getDate() + 1);
        }
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

  const handleTimeSlotClick = (date: Date, hour: number, minute: number, clickX: number, clickY: number) => {
    setInlineCreatorData({ date, hour, minute, position: { x: clickX, y: clickY } });
    setIsInlineCreatorOpen(true);
  };

  const handleInlineEventSave = async (title: string, isAllDay?: boolean) => {
    setIsEventPopoverOpen(false);
    setSelectedEvent(null);
    
    if (inlineCreatorData) {
      const { date, hour, minute } = inlineCreatorData;
      const startDate = new Date(date);
      const endDate = new Date(date);
      
      if (isAllDay) {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate.setHours(hour, minute, 0, 0);
        endDate.setHours(hour + 1, minute, 0, 0);
      }

      let metadata: { emoji: string; category: CalendarEvent['category'] };
      
      try {
        const { llmService } = await import('@/services/llmService');
        const aiMetadata = await llmService.generateEventMetadata(title, '');
        metadata = {
          emoji: aiMetadata.emoji,
          category: aiMetadata.category as CalendarEvent['category']
        };
      } catch (error) {
        const { generateEventMetadataLocal } = await import('@/utils/eventMetadataUtils');
        metadata = generateEventMetadataLocal(title, '');
      }

      const newEvent: CalendarEvent = {
        id: `event_${Date.now()}`,
        title,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        category: metadata.category,
        priority: 'medium',
        memberId: selectedMembers[0] || '1',
        emoji: metadata.emoji,
        isAllDay: isAllDay || false,
      };

      setEvents(prev => [...prev, newEvent]);
      setIsInlineCreatorOpen(false);
      setInlineCreatorData(null);
      
      toast({
        title: "Event Created",
        description: `"${title}" has been added`,
      });
    }
  };

  const handleCreateEvent = useCallback((eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `event_${Date.now()}`,
    };
    setEvents(prev => [...prev, newEvent]);
    toast({
      title: "Event Created",
      description: `"${newEvent.title}" added`,
    });
  }, [toast]);

  const handleEventUpdate = useCallback((eventId: string, newStartTime: string, newEndTime: string) => {
    setEvents(prev =>
      prev.map(event =>
        event.id === eventId
          ? { ...event, startTime: newStartTime, endTime: newEndTime }
          : event
      )
    );
  }, []);

  const handleEventSave = useCallback((updatedEvent: CalendarEvent) => {
    setEvents(prev => prev.map(event =>
      event.id === updatedEvent.id ? updatedEvent : event
    ));
    toast({
      title: "Event Updated",
      description: `"${updatedEvent.title}" updated`,
    });
  }, [toast]);

  const handleEventDelete = useCallback((eventId: string) => {
    let deletedTitle: string | null = null;
    setEvents(prev => {
      const deletedEvent = prev.find(e => e.id === eventId);
      if (deletedEvent) deletedTitle = deletedEvent.title;
      return prev.filter(event => event.id !== eventId);
    });

    toast({
      title: "Event Deleted",
      description: deletedTitle ? `"${deletedTitle}" removed` : "Event removed",
    });
  }, [toast]);

  const handleDeleteRecurring = useCallback((recurringEventId: string, deleteAll: boolean) => {
    if (deleteAll) {
      setEvents(prev => prev.filter(event => event.id !== recurringEventId));
      toast({ title: "Recurring Event Deleted", description: "All occurrences removed" });
    }
  }, [toast]);

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

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swiped left - go to next
        handleNavigate('next');
      } else {
        // Swiped right - go to previous
        handleNavigate('prev');
      }
    }
  };

  const expandedEvents = useMemo(() => {
    const expanded: CalendarEvent[] = [];
    const viewStart = new Date(currentDate);
    const viewEnd = new Date(currentDate);
    
    viewStart.setHours(0, 0, 0, 0);
    if (viewMode === 'workweek') {
      viewEnd.setDate(viewEnd.getDate() + 2);
    }
    viewEnd.setHours(23, 59, 59, 999);
    
    const bufferStart = new Date(viewStart);
    bufferStart.setDate(bufferStart.getDate() - 7);
    const bufferEnd = new Date(viewEnd);
    bufferEnd.setDate(bufferEnd.getDate() + 7);
    
    events.forEach(event => {
      if (event.recurrence) {
        const instances = generateRecurringEvents(event, event.recurrence, bufferStart, bufferEnd);
        instances.forEach((instance, index) => {
          expanded.push({
            ...instance,
            id: `${event.id}_occurrence_${index}_${new Date(instance.startTime).getTime()}`,
            recurringEventId: event.id,
          });
        });
      } else {
        expanded.push(event);
      }
    });
    
    return expanded;
  }, [events, currentDate, viewMode]);

  const filteredEvents = useMemo(
    () => expandedEvents.filter(event => selectedMembers.includes(event.memberId)),
    [expandedEvents, selectedMembers]
  );

  // Get week dates for the date picker
  const weekDates = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay()); // Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }, [currentDate]);

  const todaysEvents = useMemo(() => {
    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === currentDate.toDateString();
    });
  }, [filteredEvents, currentDate]);

  const hasAllDayEvents = useMemo(() => {
    return filteredEvents.some(event => event.isAllDay);
  }, [filteredEvents]);

  return (
    <div className="h-full flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Compact Header with Week Dates */}
      <div className="flex-none ios-header bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200/30">
        {/* Week Date Circles */}
        <div className="flex items-center justify-between px-2 py-2 overflow-x-auto hide-scrollbar">
          {weekDates.map((date) => {
            const isSelected = date.toDateString() === currentDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <button
                key={date.toISOString()}
                onClick={() => handleNavigate(date)}
                className={`flex flex-col items-center justify-center min-w-[44px] h-[52px] rounded-xl transition-all ${
                  isSelected
                    ? 'bg-primary text-white scale-105'
                    : isToday
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <span className="text-[10px] font-medium uppercase">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })[0]}
                </span>
                <span className={`text-base font-bold ${isSelected ? 'text-white' : ''}`}>
                  {date.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between px-3 pb-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleNavigate('today')} className="h-7 px-2 text-xs">
              Today
            </Button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('day')}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  viewMode === 'day' ? 'bg-primary text-white' : 'text-gray-600'
                }`}
              >
                1D
              </button>
              <button
                onClick={() => setViewMode('workweek')}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  viewMode === 'workweek' ? 'bg-primary text-white' : 'text-gray-600'
                }`}
              >
                3D
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Sheet open={isMembersSheetOpen} onOpenChange={setIsMembersSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Users className="h-4 w-4" />
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{selectedMembers.length}</Badge>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh]">
                <SheetHeader>
                  <SheetTitle>Family Members</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2">
                  {familyMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => handleToggleMember(member.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        selectedMembers.includes(member.id)
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center text-white text-sm font-bold`}>
                        {member.name[0]}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-gray-500">{member.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            <Button size="sm" onClick={() => setIsNewEventDialogOpen(true)} className="h-7 w-7 p-0 bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar - Fills remaining space with vertical scroll only */}
      <div className="flex-1 overflow-hidden">
        <EventPopover
          event={selectedEvent}
          isOpen={isEventPopoverOpen}
          position={eventPopoverPosition}
          onClose={() => setIsEventPopoverOpen(false)}
          onEdit={handleEditFromPopover}
          onDelete={handleEventDelete}
          familyMembers={familyMembers}
        >
          <div className="h-full w-full overflow-y-auto overflow-x-hidden ios-scroll hide-scrollbar">
            <CalendarGrid
              viewMode={viewMode}
              currentDate={currentDate}
              events={filteredEvents}
              familyMembers={familyMembers}
              onEventClick={handleEventClick}
              onEventUpdate={handleEventUpdate}
              onTimeSlotClick={handleTimeSlotClick}
            />
          </div>
        </EventPopover>
      </div>

      <EventDetailsDialog
        event={selectedEvent}
        isOpen={isEventDialogOpen}
        onClose={() => {
          setIsEventDialogOpen(false);
          setSelectedEvent(null);
        }}
        onSave={handleEventSave}
        onDelete={handleEventDelete}
        onDeleteRecurring={handleDeleteRecurring}
      />

      <NewEventDialog
        isOpen={isNewEventDialogOpen}
        onClose={() => setIsNewEventDialogOpen(false)}
        onSave={handleCreateEvent}
        members={familyMembers}
      />

      {isInlineCreatorOpen && inlineCreatorData && (
        <InlineEventCreator
          date={inlineCreatorData.date}
          hour={inlineCreatorData.hour}
          minute={inlineCreatorData.minute}
          position={inlineCreatorData.position}
          onSave={handleInlineEventSave}
          onCancel={() => {
            setIsInlineCreatorOpen(false);
            setInlineCreatorData(null);
          }}
        />
      )}
    </div>
  );
};

export default MobileIndex;
