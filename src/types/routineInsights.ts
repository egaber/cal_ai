// Deep Routine Insights Types
// Types for understanding daily schedules, frameworks, and family logistics

export interface DailyFramework {
  id: string;
  memberId: string;
  memberName: string;
  type: 'work' | 'kindergarten' | 'school' | 'daycare' | 'university';
  name: string; // e.g., "גן השקמה", "בית ספר רמז"
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  schedule: {
    arrivalTime: string; // "08:00"
    departureTime: string; // "16:00"
    daysOfWeek: number[]; // [0,1,2,3,4] = Sun-Thu
  };
  transportation: {
    method: 'walk' | 'car' | 'public_transport' | 'bicycle';
    travelTimeMinutes?: number;
    distance?: number; // in km
    trafficPatterns?: {
      rush_hour: boolean;
      typical_duration: number;
      worst_case_duration: number;
    };
  };
  requirements?: {
    needsLunch: boolean;
    needsSnack: boolean;
    specialEquipment?: string[]; // e.g., ["כובע", "משקפי שמש"]
  };
  confidence: number; // 0-100
  learnedFrom: string[]; // event IDs that contributed to this insight
}

export interface PreparationRoutine {
  id: string;
  forMemberId: string;
  forMemberName: string;
  type: 'morning' | 'evening';
  tasks: PreparationTask[];
  totalDuration: number; // in minutes
  responsibleMemberId?: string;
  responsibleMemberName?: string;
  confidence: number;
}

export interface PreparationTask {
  name: string; // e.g., "הכנת כריכים", "לבוש", "ארוחת בוקר"
  durationMinutes: number;
  mustBeDoneBefore: string; // time like "07:30"
  canBeDoneInParallel: boolean;
  priority: 'high' | 'medium' | 'low';
  dependencies?: string[]; // other task names that must be done first
}

export interface PickupDropoffSchedule {
  id: string;
  childId: string;
  childName: string;
  frameworkId: string;
  frameworkName: string;
  morning: {
    responsibleMemberId: string;
    responsibleMemberName: string;
    departHomeTime: string;
    arrivalTime: string;
    preparationNeeded: string[]; // e.g., ["ארוחת בוקר", "הכנת תיק"]
  };
  afternoon: {
    responsibleMemberId: string;
    responsibleMemberName: string;
    pickupTime: string;
    arrivalHomeTime: string;
    afterActivity?: {
      type: 'park' | 'class' | 'friends' | 'homework' | 'free_play';
      location?: string;
      duration?: number;
      needsSupervision: boolean;
    };
  };
  flexibility: {
    morningFlexible: boolean;
    afternoonFlexible: boolean;
    alternateResponsible?: string[]; // member IDs who can substitute
  };
  confidence: number;
}

export interface MemberDailySchedule {
  memberId: string;
  memberName: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  dayName: string; // e.g., "יום ראשון"
  date?: string; // optional specific date
  timeline: ScheduleBlock[];
  conflicts: Conflict[];
  suggestions: Suggestion[];
  metrics: {
    totalBusyTime: number; // minutes
    totalFreeTime: number; // minutes
    travelTime: number; // minutes
    stressLevel: 'low' | 'medium' | 'high'; // based on conflicts and density
  };
}

export interface ScheduleBlock {
  id: string;
  startTime: string; // "07:00"
  endTime: string; // "08:00"
  type: 'framework' | 'travel' | 'preparation' | 'pickup' | 'dropoff' | 'activity' | 'meal' | 'free_time' | 'sleep';
  title: string;
  description?: string;
  location?: string;
  responsibleFor?: string[]; // member IDs involved
  flexibility: 'fixed' | 'flexible' | 'preferred';
  canBeMovedBy?: number; // minutes this can shift
  category?: string;
  metadata?: {
    recurring?: boolean;
    source?: 'calendar' | 'inferred' | 'suggested';
    linkedFrameworkId?: string;
  };
}

export interface Conflict {
  id: string;
  type: 'overlap' | 'impossible_timing' | 'missing_transportation' | 'overload' | 'insufficient_gap';
  description: string;
  involvedMembers: string[];
  involvedBlocks: string[]; // schedule block IDs
  severity: 'low' | 'medium' | 'high' | 'critical';
  timeWindow: {
    start: string;
    end: string;
  };
  suggestions: ConflictResolution[];
  impact: string; // human-readable impact explanation
}

export interface ConflictResolution {
  description: string;
  actionType: 'reschedule' | 'delegate' | 'remove' | 'modify_duration' | 'change_transportation';
  confidence: number;
  effort: 'easy' | 'medium' | 'hard'; // how difficult to implement
  proposedChanges: ProposedChange[];
}

export interface ProposedChange {
  blockId: string;
  changeType: 'time' | 'responsible' | 'location' | 'duration';
  from: string;
  to: string;
  reason: string;
}

export interface Suggestion {
  id: string;
  type: 'schedule_activity' | 'optimize_route' | 'share_responsibility' | 'recurring_event' | 'preparation_time' | 'social_opportunity';
  title: string;
  description: string;
  confidence: number; // 0-100
  priority: 'low' | 'medium' | 'high';
  applicableTo: string[]; // member IDs
  timeWindow?: {
    start: string;
    end: string;
    daysOfWeek?: number[];
  };
  proposedAction: ProposedAction;
  benefits: string[]; // list of benefits
  considerations: string[]; // things to consider
}

export interface ProposedAction {
  type: 'create_event' | 'modify_time' | 'add_reminder' | 'split_task' | 'recurring_template';
  details: {
    title?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    participants?: string[];
    recurrence?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      daysOfWeek?: number[];
      endDate?: string; // e.g., end of school year
    };
    notes?: string;
  };
}

export interface RoutineInsights {
  userId: string;
  familyId: string;
  analyzedAt: string;
  
  // Core data
  frameworks: DailyFramework[];
  pickupSchedules: PickupDropoffSchedule[];
  preparations: PreparationRoutine[];
  
  // Schedules for each member for each day
  memberSchedules: MemberDailySchedule[];
  
  // Family-wide patterns
  familyPatterns: {
    busyDays: number[]; // which days of week are busiest
    rushHours: { start: string; end: string }[];
    coordinationPoints: CoordinationPoint[]; // times when multiple members need coordination
  };
  
  // Insights metadata
  confidence: number;
  eventsAnalyzed: number;
  timeRangeDays: number; // how many days were analyzed
  
  // Recommendations
  topSuggestions: Suggestion[];
  criticalConflicts: Conflict[];
}

export interface CoordinationPoint {
  time: string;
  membersInvolved: string[];
  reason: string; // e.g., "כולם צריכים לצאת מהבית באותו זמן"
  potentialConflict: boolean;
  suggestions?: string[];
}

// Helper type for building schedules
export interface TimeSlot {
  start: string;
  end: string;
  duration: number; // minutes
}

// For travel time calculations
export interface TravelTimeRequest {
  from: string;
  to: string;
  departureTime: Date;
  mode: 'driving' | 'walking' | 'transit' | 'bicycling';
}

export interface TravelTimeResponse {
  duration: number; // minutes
  distance: number; // meters
  typical_duration?: number;
  worst_case_duration?: number;
  route?: {
    summary: string;
    warnings?: string[];
  };
}

// For recurring event suggestions
export interface RecurringEventProposal {
  title: string;
  description: string;
  framework?: DailyFramework; // if based on a framework
  schedule: {
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  };
  participants: string[]; // member IDs
  location?: string;
  endDate: string; // when to stop (e.g., end of school year)
  confidence: number;
  reasoning: string; // why this is suggested
  category: string;
}
