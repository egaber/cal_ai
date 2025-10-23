export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
  category: 'work' | 'personal' | 'family' | 'health' | 'education' | 'social' | 'other';
  priority: 'low' | 'medium' | 'high';
  memberId: string;
  emoji?: string;
  isAllDay?: boolean;
  recurrence?: RecurrenceRule;
  recurringEventId?: string;
  color?: string;
  attachments?: string[];
  reminders?: number[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
  count?: number;
  byWeekDay?: number[];
  byMonthDay?: number[];
}

export interface FamilyMember {
  id: string;
  name: string;
  role: 'parent' | 'child';
  color: string;
  avatar?: string;
  age?: number;
}

export interface Family {
  id: string;
  name: string;
  members: FamilyMember[];
  inviteCode?: string;
  createdAt: string;
  createdBy: string;
}
