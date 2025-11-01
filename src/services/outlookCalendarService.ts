// Microsoft Outlook Calendar API Service
// Uses MSAL (Microsoft Authentication Library) for authentication

import { CalendarEvent, FamilyMember } from '@/types/calendar';
import {
  OutlookCalendarEvent,
  OutlookCalendar,
  OutlookAuthToken,
  SyncStatus,
} from '@/types/outlookCalendar';
import { OUTLOOK_CALENDAR_CONFIG } from '@/config/outlookCalendar';

// MSAL types (will be loaded from CDN or npm package)
declare const msal: any;

export class OutlookCalendarService {
  private static instance: OutlookCalendarService;
  private msalInstance: any = null;
  private isInitialized = false;
  private accessToken: string | null = null;

  private constructor() {}

  static getInstance(): OutlookCalendarService {
    if (!OutlookCalendarService.instance) {
      OutlookCalendarService.instance = new OutlookCalendarService();
    }
    return OutlookCalendarService.instance;
  }

  // Initialize MSAL
  async initialize(clientId: string): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const msalConfig = {
        auth: {
          clientId: clientId,
          authority: OUTLOOK_CALENDAR_CONFIG.AUTHORITY,
          redirectUri: OUTLOOK_CALENDAR_CONFIG.REDIRECT_URI,
        },
        cache: {
          cacheLocation: 'localStorage',
          storeAuthStateInCookie: false,
        },
      };

      this.msalInstance = new msal.PublicClientApplication(msalConfig);
      await this.msalInstance.initialize();
      this.isInitialized = true;

