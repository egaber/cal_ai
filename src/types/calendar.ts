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
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  color: string;
  isYou: boolean;
}
