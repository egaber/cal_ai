// Microsoft Outlook Calendar API Configuration
// Using Microsoft Authentication Library (MSAL) for authentication

export const OUTLOOK_CALENDAR_CONFIG = {
  // Client ID from Azure App Registration
  // Get this from: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
  CLIENT_ID: 'df115ca7-e9ad-4f88-a563-6a3485ef0f93',
  
  // Redirect URI - should match what's configured in Azure App Registration
  // For local development: http://localhost:5173
  // For production: your actual domain
  REDIRECT_URI: window.location.origin,
  
  // Microsoft authority endpoint
  AUTHORITY: 'https://login.microsoftonline.com/common',
  
  // Required scopes for calendar access
  SCOPES: [
    'Calendars.Read',
    'Calendars.ReadWrite',
    'User.Read',
  ],
  
  // Microsoft Graph API endpoints
  GRAPH_ENDPOINT: 'https://graph.microsoft.com/v1.0',
  CALENDAR_ENDPOINT: 'https://graph.microsoft.com/v1.0/me/calendars',
  EVENTS_ENDPOINT: 'https://graph.microsoft.com/v1.0/me/events',
};

// Validation helper
export function validateOutlookCalendarConfig(): boolean {
  const isValid = 
    OUTLOOK_CALENDAR_CONFIG.CLIENT_ID !== 'YOUR_CLIENT_ID_HERE' &&
    OUTLOOK_CALENDAR_CONFIG.CLIENT_ID.length > 0;
  
  if (!isValid) {
    console.warn(
      'Outlook Calendar configuration not set. Please update src/config/outlookCalendar.ts with your Azure App Registration credentials.'
    );
  }
  
  return isValid;
}

// Instructions for setting up Azure App Registration
export const SETUP_INSTRUCTIONS = `
To set up Outlook Calendar integration:

1. Go to Azure Portal: https://portal.azure.com
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Enter a name (e.g., "Calendar AI - Outlook Integration")
5. Select "Accounts in any organizational directory and personal Microsoft accounts"
6. Add redirect URI: ${OUTLOOK_CALENDAR_CONFIG.REDIRECT_URI}
7. Click "Register"
8. Copy the "Application (client) ID" and update CLIENT_ID in this file
9. Go to "API permissions" and add:
   - Microsoft Graph > Delegated permissions > Calendars.Read
   - Microsoft Graph > Delegated permissions > Calendars.ReadWrite
   - Microsoft Graph > Delegated permissions > User.Read
10. Click "Grant admin consent" (if available)
11. Go to "Authentication" and enable "Access tokens" and "ID tokens"
`;
