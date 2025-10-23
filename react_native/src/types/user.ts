export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  familyId?: string;
  createdAt: string;
  lastLoginAt: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'he';
  notifications: boolean;
  defaultView: 'day' | 'week' | 'month';
  startOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  timeFormat: '12h' | '24h';
  dateFormat: string;
}
