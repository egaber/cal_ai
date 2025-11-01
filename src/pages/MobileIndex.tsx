import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { MobileCalendarView } from "@/components/MobileCalendarView";
import { MobileEventDetails } from "@/components/MobileEventDetails";
import { NewEventDialog } from "@/components/NewEventDialog";
import { EventPopover } from "@/components/EventPopover";
import { EventCreationDrawer } from "@/components/EventCreationDrawer";
import { CalendarEvent, FamilyMember } from "@/types/calendar";
import { useToast } from "@/hooks/use-toast";
import { useEvents } from "@/contexts/EventContext";
import { useFamily } from "@/contexts/FamilyContext";
import { StorageService } from "@/services/storageService";
import { generateRecurringEvents } from "@/utils/recurrenceUtils";
import { Plus, Users, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface MobileIndexProps {
  targetEventId?: string | null;
  onEventTargeted?: () => void;
  initialDate?: Date;
  onDateChange?: (date: Date) => void;
}

const MobileIndex = ({ targetEventId, onEventTargeted, initialDate, onDateChange }: MobileIndexProps) => {
  const { toast } = useToast();
  const { family } = useFamily();
  const { events: cloudEvents, createEvent: createCloudEvent, updateEvent: updateCloudEvent, deleteEvent: deleteCloudEvent, moveEvent: moveCloudEvent } = useEvents();
  
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [highlightEventId, setHighlightEventId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'workweek'>('day');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventPopoverOpen, setIsEventPopoverOpen] = useState(false);
  const [eventPopoverPosition, setEventPopoverPosition] = useState({ x: 0, y: 0 });
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [inlineDraft, setInlineDraft] = useState<{ date: Date; hour: number; minute: number } | null>(null);
  const [isMembersSheetOpen, setIsMembersSheetOpen] = useState(false);
  const [isEventCreationDrawerOpen, setIsEventCreationDrawerOpen] = useState(false);
  const [drawerEventData, setDrawerEventData] = useState<{ date: Date; hour: number; minute: number } | null>(null);
  const [isMonthViewExpanded, setIsMonthViewExpanded] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const headerTouchStartY = useRef<number>(0);
  const isHeaderDragging = useRef(false);

  // Use family members from FamilyContext
  const familyMembers = family?.members || [];
  const events = cloudEvents;

  // Initialize with all member IDs by default
  const [selectedMembers, setSelectedMembers] = useState<string[]>(() => {
    const savedSettings = StorageService.loadSettings();
    if (savedSettings?.selectedMembers) {
      return savedSettings.selectedMembers;
    }
    // Default to all members
    return familyMembers.map(m => m.id);
  });

  // Update selectedMembers when familyMembers change (on first load)
  useEffect(() => {
    if (familyMembers.length > 0 && selectedMembers.length === 0) {
      setSelectedMembers(familyMembers.map(m => m.id));
    }
  }, [familyMembers, selectedMembers.length]);

  // Sync with parent's date when initialDate changes (but NOT if we have a targetEventId)
  useEffect(() => {
    if (initialDate && !targetEventId) {
      setCurrentDate(initialDate);
    }
  }, [initialDate, targetEventId]);

  // Handle navigation to target event - takes priority over initialDate
  useEffect(() => {
    if (targetEventId && events.length > 0) {
      const targetEvent = events.find(e => e.id === targetEventId);
      if (targetEvent) {
        const eventDate = new Date(targetEvent.startTime);
        console.log('Navigating to event date:', eventDate);
        // Navigate to the event's date
        setCurrentDate(eventDate);
        // Also notify parent to update its state
        if (onDateChange) {
          onDateChange(eventDate);
        }
        // Highlight the event with animation
        setHighlightEventId(targetEventId);
        // Clear highlight after animation
        setTimeout(() => {
          setHighlightEventId(null);
        }, 2000);
        // Notify parent that we've handled the target
        if (onEventTargeted) {
          onEventTargeted();
        }
      }
    }
  }, [targetEventId, events, onEventTargeted, onDateChange]);

  // Notify parent when date changes internally
  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  useEffect(() => {
    const loadedSettings = StorageService.loadSettings();

    if (loadedSettings && loadedSettings.selectedMembers) {
      setSelectedMembers(loadedSettings.selectedMembers);
      if (loadedSettings.viewMode === 'day' || loadedSettings.viewMode === 'workweek') {
        setViewMode(loadedSettings.viewMode);
      }
    }
  }, []);

  useEffect(() => {
    StorageService.saveSettings({ selectedMembers, viewMode });
  }, [selectedMembers, viewMode]);

  const handleNavigate = (direction: 'prev' | 'next' | 'today' | Date) => {
    let newDate: Date;
    if (direction === 'today') {
      newDate = new Date();
    } else if (direction instanceof Date) {
      newDate = direction;
    } else {
      newDate = new Date(currentDate);
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
    }
    handleDateChange(newDate);
  };

  const handleToggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleTimeSlotClick = (date: Date, hour: number, minute: number, _clickX: number, _clickY: number) => {
    setInlineDraft({ date, hour, minute });
  };

  const handleLongPressComplete = (date: Date, hour: number, minute: number) => {
    // When long-press completes, open the drawer with the selected time
    setDrawerEventData({ date, hour, minute });
    setIsEventCreationDrawerOpen(true);
  };

  const handleInlineEventSave = async (title: string, isAllDay?: boolean) => {
    setIsEventPopoverOpen(false);
    setSelectedEvent(null);
    
    if (inlineDraft) {
      const { date, hour, minute } = inlineDraft;
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

      await createCloudEvent({
        title,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        category: metadata.category,
        priority: 'medium',
        memberId: selectedMembers[0] || '1',
        emoji: metadata.emoji,
        isAllDay: isAllDay || false,
      });

      setInlineDraft(null);
      
      toast({
        title: "Event Created",
        description: `"${title}" has been added`,
      });
    }
  };

  const handleCreateEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id'>) => {
    await createCloudEvent(eventData);
    toast({
      title: "Event Created",
      description: `"${eventData.title}" added`,
    });
  }, [createCloudEvent, toast]);

  const handleEventUpdate = useCallback(async (eventId: string, newStartTime: string, newEndTime: string) => {
    await moveCloudEvent(eventId, newStartTime, newEndTime);
  }, [moveCloudEvent]);

  const handleEventSave = useCallback(async (updatedEvent: CalendarEvent) => {
    await updateCloudEvent(updatedEvent.id, updatedEvent);
    toast({
      title: "Event Updated",
      description: `"${updatedEvent.title}" updated`,
    });
  }, [updateCloudEvent, toast]);

  const handleEventDelete = useCallback(async (eventId: string) => {
    const deletedEvent = events.find(e => e.id === eventId);
    const deletedTitle = deletedEvent?.title;
    
    await deleteCloudEvent(eventId);

    toast({
      title: "Event Deleted",
      description: deletedTitle ? `"${deletedTitle}" removed` : "Event removed",
    });
  }, [deleteCloudEvent, events, toast]);

  const handleDeleteRecurring = useCallback(async (recurringEventId: string, deleteAll: boolean) => {
    if (deleteAll) {
      await deleteCloudEvent(recurringEventId);
      toast({ title: "Recurring Event Deleted", description: "All occurrences removed" });
    }
  }, [deleteCloudEvent, toast]);

  const handleEventClick = (event: CalendarEvent, clickX: number, clickY: number) => {
    // On mobile, directly open the event details view (no popover)
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const handleEditFromPopover = (event: CalendarEvent) => {
    setIsEventPopoverOpen(false);
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
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
    const startDay = start.getDay(); // 0 = Sunday
    start.setDate(start.getDate() - startDay); // Go to Sunday of current week
    
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

  // Get all dates for current month
  const monthDates = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const dates = [];
    
    // Add days from previous month to fill the first week
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(firstDay);
      date.setDate(date.getDate() - (i + 1));
      dates.push(date);
    }
    
    // Add all days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      dates.push(new Date(year, month, day));
    }
    
    // Add days from next month to fill the last week
    const remainingDays = 7 - (dates.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(year, month + 1, i);
        dates.push(date);
      }
    }
    
    return dates;
  }, [currentDate]);

  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    // Only handle if touching the notch area specifically
    if (!target.closest('.month-notch')) return;
    
    headerTouchStartY.current = e.touches[0].clientY;
    isHeaderDragging.current = true;
    
    // Don't reset dragOffset - maintain current state
  };

  const handleHeaderTouchMove = (e: React.TouchEvent) => {
    if (!isHeaderDragging.current) return;
    
    // CRITICAL: Prevent scrolling AND pull-to-refresh while dragging header
    e.preventDefault();
    e.stopPropagation();
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - headerTouchStartY.current;
    
    // Always allow smooth dragging in both directions regardless of current state
    // This ensures the view follows the finger from the start
    if (isMonthViewExpanded) {
      // When expanded, allow dragging up to collapse
      // Clamp between -260 (full collapse) and 0 (stay expanded)
      setDragOffset(Math.max(-260, Math.min(0, deltaY)));
    } else {
      // When collapsed, allow dragging down to expand
      // Clamp between 0 (stay collapsed) and 260 (full expand)
      setDragOffset(Math.max(0, Math.min(260, deltaY)));
    }
  };

  const handleHeaderTouchEnd = () => {
    if (!isHeaderDragging.current) return;
    
    isHeaderDragging.current = false;
    
    if (isMonthViewExpanded) {
      // Currently expanded - check if dragging up enough to collapse
      // Use 50% threshold: if dragged more than halfway to collapsed, complete the collapse
      const collapseThreshold = -130; // 50% of 260px range
      if (dragOffset < collapseThreshold) {
        setIsMonthViewExpanded(false);
        setDragOffset(0);
      } else {
        // Snap back to expanded state
        setDragOffset(0);
      }
    } else {
      // Currently collapsed - check if dragging down enough to expand
      // Use 50% threshold: if dragged more than halfway to expanded, complete the expansion
      const expandThreshold = 130; // 50% of 260px range
      if (dragOffset > expandThreshold) {
        setIsMonthViewExpanded(true);
        setDragOffset(0);
      } else {
        // Snap back to collapsed state
        setDragOffset(0);
      }
    }
  };

  // Lock body scroll when dragging the month calendar header
  useEffect(() => {
    if (isHeaderDragging.current) {
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
      document.body.style.overscrollBehavior = 'none';
      document.documentElement.style.overscrollBehavior = 'none';
      
      // Cleanup when dragging ends
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.touchAction = originalTouchAction;
        document.body.style.width = '';
        document.body.style.overscrollBehavior = originalOverscrollBehavior;
        document.documentElement.style.overscrollBehavior = htmlOriginalOverscrollBehavior;
      };
    }
  }, [isHeaderDragging.current]);

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header - Controls on Top, Week Dates Below */}
      <div className="flex-none ios-header bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200/30">
        {/* Controls Row */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleNavigate('prev')} 
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleNavigate('today')} className="h-7 px-2 text-xs">
              היום
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleNavigate('next')} 
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-4 w-4" />              
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

        {/* Week Date Circles with Draggable Notch */}
        <div className="relative">
          {/* Week or Month View */}
          <div 
            className="px-2 pt-2 overflow-hidden"
            style={{
              maxHeight: isMonthViewExpanded 
                ? `${320 + dragOffset}px` 
                : `${64 + dragOffset}px`,
              transition: isHeaderDragging.current ? 'none' : 'max-height 0.3s ease-out',
            }}
          >
            {(isMonthViewExpanded || dragOffset > 20) ? (
              // Full Month Grid
              <div>
                <div className="text-center text-sm font-semibold text-gray-700 mb-2">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-[10px] font-medium text-gray-500 mb-1">
                      {day}
                    </div>
                  ))}
                  {monthDates.map((date) => {
                    const isSelected = date.toDateString() === currentDate.toDateString();
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                    
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => {
                          handleNavigate(date);
                          setIsMonthViewExpanded(false);
                        }}
                        className={`flex items-center justify-center h-10 rounded-lg transition-all text-sm ${
                          isSelected
                            ? 'bg-primary text-white font-bold scale-105'
                            : isToday
                            ? 'bg-primary/10 text-primary font-semibold'
                            : isCurrentMonth
                            ? 'text-gray-700 hover:bg-gray-100'
                            : 'text-gray-400'
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Week View
              <div className="flex items-center justify-between overflow-x-auto hide-scrollbar">
                {weekDates.map((date) => {
                  const isSelected = date.toDateString() === currentDate.toDateString();
                  const isToday = date.toDateString() === new Date().toDateString();
                  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
                  const hebrewDays = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\''];
                  
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
                        {hebrewDays[dayOfWeek]}
                      </span>
                      <span className={`text-base font-bold ${isSelected ? 'text-white' : ''}`}>
                        {date.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notch indicator at bottom with expand/collapse icon - This is the draggable area */}
          <div 
            className="month-notch flex justify-center items-center pb-2 pt-1 gap-2 cursor-grab active:cursor-grabbing touch-none"
            onTouchStart={handleHeaderTouchStart}
            onTouchMove={handleHeaderTouchMove}
            onTouchEnd={handleHeaderTouchEnd}
            style={{ 
              WebkitUserSelect: 'none', 
              userSelect: 'none',
              WebkitTouchCallout: 'none'
            }}
          >
            <div className="w-8 h-1 bg-gray-300 rounded-full" />
            {isMonthViewExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
            <div className="w-8 h-1 bg-gray-300 rounded-full" />
          </div>
        </div>
      </div>

      {/* Calendar - Fills remaining space with vertical scroll only */}
      <div className="flex-1 overflow-hidden">
        <MobileCalendarView
          currentDate={currentDate}
          events={filteredEvents}
          familyMembers={familyMembers}
          onEventClick={handleEventClick}
          onEventUpdate={handleEventUpdate}
          onTimeSlotClick={handleTimeSlotClick}
          onDateChange={(date) => handleDateChange(date)}
          inlineDraft={inlineDraft || undefined}
          onInlineSave={handleInlineEventSave}
          onInlineCancel={() => setInlineDraft(null)}
          highlightEventId={highlightEventId}
          onLongPressComplete={handleLongPressComplete}
        />
      </div>

      {/* Event Creation Drawer - New long-press flow */}
      {drawerEventData && (
        <EventCreationDrawer
          isOpen={isEventCreationDrawerOpen}
          onClose={() => {
            setIsEventCreationDrawerOpen(false);
            setDrawerEventData(null);
          }}
          date={drawerEventData.date}
          hour={drawerEventData.hour}
          minute={drawerEventData.minute}
          familyMembers={familyMembers}
          onSave={handleCreateEvent}
        />
      )}

      <MobileEventDetails
        event={selectedEvent}
        isOpen={isEventDialogOpen}
        onClose={() => {
          setIsEventDialogOpen(false);
          setSelectedEvent(null);
        }}
        onSave={handleEventSave}
        onDelete={handleEventDelete}
        onDeleteRecurring={handleDeleteRecurring}
        familyMembers={familyMembers}
      />

      <NewEventDialog
        isOpen={isNewEventDialogOpen}
        onClose={() => setIsNewEventDialogOpen(false)}
        onSave={handleCreateEvent}
        members={familyMembers}
      />

    </div>
  );
};

export default MobileIndex;
