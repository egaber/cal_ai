# AI Deep Insights - Roadmap

## Vision
מערכת AI שמבינה לעומק את סדר היום של המשפחה ומספקת תובנות והצעות חכמות מבוססות על הבנה מלאה של:
- מסגרות קבועות (גן, בית ספר, עבודה)
- זמני נסיעה ותנאי תנועה
- חלוקת תפקידים במשפחה
- אילוצים והעדפות
- תכנון מול אירועים עתידיים

## Current State (Phase 1 - ✅ Completed)

### What We Have:
- Basic calendar analysis (analyzeCalendar)
- Simple predictions (predictUpcomingEvents)
- Family member detection
- Recurring activities identification
- 19 categories
- Structured insights format

### Limitations:
- Surface-level analysis
- No deep understanding of daily routines
- No location/travel intelligence
- No preparation time calculations
- No conflict resolution suggestions

## Phase 2: Deep Daily Routine Understanding 🎯

### 2.1 Enhanced Data Collection

**New Memory Types Needed:**
```typescript
// src/types/routineInsights.ts

interface DailyFramework {
  id: string;
  memberId: string;
  type: 'work' | 'kindergarten' | 'school' | 'daycare';
  name: string;  // e.g., "גן השקמה", "בית ספר רמז"
  address: string;
  arrivalTime: string;  // "08:00"
  departureTime: string;  // "16:00"
  daysOfWeek: number[];  // [0,1,2,3,4] = Sun-Thu
  transportMethod: 'walk' | 'car' | 'public_transport';
  travelTimeMinutes: number;
  trafficPatterns?: {
    rush_hour: boolean;
    typical_duration: number;
    worst_case_duration: number;
  };
}

interface PreparationRoutine {
  id: string;
  forMemberId: string;
  tasks: PreparationTask[];
  totalDuration: number;
  responsibleMemberId?: string;  // who does it
}

interface PreparationTask {
  name: string;  // e.g., "הכנת כריכים"
  durationMinutes: number;
  mustBeDoneBefore: string;  // time
  canBeDoneInParallel: boolean;
}

interface PickupDropoffSchedule {
  id: string;
  childId: string;
  frameworkId: string;
  morning: {
    responsibleMemberId: string;
    departHomeTime: string;
    arrivalTime: string;
  };
  afternoon: {
    responsibleMemberId: string;
    pickupTime: string;
    arrivalHomeTime: string;
    afterActivity?: {
      type: 'park' | 'class' | 'friends';
      location?: string;
      duration?: number;
    };
  };
}

interface MemberDailySchedule {
  memberId: string;
  memberName: string;
  dayOfWeek: number;
  timeline: ScheduleBlock[];
  conflicts: Conflict[];
  suggestions: Suggestion[];
}

interface ScheduleBlock {
  startTime: string;
  endTime: string;
  type: 'framework' | 'travel' | 'preparation' | 'pickup' | 'activity' | 'free_time';
  title: string;
  location?: string;
  responsibleFor?: string[];  // other members involved
  flexibility: 'fixed' | 'flexible' | 'preferred';
}

interface Conflict {
  type: 'overlap' | 'impossible_timing' | 'missing_transportation' | 'overload';
  description: string;
  involvedMembers: string[];
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
}

interface Suggestion {
  type: 'schedule_activity' | 'optimize_route' | 'share_responsibility' | 'recurring_event';
  title: string;
  description: string;
  confidence: number;
  proposedAction: ProposedAction;
}

interface ProposedAction {
  type: 'create_event' | 'modify_time' | 'add_reminder' | 'split_task';
  details: any;
}
```

### 2.2 Enhanced AI Prompts

