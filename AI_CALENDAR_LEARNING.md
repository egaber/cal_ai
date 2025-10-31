# AI Calendar Learning & Prediction System

## 🎯 Vision
Create an intelligent system that learns from the user's calendar history to:
- Understand patterns and habits
- Predict future scheduling needs
- Suggest optimal time slots
- Proactively offer scheduling assistance

## 📊 Data We Have
After Google Calendar sync, we have access to:
- **96+ historical events** spanning weeks/months
- Event details: title, time, duration, recurrence
- Metadata: location, attendees, descriptions
- Source information (Google Calendar)

## 🧠 Learning Phases

### Phase 1: Pattern Recognition (Passive Learning)
**Goal**: Build a profile of user behavior WITHOUT asking questions

#### 1.1 Time Patterns
```typescript
interface TimePatterns {
  workingHours: {
    start: string;  // e.g., "09:00"
    end: string;    // e.g., "17:00"
    preferredDays: string[];  // ["Monday", "Tuesday", ...]
  };
  
  peakProductiveHours: {
    morning: number;   // 0-10 scale
    afternoon: number;
    evening: number;
  };
  
  meetingPatterns: {
    averageDuration: number;  // minutes
    preferredSlots: string[]; // ["10:00-11:00", "14:00-15:00"]
    bufferTime: number;       // minutes between meetings
  };
  
  freeTimeWindows: {
    dayOfWeek: string;
    timeSlots: Array<{ start: string; end: string; }>;
  }[];
}
```

**Analysis Methods**:
- Cluster events by time of day → identify work hours
- Calculate meeting frequency by day/time → find preferred slots
- Analyze gaps between events → determine buffer preferences
- Identify recurring events → understand routine

#### 1.2 Category Patterns
```typescript
interface CategoryPatterns {
  workBalance: {
    workEvents: number;
    personalEvents: number;
    familyEvents: number;
    healthEvents: number;
  };
  
  categoryByDay: {
    [day: string]: {
      [category: string]: number;
    };
  };
  
  typicalWeek: {
    monday: CategoryDistribution;
    tuesday: CategoryDistribution;
    // ...
  };
}
```

**Analysis Methods**:
- Categorize events using keywords + AI
- Map categories to days of week
- Identify "theme days" (e.g., "Tuesday = meeting day")

#### 1.3 Social Patterns
```typescript
interface SocialPatterns {
  frequentContacts: Array<{
    name: string;
    frequency: number;
    typicalDuration: number;
    preferredTimes: string[];
  }>;
  
  teamMeetings: Array<{
    type: string;  // "standup", "review", "planning"
    frequency: string;  // "weekly", "daily"
    participants: string[];
  }>;
  
  oneOnOnes: Array<{
    with: string;
    frequency: string;
    averageDuration: number;
  }>;
}
```

#### 1.4 Location & Activity Patterns
```typescript
interface ActivityPatterns {
  locations: Array<{
    name: string;
    frequency: number;
    typicalTime: string;
    associatedActivities: string[];
  }>;
  
  travelTime: {
    averageCommute: number;  // minutes
    homeToOffice: number;
    typicalRoutes: string[];
  };
  
  activities: Array<{
    type: string;  // "gym", "school pickup", "lunch"
    frequency: string;
    typicalDuration: number;
    preferredTime: string;
  }>;
}
```

### Phase 2: Predictive Insights (Active Analysis)

#### 2.1 Weekly Pattern Prediction
```typescript
interface WeeklyPrediction {
  nextWeek: {
    expectedMeetings: number;
    likelyBusyDays: string[];
    recommendedFocusTime: Array<{
      day: string;
      timeSlot: string;
      reason: string;
    }>;
  };
  
  conflicts: Array<{
    date: string;
    issue: string;  // "overbooked", "no breaks", "too many meetings"
    suggestion: string;
  }>;
}
```

#### 2.2 Scheduling Suggestions
When user creates a new event, AI suggests:
```typescript
interface SchedulingSuggestion {
  recommendedSlots: Array<{
    start: string;
    end: string;
    score: number;  // 0-100
    reasons: string[];  // ["Based on your usual meeting time", "You're typically free"]
  }>;
  
  considerations: {
    conflicts: CalendarEvent[];
    nearbyEvents: CalendarEvent[];
    travelTime: number;
    energyLevel: "high" | "medium" | "low";  // based on time of day patterns
  };
}
```

