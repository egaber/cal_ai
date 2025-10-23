// Mobile Task App - Type Definitions

export type TimeBucket = 'today' | 'tomorrow' | 'this-week' | 'next-week' | 'unlabeled';

export type TagType = 
  | 'timeBucket'
  | 'time'
  | 'date'
  | 'owner'
  | 'involved'
  | 'location'
  | 'transport'
  | 'priority'
  | 'recurring'
  | 'reminder';

export type FamilyMemberName = 'Eyal' | 'Ella' | 'Hilly' | 'Yael' | 'Alon';

export type PriorityLevel = 'P1' | 'P2' | 'P3';

export type RecurringPattern = 'daily' | 'weekly' | 'monthly' | 'none';

export interface FamilyMember {
  name: FamilyMemberName;
  nameHe?: string; // Hebrew name
  age?: number;
  isChild: boolean;
  needsSupervision: boolean;
}

export interface KnownPlace {
  name: string;
  nameHe: string;
  drivingTimeFromHome: number; // minutes
  requiresDriving: boolean;
}

export interface TimeValue {
  hour: number; // 0-23
  minute: number; // 0-59
}

export interface ParsedSegment {
  text: string;
  type: 'text' | TagType;
  value?: Date | TimeValue | FamilyMemberName | PriorityLevel | RecurringPattern | string;
  start: number;
  end: number;
}

export interface ExtractedTag {
  id: string;
  type: TagType;
  displayText: string;
  value: Date | TimeValue | FamilyMemberName | PriorityLevel | RecurringPattern | string | boolean | number;
  emoji: string;
  editable: boolean;
}

export interface ParsedTask {
  // Raw text
  rawText: string;
  
  // Parsed segments for visual display
  segments: ParsedSegment[];
  
  // Extracted tags
  tags: ExtractedTag[];
  
  // Structured data
  timeBucket: TimeBucket;
  specificTime?: TimeValue;
  specificDate?: Date;
  owner?: FamilyMemberName;
  involvedMembers: FamilyMemberName[];
  location?: string;
  priority?: PriorityLevel;
  recurring?: RecurringPattern;
  isReminder: boolean;
  
  // Inferred data
  requiresDriving: boolean;
  drivingDuration?: number;
  drivingFrom?: string;
  drivingTo?: string;
}

export interface MobileTask {
  id: string;
  title: string;
  
  // Time organization
  timeBucket: TimeBucket;
  specificTime?: TimeValue;
  specificDate?: Date;
  
  // People
  owner?: FamilyMemberName;
  involvedMembers: FamilyMemberName[];
  
  // Location & transportation
  location?: string;
  requiresDriving: boolean;
  drivingDuration?: number;
  drivingFrom?: string;
  drivingTo?: string;
  
  // Properties
  priority?: PriorityLevel;
  recurring?: RecurringPattern;
  isReminder: boolean;
  
  // Tags for display
  tags: ExtractedTag[];
  
  // Metadata
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Raw parsed data for re-editing
  parsedData?: ParsedTask;
}

export interface ParserConfig {
  language: 'he' | 'en' | 'auto';
  enableInference: boolean;
  familyMembers: FamilyMember[];
  knownPlaces: KnownPlace[];
}

export interface ParsingResult {
  success: boolean;
  parsedTask: ParsedTask;
  confidence: number; // 0-1
  warnings: string[];
}

// Voice recognition types
export interface VoiceRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export interface VoiceRecognitionConfig {
  language: 'he-IL' | 'en-US';
  continuous: boolean;
  interimResults: boolean;
}

// UI State types
export interface TaskInputState {
  text: string;
  isRecording: boolean;
  parsedTask?: ParsedTask;
  cursorPosition: number;
}

export interface TaskListState {
  tasks: MobileTask[];
  selectedBucket?: TimeBucket;
  expandedBuckets: TimeBucket[];
  isLoading: boolean;
  error?: string;
}
