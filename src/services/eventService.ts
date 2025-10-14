import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { CalendarEvent } from '../types/calendar';

// Event Service - Manages events in Firestore with optimistic UI updates
export class EventService {
  private familyId: string;
  private userId: string;
  private calendarSource: string;
  private eventsCollection: string;

  constructor(familyId: string, userId: string, calendarSource: string = 'cal_ai') {
    this.familyId = familyId;
    this.userId = userId;
    this.calendarSource = calendarSource;
    this.eventsCollection = `families/${familyId}/members/${userId}/calendars/${calendarSource}/events`;
  }

  // Generate unique event ID
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Convert CalendarEvent to Firestore format
  private toFirestore(event: CalendarEvent): DocumentData {
    // Remove undefined values as Firestore doesn't accept them
    const cleanEvent: any = {};
    
    Object.keys(event).forEach(key => {
      const value = (event as any)[key];
      if (value !== undefined) {
        cleanEvent[key] = value;
      }
    });
    
    return {
      ...cleanEvent,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  }

  // Convert Firestore document to CalendarEvent
  private fromFirestore(doc: DocumentData): CalendarEvent {
    const data = doc;
    return {
      ...data,
      id: doc.id,
      startTime: data.startTime,
      endTime: data.endTime,
    } as CalendarEvent;
  }

  // Create event with optimistic UI update
  async createEvent(eventData: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const eventId = this.generateEventId();
    const event: CalendarEvent = {
      ...eventData,
      id: eventId,
    };

    // Return immediately for UI (optimistic update)
    // Save to Firestore in background
    this.saveEventToFirestore(event).catch(error => {
      console.error('Error saving event to Firestore:', error);
      // TODO: Implement retry logic or error handling
    });

    return event;
  }

  // Save event to Firestore (background operation)
  private async saveEventToFirestore(event: CalendarEvent): Promise<void> {
    const eventRef = doc(collection(db, this.eventsCollection), event.id);
    await setDoc(eventRef, this.toFirestore(event));
  }

  // Update event with optimistic UI update
  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<void> {
    // Return immediately for UI (optimistic update)
    // Save to Firestore in background
    this.updateEventInFirestore(eventId, updates).catch(error => {
      console.error('Error updating event in Firestore:', error);
      // TODO: Implement retry logic or error handling
    });
  }

  // Update event in Firestore (background operation)
  private async updateEventInFirestore(
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<void> {
    // Remove undefined values as Firestore doesn't accept them
    const cleanUpdates: any = {};
    
    Object.keys(updates).forEach(key => {
      const value = (updates as any)[key];
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    });
    
    const eventRef = doc(db, this.eventsCollection, eventId);
    await updateDoc(eventRef, {
      ...cleanUpdates,
      updatedAt: Timestamp.now(),
    });
  }

  // Delete event with optimistic UI update
  async deleteEvent(eventId: string): Promise<void> {
    // Return immediately for UI (optimistic update)
    // Delete from Firestore in background
    this.deleteEventFromFirestore(eventId).catch(error => {
      console.error('Error deleting event from Firestore:', error);
      // TODO: Implement retry logic or error handling
    });
  }

  // Delete event from Firestore (background operation)
  private async deleteEventFromFirestore(eventId: string): Promise<void> {
    const eventRef = doc(db, this.eventsCollection, eventId);
    await deleteDoc(eventRef);
  }

  // Move event (update start and end times)
  async moveEvent(eventId: string, newStartTime: string, newEndTime: string): Promise<void> {
    await this.updateEvent(eventId, {
      startTime: newStartTime,
      endTime: newEndTime,
    });
  }

  // Load events for a date range
  async loadEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      const eventsRef = collection(db, this.eventsCollection);
      const q = query(
        eventsRef,
        where('startTime', '>=', startDate.toISOString()),
        where('startTime', '<=', endDate.toISOString()),
        orderBy('startTime', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const events: CalendarEvent[] = [];

      querySnapshot.forEach((doc) => {
        events.push(this.fromFirestore({ id: doc.id, ...doc.data() }));
      });

      return events;
    } catch (error) {
      console.error('Error loading events from Firestore:', error);
      return [];
    }
  }

  // Subscribe to real-time event updates
  subscribeToEvents(
    startDate: Date,
    endDate: Date,
    callback: (events: CalendarEvent[]) => void
  ): () => void {
    const eventsRef = collection(db, this.eventsCollection);
    const q = query(
      eventsRef,
      where('startTime', '>=', startDate.toISOString()),
      where('startTime', '<=', endDate.toISOString()),
      orderBy('startTime', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot: QuerySnapshot) => {
        const events: CalendarEvent[] = [];
        querySnapshot.forEach((doc) => {
          events.push(this.fromFirestore({ id: doc.id, ...doc.data() }));
        });
        callback(events);
      },
      (error) => {
        console.error('Error subscribing to events:', error);
      }
    );

    return unsubscribe;
  }

  // Load all events for a family (for export, backup, etc.)
  async loadAllEvents(): Promise<CalendarEvent[]> {
    try {
      const eventsRef = collection(db, this.eventsCollection);
      const q = query(eventsRef, orderBy('startTime', 'asc'));

      const querySnapshot = await getDocs(q);
      const events: CalendarEvent[] = [];

      querySnapshot.forEach((doc) => {
        events.push(this.fromFirestore({ id: doc.id, ...doc.data() }));
      });

      return events;
    } catch (error) {
      console.error('Error loading all events from Firestore:', error);
      return [];
    }
  }
}

// Factory function to create EventService instance
export const createEventService = (familyId: string, userId: string, calendarSource: string = 'cal_ai'): EventService => {
  return new EventService(familyId, userId, calendarSource);
};
