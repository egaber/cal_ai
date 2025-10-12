// Google Calendar API Service

import { CalendarEvent, FamilyMember } from '@/types/calendar';
import {
  GoogleCalendarEvent,
  GoogleCalendarList,
  GoogleCalendarSettings,
  SyncStatus,
} from '@/types/googleCalendar';
import { GOOGLE_CALENDAR_CONFIG } from '@/config/googleCalendar';

declare const gapi: any;
declare const google: any;

export class GoogleCalendarService {
  private static instance: GoogleCalendarService;
  private tokenClient: any = null;
  private isInitialized = false;
  private accessToken: string | null = null;

  private constructor() {}

  static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  // Initialize the Google API client
  async initialize(clientId: string, apiKey: string): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load the gapi client
      await new Promise<void>((resolve, reject) => {
        gapi.load('client', async () => {
          try {
            await gapi.client.init({
              apiKey: apiKey,
              discoveryDocs: [GOOGLE_CALENDAR_CONFIG.DISCOVERY_DOC],
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });

      // Initialize the Google Identity Services token client
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GOOGLE_CALENDAR_CONFIG.SCOPES,
        callback: '', // Will be set per request
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing Google Calendar API:', error);
      throw new Error('Failed to initialize Google Calendar API');
    }
  }

  // Authenticate the user and get access token
  async authenticate(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        this.tokenClient.callback = (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          this.accessToken = response.access_token;
          resolve(true);
        };

        if (gapi.client.getToken() === null) {
          // Prompt the user to select a Google Account and ask for consent
          this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
          // Skip display of account chooser and consent dialog
          this.tokenClient.requestAccessToken({ prompt: '' });
        }
      } catch (error) {
        console.error('Error authenticating:', error);
        reject(error);
      }
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.accessToken !== null || gapi.client.getToken() !== null;
  }

  // Sign out
  signOut(): void {
    const token = gapi.client.getToken();
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token);
      gapi.client.setToken(null);
    }
    this.accessToken = null;
  }

  // Get list of user's calendars
  async getCalendarList(): Promise<GoogleCalendarList[]> {
    try {
      const response = await gapi.client.calendar.calendarList.list();
      return response.result.items || [];
    } catch (error) {
      console.error('Error fetching calendar list:', error);
      throw new Error('Failed to fetch calendar list');
    }
  }

  // Fetch events from Google Calendar
  async fetchEvents(
    calendarId: string = 'primary',
    timeMin?: string,
    timeMax?: string
  ): Promise<GoogleCalendarEvent[]> {
    try {
      const request: any = {
        calendarId: calendarId,
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax,
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime',
      };

      const response = await gapi.client.calendar.events.list(request);
      return response.result.items || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      throw new Error('Failed to fetch events from Google Calendar');
    }
  }

  // Create event in Google Calendar
  async createEvent(
    event: GoogleCalendarEvent,
    calendarId: string = 'primary'
  ): Promise<GoogleCalendarEvent> {
    try {
      const response = await gapi.client.calendar.events.insert({
        calendarId: calendarId,
        resource: event,
      });
      return response.result;
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event in Google Calendar');
    }
  }

  // Update event in Google Calendar
  async updateEvent(
    eventId: string,
    event: GoogleCalendarEvent,
    calendarId: string = 'primary'
  ): Promise<GoogleCalendarEvent> {
    try {
      const response = await gapi.client.calendar.events.update({
        calendarId: calendarId,
        eventId: eventId,
        resource: event,
      });
      return response.result;
    } catch (error) {
      console.error('Error updating event:', error);
      throw new Error('Failed to update event in Google Calendar');
    }
  }

