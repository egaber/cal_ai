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

// New structured insight format
export interface StructuredInsight {
  summary: string;  // Short natural language sentence
  related_people: string[];  // Family member names involved
  category: string;  // One of the predefined categories
  importance: 'נמוכה' | 'בינונית' | 'גבוהה';
  confidence: number;  // 0-1
  source_events: string[];  // Relevant event titles
}

// Predicted event for future planning
export interface PredictedEvent {
  title: string;
  predicted_date: string;  // ISO date
  predicted_time: string;  // e.g., "08:00"
  duration: number;  // minutes
  category: string;
  responsible_people: string[];  // Who will handle it
  confidence: number;  // 0-1
  reasoning: string;  // Why this prediction was made
  potential_conflicts: string[];  // Possible scheduling conflicts
}

export interface CalendarInsights {
  userId: string;
  analyzedAt: string;  // ISO date
  eventsAnalyzed: number;
  dateRange: {
    from: string;
    to: string;
  };
  
  // New structured insights
  insights?: StructuredInsight[];
  
  // Original format (for backward compatibility)
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

// Predictions response
export interface CalendarPredictions {
  userId: string;
  predictedAt: string;  // ISO date
  predictionPeriod: {
    from: string;
    to: string;
  };
  predictions: PredictedEvent[];
  basedOnInsights: boolean;  // Whether predictions used insights
  confidence: number;  // Overall confidence 0-100
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

export interface PredictEventsResponse {
  success: boolean;
  predictions?: CalendarPredictions;
  error?: string;
}
