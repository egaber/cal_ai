import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  OnboardingState,
  OnboardingStep,
  FamilyProfile,
  DEFAULT_FAMILY_PROFILE,
  ONBOARDING_STEPS,
  getNextStep,
} from '../types/onboarding';

/**
 * Onboarding Service
 * Manages the family onboarding process, saving progress to Firestore
 */

// Initialize a new onboarding session
export const initializeOnboarding = async (
  familyId: string
): Promise<OnboardingState> => {
  const initialState: OnboardingState = {
    currentStep: 'calendar-sync',
    completedSteps: [],
    profile: DEFAULT_FAMILY_PROFILE,
    calendarsSynced: [],
    skippedSteps: [],
    startedAt: new Date(),
    lastUpdatedAt: new Date(),
  };

  try {
    await setDoc(
      doc(db, 'families', familyId, 'onboarding', 'state'),
      {
        ...initialState,
        startedAt: serverTimestamp(),
        lastUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return initialState;
  } catch (error) {
    console.error('Error initializing onboarding:', error);
    const message = error instanceof Error ? error.message : 'Failed to initialize onboarding';
    throw new Error(message);
  }
};

// Get current onboarding state
export const getOnboardingState = async (
  familyId: string
): Promise<OnboardingState | null> => {
  try {
    const stateDoc = await getDoc(
      doc(db, 'families', familyId, 'onboarding', 'state')
    );

    if (stateDoc.exists()) {
      const data = stateDoc.data();
      return {
        ...data,
        startedAt: data.startedAt?.toDate() || new Date(),
        lastUpdatedAt: data.lastUpdatedAt?.toDate() || new Date(),
      } as OnboardingState;
    }

    return null;
  } catch (error) {
    console.error('Error getting onboarding state:', error);
    return null;
  }
};

// Update onboarding state
export const updateOnboardingState = async (
  familyId: string,
  updates: Partial<OnboardingState>
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'families', familyId, 'onboarding', 'state'), {
      ...updates,
      lastUpdatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating onboarding state:', error);
    const message = error instanceof Error ? error.message : 'Failed to update onboarding state';
    throw new Error(message);
  }
};

// Mark a step as completed and move to next
export const completeStep = async (
  familyId: string,
  step: OnboardingStep,
  profileUpdates?: Partial<FamilyProfile>
): Promise<OnboardingStep | null> => {
  try {
    const state = await getOnboardingState(familyId);
    if (!state) {
      throw new Error('Onboarding state not found');
    }

    const completedSteps = [...state.completedSteps];
    if (!completedSteps.includes(step)) {
      completedSteps.push(step);
    }

    const nextStep = getNextStep(step);
    const updates: Partial<OnboardingState> = {
      completedSteps,
      currentStep: nextStep || step,
    };

    if (profileUpdates) {
      updates.profile = {
        ...state.profile,
        ...profileUpdates,
      };
    }

    await updateOnboardingState(familyId, updates);

    return nextStep;
  } catch (error) {
    console.error('Error completing step:', error);
    const message = error instanceof Error ? error.message : 'Failed to complete step';
    throw new Error(message);
  }
};

// Skip a step
export const skipStep = async (
  familyId: string,
  step: OnboardingStep
): Promise<OnboardingStep | null> => {
  try {
    const state = await getOnboardingState(familyId);
    if (!state) {
      throw new Error('Onboarding state not found');
    }

    const skippedSteps = [...state.skippedSteps];
    if (!skippedSteps.includes(step)) {
      skippedSteps.push(step);
    }

    const nextStep = getNextStep(step);
    await updateOnboardingState(familyId, {
      skippedSteps,
      currentStep: nextStep || step,
    });

    return nextStep;
  } catch (error) {
    console.error('Error skipping step:', error);
    const message = error instanceof Error ? error.message : 'Failed to skip step';
    throw new Error(message);
  }
};

// Go to a specific step
export const goToStep = async (
  familyId: string,
  step: OnboardingStep
): Promise<void> => {
  try {
    await updateOnboardingState(familyId, {
      currentStep: step,
    });
  } catch (error) {
    console.error('Error going to step:', error);
    const message = error instanceof Error ? error.message : 'Failed to go to step';
    throw new Error(message);
  }
};

// Save profile updates without changing step
export const saveProfileData = async (
  familyId: string,
  profileUpdates: Partial<FamilyProfile>
): Promise<void> => {
  try {
    const state = await getOnboardingState(familyId);
    if (!state) {
      throw new Error('Onboarding state not found');
    }

    await updateOnboardingState(familyId, {
      profile: {
        ...state.profile,
        ...profileUpdates,
      },
    });
  } catch (error) {
    console.error('Error saving profile data:', error);
    const message = error instanceof Error ? error.message : 'Failed to save profile data';
    throw new Error(message);
  }
};

// Mark calendar as synced
export const markCalendarSynced = async (
  familyId: string,
  calendarType: string
): Promise<void> => {
  try {
    const state = await getOnboardingState(familyId);
    if (!state) {
      throw new Error('Onboarding state not found');
    }

    const calendarsSynced = [...state.calendarsSynced];
    if (!calendarsSynced.includes(calendarType)) {
      calendarsSynced.push(calendarType);
    }

    await updateOnboardingState(familyId, {
      calendarsSynced,
    });
  } catch (error) {
    console.error('Error marking calendar synced:', error);
    const message = error instanceof Error ? error.message : 'Failed to mark calendar synced';
    throw new Error(message);
  }
};

// Complete onboarding and save profile to family document
export const completeOnboarding = async (
  familyId: string
): Promise<FamilyProfile> => {
  try {
    const state = await getOnboardingState(familyId);
    if (!state) {
      throw new Error('Onboarding state not found');
    }

    // Save the complete profile to the family document
    await updateDoc(doc(db, 'families', familyId), {
      profile: state.profile,
      onboardingCompleted: true,
      onboardingCompletedAt: serverTimestamp(),
      calendarsSynced: state.calendarsSynced,
      updatedAt: serverTimestamp(),
    });

    return state.profile as FamilyProfile;
  } catch (error) {
    console.error('Error completing onboarding:', error);
    const message = error instanceof Error ? error.message : 'Failed to complete onboarding';
    throw new Error(message);
  }
};

// Check if onboarding is completed
export const isOnboardingCompleted = async (
  familyId: string
): Promise<boolean> => {
  try {
    const familyDoc = await getDoc(doc(db, 'families', familyId));
    
    if (familyDoc.exists()) {
      const data = familyDoc.data();
      return data.onboardingCompleted === true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

// Get family profile
export const getFamilyProfile = async (
  familyId: string
): Promise<FamilyProfile | null> => {
  try {
    const familyDoc = await getDoc(doc(db, 'families', familyId));
    
    if (familyDoc.exists()) {
      const data = familyDoc.data();
      return data.profile || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting family profile:', error);
    return null;
  }
};

// Reset onboarding (for testing or re-onboarding)
export const resetOnboarding = async (familyId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'families', familyId), {
      onboardingCompleted: false,
      onboardingCompletedAt: null,
    });

    await initializeOnboarding(familyId);
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    const message = error instanceof Error ? error.message : 'Failed to reset onboarding';
    throw new Error(message);
  }
};
