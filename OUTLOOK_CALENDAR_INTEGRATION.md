# Outlook Calendar Integration

This document describes the Microsoft Outlook/Microsoft 365 Calendar integration for the Calendar AI application.

## Overview

The Outlook Calendar integration allows users to:
- **Import events** from Outlook/Microsoft 365 calendars into Calendar AI
- **Export events** from Calendar AI to Outlook calendars
- **Map multiple calendars** to different family members
- **Two-way sync** between Calendar AI and Outlook

## Architecture

The integration follows the same pattern as Google Calendar integration:

```
User Interface (OutlookCalendarSync.tsx)
    ↓
Service Layer (outlookCalendarService.ts)
    ↓
Microsoft Graph API (via MSAL.js)
    ↓
Outlook/Microsoft 365 Calendars
```

## Components

### 1. Types (`src/types/outlookCalendar.ts`)
- `OutlookCalendarEvent`: Event structure from Microsoft Graph API
- `OutlookCalendar`: Calendar metadata
- `OutlookCalendarSettings`: User settings for sync
- `CalendarMemberMapping`: Maps Outlook calendars to family members

### 2. Configuration (`src/config/outlookCalendar.ts`)
- Azure App Registration Client ID
- Microsoft Graph API endpoints
- OAuth scopes (Calendars.Read, Calendars.ReadWrite, User.Read)
- Setup instructions for Azure portal

### 3. Service (`src/services/outlookCalendarService.ts`)
Core functionality:
- **Authentication**: MSAL popup-based OAuth flow
- **Calendar List**: Fetch user's calendars
- **Event Operations**: Create, read, update, delete events
- **Event Conversion**: Transform between Calendar AI and Outlook formats
- **Sync Operations**: Import/export events in bulk

### 4. UI Component (`src/components/OutlookCalendarSync.tsx`)
User interface features:
- Enable/disable sync toggle
- Connect/disconnect authentication
- Calendar-to-member mapping interface
- Manual sync buttons (import/export)
- Last sync timestamp display

### 5. Storage (`src/services/storageService.ts`)
Persists settings to localStorage:
- Calendar mappings
- Sync preferences
- Last sync time

## Setup Instructions

### Step 1: Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: Calendar AI - Outlook Integration
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**: 
     - Type: Single-page application (SPA)
     - URL: `http://localhost:5173` (development) or your production URL
5. Click **Register**
6. Copy the **Application (client) ID**

### Step 2: Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission** > **Microsoft Graph** > **Delegated permissions**
3. Add these permissions:
   - `Calendars.Read`
   - `Calendars.ReadWrite`
   - `User.Read`
4. Click **Add permissions**
5. (Optional) Click **Grant admin consent** if you have admin rights

### Step 3: Configure Authentication

1. Go to **Authentication** in your app registration
2. Under **Implicit grant and hybrid flows**, enable:
   - ✅ Access tokens
   - ✅ ID tokens
3. Save changes

### Step 4: Update Configuration File

Update `src/config/outlookCalendar.ts`:

```typescript
export const OUTLOOK_CALENDAR_CONFIG = {
  CLIENT_ID: 'YOUR_CLIENT_ID_HERE', // Paste your Application (client) ID
  REDIRECT_URI: window.location.origin,
  // ... rest of config
};
```

## Usage

### For Users

1. **Enable Integration**:
   - Click "Outlook Calendar" button in the app
   - Toggle "Enable Outlook Calendar Sync"
   - Click "Connect" to authenticate

2. **Map Calendars**:
   - Click "Add Calendar" to create a mapping
   - Select an Outlook calendar
   - Assign it to a family member
   - Repeat for multiple calendars

3. **Sync Events**:
   - Click "Import from Outlook" to pull events into Calendar AI
   - Click "Export to Outlook" to push local events to Outlook
   - Or use the quick sync button in the header

### For Developers

#### Import Events from Outlook

```typescript
import { outlookCalendarService } from '@/services/outlookCalendarService';
import { createEventService } from '@/services/eventService';

// Initialize and authenticate
await outlookCalendarService.initialize(clientId);
await outlookCalendarService.authenticate();

// Fetch events
const events = await outlookCalendarService.syncFromOutlook(
  calendarId,
  memberId,
  timeMin,
  timeMax
);

// Save to Firestore
const eventService = createEventService(familyId, userId, 'outlook');
for (const event of events) {
  await eventService.createEvent(event);
}
```

