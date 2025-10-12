// Google Calendar API types

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  colorId?: string;
  recurrence?: string[];
  status?: 'confirmed' | 'tentative' | 'cancelled';
}

export interface GoogleCalendarList {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
}

export interface GoogleAuthConfig {
  clientId: string;
  apiKey: string;
  scopes: string[];
  discoveryDocs: string[];
}

export interface SyncStatus {
  lastSync?: string;
  isSyncing: boolean;
  error?: string;
  syncedEventsCount?: number;
}

export interface CalendarMemberMapping {
  calendarId: string;
  calendarName: string;
  memberId: string;
  calendarEmail?: string;
}

export interface GoogleCalendarSettings {
  enabled: boolean;
  clientId: string;
  apiKey: string;
  calendarMappings: CalendarMemberMapping[];
  autoSync: boolean;
  syncInterval: number; // minutes
  lastSyncTime?: string;
}