#### 2.3 Proactive Warnings
```typescript
interface ProactiveWarning {
  type: "overbooked" | "no-breaks" | "late-night" | "pattern-break";
  severity: "low" | "medium" | "high";
  message: string;
  suggestion: string;
  affectedEvents: CalendarEvent[];
}
```

### Phase 3: Memory Integration

#### 3.1 User Profile Building
Store learned patterns in Memory System:
```typescript
interface UserCalendarProfile {
  userId: string;
  lastAnalyzed: string;
  
  workingStyle: {
    type: "structured" | "flexible" | "chaotic";
    prefersMornings: boolean;
    prefersEvenings: boolean;
    averageMeetingsPerDay: number;
    typicalWorkHours: number;
  };
  
  preferences: {
    meetingDuration: number;
    bufferBetweenMeetings: number;
    lunchTime: string;
    endOfDay: string;
    noMeetingDays: string[];
  };
  
  habits: Array<{
    pattern: string;  // "Weekly team meeting every Monday 10am"
    confidence: number;  // 0-100
    firstSeen: string;
    lastSeen: string;
    frequency: number;
  }>;
  
  insights: Array<{
    type: string;
    description: string;
    impact: "positive" | "neutral" | "negative";
    suggestedAction?: string;
  }>;
}
```

#### 3.2 Context-Aware Assistance
AI Assistant can now:
- "I see you usually have team meetings on Mondays at 10am. Want me to schedule the next one?"
- "You have 5 meetings tomorrow with no breaks. Should I suggest moving one?"
- "Based on your patterns, Thursday afternoons are your focus time. Keep it clear?"

## 🛠 Implementation Strategy

### Step 1: Data Preparation Service
```typescript
// src/services/calendarAnalysisService.ts
class CalendarAnalysisService {
  // Load all events (Google + local)
  async loadEventHistory(userId: string, familyId: string): Promise<CalendarEvent[]>
  
  // Prepare data for AI analysis
  prepareEventsForAnalysis(events: CalendarEvent[]): AnalysisData
  
  // Basic statistical analysis (no AI needed)
  analyzeTimePatterns(events: CalendarEvent[]): TimePatterns
  analyzeCategoryDistribution(events: CalendarEvent[]): CategoryPatterns
}
```

### Step 2: AI Analysis Service
```typescript
// src/services/calendarLearningService.ts
class CalendarLearningService {
  // Send events to LLM with structured prompt
  async analyzeCalendarHistory(
    events: CalendarEvent[],
    basicStats: TimePatterns
  ): Promise<UserCalendarProfile>
  
  // Generate insights
  async generateInsights(
    profile: UserCalendarProfile
  ): Promise<Insight[]>
  
  // Predict optimal slots for new event
  async suggestTimeSlots(
    eventDetails: Partial<CalendarEvent>,
    profile: UserCalendarProfile,
    existingEvents: CalendarEvent[]
  ): Promise<SchedulingSuggestion>
}
```

### Step 3: Prompt Engineering

#### Analysis Prompt Structure
```
You are analyzing a user's calendar to understand their scheduling patterns and preferences.

CALENDAR DATA:
- Total events: {count}
- Date range: {start} to {end}
- Event breakdown: {summary}

EVENTS:
{formatted_events}

TASK:
Analyze the above calendar data and provide:

1. WORKING HOURS:
   - Typical start/end time
   - Most productive hours
   - Preferred meeting times

2. PATTERNS:
   - Recurring activities
   - Theme days (e.g., "Meeting Mondays")
   - Regular commitments

3. HABITS:
   - Meeting duration preferences
   - Buffer time between meetings
   - Lunch/break patterns

4. INSIGHTS:
   - Potential scheduling conflicts
   - Overbooked periods
   - Recommendations for better balance

5. PREDICTIONS:
   - Likely future scheduling needs
   - Optimal focus time blocks
   - Suggested "no-meeting" times

Format your response as structured JSON following this schema:
{schema}
```

### Step 4: UI Integration

#### 4.1 Analysis Trigger
```tsx
// In GoogleCalendarSync component
<Button onClick={handleAnalyzeCalendar}>
  🧠 Analyze My Calendar
</Button>
```

#### 4.2 Insights Display
```tsx
// New component: CalendarInsights
<CalendarInsights 
  profile={userProfile}
  onApplySuggestion={(suggestion) => { /* apply */ }}
/>
```

#### 4.3 Smart Scheduling Assistant
```tsx
// Enhanced NewEventDialog
<SmartEventCreator
  profile={userProfile}
  suggestedSlots={aiSuggestions}
  onSelectSlot={(slot) => { /* use suggestion */ }}
/>
```

