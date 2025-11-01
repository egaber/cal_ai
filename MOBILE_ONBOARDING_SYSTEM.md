# Mobile Onboarding System

## Overview

The mobile onboarding system guides new families through setting up their calendar with personalized information about their family structure, routines, and activities. This creates a rich context for AI assistance and enables smart scheduling from day one.

## Architecture

### Files Created

1. **`src/types/onboarding.ts`** - TypeScript type definitions
   - `OnboardingStep` - Step enum
   - `FamilyProfile` - Complete family profile structure
   - `ChildProfile`, `ParentProfile`, `FamilyRoutines`, `Activity` - Sub-types
   - `OnboardingState` - Progress tracking
   - Helper functions for step navigation

2. **`src/services/onboardingService.ts`** - Business logic service
   - `initializeOnboarding()` - Start new onboarding session
   - `getOnboardingState()` - Retrieve current progress
   - `completeStep()` - Mark step done and move to next
   - `skipStep()` - Skip optional steps
   - `saveProfileData()` - Auto-save profile updates
   - `markCalendarSynced()` - Track synced calendars
   - `completeOnboarding()` - Finalize and save to family document
   - `isOnboardingCompleted()` - Check completion status
   - `getFamilyProfile()` - Retrieve saved profile

### Onboarding Flow

```
┌────────────────────────────────────────┐
│ Step 1: Calendar Sync (Optional)       │
│ - Google Calendar integration          │
│ - [Skip] button available              │
└────────────────────────────────────────┘
                  ↓
┌────────────────────────────────────────┐
│ Step 2: Family Structure               │
│ - Number of children                   │
│ - For each child:                      │
│   • Name, age                          │
│   • School/kindergarten/daycare        │
│   • School name                        │
│   • Hours (start-end)                  │
└────────────────────────────────────────┘
                  ↓
┌────────────────────────────────────────┐
│ Step 3: Parents & Work                 │
│ - For each parent:                     │
│   • Name                               │
│   • Workplace                          │
│   • Work hours                         │
│   • Remote work days                   │
└────────────────────────────────────────┘
                  ↓
┌────────────────────────────────────────┐
│ Step 4: Daily Routines                 │
│ - Morning dropoff handler              │
│ - Afternoon pickup handler             │
│ - Grandparents help schedule           │
│ - Babysitter schedule                  │
└────────────────────────────────────────┘
                  ↓
┌────────────────────────────────────────┐
│ Step 5: Activities (Optional)          │
│ - After-school activities              │
│ - Parent hobbies/activities            │
│ - Family recurring events              │
│ - [Skip] button available              │
└────────────────────────────────────────┘
                  ↓
┌────────────────────────────────────────┐
│ Step 6: Completion                     │
│ - Summary of profile                   │
│ - "Start Using Calendar" button        │
└────────────────────────────────────────┘
```

## Data Storage

### Firestore Structure

```
families/{familyId}/
  ├─ name: string
  ├─ members: FamilyMember[]
  ├─ profile: FamilyProfile                    ← NEW
  ├─ onboardingCompleted: boolean              ← NEW
  ├─ onboardingCompletedAt: timestamp          ← NEW
  ├─ calendarsSynced: string[]                 ← NEW
  ├─ adminUserIds: string[]
  ├─ memberUserIds: string[]
  ├─ createdAt: timestamp
  └─ updatedAt: timestamp

families/{familyId}/onboarding/
  └─ state/                                    ← NEW
      ├─ currentStep: OnboardingStep
      ├─ completedSteps: OnboardingStep[]
      ├─ profile: Partial<FamilyProfile>
      ├─ calendarsSynced: string[]
      ├─ skippedSteps: OnboardingStep[]
      ├─ startedAt: timestamp
      └─ lastUpdatedAt: timestamp
```

### FamilyProfile Structure

```typescript
interface FamilyProfile {
  children: ChildProfile[];
  parents: ParentProfile[];
  routines: FamilyRoutines;
  activities: Activity[];
  parentActivities: ParentActivity[];
  familyRecurringEvents: FamilyRecurringEvent[];
  preferences: FamilyPreferences;
}
```

## Components to Build (Next Steps)

### 1. Main Onboarding Container
**File**: `src/pages/MobileOnboarding.tsx`

Features:
- Full-screen mobile layout
- Progress indicator (dots)
- Step navigation
- Auto-save on every change
- Exit confirmation

### 2. Individual Step Components

#### `src/components/onboarding/CalendarSyncStep.tsx`
- Google Calendar connect button
- Benefits explanation
- Skip option
- Success feedback

#### `src/components/onboarding/FamilyStructureStep.tsx`
- Number of children selector (0-4+)
- Dynamic child forms
- School type dropdown
- Time pickers for school hours
- Validation

#### `src/components/onboarding/ParentsWorkStep.tsx`
- Parent name inputs
- Workplace inputs
- Work hours time pickers
- Remote work days checkboxes
- Flexibility selector

