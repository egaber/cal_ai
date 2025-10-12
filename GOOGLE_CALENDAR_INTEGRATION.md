# Google Calendar Integration

This document explains how to set up and use the Google Calendar integration in Calendar AI.

## Overview

The Google Calendar integration allows you to:
- **Import events** from your Google Calendar into Calendar AI
- **Export events** from Calendar AI to your Google Calendar
- **Two-way synchronization** between both calendars
- **Multiple calendar support** - sync with any of your Google calendars

## Features

- ✅ OAuth 2.0 authentication for secure access
- ✅ Import events from Google Calendar (with date range filtering)
- ✅ Export local events to Google Calendar
- ✅ Support for recurring events
- ✅ Multiple calendar selection
- ✅ Manual sync on-demand
- ✅ Sync status indicators
- ✅ Automatic event categorization and emoji assignment

## Setup Instructions

### Step 1: Create NEW Google Cloud Project

**IMPORTANT**: You must create a BRAND NEW project specifically for Calendar AI. Do NOT reuse credentials from other projects.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name: **"Calendar AI"** (or similar)
4. Click "Create"
5. **Wait for the project to be created** (you'll see a notification)
6. **Make sure the new project is selected** (check the project name at the top of the page)

### Step 2: Enable Google Calendar API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. **Configure the OAuth consent screen** (CRITICAL STEP):
   - Choose "External" user type
   - **App name**: "Calendar AI" (NOT "Shoply Mobile" or any other name)
   - **User support email**: Your email address
   - **Developer contact**: Your email address
   - Click "Save and Continue"
   
   - **Scopes page**: Click "Add or Remove Scopes"
     - Search for "Calendar API"
     - Select: `.../auth/calendar` (full access to Google Calendar)
     - Click "Update" then "Save and Continue"
   
   - **Test users page**: **THIS IS CRITICAL**
     - Click "Add Users"
     - Enter YOUR Google account email (the one you'll use to sign in)
     - Click "Add"
     - Click "Save and Continue"
   
   - **Summary page**: Click "Back to Dashboard"

4. Back to "Create OAuth client ID":
   - Application type: "Web application"
   - Name: "Calendar AI Web Client"
   - Authorized JavaScript origins - Add ALL of these:
     - `http://localhost:5173` (Vite default port)
     - `http://localhost:8081` (alternative port)
     - `http://localhost:3000` (common React port)
     - Add your production URL if deploying
   - Authorized redirect URIs - Add ALL of these:
     - `http://localhost:5173`
     - `http://localhost:8081`
     - `http://localhost:3000`
   - Click "Create"
   
   **Important**: Make sure to add the EXACT URL where your app is running. Check your browser's address bar for the correct port number!

5. **Save your Client ID** - you'll need this later

### Step 4: Create API Key

1. Still in "Credentials", click "Create Credentials" → "API key"
2. **Save your API Key** - you'll need this later
3. (Optional) Click "Restrict Key" to limit it to Google Calendar API only

### Step 5: Configure Calendar AI

1. Open the file `src/config/googleCalendar.ts` in your code editor
2. Replace the placeholder values with your actual credentials:
   ```typescript
   export const GOOGLE_CALENDAR_CONFIG = {
     CLIENT_ID: 'your-actual-client-id.apps.googleusercontent.com',
     API_KEY: 'your-actual-api-key',
     // ... rest of config
   };
   ```
3. Save the file
4. Restart your development server if it's running

### Step 6: Connect to Google Calendar

1. Open Calendar AI application
2. Click the "Google Calendar" button in the top bar
3. Toggle "Enable Google Calendar Sync" to ON
4. The UI will show if credentials are configured correctly
5. Click "Connect" to authenticate
6. Allow Calendar AI to access your Google Calendar when prompted
7. Select which calendar you want to sync with
8. Click "Save Settings"

## Usage

### Importing Events from Google Calendar

1. Click the "Google Calendar" button
2. Make sure you're connected (green cloud icon)
3. Click "Import from Google" button
4. Events from the last 7 days to 90 days in the future will be imported
5. Imported events will be merged with your existing events (no duplicates)

### Exporting Events to Google Calendar

1. Click the "Google Calendar" button
2. Make sure you're connected (green cloud icon)
3. Click "Export to Google" button
4. All local events (that aren't already synced) will be exported to your selected Google Calendar

### Quick Sync

If sync is enabled and you're connected:
- A "Sync" button will appear in the top bar
- Click it to quickly import new events from Google Calendar
- The cloud icon shows your connection status (green = connected, gray = disconnected)

## Event Mapping

### Calendar AI → Google Calendar

| Calendar AI Field | Google Calendar Field |
|-------------------|----------------------|
| Title | Summary |
| Description | Description |
| Start Time | Start DateTime |
| End Time | End DateTime |
| Family Members | Attendees (as pseudo-emails) |
| Recurrence Rule | Recurrence (RRULE format) |

### Google Calendar → Calendar AI

| Google Calendar Field | Calendar AI Field |
|----------------------|-------------------|
| Summary | Title |
| Description | Description |
| Start DateTime | Start Time |
| End DateTime | End Time |
| Color | Category (inferred) |
| N/A | Assigned to primary user |

## Automatic Categorization

When importing from Google Calendar, events are automatically categorized based on keywords:

- **Health**: doctor, dentist, hospital, medical
- **Work**: meeting, work, office, project
- **Family**: family, kids, children, school
- **Personal**: (default for everything else)

Emojis are also automatically assigned based on event titles.

## Troubleshooting

### "Error 403: access_denied" or "has not completed the Google verification process"

- **Problem**: You see "Error 403: access_denied" or a message about an app not completing verification (like "Shoply Mobile" or other app name)
- **Root Cause**: You're using OAuth credentials from a different/wrong project
- **Solution**:
  - **START FRESH**: You MUST create a BRAND NEW Google Cloud project for Calendar AI
  - Do NOT reuse credentials from other projects (like "Shoply Mobile")
  - Follow Step 1 carefully to create a new project
  - Make sure the project is selected (check top bar of Google Cloud Console)
  - Configure the OAuth consent screen with:
    - App name: "Calendar AI" (or your chosen name)
    - Your email as a test user
    - Calendar API scope selected
  - Create NEW OAuth credentials in this new project
  - Copy the NEW Client ID and API Key to `src/config/googleCalendar.ts`
  - The error message showing a different app name means you're using wrong credentials

### "Authentication Failed" / "Error 400: redirect_uri_mismatch"

- **Problem**: OAuth authentication is not working, or you see "redirect_uri_mismatch" error
- **Solution**: 
  - **This is the most common error!** It means the URL in your browser doesn't match what's registered in Google Cloud Console
  - Check your browser's address bar - what port number do you see? (e.g., `http://localhost:8081`)
  - Go back to Google Cloud Console → APIs & Services → Credentials
  - Click on your OAuth 2.0 Client ID
  - Under "Authorized JavaScript origins", add the EXACT URL from your browser (including the port)
  - Under "Authorized redirect URIs", add the same URL
  - Click "Save"
  - Wait 5 minutes for changes to propagate
  - Try authenticating again
  - Common ports to add:
    - `http://localhost:5173` (Vite default)
    - `http://localhost:8081` (alternative)
    - `http://localhost:3000` (React default)

### "Failed to initialize Google Calendar API"

- **Problem**: Google API libraries not loading
- **Solution**:
  - Check your internet connection
  - Make sure the Google API scripts are loaded in index.html
  - Try refreshing the page
  - Check browser console for specific errors

### "Sync Failed" / "Failed to fetch events"

- **Problem**: API request failed
- **Solution**:
  - Make sure you're connected (click "Connect" button)
  - Check that your API key hasn't been restricted too much
  - Verify the selected calendar still exists
  - Try signing out and signing back in

### Events Not Appearing After Import

- **Problem**: Events were imported but not showing
- **Solution**:
  - Check that the event dates are within your current view
  - Verify the events were assigned to a family member you have selected
  - Check the date range - only events from 7 days ago to 90 days in the future are imported

### Duplicate Events After Multiple Syncs

- **Problem**: Same events appearing multiple times
- **Solution**:
  - The system should prevent duplicates automatically
  - If duplicates persist, try clearing your calendar and doing a fresh import
  - Events are identified by their ID, so exact duplicates shouldn't occur

## Security & Privacy

- **OAuth 2.0**: Uses industry-standard OAuth 2.0 for secure authentication
- **Local Storage**: API credentials are stored locally in your browser
- **No Server**: Authentication happens directly between your browser and Google
- **Minimal Scope**: Only requests access to your calendar data, nothing else
- **Revocable**: You can revoke access anytime from your [Google Account Settings](https://myaccount.google.com/permissions)

## Limitations

- Manual sync only (no automatic background sync)
- Imports events from last 7 days to next 90 days
- Event modifications in Google Calendar won't auto-update in Calendar AI (requires manual re-import)
- Family member assignments use pseudo-emails (not real email addresses)
- Recurring event exceptions not fully supported yet

## API Rate Limits

Google Calendar API has the following limits:
- **Queries per day**: 1,000,000
- **Queries per 100 seconds per user**: 250
- **Queries per 100 seconds**: 500

For typical personal use, you should never hit these limits. The app doesn't make continuous background requests.

## Future Enhancements

Planned improvements:
- [ ] Automatic periodic sync
- [ ] Real-time sync with webhooks
- [ ] Conflict resolution for modified events
- [ ] Sync preferences (which categories to sync)
- [ ] Multiple calendar sync simultaneously
- [ ] Sync history and logs

## Support

If you encounter issues:
1. Check this documentation first
2. Verify your Google Cloud Console settings
3. Check the browser console for error messages
4. Try the troubleshooting steps above

## Configuration File

The Google Calendar credentials are stored in `src/config/googleCalendar.ts`:

```typescript
export const GOOGLE_CALENDAR_CONFIG = {
  CLIENT_ID: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com',
  API_KEY: 'YOUR_API_KEY_HERE',
  DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
  SCOPES: 'https://www.googleapis.com/auth/calendar',
};
```

**Important Security Notes:**
- ⚠️ **Never commit real credentials to version control**
- Add `src/config/googleCalendar.ts` to `.gitignore` if using real credentials
- For production, consider using environment variables instead
- The config file includes a validation helper that warns if credentials aren't set

## Technical Details

### Architecture

```
┌─────────────────┐
│   Calendar AI   │
│   (React App)   │
└────────┬────────┘
         │
         ├─ googleCalendarService.ts
         │  ├─ Initialize GAPI
         │  ├─ OAuth Authentication
         │  ├─ Event CRUD operations
         │  └─ Event format conversion
         │
         ├─ GoogleCalendarSync.tsx
         │  ├─ Settings UI
         │  ├─ Sync controls
         │  └─ Status indicators
         │
         └─ StorageService
            └─ Persist settings locally
                 │
                 ├─ Client ID
                 ├─ API Key
                 ├─ Calendar selection
                 └─ Last sync time
```

### Dependencies

- `gapi-script`: Google API client library
- `@react-oauth/google`: React OAuth components
- Google Calendar API v3

### API Endpoints Used

- `calendar.calendarList.list`: List user's calendars
- `calendar.events.list`: Fetch events
- `calendar.events.insert`: Create new event
- `calendar.events.update`: Update existing event
- `calendar.events.delete`: Delete event

## Code Examples

### Initialize the Service

```typescript
import { googleCalendarService } from '@/services/googleCalendarService';

// Initialize with credentials
await googleCalendarService.initialize(clientId, apiKey);

// Authenticate user
const authenticated = await googleCalendarService.authenticate();
```

### Import Events

```typescript
// Fetch events from Google Calendar
const events = await googleCalendarService.syncFromGoogle(
  'primary', // calendar ID
  'user-id', // default family member ID
  new Date().toISOString(), // start date
  futureDate.toISOString() // end date
);

// Update local state
setEvents(prev => [...prev, ...events]);
```

### Export Events

```typescript
// Sync local events to Google
const results = await googleCalendarService.syncToGoogle(
  localEvents,
  familyMembers,
  'primary' // calendar ID
);

console.log(`Synced ${results.success} events`);
if (results.failed > 0) {
  console.error('Errors:', results.errors);
}
```

## License

This integration is part of Calendar AI and follows the same license as the main application.
