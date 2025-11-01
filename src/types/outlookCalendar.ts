// Microsoft Outlook Calendar API types

export interface OutlookCalendarEvent {
  id?: string;
  subject: string;
  body?: {
    contentType: 'HTML' | 'Text';
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
    type: 'required' | 'optional' | 'resource';
  }>;
  location?: {
    displayName: string;
  };
  isAllDay?: boolean;
  recurrence?: {
    pattern: {
      type: 'daily' | 'weekly' | 'absoluteMonthly' | 'relativeMonthly' | 'absoluteYearly' | 'relativeYearly';
      interval: number;
      daysOfWeek?: string[];
      dayOfMonth?: number;
    };
    range: {
      type: 'endDate' | 'noEnd' | 'numbered';
      startDate: string;
      endDate?: string;
      numberOfOccurrences?: number;
    };
  };
  categories?: string[];
  sensitivity?: 'normal' | 'personal' | 'private' | 'confidential';
  showAs?: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere' | 'unknown';
}

export interface OutlookCalendar {
  id: string;
  name: string;
  color?: string;
  canEdit?: boolean;
  isDefaultCalendar?: boolean;
  owner?: {
    name: string;
    address: string;
  };
}

export interface OutlookAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  authority: string;
}

export interface OutlookAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresOn: number;
  tokenType: string;
}

export interface CalendarMemberMapping {
  calendarId: string;
  calendarName: string;
  memberId: string;
  ownerEmail?: string;
}

export interface OutlookCalendarSettings {
  enabled: boolean;
  clientId: string;
  calendarMappings: CalendarMemberMapping[];
  autoSync: boolean;
  syncInterval: number; // minutes
  lastSyncTime?: string;
}

export interface SyncStatus {
  lastSync?: string;
  isSyncing: boolean;
  error?: string;
  syncedEventsCount?: number;
}
