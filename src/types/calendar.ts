export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // e.g., every 2 weeks
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, etc. (for weekly)
  dayOfMonth?: number; // for monthly
  endDate?: string; // when to stop recurring
  count?: number; // or after N occurrences
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  category: 'health' | 'work' | 'personal' | 'family' | 'education' | 'social' | 'finance' | 'home' | 'travel' | 'fitness' | 'food' | 'shopping' | 'entertainment' | 'sports' | 'hobby' | 'volunteer' | 'appointment' | 'maintenance' | 'celebration' | 'meeting' | 'childcare' | 'pet' | 'errand' | 'transport' | 'project' | 'deadline';
  priority: 'low' | 'medium' | 'high';
  memberId: string; // Primary member (for backward compatibility and filtering)
  memberIds?: string[]; // Optional: multiple family members attending this event
  description?: string;
  type?: string;
  emoji?: string; // AI-generated emoji representing the event
  aiTip?: string; // AI-generated scheduling tip or suggestion
  recurrence?: RecurrenceRule;
  recurringEventId?: string; // links to parent recurring event
  source?: 'local' | 'google'; // Where this event came from
  sourceCalendarId?: string; // Google Calendar ID if from Google
  sourceCalendarEmail?: string; // Email of the Google Calendar
  isAllDay?: boolean; // Whether this is a whole-day event
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  color: string;
  isYou: boolean;
  avatar?: string; // Base64 encoded image or URL
}
