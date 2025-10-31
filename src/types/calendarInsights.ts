// Calendar Analysis & Insights Types

export interface FamilyMemberRole {
  name: string;
  role: string;  // e.g., "הורה עובד", "ילד בגן", "תלמיד תיכון"
  responsibilities: string[];  // e.g., ["הסעות לגן", "פגישות עבודה"]
  confidence: number;  // 0-100
}

export interface RecurringAnchor {
  activity: string;  // e.g., "הסעה לגן"
  dayOfWeek: string;  // e.g., "ראשון", "שני"
  time: string;  // e.g., "08:00"
  duration: number;  // minutes
  participants: string[];  // who is involved
  location?: string;
  confidence: number;  // 0-100
  frequency: string;  // e.g., "כל יום", "פעם בשבוע"
}

export interface Habit {
  description: string;  // e.g., "פגישות צוות בימי שני בבוקר"
  pattern: string;  // e.g., "weekly", "daily", "monthly"
  timePreference: string;  // e.g., "בוקר", "אחר צהריים", "ערב"
  confidence: number;  // 0-100
  examples: string[];  // actual event titles that show this habit
}

export interface TimePreferences {
  workingHours: {
    start: string;  // e.g., "09:00"
    end: string;  // e.g., "17:00"
    confidence: number;
  };
  
  meetingPreferences: {
    preferredTimes: string[];  // e.g., ["10:00-12:00", "14:00-16:00"]
    avoidedTimes: string[];  // e.g., ["08:00-09:00", "17:00-18:00"]
    averageDuration: number;  // minutes
    confidence: number;
  };
  
  personalTime: {
    breakTimes: string[];  // e.g., ["12:00-13:00"]
    familyTime: string[];  // e.g., ["17:00-19:00"]
    confidence: number;
  };
}

export interface GeneralInsight {
  type: 'pattern' | 'conflict' | 'opportunity' | 'recommendation';
  title: string;  // e.g., "עומס פגישות בימי רביעי"
  description: string;
  impact: 'positive' | 'neutral' | 'negative';
  confidence: number;  // 0-100
  suggestedAction?: string;  // e.g., "לשקול להעביר חלק לימי שישי"
}

export interface CalendarInsights {
  userId: string;
  analyzedAt: string;  // ISO date
  eventsAnalyzed: number;
  dateRange: {
    from: string;
    to: string;
  };
  
  familyMembers: FamilyMemberRole[];
  recurringAnchors: RecurringAnchor[];
  habits: Habit[];
  timePreferences: TimePreferences;
  generalInsights: GeneralInsight[];
  
  // Metadata
  confidence: number;  // Overall confidence 0-100
  needsMoreData: boolean;
  suggestedAnalysisFrequency: string;  // e.g., "weekly", "monthly"
}

// Request/Response types for the service
export interface AnalyzeCalendarRequest {
  userId: string;
  familyId: string;
  events: Array<{
    title: string;
    startTime: string;
    endTime: string;
    category: string;
    memberId?: string;
    location?: string;
    description?: string;
    isRecurring?: boolean;
  }>;
}

export interface AnalyzeCalendarResponse {
  success: boolean;
  insights?: CalendarInsights;
  error?: string;
}
