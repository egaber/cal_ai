// Task Management Types - Extended for new AI processing pipeline & SMART/Kesem evaluation

export interface SubTask {
  id: string;
  title: string;
  description?: string;
  estimatedDuration: number; // minutes
  completed: boolean;
  order: number;
}

export type TaskProcessingPhase =
  | 'idle'
  | 'context_loading'  // load memory, existing week events, current tasks for context
  | 'categorizing'
  | 'prioritizing'
  | 'breaking_down'
  | 'estimating'
  | 'enhancing' // optimize / best approach
  | 'smart_evaluating'
  | 'complete'
  | 'error';

export interface TaskProcessingStep {
  id: string;
  phase: TaskProcessingPhase;
  label: string;
  status: 'pending' | 'in-progress' | 'done' | 'skipped' | 'error';
  startedAt?: string;
  completedAt?: string;
  reasoning?: string;
  outputSummary?: string;
}

export interface SmartEvaluation {
  specific?: string;      // S
  measurable?: string;    // M
  achievable?: string;    // A
  relevant?: string;      // R
  timeBound?: string;     // T
  score?: number;         // 0-100 combined heuristic
  kesemVariant?: {
    concrete?: string;    // "קונקרטי"/"קצר"
    specific?: string;    // "ספציפי"
    measurable?: string;  // "מדיד"
    timeOrAligned?: string; // "מוגבל בזמן / מתואם"
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  emoji?: string;
  category: 'health' | 'work' | 'personal' | 'family' | 'education' | 'social' | 'finance' | 'home' | 'travel' | 'fitness' | 'food' | 'shopping' | 'entertainment' | 'sports' | 'hobby' | 'volunteer' | 'appointment' | 'maintenance' | 'celebration' | 'meeting' | 'childcare' | 'pet' | 'errand' | 'transport' | 'project' | 'deadline' | 'other';

  // Priority
  urgency: 'low' | 'medium' | 'high' | 'critical';
  importance: 'low' | 'medium' | 'high' | 'critical';
  priority: number; // 0-100

  // Time
  estimatedDuration: number; // minutes
  deadline?: string;
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'flexible';

  // Assignment
  assignedToMemberIds: string[];
  requiresMultipleMembers: boolean;

  // Location & logistics
  location?: string;
  requiresDriving: boolean;
  drivingDuration?: number;
  drivingFrom?: string;
  drivingTo?: string;

  // Breakdown
  subtasks: SubTask[];

  // AI Analysis snapshot (initial consolidated output)
  aiAnalysis?: {
    suggestedCategory: string;
    suggestedPriority: number;
    suggestedDuration: number;
    suggestedMembers: string[];
    reasoning: string;
    breakdownSuggestions?: string[];
    schedulingTips?: string[];
  };

  // Processing pipeline
  processingPhase: TaskProcessingPhase;
  processingSteps: TaskProcessingStep[];
  processingVersion?: number;
  lastProcessingError?: string;

  // SMART / Kesem evaluation
  smart?: SmartEvaluation;

  // Status lifecycle
  status: 'pending' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  scheduledEventId?: string;
  createdAt: string;
  updatedAt: string;

  // User context (answers to follow-up questions)
  userContext?: Record<string, string>;
}

export interface TaskAnalysisRequest {
  title: string;
  description?: string;
  deadline?: string;
  userContext?: Record<string, string>;
}

export interface TaskAnalysisResponse {
  emoji: string;
  category: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  importance: 'low' | 'medium' | 'high' | 'critical';
  priority: number;
  estimatedDuration: number;
  suggestedSubtasks: Array<{
    title: string;
    description?: string;
    estimatedDuration: number;
  }>;
  suggestedMembers: string[];
  requiresDriving: boolean;
  drivingDuration?: number;
  drivingFrom?: string;
  drivingTo?: string;
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'flexible';
  reasoning: string;
  schedulingTips: string[];
  followUpQuestions?: string[];
}

export interface WeeklyScheduleSuggestion {
  tasksToSchedule: Array<{
    taskId: string;
    suggestedSlots: Array<{
      date: string;
      startTime: string;
      endTime: string;
      confidence: number;
      reasoning: string;
    }>;
  }>;
  tasksToDefer: Array<{
    taskId: string;
    reason: string;
    suggestedDeferralPeriod: 'next-week' | 'later' | 'delegate' | 'cancel';
  }>;
  overallCapacityAnalysis: {
    totalAvailableHours: number;
    totalRequestedHours: number;
    utilizationPercentage: number;
    bufferTimeRecommendation: number;
    warnings: string[];
  };
}

export interface EventSuggestion {
  id: string;
  taskId: string;
  taskTitle: string;
  taskEmoji?: string;
  suggestedStartTime: string;
  suggestedEndTime: string;
  confidence: number;
  reasoning: string;
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  originalStartTime?: string;
  originalEndTime?: string;
}
