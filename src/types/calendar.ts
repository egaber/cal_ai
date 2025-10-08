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
  category: 'health' | 'work' | 'personal' | 'family';
  priority: 'low' | 'medium' | 'high';
  memberId: string;
  description?: string;
  type?: string;
  recurrence?: RecurrenceRule;
  recurringEventId?: string; // links to parent recurring event
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  color: string;
  isYou: boolean;
}