#### Export Events to Outlook

```typescript
// Load local events
const localEventService = createEventService(familyId, userId, 'cal_ai');
const localEvents = await localEventService.loadAllEvents();

// Sync to Outlook
const results = await outlookCalendarService.syncToOutlook(
  localEvents,
  familyMembers,
  calendarId
);

console.log(`Synced ${results.success} events, ${results.failed} failed`);
```

## Data Flow

### Import Flow
```
Outlook Calendar
    ↓ (Microsoft Graph API)
outlookCalendarService.fetchEvents()
    ↓
outlookCalendarService.convertFromOutlookEvent()
    ↓
Firestore (outlook collection)
    ↓
Calendar AI UI
```

### Export Flow
```
Calendar AI (Firestore)
    ↓
outlookCalendarService.convertToOutlookEvent()
    ↓
outlookCalendarService.createEvent()
    ↓ (Microsoft Graph API)
Outlook Calendar
```

## Event Mapping

### Outlook → Calendar AI

| Outlook Field | Calendar AI Field |
|--------------|-------------------|
| `subject` | `title` |
| `body.content` | `description` |
| `start.dateTime` | `startTime` |
| `end.dateTime` | `endTime` |
| `categories[0]` | `category` (inferred) |
| `attendees` | `memberIds` (mapped) |
| `recurrence` | `recurrence` (converted) |

### Calendar AI → Outlook

| Calendar AI Field | Outlook Field |
|------------------|---------------|
| `title` | `subject` |
| `description` | `body.content` |
| `startTime` | `start.dateTime` |
| `endTime` | `end.dateTime` |
| `category` | `categories` |
| `memberIds` | `attendees` (synthetic emails) |
| `recurrence` | `recurrence` (converted) |

## Recurrence Patterns

The service converts between Calendar AI's simple recurrence format and Outlook's complex pattern:

**Calendar AI format:**
```typescript
{
  frequency: 'weekly',
  interval: 1,
  daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
  endDate: '2024-12-31'
}
```

**Outlook format:**
```typescript
{
  pattern: {
    type: 'weekly',
    interval: 1,
    daysOfWeek: ['monday', 'wednesday', 'friday']
  },
  range: {
    type: 'endDate',
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  }
}
```

## Security Considerations

1. **OAuth Flow**: Uses MSAL.js with popup-based authentication
2. **Token Storage**: Tokens stored securely in browser's session storage by MSAL
3. **Scope Limitation**: Only requests calendar and basic profile permissions
4. **Client-Side Only**: No server-side token storage (pure SPA)

## Troubleshooting

### Common Issues

**"Authentication Failed"**
- Verify Client ID is correct
- Check redirect URI matches Azure app registration
- Ensure API permissions are granted

**"Failed to fetch calendars"**
- Verify user is authenticated
- Check API permissions include `Calendars.Read`
- Check browser console for specific errors

**"Events not syncing"**
- Verify calendar mappings are saved
- Check date range (default: 7 days past to 90 days future)
- Check browser console for sync errors

### Debug Mode

Enable detailed logging in browser console:

```javascript
localStorage.setItem('DEBUG_OUTLOOK', 'true');
```

## API Rate Limits

Microsoft Graph API has rate limits:
- **Per app per user**: 2,000 requests per minute
- **Per app**: 150,000 requests per minute

The integration automatically handles rate limiting through MSAL token refresh.

## Future Enhancements

Potential improvements:
- [ ] Automatic sync on interval
- [ ] Conflict resolution for two-way sync
- [ ] Support for Outlook task lists
- [ ] Real-time sync via Microsoft Graph webhooks
- [ ] Support for shared calendars
- [ ] Attachment support
- [ ] Meeting invitations

## Related Documentation

- [Microsoft Graph Calendar API](https://learn.microsoft.com/en-us/graph/api/resources/calendar)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Azure App Registration Guide](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Google Calendar Integration](./GOOGLE_CALENDAR_INTEGRATION.md) (similar pattern)

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Azure app configuration
3. Review setup instructions above
4. Check Microsoft Graph API documentation