      // Handle redirect response if any
      await this.msalInstance.handleRedirectPromise();
    } catch (error) {
      console.error('Error initializing MSAL:', error);
      throw new Error('Failed to initialize Outlook Calendar authentication');
    }
  }

  // Authenticate the user
  async authenticate(): Promise<boolean> {
    try {
      const loginRequest = {
        scopes: OUTLOOK_CALENDAR_CONFIG.SCOPES,
      };

      // Try silent authentication first
      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        const silentRequest = {
          scopes: OUTLOOK_CALENDAR_CONFIG.SCOPES,
          account: accounts[0],
        };

        try {
          const response = await this.msalInstance.acquireTokenSilent(silentRequest);
          this.accessToken = response.accessToken;
          return true;
        } catch (silentError) {
          console.log('Silent authentication failed, trying popup');
        }
      }

      // If silent fails or no accounts, use popup
      const response = await this.msalInstance.loginPopup(loginRequest);
      this.accessToken = response.accessToken;
      return true;
    } catch (error) {
      console.error('Error authenticating:', error);
      throw error;
    }
  }

  // Get access token (with refresh if needed)
  private async getAccessToken(): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      throw new Error('No authenticated account found. Please sign in.');
    }

    const silentRequest = {
      scopes: OUTLOOK_CALENDAR_CONFIG.SCOPES,
      account: accounts[0],
    };

    try {
      const response = await this.msalInstance.acquireTokenSilent(silentRequest);
      this.accessToken = response.accessToken;
      return response.accessToken;
    } catch (error) {
      // If silent token acquisition fails, try interactive
      const interactiveRequest = {
        scopes: OUTLOOK_CALENDAR_CONFIG.SCOPES,
      };
      const response = await this.msalInstance.acquireTokenPopup(interactiveRequest);
      this.accessToken = response.accessToken;
      return response.accessToken;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    if (!this.isInitialized) return false;
    const accounts = this.msalInstance.getAllAccounts();
    return accounts.length > 0;
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        await this.msalInstance.logoutPopup({
          account: accounts[0],
        });
      }
      this.accessToken = null;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Get user's calendars
  async getCalendarList(): Promise<OutlookCalendar[]> {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(OUTLOOK_CALENDAR_CONFIG.CALENDAR_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch calendars: ${response.statusText}`);
      }

      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.error('Error fetching calendar list:', error);
      throw new Error('Failed to fetch calendar list');
    }
  }

  // Fetch events from Outlook Calendar
  async fetchEvents(
    calendarId: string = 'calendar',
    timeMin?: string,
    timeMax?: string
  ): Promise<OutlookCalendarEvent[]> {
    try {
      const token = await this.getAccessToken();
      
      // Build query parameters
      const params = new URLSearchParams();
      if (timeMin) {
        params.append('$filter', `start/dateTime ge '${timeMin}'`);
      }
      if (timeMax) {
        const filterValue = timeMin 
          ? `start/dateTime ge '${timeMin}' and end/dateTime le '${timeMax}'`
          : `end/dateTime le '${timeMax}'`;
        params.set('$filter', filterValue);
      }
      params.append('$orderby', 'start/dateTime');
      params.append('$top', '250'); // Max results per page

      const url = calendarId === 'calendar'
        ? `${OUTLOOK_CALENDAR_CONFIG.EVENTS_ENDPOINT}?${params}`
        : `${OUTLOOK_CALENDAR_CONFIG.GRAPH_ENDPOINT}/me/calendars/${calendarId}/events?${params}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }

      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      throw new Error('Failed to fetch events from Outlook Calendar');
    }
  }

  // Create event in Outlook Calendar
  async createEvent(
    event: OutlookCalendarEvent,
    calendarId: string = 'calendar'
  ): Promise<OutlookCalendarEvent> {
    try {
      const token = await this.getAccessToken();
      
      const url = calendarId === 'calendar'
        ? OUTLOOK_CALENDAR_CONFIG.EVENTS_ENDPOINT
        : `${OUTLOOK_CALENDAR_CONFIG.GRAPH_ENDPOINT}/me/calendars/${calendarId}/events`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`Failed to create event: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event in Outlook Calendar');
    }
  }

  // Update event in Outlook Calendar
  async updateEvent(
    eventId: string,
    event: OutlookCalendarEvent,
    calendarId: string = 'calendar'
  ): Promise<OutlookCalendarEvent> {
    try {
      const token = await this.getAccessToken();
      
      const url = `${OUTLOOK_CALENDAR_CONFIG.GRAPH_ENDPOINT}/me/events/${eventId}`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`Failed to update event: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating event:', error);
      throw new Error('Failed to update event in Outlook Calendar');
    }
  }

  // Delete event from Outlook Calendar
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      
      const url = `${OUTLOOK_CALENDAR_CONFIG.GRAPH_ENDPOINT}/me/events/${eventId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete event: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      throw new Error('Failed to delete event from Outlook Calendar');
    }
  }

  // Convert CalendarEvent to OutlookCalendarEvent
  convertToOutlookEvent(
    event: CalendarEvent,
    familyMembers: FamilyMember[]
  ): OutlookCalendarEvent {
    const attendees = event.memberIds
      ? event.memberIds
          .map((id) => {
            const member = familyMembers.find((m) => m.id === id);
            return member
              ? {
                  emailAddress: {
                    address: `${member.name.toLowerCase().replace(/\s+/g, '.')}@family.local`,
                    name: member.name,
                  },
                  type: 'required' as const,
                }
              : null;
          })
          .filter(Boolean) as OutlookCalendarEvent['attendees']
      : undefined;

    const outlookEvent: OutlookCalendarEvent = {
      subject: event.title,
      body: event.description
        ? {
            contentType: 'Text',
            content: event.description,
          }
        : undefined,
      start: {
        dateTime: event.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees,
      categories: [event.category],
    };

    // Handle recurrence
    if (event.recurrence) {
      const { frequency, interval, daysOfWeek, dayOfMonth, endDate, count } = event.recurrence;
      outlookEvent.recurrence = this.buildRecurrence(
        frequency,
        interval,
        daysOfWeek,
        dayOfMonth,
        endDate,
        count,
        event.startTime
      );
    }

    return outlookEvent;
  }

  // Convert OutlookCalendarEvent to CalendarEvent
  convertFromOutlookEvent(
    outlookEvent: OutlookCalendarEvent,
    defaultMemberId: string
  ): CalendarEvent {
    const event: CalendarEvent = {
      id: outlookEvent.id || `outlook_${Date.now()}`,
      title: outlookEvent.subject,
      description: outlookEvent.body?.content,
      startTime: outlookEvent.start.dateTime,
      endTime: outlookEvent.end.dateTime,
      category: this.inferCategory(outlookEvent.subject, outlookEvent.body?.content),
      priority: 'medium',
      memberId: defaultMemberId,
      emoji: this.inferEmoji(outlookEvent.subject),
      source: 'outlook',
    };

    return event;
  }

  // Build Outlook recurrence pattern
  private buildRecurrence(
    frequency: string,
    interval: number,
    daysOfWeek?: number[],
    dayOfMonth?: number,
    endDate?: string,
    count?: number,
    startDate?: string
  ): OutlookCalendarEvent['recurrence'] {
    const pattern: any = {
      type: frequency.toLowerCase(),
      interval,
    };

    if (daysOfWeek && daysOfWeek.length > 0) {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      pattern.daysOfWeek = daysOfWeek.map((day) => days[day]);
    }

    if (dayOfMonth) {
      pattern.dayOfMonth = dayOfMonth;
    }

    const range: any = {
      startDate: startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    };

    if (endDate) {
      range.type = 'endDate';
      range.endDate = endDate.split('T')[0];
    } else if (count) {
      range.type = 'numbered';
      range.numberOfOccurrences = count;
    } else {
      range.type = 'noEnd';
    }

    return { pattern, range };
  }

  // Infer category from event title/description
  private inferCategory(title: string, description?: string): CalendarEvent['category'] {
    const text = `${title} ${description || ''}`.toLowerCase();

    if (
      text.includes('doctor') ||
      text.includes('dentist') ||
      text.includes('hospital') ||
      text.includes('medical')
    ) {
      return 'health';
    }
    if (
      text.includes('meeting') ||
      text.includes('work') ||
      text.includes('office') ||
      text.includes('project')
    ) {
      return 'work';
    }
    if (
      text.includes('family') ||
      text.includes('kids') ||
      text.includes('children') ||
      text.includes('school')
    ) {
      return 'family';
    }

    return 'personal';
  }

  // Infer emoji from event title
  private inferEmoji(title: string): string {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('meeting') || lowerTitle.includes('work')) return '💼';
    if (lowerTitle.includes('doctor') || lowerTitle.includes('health')) return '🏥';
    if (lowerTitle.includes('family') || lowerTitle.includes('kids')) return '👨‍👩‍👧‍👦';
    if (lowerTitle.includes('meal') || lowerTitle.includes('dinner') || lowerTitle.includes('lunch'))
      return '🍽️';
    if (lowerTitle.includes('exercise') || lowerTitle.includes('gym')) return '🏋️';
    if (lowerTitle.includes('school') || lowerTitle.includes('learn')) return '📚';
    if (lowerTitle.includes('appointment')) return '📅';

    return '📌';
  }

  // Sync events: push local events to Outlook Calendar
  async syncToOutlook(
    events: CalendarEvent[],
    familyMembers: FamilyMember[],
    calendarId: string = 'calendar'
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const event of events) {
      try {
        // Skip events that already have an Outlook ID
        if (event.id.startsWith('outlook_')) {
          continue;
        }

        const outlookEvent = this.convertToOutlookEvent(event, familyMembers);
        await this.createEvent(outlookEvent, calendarId);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Failed to sync "${event.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return results;
  }

  // Sync events: pull events from Outlook Calendar
  async syncFromOutlook(
    calendarId: string = 'calendar',
    defaultMemberId: string,
    timeMin?: string,
    timeMax?: string,
    calendarName?: string
  ): Promise<CalendarEvent[]> {
    try {
      const outlookEvents = await this.fetchEvents(calendarId, timeMin, timeMax);
      return outlookEvents.map((oEvent) => {
        const event = this.convertFromOutlookEvent(oEvent, defaultMemberId);
        // Add source information
        event.source = 'outlook';
        event.sourceCalendarId = calendarId;
        event.sourceCalendarEmail = calendarName || calendarId;
        return event;
      });
    } catch (error) {
      console.error('Error syncing from Outlook:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const outlookCalendarService = OutlookCalendarService.getInstance();
