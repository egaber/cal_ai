// Hybrid Memory Schema - Unified memory layer for family AI calendar

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// CORE TYPES
// ============================================================================

export type MemoryType = 
  | 'fact' 
  | 'preference' 
  | 'restriction' 
  | 'place' 
  | 'habit' 
  | 'event_pattern' 
  | 'note';

export type MemorySource = 'user' | 'system' | 'ai_inferred';

export type TransportMethod = 'car' | 'walk' | 'bus' | 'bike' | 'public_transport';

export type PlaceCategory = 
  | 'home' 
  | 'work' 
  | 'school' 
  | 'hobby' 
  | 'relative' 
  | 'kindergarten'
  | 'other';

export type DayOfWeek = 
  | 'Sunday' 
  | 'Monday' 
  | 'Tuesday' 
  | 'Wednesday' 
  | 'Thursday' 
  | 'Friday' 
  | 'Saturday';

// ============================================================================
// STRUCTURED TYPE DEFINITIONS
// ============================================================================

/**
 * Fact: General information about family or members
 * Example: "Alon's kindergarten ends at 16:30"
 */
export interface FactStructure {
  subject: string;        // e.g. "Alon"
  predicate: string;      // e.g. "ends_kindergarten_at"
  object: string;         // e.g. "16:30"
  category?: string;      // e.g. "schedule"
}

/**
 * Preference: User or family-level choices
 * Example: "Dad prefers WhatsApp reminders"
 */
export interface PreferenceStructure {
  owner: string;          // e.g. "Dad", "Family"
  category: string;       // e.g. "reminder_channel", "meeting_time"
  value: string;          // e.g. "WhatsApp", "morning"
}

/**
 * Place: Common locations
 * Example: "Home at 12 Ben Gurion St"
 */
export interface PlaceStructure {
  name: string;           // e.g. "Home"
  address: string;        // Full address
  geo?: {
    lat: number;
    lng: number;
  };
  relatedUsers?: string[];     // User IDs
  category?: PlaceCategory;
  scheduleHints?: {
    days?: DayOfWeek[];
    startTime?: string;   // e.g. "08:00"
    endTime?: string;     // e.g. "16:30"
  };
}

/**
 * Restriction: Rules or limits applying to users or the whole family
 * Example: "No events after 21:00 for kids"
 */
export interface RestrictionStructure {
  appliesTo: string[];    // User IDs or ["all"]
  rule: string;           // e.g. "no_events_after", "required_rest_time"
  value: string;          // e.g. "21:00", "2 hours"
  days?: DayOfWeek[];     // Optional: specific days
}

/**
 * Habit: Repeated or routine behaviors
 * Example: "Family dinner at 19:00"
 */
export interface HabitStructure {
  activity: string;       // e.g. "Family dinner"
  time: string;           // e.g. "19:00"
  days?: DayOfWeek[];     // Optional: specific days
  location?: string;      // Optional: place name
}

/**
 * Event Pattern: For predictive scheduling - recurring but not fixed behaviors
 * Example: "Fridays, go to grandparents' house"
 */
export interface EventPatternStructure {
  trigger: string;        // e.g. "Friday", "Weekend", "After work"
  action: string;         // e.g. "Go to grandparents' house"
  time?: string;          // Optional default time
  location?: string;      // Optional place name
  relatedUsers?: string[]; // User IDs involved
  confidence?: number;    // 0-1, e.g. 0.85 if learned
}

/**
 * Note: Free-form memory or informational note
 */
export interface NoteStructure {
  category?: string;      // e.g. "general", "important"
  attachments?: string[]; // File URLs or references
  mood?: 'neutral' | 'urgent' | 'positive';
}

// Union type for all structured data
export type MemoryStructured = 
  | FactStructure 
  | PreferenceStructure 
  | PlaceStructure 
  | RestrictionStructure 
  | HabitStructure 
  | EventPatternStructure 
  | NoteStructure;

// ============================================================================
// MAIN MEMORY TYPE
// ============================================================================

/**
 * FamilyMemory: Unified memory record
 * Each record represents a remembered fact, preference, rule, place, habit, event pattern, or note
 */
export interface FamilyMemory {
  id: string;
  familyId: string;
  
  memoryType: MemoryType;
  
  title?: string;                    // Optional short title
  text: string;                      // Human-readable form, always required
  structured?: MemoryStructured;     // Structured data based on memoryType
  
  relatedUserIds?: string[];         // Associated family member IDs
  tags?: string[];                   // For filtering and categorization
  source: MemorySource;              // Who/what created this memory
  confidence?: number;               // 0-1, for AI-inferred knowledge
  
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  
  embedding?: number[];              // Optional: for semantic search
  expiresAt?: Date | Timestamp;      // Optional: for temporary facts
}

// ============================================================================
// FIRESTORE DOCUMENT TYPE (for serialization)
// ============================================================================

/**
 * FamilyMemoryDoc: Firestore document format
 * Uses Firestore Timestamps instead of Date objects
 */
export interface FamilyMemoryDoc {
  id: string;
  familyId: string;
  
  memoryType: MemoryType;
  
  title?: string;
  text: string;
  structured?: Record<string, any>;  // JSON serializable
  
  relatedUserIds?: string[];
  tags?: string[];
  source: MemorySource;
  confidence?: number;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  embedding?: number[];
  expiresAt?: Timestamp;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Memory creation input (without auto-generated fields)
 */
export interface CreateMemoryInput {
  familyId: string;
  memoryType: MemoryType;
  title?: string;
  text: string;
  structured?: MemoryStructured;
  relatedUserIds?: string[];
  tags?: string[];
  source: MemorySource;
  confidence?: number;
  expiresAt?: Date;
}

/**
 * Memory update input (partial)
 */
export interface UpdateMemoryInput {
  title?: string;
  text?: string;
  structured?: MemoryStructured;
  relatedUserIds?: string[];
  tags?: string[];
  confidence?: number;
  expiresAt?: Date;
}

/**
 * Memory query filters
 */
export interface MemoryQueryFilters {
  memoryType?: MemoryType | MemoryType[];
  relatedUserId?: string;
  tags?: string[];
  source?: MemorySource;
  minConfidence?: number;
  includeExpired?: boolean;
}

/**
 * Compact memory for LLM context
 * Only essential information to minimize token usage
 */
export interface CompactMemory {
  type: MemoryType;
  text: string;
  users?: string[];   // Just names, not IDs
  tags?: string[];
}

// ============================================================================
// LEGACY TYPES (for backward compatibility - can be deprecated later)
// ============================================================================

export interface UserMemory {
  id: string;
  userId: string;
  fact: string;
  category: 'preference' | 'habit' | 'constraint' | 'goal' | 'other';
  importance: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  type: 'home' | 'work' | 'school' | 'kindergarten' | 'other';
  coordinates?: {
    lat: number;
    lng: number;
  };
  associatedMemberId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TravelInfo {
  id: string;
  fromPlaceId: string;
  toPlaceId: string;
  method: 'drive' | 'walk' | 'public_transport' | 'bike';
  durationMinutes: number;
  requiresAdult: boolean;
  accompaniedByMemberId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryData {
  userMemories: UserMemory[];
  familyMemories: FamilyMemory[];
  places: Place[];
  travelInfo: TravelInfo[];
}
