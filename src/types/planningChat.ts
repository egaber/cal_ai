import { CalendarEvent } from './calendar';

/**
 * Planning Chat Types
 * Types for the interactive planning chat flow
 */

// Question Categories
export type QuestionCategory = 
  | 'framework'      // שאלות על מסגרות קבועות (גן, עבודה)
  | 'transportation' // שאלות על נסיעות והסעות
  | 'coordination'   // שאלות על תיאום משפחתי
  | 'preference';    // שאלות על העדפות

// Question Priority
export type QuestionPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * OpenQuestion - שאלה פתוחה שה-AI שואל
 */
export interface OpenQuestion {
  id: string;
  category: QuestionCategory;
  question: string;  // השאלה בעברית
  context: {
    memberId?: string;
    relatedEvents?: string[];  // IDs של אירועים רלוונטיים
    frameworkId?: string;
  };
  priority: QuestionPriority;
  suggestedAnswers?: string[];  // תשובות מוצעות לכפתורים
  answered?: boolean;
  answer?: string;
}

// Anchor Types
export type AnchorType = 
  | 'framework'     // מסגרת קבועה (גן, עבודה)
  | 'travel'        // נסיעה/הסעה
  | 'preparation'   // הכנה (ארוז תיק, בישול)
  | 'coordination'; // נקודת תיאום

/**
 * RecurrencePattern - תבנית חזרתיות
 */
export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  daysOfWeek?: number[];  // 0=ראשון, 1=שני, etc.
  interval?: number;      // כל כמה (1=כל שבוע, 2=כל שבועיים)
  endDate?: string;       // תאריך סיום (optional)
}

/**
 * ProposedAnchor - הצעה לעוגן חוזר
 */
export interface ProposedAnchor {
  id: string;
  type: AnchorType;
  title: string;
  description: string;
  event: {
    title: string;
    startTime: string;
    endTime: string;
    recurrence: RecurrencePattern;
    category: string;
    memberId: string;
    location?: string;
    metadata: {
      isAnchor: true;
      confidence: number;      // 0-1, עד כמה ה-AI בטוח
      learnedFrom: string[];   // אילו אירועים תרמו ללמידה
      source: 'ai_analysis';
    };
  };
  reasoning: string;    // למה ה-AI מציע את זה
  benefits: string[];   // היתרונות של העוגן הזה
  alternatives?: ProposedAnchor[];  // אלטרנטיבות
  status?: 'pending' | 'approved' | 'rejected' | 'modified';
}

/**
 * PlanningChatMessage - הודעה בשיחת התכנון
 */
export interface PlanningChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: string;
  metadata?: {
    question?: OpenQuestion;
    proposal?: ProposedAnchor;
    action?: 'approved' | 'rejected' | 'modified';
    relatedEventIds?: string[];
  };
}

/**
 * ChatContext - הקשר השיחה
 */
export interface ChatContext {
  sessionId: string;
  userId: string;
  familyId: string;
  startTime: string;
  
  // שאלות ותשובות
  questions: OpenQuestion[];
  answeredQuestions: Map<string, string>;
  
  // הצעות עוגנים
  proposals: ProposedAnchor[];
  
  // מצב השיחה
  currentGoal: string;  // "identify_frameworks" | "gather_details" | "propose_anchors" | "finalize"
  
  // אירועים שנוצרו
  createdEvents: CalendarEvent[];
}

/**
 * PlanningSession - סשן תכנון מלא
 */
export interface PlanningSession {
  id: string;
  userId: string;
  familyId: string;
  startTime: string;
  endTime?: string;
  
  context: ChatContext;
  messages: PlanningChatMessage[];
  
  // תוצאות
  questionsAnswered: number;
  anchorsCreated: number;
  status: 'active' | 'completed' | 'abandoned';
}

/**
 * AnchorApprovalRequest - בקשה לאישור עוגן
 */
export interface AnchorApprovalRequest {
  anchor: ProposedAnchor;
  modifications?: {
    title?: string;
    startTime?: string;
    endTime?: string;
    daysOfWeek?: number[];
    location?: string;
  };
}
