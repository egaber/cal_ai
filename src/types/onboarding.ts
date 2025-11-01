// Onboarding type definitions for family profile and questionnaire

export type OnboardingStep = 
  | 'calendar-sync'
  | 'family-structure'
  | 'parents-work'
  | 'daily-routines'
  | 'activities'
  | 'completion';

export type SchoolType = 'kindergarten' | 'school' | 'daycare';
export type PickupHandler = 'parent1' | 'parent2' | 'grandparents' | 'babysitter' | 'varies';
export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

// Child profile information
export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  birthDate?: Date;
  school: {
    name: string;
    type: SchoolType;
    hours: {
      start: string; // HH:mm format
      end: string;   // HH:mm format
    };
  };
}

// Parent profile information
export interface ParentProfile {
  id: string;
  name: string;
  workplace: string;
  workHours: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  remoteDays: DayOfWeek[]; // Days working from home
  flexibility: 'high' | 'medium' | 'low';
}

// Daily routines (pickup/dropoff patterns)
export interface FamilyRoutines {
  morningDropoff: {
    handler: PickupHandler;
    variations?: {
      day: DayOfWeek;
      handler: PickupHandler;
    }[];
  };
  afternoonPickup: {
    handler: PickupHandler;
    variations?: {
      day: DayOfWeek;
      handler: PickupHandler;
    }[];
  };
  grandparentsHelp: {
    enabled: boolean;
    schedule?: {
      day: DayOfWeek;
      startTime: string;
      endTime: string;
    }[];
  };
  babysitter: {
    enabled: boolean;
    schedule?: {
      day: DayOfWeek;
      startTime: string;
      endTime: string;
    }[];
  };
}

// After-school activity
export interface Activity {
  id: string;
  childId: string;
  name: string;
  type?: string; // e.g., 'sports', 'music', 'art'
  day: DayOfWeek;
  time: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  location?: string;
}

// Parent activity/hobby
export interface ParentActivity {
  id: string;
  parentId: string;
  name: string;
  type?: string;
  day: DayOfWeek;
  time: {
    start: string;
    end: string;
  };
  frequency: 'weekly' | 'biweekly' | 'monthly';
}

// Family recurring events (e.g., Friday dinner at grandparents)
export interface FamilyRecurringEvent {
  id: string;
  name: string;
  description?: string;
  day: DayOfWeek;
  time: {
    start: string;
    end: string;
  };
  frequency: 'weekly' | 'biweekly' | 'monthly';
}

// Family preferences
export interface FamilyPreferences {
  bufferTimeBetweenActivities: number; // minutes
  averageTravelTime: number; // minutes
  priorities: {
    qualityTimeWithKids: number; // 1-5 scale
    workLifeBalance: number;
    personalTime: number;
    kidsEnrichment: number;
    predictableRoutine: number;
  };
}

// Complete family profile
export interface FamilyProfile {
  children: ChildProfile[];
  parents: ParentProfile[];
  routines: FamilyRoutines;
  activities: Activity[];
  parentActivities: ParentActivity[];
  familyRecurringEvents: FamilyRecurringEvent[];
  preferences: FamilyPreferences;
}

// Onboarding progress state
export interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  profile: Partial<FamilyProfile>;
  calendarsSynced: string[]; // e.g., ['google', 'outlook']
  skippedSteps: OnboardingStep[];
  startedAt: Date;
  lastUpdatedAt: Date;
}

// Initial/default values
export const DEFAULT_FAMILY_PROFILE: Partial<FamilyProfile> = {
  children: [],
  parents: [],
  routines: {
    morningDropoff: {
      handler: 'parent1',
    },
    afternoonPickup: {
      handler: 'parent1',
    },
    grandparentsHelp: {
      enabled: false,
    },
    babysitter: {
      enabled: false,
    },
  },
  activities: [],
  parentActivities: [],
  familyRecurringEvents: [],
  preferences: {
    bufferTimeBetweenActivities: 30,
    averageTravelTime: 20,
    priorities: {
      qualityTimeWithKids: 5,
      workLifeBalance: 4,
      personalTime: 3,
      kidsEnrichment: 4,
      predictableRoutine: 4,
    },
  },
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  'calendar-sync',
  'family-structure',
  'parents-work',
  'daily-routines',
  'activities',
  'completion',
];

// Helper to get step index
export function getStepIndex(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step);
}

// Helper to get next step
export function getNextStep(currentStep: OnboardingStep): OnboardingStep | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex < ONBOARDING_STEPS.length - 1) {
    return ONBOARDING_STEPS[currentIndex + 1];
  }
  return null;
}

// Helper to get previous step
export function getPreviousStep(currentStep: OnboardingStep): OnboardingStep | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex > 0) {
    return ONBOARDING_STEPS[currentIndex - 1];
  }
  return null;
}

// Helper to calculate progress percentage
export function calculateProgress(completedSteps: OnboardingStep[]): number {
  return Math.round((completedSteps.length / ONBOARDING_STEPS.length) * 100);
}
