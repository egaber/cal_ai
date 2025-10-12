// Google Calendar API Configuration
// Replace these with your actual Google Cloud Console credentials

export const GOOGLE_CALENDAR_CONFIG = {
  // OAuth 2.0 Client ID from Google Cloud Console
  // Get this from: https://console.cloud.google.com/apis/credentials
  CLIENT_ID: '621949292585-724rru6novnr424m5vcpp0voac6fil8v.apps.googleusercontent.com',
  
  // API Key from Google Cloud Console
  // Get this from: https://console.cloud.google.com/apis/credentials
  API_KEY: 'AIzaSyDvJeFruYBpCbPwKG5VqsqIVZE5X6HHLEc',
  
  // Calendar API configuration
  DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
  SCOPES: 'https://www.googleapis.com/auth/calendar',
};

// Validation helper
export function validateGoogleCalendarConfig(): boolean {
  const isValid = 
    GOOGLE_CALENDAR_CONFIG.CLIENT_ID !== 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com' &&
    GOOGLE_CALENDAR_CONFIG.API_KEY !== 'YOUR_API_KEY_HERE';
  
  if (!isValid) {
    console.warn(
      'Google Calendar configuration not set. Please update src/config/googleCalendar.ts with your credentials.'
    );
  }
  
  return isValid;
}
