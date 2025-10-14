import { FamilyMember } from './calendar';
import { CalendarEvent } from './calendar';
import { MemoryData } from './memory';

// Re-export MemoryData for convenience
export type { MemoryData };

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: Date;
  lastLoginAt: Date;
  
  // Family reference
  familyId?: string;
  
  // Face recognition data
  faceDescriptor?: number[];
  faceDescriptorUpdatedAt?: Date;
  
  // DEPRECATED: Family members (now stored in family document)
  familyMembers?: FamilyMember[];
  
  // User preferences
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'he';
  timezone: string;
  calendarView: 'week' | 'month';
  notifications: boolean;
  
  // AI settings
  geminiApiKey?: string;
  preferredLLMModel?: string;
}

export interface UserData {
  profile: UserProfile;
  memories: MemoryData;
  events: CalendarEvent[]; // Will sync with calendar events
  credentials: UserCredentials;
}

export interface UserCredentials {
  googleCalendarToken?: string;
  googleCalendarRefreshToken?: string;
  // Add other service credentials as needed
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export interface FaceRecognitionResult {
  success: boolean;
  confidence?: number;
  userId?: string;
  error?: string;
}