## 🔄 Continuous Learning

### Trigger Points for Re-analysis:
1. **Weekly**: Sunday evening - prepare for upcoming week
2. **After sync**: New events from Google Calendar
3. **Manual**: User requests analysis
4. **Significant change**: Major schedule shift detected

### Incremental Updates:
Instead of re-analyzing all events each time:
```typescript
interface IncrementalUpdate {
  newEvents: CalendarEvent[];
  changedPatterns: string[];
  updatedInsights: Insight[];
  confidence: number;  // How sure we are about the patterns
}
```

## 📈 Success Metrics

### Quantitative:
- **Pattern accuracy**: % of correctly predicted events
- **Suggestion acceptance**: % of AI suggestions used
- **Time saved**: Estimated hours saved in scheduling
- **Conflict prevention**: # of conflicts avoided

### Qualitative:
- User satisfaction with suggestions
- Perceived intelligence of system
- Trust in AI predictions

## 🚀 MVP Implementation Plan

### Week 1: Data & Basic Analysis
- [ ] Create CalendarAnalysisService
- [ ] Implement basic statistical analysis
- [ ] Build data preparation pipeline
- [ ] Test with 96 events

### Week 2: AI Integration
- [ ] Create CalendarLearningService
- [ ] Design and test analysis prompt
- [ ] Integrate with LLM service
- [ ] Generate first insights

### Week 3: UI & UX
- [ ] Build CalendarInsights component
- [ ] Add analysis trigger button
- [ ] Display patterns and suggestions
- [ ] Collect user feedback

### Week 4: Smart Features
- [ ] Implement smart time slot suggestions
- [ ] Add proactive warnings
- [ ] Enable weekly predictions
- [ ] Polish UI/UX

## 🎨 UI Concepts

### Insights Dashboard
```
┌─────────────────────────────────────────┐
│ 🧠 Your Calendar Intelligence            │
├─────────────────────────────────────────┤
│                                          │
│ 📊 This Week's Patterns:                │
│   • 12 meetings scheduled                │
│   • Peak time: Tue-Thu 10am-3pm         │
│   • Focus time: Mon & Fri mornings      │
│                                          │
│ 💡 Insights:                            │
│   ⚠️  No breaks scheduled Thursday      │
│   ✨  Friday 2-4pm perfect for deep work│
│   📅  Team meeting pattern: Mon 10am    │
│                                          │
│ 🔮 Next Week Prediction:                │
│   • Expected: 10-14 meetings            │
│   • Busy days: Tue, Wed                 │
│   • Recommended focus: Thu afternoon    │
│                                          │
└─────────────────────────────────────────┘
```

### Smart Scheduling
```
┌─────────────────────────────────────────┐
│ Create New Event: "Team Sync"           │
├─────────────────────────────────────────┤
│                                          │
│ 🎯 AI Suggested Times:                  │
│                                          │
│ ✨ Monday 10:00-11:00  (95% match)     │
│    • Your usual team meeting time       │
│    • No conflicts                       │
│    • Energy level: High                 │
│                                          │
│ 💚 Tuesday 14:00-15:00  (87% match)    │
│    • Good alternative slot              │
│    • Right after lunch                  │
│    • Similar to past patterns           │
│                                          │
│ 🟡 Wednesday 16:00-17:00  (65% match)  │
│    • Available but less ideal           │
│    • Late in day (lower energy)         │
│    • Close to another meeting           │
│                                          │
└─────────────────────────────────────────┘
```

## 🔐 Privacy Considerations

### Data Storage:
- Analysis results stored in Memory System (Firestore)
- Original events remain in their respective collections
- User can clear analysis data anytime

### Data Processing:
- Events sent to LLM are anonymized
- Only titles, times, and categories shared
- No sensitive content from descriptions
- User consent required for analysis

## 🎓 Learning Approach

### Start Simple:
1. **Observe**: Just watch and learn patterns
2. **Suggest**: Offer gentle suggestions
3. **Adapt**: Learn from user's responses
4. **Predict**: Make confident predictions

### Build Trust:
- Show reasoning behind suggestions
- Allow user to correct/teach the AI
- Gradually increase confidence
- Never be pushy

## Next Steps

Ready to start implementation? Let's begin with:

1. **Create CalendarAnalysisService** - basic stats
2. **Test prompt with your 96 events** - see what insights we get
3. **Build simple UI** - display results
4. **Iterate based on feedback**

What do you think? Should we start coding or refine the strategy first?
