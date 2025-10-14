import { useMemo, useState, useEffect, useCallback } from "react";
import { CalendarHeader } from "@/components/CalendarHeader";
import { CalendarGrid } from "@/components/CalendarGrid";
import { MiniCalendar } from "@/components/MiniCalendar";
import { CapacityIndicator } from "@/components/CapacityIndicator";
import { AIAssistant } from "@/components/AIAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { useEvents } from "@/contexts/EventContext";
import { useFamily } from "@/contexts/FamilyContext";
import { PRIMARY_COLOR } from "@/config/branding";
import { EventDetailsDialog } from "@/components/EventDetailsDialog";
import { NewEventDialog } from "@/components/NewEventDialog";
import { EventPopover } from "@/components/EventPopover";
import { InlineEventCreator } from "@/components/InlineEventCreator";
import { MemoryManager } from "@/components/MemoryManager";
import { FamilyMembersSidebar } from "@/components/FamilyMembersSidebar";
import { FamilyManagement } from "@/components/FamilyManagement";
import { EventSuggestionCard } from "@/components/EventSuggestionCard";
import { GoogleCalendarSync } from "@/components/GoogleCalendarSync";
import { CalendarEvent, FamilyMember } from "@/types/calendar";
import { MemoryData } from "@/types/memory";
import { EventSuggestion } from "@/types/task";
import { useToast } from "@/hooks/use-toast";
import { CalendarService, CalendarOperations } from "@/services/calendarService";
import { StorageService } from "@/services/storageService";
import { taskService } from "@/services/taskService";
import { generateRecurringEvents } from "@/utils/recurrenceUtils";
import { Brain, ListTodo, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";

interface IndexProps {
  activeTab?: 'calendar' | 'tasks';
  onTabChange?: (tab: 'calendar' | 'tasks') => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

const Index = ({ activeTab, onTabChange, isDarkMode, onToggleDarkMode }: IndexProps = {}) => {
  const { user } = useAuth();
  const { family, refreshFamily } = useFamily();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
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

  // Use family members from FamilyContext
  const familyMembers = family?.members || [];

  const [selectedMembers, setSelectedMembers] = useState<string[]>(['1']);
  const { events: cloudEvents, createEvent: createCloudEvent, updateEvent: updateCloudEvent, deleteEvent: deleteCloudEvent, moveEvent: moveCloudEvent, loading: eventsLoading } = useEvents();
  // Use cloud events directly
  const events = cloudEvents;
  const [memoryData, setMemoryData] = useState<MemoryData>({
    userMemories: [],
    familyMemories: [],
    places: [],
    travelInfo: [],
  });
  const [isMemoryDialogOpen, setIsMemoryDialogOpen] = useState(false);
  const [isFamilyManagementOpen, setIsFamilyManagementOpen] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | undefined>(undefined);
  const [eventSuggestions, setEventSuggestions] = useState<EventSuggestion[]>([]);
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);
  const refreshMemoryData = useCallback(() => {
    const updatedMemory = StorageService.loadMemoryData();
    setMemoryData(updatedMemory);
  }, [setMemoryData]);

  // Load data from storage on mount
  useEffect(() => {
    const loadedSettings = StorageService.loadSettings();
    const loadedMemory = StorageService.loadMemoryData();
    const loadedSuggestions = localStorage.getItem('event_suggestions');

    if (loadedSettings) {
      setSelectedMembers(loadedSettings.selectedMembers);
      setViewMode(loadedSettings.viewMode);
    }

    setMemoryData(loadedMemory);

    // Load event suggestions if they exist
    if (loadedSuggestions) {
      try {
        const suggestions = JSON.parse(loadedSuggestions);
        setEventSuggestions(suggestions.filter((s: EventSuggestion) => s.status === 'pending'));
        setShowSuggestionsPanel(suggestions.length > 0);
      } catch (error) {
        console.error('Error loading suggestions:', error);
      }
    }

    // Check if we came from task planning with new suggestions
    if (location.state?.showSuggestions) {
      setShowSuggestionsPanel(true);
    }
  }, [location]);

  // Save events whenever they change
  useEffect(() => {
    if (events.length > 0) {
      StorageService.saveEvents(events);
    }
  }, [events]);


  // Save settings whenever they change
  useEffect(() => {
    StorageService.saveSettings({ selectedMembers, viewMode });
  }, [selectedMembers, viewMode]);

  // Handler to update family member avatar
  const handleAvatarUpload = useCallback((memberId: string, avatarDataUrl: string) => {
    // TODO: Implement avatar upload through FamilyContext
    toast({
      title: "Avatar Updated",
      description: "Profile picture has been updated successfully",
    });
  }, [toast]);

  const handleAddMember = useCallback(async (memberData: Omit<FamilyMember, 'id' | 'color'>) => {
    if (!family?.id) {
      toast({
        title: "Error",
        description: "No family found",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { addFamilyMember } = await import('@/services/familyService');
      await addFamilyMember(family.id, memberData);
      
      // Refresh family data
      await refreshFamily();
      
      toast({
        title: "Member Added",
        description: `${memberData.name} has been added to the family`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add family member",
        variant: "destructive",
      });
    }
  }, [family, toast]);

  const handleRemoveMember = useCallback(async (memberId: string) => {
    if (!family?.id) {
      toast({
        title: "Error",
        description: "No family found",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { removeFamilyMember } = await import('@/services/familyService');
      await removeFamilyMember(family.id, memberId);
      
      // Refresh family data
      await refreshFamily();
      
      toast({
        title: "Member Removed",
        description: "Family member has been removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove family member",
        variant: "destructive",
      });
    }
  }, [family, refreshFamily, toast]);

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

  const handleInlineEventSave = async (title: string, isAllDay?: boolean) => {
    // Close any open popovers first
    setIsEventPopoverOpen(false);
    setSelectedEvent(null);
    
    if (inlineCreatorData) {
      const { date, hour, minute } = inlineCreatorData;
      const startDate = new Date(date);
      const endDate = new Date(date);
      
      if (isAllDay) {
        // For all-day events, set to start and end of day
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // For timed events, use the clicked time
        startDate.setHours(hour, minute, 0, 0);
        endDate.setHours(hour + 1, minute, 0, 0); // Default 1 hour duration
      }

      // Try AI first, fallback to local generator if AI is unavailable
      let metadata: { emoji: string; category: CalendarEvent['category'] };
      
      try {
        const { llmService } = await import('@/services/llmService');
        // Try to get AI-generated metadata
        const aiMetadata = await llmService.generateEventMetadata(title, '');
        metadata = {
          emoji: aiMetadata.emoji,
          category: aiMetadata.category as CalendarEvent['category']
        };
      } catch (error) {
        // If AI fails, use local fallback
        console.log('AI unavailable, using local generator');
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

  const handleCreateEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id'>) => {
    await createCloudEvent(eventData);
    toast({
      title: "Event Created",
      description: `"${eventData.title}" has been added to your calendar`,
    });
  }, [createCloudEvent, toast]);

  const handleEventUpdate = useCallback(async (eventId: string, newStartTime: string, newEndTime: string) => {
    await moveCloudEvent(eventId, newStartTime, newEndTime);
  }, [moveCloudEvent]);

  const handleEventUpdatePartial = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    await updateCloudEvent(eventId, updates);
  }, [updateCloudEvent]);

  const handleMoveEvent = useCallback(async (eventId: string, newStartTime: string, newEndTime: string) => {
    await moveCloudEvent(eventId, newStartTime, newEndTime);
    toast({
      title: "Event Moved",
      description: "The event has been rescheduled",
    });
  }, [moveCloudEvent, toast]);

  const handleEventSave = useCallback(async (updatedEvent: CalendarEvent) => {
    await updateCloudEvent(updatedEvent.id, updatedEvent);
    toast({
      title: "Event Updated",
      description: `"${updatedEvent.title}" has been updated`,
    });
  }, [updateCloudEvent, toast]);

  const handleEventDelete = useCallback(async (eventId: string) => {
    const deletedEvent = events.find(e => e.id === eventId);
    const deletedTitle = deletedEvent?.title;
    
    await deleteCloudEvent(eventId);

    toast({
      title: "Event Deleted",
      description: deletedTitle ? `"${deletedTitle}" has been removed` : "Event removed",
    });
  }, [deleteCloudEvent, events, toast]);

  const handleAcceptSuggestion = useCallback(async (suggestion: EventSuggestion) => {
    // Create calendar event from suggestion
    await createCloudEvent({
      title: suggestion.taskTitle,
      startTime: suggestion.suggestedStartTime,
      endTime: suggestion.suggestedEndTime,
      category: 'personal', // Default category
      priority: 'medium',
      memberId: selectedMembers[0] || '1',
      emoji: suggestion.taskEmoji,
    });

    // Update suggestion status
    setEventSuggestions(prev =>
      prev.filter(s => s.id !== suggestion.id)
    );

    // Update localStorage
    const allSuggestions = JSON.parse(localStorage.getItem('event_suggestions') || '[]');
    const updated = allSuggestions.map((s: EventSuggestion) =>
      s.id === suggestion.id ? { ...s, status: 'accepted' } : s
    );
    localStorage.setItem('event_suggestions', JSON.stringify(updated));

    // Update task status  
    const tasks = taskService.loadTasks();
    const task = tasks.find(t => t.id === suggestion.taskId);
    if (task) {
      taskService.updateTask(suggestion.taskId, {
        status: 'scheduled',
        scheduledEventId: suggestion.id,
      });
    }

    toast({
      title: '✅ הצעה אושרה',
      description: `האירוע "${suggestion.taskTitle}" נוסף ללוח השנה`,
    });

    // Close panel if no more suggestions
    if (eventSuggestions.length === 1) {
      setShowSuggestionsPanel(false);
    }
  }, [selectedMembers, eventSuggestions.length, toast]);

  const handleRejectSuggestion = useCallback((suggestionId: string) => {
    setEventSuggestions(prev =>
      prev.filter(s => s.id !== suggestionId)
    );

    // Update localStorage
    const allSuggestions = JSON.parse(localStorage.getItem('event_suggestions') || '[]');
    const updated = allSuggestions.map((s: EventSuggestion) =>
      s.id === suggestionId ? { ...s, status: 'rejected' } : s
    );
    localStorage.setItem('event_suggestions', JSON.stringify(updated));

    toast({
      title: '❌ הצעה נדחתה',
      description: 'ההצעה הוסרה מהרשימה',
    });

    // Close panel if no more suggestions
    if (eventSuggestions.length === 1) {
      setShowSuggestionsPanel(false);
    }
  }, [eventSuggestions.length, toast]);

  const handleDismissAllSuggestions = useCallback(() => {
    eventSuggestions.forEach(s => {
      handleRejectSuggestion(s.id);
    });
    setShowSuggestionsPanel(false);
  }, [eventSuggestions, handleRejectSuggestion]);

  const handleDeleteRecurring = useCallback(async (recurringEventId: string, deleteAll: boolean) => {
    if (deleteAll) {
      const parentEvent = events.find(e => e.id === recurringEventId);
      const deletedTitle = parentEvent?.title;
      
      await deleteCloudEvent(recurringEventId);
      
      if (deletedTitle) {
        toast({
          title: "Recurring Event Deleted",
          description: `All occurrences of "${deletedTitle}" have been removed`,
        });
      }
    } else {
      // For "delete this occurrence only", we need to handle it differently
      // We can't actually delete a single occurrence of a recurring event pattern
      // Instead, we would need to add an "exception" system or modify the recurrence rule
      // For now, just show a message that this feature needs more work
      toast({
        title: "Not Yet Implemented",
        description: "Deleting single occurrences requires exception handling. Please delete the entire series for now.",
      });
    }
  }, [events, deleteCloudEvent, toast]);

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

  const handleTalkToChatAboutEvent = (event: CalendarEvent) => {
    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    };

    const member = familyMembers.find(m => m.id === event.memberId);
    const memberName = member ? member.name : 'Unknown';

    const message = `I want to talk about this event:

Title: ${event.title}
Date: ${formatDate(event.startTime)}
Time: ${formatTime(event.startTime)} - ${formatTime(event.endTime)}
Category: ${event.category}
Priority: ${event.priority}
Assigned to: ${memberName}
${event.description ? `Description: ${event.description}` : ''}

What would you like to know or do with this event?`;

    setChatInitialMessage(message);
    // Scroll to AI Assistant
    setTimeout(() => {
      const assistantElement = document.querySelector('[data-ai-assistant]');
      if (assistantElement) {
        assistantElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Expand recurring events into individual instances for display
  const expandedEvents = useMemo(() => {
    const expanded: CalendarEvent[] = [];
    
    // Calculate view range based on current date and view mode
    const viewStart = new Date(currentDate);
    const viewEnd = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        viewStart.setHours(0, 0, 0, 0);
        viewEnd.setHours(23, 59, 59, 999);
        break;
      case 'week':
      case 'workweek':
        // Start from Sunday of current week
        viewStart.setDate(currentDate.getDate() - currentDate.getDay());
        viewStart.setHours(0, 0, 0, 0);
        viewEnd.setDate(viewStart.getDate() + 7);
        viewEnd.setHours(23, 59, 59, 999);
        break;
      case 'month':
        viewStart.setDate(1);
        viewStart.setHours(0, 0, 0, 0);
        viewEnd.setMonth(viewStart.getMonth() + 1);
        viewEnd.setDate(0);
        viewEnd.setHours(23, 59, 59, 999);
        break;
    }
    
    // Add a buffer to generate events slightly outside the view range
    const bufferStart = new Date(viewStart);
    bufferStart.setDate(bufferStart.getDate() - 7);
    const bufferEnd = new Date(viewEnd);
    bufferEnd.setDate(bufferEnd.getDate() + 7);
    
    events.forEach(event => {
      if (event.recurrence) {
        // Generate recurring event instances
        const instances = generateRecurringEvents(
          event,
          event.recurrence,
          bufferStart,
          bufferEnd
        );
        
        // Add unique IDs to each instance
        instances.forEach((instance, index) => {
          expanded.push({
            ...instance,
            id: `${event.id}_occurrence_${index}_${new Date(instance.startTime).getTime()}`,
            recurringEventId: event.id,
          });
        });
      } else {
        // Regular non-recurring event
        expanded.push(event);
      }
    });
    
    return expanded;
  }, [events, currentDate, viewMode]);

  const filteredEvents = useMemo(
    () => expandedEvents.filter(event => selectedMembers.includes(event.memberId)),
    [expandedEvents, selectedMembers]
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
  const calendarOperations: CalendarOperations = useMemo(
    () => ({
      createEvent: handleCreateEvent,
      updateEvent: handleEventUpdatePartial,
      deleteEvent: handleEventDelete,
      moveEvent: handleMoveEvent,
    }),
    [handleCreateEvent, handleEventUpdatePartial, handleEventDelete, handleMoveEvent]
  );

  const calendarService = useMemo(
    () => new CalendarService(calendarOperations),
    [calendarOperations]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-none flex-col gap-6 px-4 pb-10 pt-6 sm:px-8 xl:px-16">
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
          <div className="flex items-center gap-4">
            <GoogleCalendarSync
              events={events}
              familyMembers={familyMembers}
              onEventsUpdated={() => {}} // Events now managed by cloud context
            />
            {eventSuggestions.length > 0 && (
              <Button
                onClick={() => setShowSuggestionsPanel(!showSuggestionsPanel)}
                className="hover:opacity-90 transition-opacity"
                style={{ background: `linear-gradient(to right, ${PRIMARY_COLOR}, #e91e63)` }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {eventSuggestions.length} הצעות AI
              </Button>
            )}
            {upcomingEvent && (
              <div className="text-sm text-muted-foreground">
                Next: <span className="font-medium text-foreground">{upcomingEvent.title}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col-reverse gap-6 lg:flex-row">
          {/* Left Sidebar - Tools and Assistant */}
          <aside className="flex w-full flex-col gap-4 lg:w-72 xl:w-80 lg:flex-shrink-0">
            <MiniCalendar
              currentDate={currentDate}
              onDateSelect={setCurrentDate}
            />

            <FamilyMembersSidebar
              members={familyMembers}
              selectedMembers={selectedMembers}
              onToggleMember={handleToggleMember}
              onAvatarUpload={handleAvatarUpload}
              onManageFamily={() => setIsFamilyManagementOpen(true)}
              currentUser={user}
            />

            {/* <CapacityIndicator scheduled={4.5} total={8} /> */}

            {/* Task Planning Button */}
            <Button 
              onClick={() => navigate('/tasks')}
              className="w-full hover:opacity-90 transition-opacity"
              style={{ background: `linear-gradient(to right, ${PRIMARY_COLOR}, #e91e63)` }}
            >
              <ListTodo className="h-4 w-4 mr-2" />
              תכנון משימות שבועי
            </Button>

            {/* Memory Manager Button */}
            <Dialog open={isMemoryDialogOpen} onOpenChange={setIsMemoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Brain className="h-4 w-4 mr-2" />
                  Memory Manager
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Smart Memory System</DialogTitle>
                </DialogHeader>
                <MemoryManager
                  familyMembers={familyMembers}
                  memoryData={memoryData}
                  onMemoryUpdate={setMemoryData}
                />
              </DialogContent>
            </Dialog>

            <div data-ai-assistant>
              <AIAssistant 
                calendarService={calendarService}
                currentDate={currentDate}
                todayEvents={todaysEvents}
                weekEvents={weekEvents}
                familyMembers={familyMembers}
                onMemoryUpdate={refreshMemoryData}
                initialMessage={chatInitialMessage}
              />
            </div>
          </aside>

          {/* Event Suggestions Panel */}
          {showSuggestionsPanel && eventSuggestions.length > 0 && (
            <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0">
              <div className="rounded-2xl border border-blue-300 bg-blue-50/80 p-4 shadow-lg backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">הצעות AI לתזמון</h3>
                    <Badge className="bg-blue-600">
                      {eventSuggestions.length}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowSuggestionsPanel(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {eventSuggestions.map((suggestion) => (
                    <EventSuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onAccept={handleAcceptSuggestion}
                      onReject={handleRejectSuggestion}
                    />
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDismissAllSuggestions}
                    className="w-full"
                  >
                    דחה את כל ההצעות
                  </Button>
                </div>
              </div>
            </aside>
          )}

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
                user={user}
                familyMembers={familyMembers}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
                activeTab={activeTab}
                onTabChange={onTabChange}
                isDarkMode={isDarkMode}
                onToggleDarkMode={onToggleDarkMode}
              />

              <div className="mt-6 flex min-h-[600px] flex-1 overflow-hidden rounded-2xl border border-border/60 bg-white/90 shadow-inner">
                <EventPopover
                  event={selectedEvent}
                  isOpen={isEventPopoverOpen}
                  position={eventPopoverPosition}
                  onClose={() => setIsEventPopoverOpen(false)}
                  onEdit={handleEditFromPopover}
                  onDelete={handleEventDelete}
                  familyMembers={familyMembers}
                >
                  <div className="h-full w-full">
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
            </div>
          </section>
        </div>
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

      {/* Family Management Dialog */}
      <Dialog open={isFamilyManagementOpen} onOpenChange={setIsFamilyManagementOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Family Management</DialogTitle>
          </DialogHeader>
          <FamilyManagement
            members={familyMembers}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            currentUser={user}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
