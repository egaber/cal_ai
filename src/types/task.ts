// Task Management Types

export interface SubTask {
  id: string;
  title: string;
  description?: string;
  estimatedDuration: number; // in minutes
  completed: boolean;
  order: number; // for hierarchical ordering
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  emoji?: string; // AI-generated emoji for the task
  category: 'health' | 'work' | 'personal' | 'family' | 'education' | 'social' | 'finance' | 'home' | 'travel' | 'fitness' | 'food' | 'shopping' | 'entertainment' | 'sports' | 'hobby' | 'volunteer' | 'appointment' | 'maintenance' | 'celebration' | 'meeting' | 'childcare' | 'pet' | 'errand' | 'transport' | 'project' | 'deadline' | 'other';
  
  // Priority determination
  urgency: 'low' | 'medium' | 'high' | 'critical'; // Based on deadline
  importance: 'low' | 'medium' | 'high' | 'critical'; // Based on impact/value
  priority: number; // Calculated: 0-100 (higher = more important)
  
  // Time management
  estimatedDuration: number; // in minutes (accumulated from subtasks)
  deadline?: string; // ISO date string
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'flexible';
  
  // Assignment
  assignedToMemberIds: string[]; // Family members responsible
  requiresMultipleMembers: boolean; // If coordination needed
  
  // Location & logistics
  location?: string;
  requiresDriving: boolean;
  drivingDuration?: number; // in minutes
  
  // Breakdown & analysis
  subtasks: SubTask[];
  aiAnalysis?: {
    suggestedCategory: string;
    suggestedPriority: number;
    suggestedDuration: number;
    suggestedMembers: string[];
    reasoning: string;
    breakdownSuggestions?: string[];
    schedulingTips?: string[];
  };
  
  // Status
  status: 'pending' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  scheduledEventId?: string; // Link to calendar event when scheduled
  createdAt: string;
  updatedAt: string;
  
  // User responses to AI questions
  userContext?: Record<string, string>; // Store Q&A for better future suggestions
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
  drivingFrom?: string; // Origin location
  drivingTo?: string; // Destination location
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'flexible';
  reasoning: string;
  schedulingTips: string[];
  followUpQuestions?: string[]; // Questions AI wants to ask for better analysis
}

export interface WeeklyScheduleSuggestion {
  tasksToSchedule: Array<{
    taskId: string;
    suggestedSlots: Array<{
      date: string;
      startTime: string;
      endTime: string;
      confidence: number; // 0-1
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
    bufferTimeRecommendation: number; // minutes to keep free
    warnings: string[];
  };
}