  // Delete event from Google Calendar
  async deleteEvent(eventId: string, calendarId: string = 'primary'): Promise<void> {
    try {
      await gapi.client.calendar.events.delete({
        calendarId: calendarId,
        eventId: eventId,
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      throw new Error('Failed to delete event from Google Calendar');
    }
  }

  // Convert CalendarEvent to GoogleCalendarEvent
  convertToGoogleEvent(event: CalendarEvent, familyMembers: FamilyMember[]): GoogleCalendarEvent {
    const attendees = event.memberIds
      ? event.memberIds
          .map((id) => {
            const member = familyMembers.find((m) => m.id === id);
            return member
              ? {
                  email: `${member.name.toLowerCase().replace(/\s+/g, '.')}@family.local`,
                  displayName: member.name,
                }
              : null;
          })
          .filter(Boolean) as Array<{ email: string; displayName: string }>
      : [];

    const googleEvent: GoogleCalendarEvent = {
      summary: event.title,
      description: event.description || '',
      start: {
        dateTime: event.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: attendees.length > 0 ? attendees : undefined,
    };

    // Handle recurrence
    if (event.recurrence) {
      const { frequency, interval, daysOfWeek, dayOfMonth, endDate, count } = event.recurrence;
      const rrule = this.buildRRule(frequency, interval, daysOfWeek, dayOfMonth, endDate, count);
      googleEvent.recurrence = [rrule];
    }

    return googleEvent;
  }

  // Convert GoogleCalendarEvent to CalendarEvent
  convertFromGoogleEvent(
    googleEvent: GoogleCalendarEvent,
    defaultMemberId: string
  ): CalendarEvent {
    const event: CalendarEvent = {
      id: googleEvent.id || `google_${Date.now()}`,
      title: googleEvent.summary,
      description: googleEvent.description,
      startTime: googleEvent.start.dateTime,
      endTime: googleEvent.end.dateTime,
      category: this.inferCategory(googleEvent.summary, googleEvent.description),
      priority: 'medium',
      memberId: defaultMemberId,
      emoji: this.inferEmoji(googleEvent.summary),
    };

    return event;
  }

  // Build RRULE string for recurrence
  private buildRRule(
    frequency: string,
    interval: number,
    daysOfWeek?: number[],
    dayOfMonth?: number,
    endDate?: string,
    count?: number
  ): string {
    let rrule = `RRULE:FREQ=${frequency.toUpperCase()};INTERVAL=${interval}`;

    if (daysOfWeek && daysOfWeek.length > 0) {
      const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      const byDay = daysOfWeek.map((day) => days[day]).join(',');
      rrule += `;BYDAY=${byDay}`;
    }

    if (dayOfMonth) {
      rrule += `;BYMONTHDAY=${dayOfMonth}`;
    }

    if (endDate) {
      const formattedDate = endDate.replace(/[-:]/g, '').split('.')[0] + 'Z';
      rrule += `;UNTIL=${formattedDate}`;
    } else if (count) {
      rrule += `;COUNT=${count}`;
    }

    return rrule;
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

  // Sync events: push local events to Google Calendar
  async syncToGoogle(
    events: CalendarEvent[],
    familyMembers: FamilyMember[],
    calendarId: string = 'primary'
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const event of events) {
      try {
        // Skip events that already have a Google Calendar ID
        if (event.id.startsWith('google_')) {
          continue;
        }

        const googleEvent = this.convertToGoogleEvent(event, familyMembers);
        await this.createEvent(googleEvent, calendarId);
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

  // Sync events: pull events from Google Calendar
  async syncFromGoogle(
    calendarId: string = 'primary',
    defaultMemberId: string,
    timeMin?: string,
    timeMax?: string,
    calendarEmail?: string
  ): Promise<CalendarEvent[]> {
    try {
      const googleEvents = await this.fetchEvents(calendarId, timeMin, timeMax);
      return googleEvents.map((gEvent) => {
        const event = this.convertFromGoogleEvent(gEvent, defaultMemberId);
        // Add source information
        event.source = 'google';
        event.sourceCalendarId = calendarId;
        event.sourceCalendarEmail = calendarEmail || calendarId;
        return event;
      });
    } catch (error) {
      console.error('Error syncing from Google:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const googleCalendarService = GoogleCalendarService.getInstance();
