/**
 * Mobile Task Type Definitions
 * 
 * Core types for the mobile task management app with real-time parsing,
 * tag extraction, and smart inference capabilities.
 */

// ============================================================================
// FAMILY MEMBERS
// ============================================================================

export type FamilyMemberName = 'Eyal' | 'Ella' | 'Hilly' | 'Yael' | 'Alon';

export interface FamilyMember {
  name: FamilyMemberName;
  displayName: string;
  displayNameHebrew: string;
  age?: number;
  isChild: boolean;
  needsSupervision: boolean;
}

// ============================================================================
// TIME & DATES
// ============================================================================

export type TimeBucket = 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek' | 'unlabeled';

export interface TimeValue {
  hours: number;
  minutes: number;
  displayText: string; // e.g., "8:00", "14:30"
}

// ============================================================================
// LOCATIONS
// ============================================================================

export type KnownLocation = 'home' | 'kindergarten' | 'school' | 'work';

export interface LocationInfo {
  name: KnownLocation;
  displayName: string;
  displayNameHebrew: string;
  drivingTimeFromHome?: number; // in minutes
}

// ============================================================================
// RECURRING PATTERNS
// ============================================================================

export type RecurringPattern = 
  | 'daily' 
  | 'weekly' 
  | 'monthly' 
  | 'weekday-0' // Sunday
  | 'weekday-1' // Monday
  | 'weekday-2' // Tuesday
  | 'weekday-3' // Wednesday
  | 'weekday-4' // Thursday
  | 'weekday-5' // Friday
  | 'weekday-6' // Saturday
  | 'morning'
  | 'evening'
  | 'afternoon'
  | 'night'
  | 'weekdays' // Multiple specific days
  | 'none';

export type RecurringValue = RecurringPattern | number[]; // Array of day numbers for multiple days

// ============================================================================
// PRIORITY
// ============================================================================

export type PriorityLevel = 'P1' | 'P2' | 'P3';

// ============================================================================
// TAGS
// ============================================================================

export type TagType = 
  | 'timeBucket'
  | 'time'
  | 'date'
  | 'owner'
  | 'involved'
  | 'location'
  | 'priority'
  | 'recurring'
  | 'needsDriving';

export interface ExtractedTag {
  id: string;
  type: TagType;
  displayText: string;
  value: Date | TimeValue | FamilyMemberName | PriorityLevel | RecurringPattern | string | boolean | number | number[];
  emoji: string;
  editable: boolean;
  inferred?: boolean; // Was this tag auto-inferred by the system?
}

// ============================================================================
// PARSED TASK
// ============================================================================

export interface TextSegment {
  text: string;
  highlighted: boolean;
  type?: 'priority' | 'timeBucket' | 'time' | 'owner' | 'involved' | 'location' | 'recurring';
}

export interface ParsedTask {
  rawText: string;
  segments: TextSegment[];
  tags: ExtractedTag[];
  language: 'hebrew' | 'english' | 'mixed';
}

// ============================================================================
// TASK CATEGORIES (for AI enhancement)
// ============================================================================

export type TaskCategory = 
  | 'work'
  | 'family'
  | 'health'
  | 'shopping'
  | 'education'
  | 'home'
  | 'transport'
  | 'personal'
  | 'other';

// ============================================================================
// STORED TASK
// ============================================================================

export interface MobileTask {
  id: string;
  text: string; // Original text
  cleanText?: string; // AI-improved text
  parsedData: ParsedTask;
  
  // Extracted values
  timeBucket: TimeBucket;
  specificDate?: Date;
  specificTime?: TimeValue;
  owner?: FamilyMemberName;
  involvedPeople: FamilyMemberName[];
  location?: KnownLocation;
  priority?: PriorityLevel;
  recurring?: RecurringValue;
  needsDriving: boolean;
  
  // AI enhancement
  category?: TaskCategory;
  aiSuggestions?: {
    improvedText?: string;
    suggestedTags?: ExtractedTag[];
    confidence?: number;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completed: boolean;
  completedAt?: Date;
}

// ============================================================================
// FILTER OPTIONS
// ============================================================================

export type FilterType = 
  | 'all'
  | 'my-tasks'
  | 'by-family'
  | 'today'
  | 'this-week'
  | 'by-priority';

export interface TaskFilter {
  type: FilterType;
  familyMember?: FamilyMemberName;
  priority?: PriorityLevel;
}
