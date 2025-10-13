import { FamilyMember } from './calendar';
import { MemoryData } from './memory';
import { CalendarEvent } from './calendar';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: Date;
  lastLoginAt: Date;
  
  // Face recognition data
  faceDescriptor?: number[];
  faceDescriptorUpdatedAt?: Date;
  
  // Family members
  familyMembers: FamilyMember[];
  
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