**Deep Analysis Prompt Structure:**
```
You are an advanced family scheduling AI that understands:

1. DAILY FRAMEWORKS for each family member:
   - Work schedules (address, hours, traffic patterns)
   - School/kindergarten schedules
   - Commute times and methods
   
2. PREPARATION REQUIREMENTS:
   - Morning routines (breakfast, packing lunches)
   - Who prepares what
   - Parallel vs sequential tasks
   - Optimal wake-up times
   
3. TRANSPORTATION LOGISTICS:
   - Who drives/walks with whom
   - Route optimization
   - Traffic considerations
   - Public transport schedules
   
4. AFTERNOON ACTIVITIES:
   - After-school programs
   - Classes/hobbies
   - Social time with friends
   - Optimal windows for activities

5. CONSTRAINTS & PREFERENCES:
   - Family preferences
   - Energy levels (morning person vs night owl)
   - Dietary restrictions
   - Budget considerations

Your task: Create a comprehensive daily schedule for each family member that:
- Minimizes conflicts
- Optimizes travel time
- Distributes responsibilities fairly
- Suggests recurring events
- Identifies good times for social activities
- Plans preparation times
```

### 2.3 New Analysis Functions

```typescript
// src/services/deepRoutineAnalysis.ts

class DeepRoutineAnalysisService {
  // Extract frameworks from calendar events
  async identifyDailyFrameworks(
    events: CalendarEvent[], 
    familyMembers: FamilyMember[]
  ): Promise<DailyFramework[]>
  
  // Build complete daily schedule for each member
  async buildMemberDailySchedules(
    frameworks: DailyFramework[],
    pickupSchedules: PickupDropoffSchedule[],
    preparations: PreparationRoutine[]
  ): Promise<MemberDailySchedule[]>
  
  // Detect conflicts and impossible timing
  async detectScheduleConflicts(
    schedules: MemberDailySchedule[]
  ): Promise<Conflict[]>
  
  // Generate smart suggestions
  async generateSmartSuggestions(
    schedules: MemberDailySchedule[],
    conflicts: Conflict[],
    preferences: FamilyPreferences
  ): Promise<Suggestion[]>
  
  // Create recurring events until summer vacation
  async proposeRecurringEvents(
    frameworks: DailyFramework[],
    endDate: Date  // summer vacation start
  ): Promise<RecurringEventProposal[]>
}
```

### 2.4 Integration with Google Maps / Location Services

```typescript
// src/services/travelTimeService.ts

class TravelTimeService {
  // Calculate actual travel time with traffic
  async calculateTravelTime(
    from: string,
    to: string,
    departureTime: Date,
    method: 'drive' | 'walk' | 'transit'
  ): Promise<{
    duration: number;
    distance: number;
    typical_traffic: number;
    worst_case: number;
  }>
  
  // Suggest optimal departure time
  async suggestDepartureTime(
    destination: string,
    arrivalBy: string,
    from: string
  ): Promise<string>
}
```

## Phase 3: Interactive Planning Module 🏖️

### 3.1 Summer Vacation Planner
- Interactive calendar for planning activities
- Budget tracking
- Destination suggestions
- Family voting system
- Packing lists

### 3.2 Features:
- Multi-week view
- Activity suggestions by age group
- Weather integration
- Local events detection
- Booking integration

## Implementation Priority

### Immediate (Week 1-2):
1. ✅ Define new types (routineInsights.ts)
2. ✅ Update prompt to ask deeper questions
3. ✅ Extract frameworks from existing events

### Short-term (Week 3-4):
4. Build daily schedule generator
5. Add travel time calculations
6. Implement conflict detection

### Medium-term (Month 2):
7. Smart suggestions engine
8. Recurring event proposals
9. UI for daily schedules

### Long-term (Month 3+):
10. Summer vacation planner module
11. Integration with external services
12. Family collaboration features

## Technical Challenges

1. **Data Collection**: How to get addresses, preferences automatically?
2. **Location Services**: Google Maps API costs, rate limits
3. **Traffic Patterns**: Historical data needed
4. **LLM Context**: Large prompts = more tokens = $$$
5. **Real-time Updates**: Traffic changes throughout day

## Solutions

1. **Progressive Enhancement**: Start with what we have, ask user to fill gaps
2. **Caching**: Store travel times, update weekly
3. **Smart Defaults**: Learn from patterns
4. **Batch Processing**: Analyze once, cache results
5. **User Confirmation**: Always let user approve suggestions

## Next Steps

1. **Update memory bank** to include this vision
2. **Create new types file** for deep insights
3. **Enhance analysis prompt** to ask deeper questions
4. **Build UI for viewing daily schedules**
5. **Test with real family data**

---

**This is a multi-month project**, but we can start incrementally and show value at each stage.
