import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { EventService, createEventService } from '@/services/eventService';
import { useFamily } from './FamilyContext';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EventContextType {
  events: CalendarEvent[];
  loading: boolean;
  eventService: EventService | null;
  createEvent: (eventData: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  moveEvent: (eventId: string, newStartTime: string, newEndTime: string) => Promise<void>;
  refreshEvents: () => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within EventProvider');
  }
  return context;
};

interface EventProviderProps {
  children: ReactNode;
}

export const EventProvider = ({ children }: EventProviderProps) => {
  const { family } = useFamily();
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventService, setEventService] = useState<EventService | null>(null);

  // Initialize event service when family and user are available
  useEffect(() => {
    if (family?.id && user?.uid) {
      const service = createEventService(family.id, user.uid, 'cal_ai');
      setEventService(service);
    } else {
      setEventService(null);
      setEvents([]);
    }
  }, [family?.id, user?.uid]);

  // Load and subscribe to events
  useEffect(() => {
    if (!eventService) {
      setLoading(false);
      return;
    }

    // Calculate date range (load 3 months: 1 month past, 2 months future)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 2);
    endDate.setDate(0); // Last day of month
    endDate.setHours(23, 59, 59, 999);

    // Subscribe to real-time updates
    const unsubscribe = eventService.subscribeToEvents(
      startDate,
      endDate,
      (updatedEvents) => {
        setEvents(updatedEvents);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [eventService]);

  const createEvent = async (eventData: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
    if (!eventService) {
      throw new Error('Event service not initialized');
    }

    try {
      // Optimistic update
      const newEvent = await eventService.createEvent(eventData);
      setEvents((prev) => [...prev, newEvent]);
      return newEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to create event. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<CalendarEvent>): Promise<void> => {
    if (!eventService) {
      throw new Error('Event service not initialized');
    }

    try {
      // Optimistic update
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId ? { ...event, ...updates } : event
        )
      );
      await eventService.updateEvent(eventId, updates);
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to update event. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteEvent = async (eventId: string): Promise<void> => {
    if (!eventService) {
      throw new Error('Event service not initialized');
    }

    try {
      // Optimistic update
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
      await eventService.deleteEvent(eventId);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const moveEvent = async (
    eventId: string,
    newStartTime: string,
    newEndTime: string
  ): Promise<void> => {
    if (!eventService) {
      throw new Error('Event service not initialized');
    }

    try {
      // Optimistic update
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? { ...event, startTime: newStartTime, endTime: newEndTime }
            : event
        )
      );
      await eventService.moveEvent(eventId, newStartTime, newEndTime);
    } catch (error) {
      console.error('Error moving event:', error);
      toast({
        title: 'Error',
        description: 'Failed to move event. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const refreshEvents = async (): Promise<void> => {
    if (!eventService) return;

    try {
      setLoading(true);
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 2);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);

      const loadedEvents = await eventService.loadEvents(startDate, endDate);
      setEvents(loadedEvents);
    } catch (error) {
      console.error('Error refreshing events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <EventContext.Provider
      value={{
        events,
        loading,
        eventService,
        createEvent,
        updateEvent,
        deleteEvent,
        moveEvent,
        refreshEvents,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};