#### `src/components/onboarding/RoutinesStep.tsx`
- Dropoff handler selector
- Pickup handler selector
- Grandparents schedule builder
- Babysitter schedule builder
- Day/time pickers

#### `src/components/onboarding/ActivitiesStep.tsx`
- Activities list
- Add activity form (child selector, name, day, time)
- Parent activities (optional)
- Family events (optional)
- Skip option

#### `src/components/onboarding/CompletionStep.tsx`
- Profile summary
- Calendar preview
- "Start" button
- Celebration UI

### 3. Shared Components

#### `src/components/onboarding/OnboardingContainer.tsx`
- Progress bar
- Step wrapper
- Navigation buttons
- Auto-save indicator

#### `src/components/onboarding/StepNavigation.tsx`
- Previous/Next buttons
- Skip button
- Progress dots

## Integration Points

### 1. Update FamilySetupDialog
**File**: `src/components/FamilySetupDialog.tsx`

After family creation success, redirect to onboarding:
```typescript
const handleCompleteSetup = () => {
  if (createdFamily) {
    // Initialize onboarding
    await initializeOnboarding(createdFamily.id);
    
    // Navigate to onboarding page
    navigate('/onboarding');
  }
};
```

### 2. Add Onboarding Route
**File**: `src/App.tsx`

```typescript
<Route path="/onboarding" element={<MobileOnboarding />} />
```

### 3. Check Onboarding Status
**File**: `src/contexts/FamilyContext.tsx`

On family load, check if onboarding is completed:
```typescript
const completed = await isOnboardingCompleted(family.id);
if (!completed) {
  navigate('/onboarding');
}
```

## AI Integration

### Using Profile Data

The completed family profile enables:

1. **Pre-populated Events**
   - School hours → recurring events
   - Work hours → calendar blocks
   - Activities → recurring events
   - Family events → recurring events

2. **Smart Scheduling**
   - AI knows constraints (work hours, school pickup)
   - Can suggest optimal meeting times
   - Avoids scheduling conflicts

3. **Better Suggestions**
   - "You usually have dinner with grandparents on Friday"
   - "Yael has dance class on Tuesdays at 4pm"
   - "Avoid scheduling during Eyal's work hours"

4. **Conflict Detection**
   - "This meeting conflicts with school pickup"
   - "Ella is usually working from home on Wednesdays"

### Event Creation Service
**File**: `src/services/onboardingEventsService.ts` (to be created)

```typescript
export const createEventsFromProfile = async (
  familyId: string,
  profile: FamilyProfile
): Promise<CalendarEvent[]> => {
  const events: CalendarEvent[] = [];
  
  // Create school events
  for (const child of profile.children) {
    events.push(createSchoolEvent(child));
  }
  
  // Create work blocks
  for (const parent of profile.parents) {
    events.push(...createWorkEvents(parent));
  }
  
  // Create activities
  for (const activity of profile.activities) {
    events.push(createActivityEvent(activity));
  }
  
  return events;
};
```

## Mobile UX Best Practices

### Design Principles
1. **One Question Per Screen** - Don't overwhelm users
2. **Large Touch Targets** - Min 44px for buttons
3. **Clear Progress** - Show where they are in the process
4. **Skip Options** - Let users move forward
5. **Auto-save** - Never lose progress
6. **Hebrew RTL** - Right-to-left layout support

### Visual Design
- Full-screen steps
- Bottom navigation buttons
- Smooth transitions
- Loading states
- Success animations
- Error handling

## Testing Checklist

- [ ] Create family → Triggers onboarding
- [ ] Skip all steps → Still completes successfully
- [ ] Fill partial data → Saves correctly
- [ ] Refresh mid-onboarding → Resumes where left off
- [ ] Complete onboarding → Profile saved to Firestore
- [ ] Profile data → Creates calendar events
- [ ] AI assistant → Uses profile context
- [ ] Calendar sync → Integrates with Google Calendar

## Next Development Steps

### Phase 1: Core Components (Current)
- [x] Create types (`onboarding.ts`)
- [x] Create service (`onboardingService.ts`)
- [ ] Create main onboarding page
- [ ] Create step components

### Phase 2: Integration
- [ ] Update FamilySetupDialog
- [ ] Add routing
- [ ] Add onboarding check in auth flow

### Phase 3: Event Generation
- [ ] Create events from profile
- [ ] Sync with calendar
- [ ] Enable AI context

### Phase 4: Polish
- [ ] Add animations
- [ ] Add success celebrations
- [ ] Add skip confirmations
- [ ] Add progress persistence

## Questions for Future Consideration

1. **Re-onboarding**: Should users be able to update their profile later?
2. **Multiple Families**: How to handle users in multiple families?
3. **Incomplete Profiles**: What's the minimum required data?
4. **Data Privacy**: What profile data should be optional/skippable?
5. **Localization**: Full Hebrew translation for all steps?

## Resources

- TypeScript types: `src/types/onboarding.ts`
- Service functions: `src/services/onboardingService.ts`
- Firestore schema: See "Data Storage" section above
- UI components: To be created in `src/components/onboarding/`
