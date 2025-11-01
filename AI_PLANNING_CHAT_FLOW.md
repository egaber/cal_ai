oy# AI Planning Chat Flow - תכנון אינטראקטיבי עם המשתמש

## 🎯 מטרה
ליצור פלואו צ'אט אינטראקטיבי שמאפשר ל-AI להעמיק את ההבנה של שגרות המשפחה ולהציע עוגנים חוזרים.

## 🔄 תהליך הפלואו

### שלב 1: ניתוח ראשוני (Silent Analysis)
```
Input: אירועים מהיומן (Google Calendar + Local Events)
Process: deepRoutineAnalysis מזהה דפוסים
Output: 
  - מסגרות שזוהו (עבודה, גן, בית ספר)
  - שאלות פתוחות (Open Questions)
  - אזורי אי-וודאות (Uncertainty Areas)
```

### שלב 2: פתיחת צ'אט תכנון (Planning Chat)
```
UI: כפתור "תכנון חכם עם AI" 💬
Action: פותח מסך צ'אט ייעודי
Initial Prompt: פרומפט מובנה שמכין את ה-AI
```

### שלב 3: שיחה מובנית (Structured Conversation)
```
AI שואל שאלות ממוקדות:

1. אימות מסגרות:
   "ראיתי ש[שם] הולך ל[מקום] ב[ימים]. זה נכון?"
   
2. השלמת פרטים חסרים:
   "מי אוסף את [שם] מה[מקום]?"
   "איזה תחבורה משתמשים?"
   
3. העדפות וכללים:
   "האם יש העדפה למי אוסף במקרה של חפיפה?"
   "מה השעה המועדפת ל[פעילות]?"
   
4. אירועים עתידיים:
   "האם יש אירועים קבועים שעוד לא ביומן?"
```

### שלב 4: הצעות עוגנים חוזרים (Recurring Anchors)
```
AI מציע:

Type 1: מסגרות קבועות
"האם להוסיף אירוע חוזר: '[שם הגן]' כל [ימים] בשעה [שעה]?"
[כפתור: הוסף כחוזר] [כפתור: עדכן פרטים] [כפתור: דלג]

Type 2: נסיעות
"האם להוסיף תזכורת נסיעה ל[מקום] 15 דקות לפני?"
[כפתור: כן, הוסף] [כפתור: לא, תודה]

Type 3: הכנות
"האם להוסיף תזכורת הכנת תיק לגן כל ערב?"
[כפתור: כן] [כפתור: התאם אישית]

Type 4: קואורדינציה משפחתית
"ב[יום] יש חפיפה. מי מוביל את [שם]?"
[כפתור: אבא] [כפתור: אמא] [כפתור: עוד לא ברור]
```

### שלב 5: אישור והוספה ליומן (Confirmation & Addition)
```
User מאשר/דוחה כל הצעה

Approved Event Details:
{
  title: string
  type: 'one-time' | 'recurring'
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    daysOfWeek?: number[]
    endDate?: string
  }
  startTime: string
  endTime: string
  category: string
  memberId: string
  isAnchor: true  // מסמן שזה עוגן חוזר
  confidence: number
  learnedFrom: string[]  // אילו אירועים תרמו ללמידה
}

Action: 
  - שמירה ב-Firestore
  - סנכרון ל-Google Calendar (אם מחובר)
  - עדכון Insights
```

## 📊 מבנה הנתונים

### OpenQuestion Type
```typescript
interface OpenQuestion {
  id: string;
  category: 'framework' | 'transportation' | 'coordination' | 'preference';
  question: string;  // השאלה לשאול
  context: {
    memberId?: string;
    relatedEvents?: string[];  // IDs של אירועים רלוונטיים
    frameworkId?: string;
  };
  priority: 'critical' | 'high' | 'medium' | 'low';
  suggestedAnswers?: string[];  // תשובות אפשריות
}
```

### ProposedAnchor Type
```typescript
interface ProposedAnchor {
  id: string;
  type: 'framework' | 'travel' | 'preparation' | 'coordination';
  title: string;
  description: string;
  event: {
    title: string;
    startTime: string;
    endTime: string;
    recurrence: {
      frequency: 'daily' | 'weekly' | 'monthly';
      daysOfWeek?: number[];
      interval?: number;
      endDate?: string;
    };
    category: string;
    memberId: string;
    location?: string;
    metadata: {
      isAnchor: true;
      confidence: number;
      learnedFrom: string[];
      source: 'ai_analysis';
    };
  };
  reasoning: string;  // למה ה-AI מציע את זה
  benefits: string[];  // היתרונות
  alternatives?: ProposedAnchor[];  // אלטרנטיבות
}
```

### ChatMessage Type
```typescript
interface PlanningChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: string;
  metadata?: {
    question?: OpenQuestion;
    proposal?: ProposedAnchor;
    action?: 'approved' | 'rejected' | 'modified';
  };
}
```

## 🎨 UI Components נדרשים

### 1. PlanningChatInterface
```
- מסך צ'אט מלא
- הודעות AI עם אנימציות
- כפתורי פעולה מהירים
- תצוגת הצעות מעוצבת
```

### 2. AnchorProposalCard
```
- כרטיס מעוצב להצעת עוגן
- פרטי האירוע החוזר
- כפתורי אישור/עריכה/דחייה
- תצוגה ויזואלית של החזרתיות
```

### 3. QuestionPrompt
```
- שאלה ממוקדת
- תשובות מוצעות (אם יש)
- אפשרות טקסט חופשי
```

## 🔧 Services נדרשים

### 1. planningChatService.ts
```typescript
class PlanningChatService {
  // יצירת פרומפט ראשוני
  async initializePlanningSession(insights: RoutineInsights): Promise<string>
  
  // יצירת שאלות פתוחות
  async generateOpenQuestions(insights: RoutineInsights): Promise<OpenQuestion[]>
  
  // יצירת הצעות עוגנים
  async generateAnchorProposals(
    insights: RoutineInsights,
    answeredQuestions: Map<string, string>
  ): Promise<ProposedAnchor[]>
  
  // שליחת הודעה והמשך שיחה
  async sendMessage(
    message: string,
    context: ChatContext
  ): Promise<PlanningChatMessage>
  
  // אישור והוספת עוגן ליומן
  async approveAnchor(
    anchor: ProposedAnchor,
    modifications?: Partial<CalendarEvent>
  ): Promise<CalendarEvent>
}
```

### 2. anchorManagementService.ts
```typescript
class AnchorManagementService {
  // קבלת כל העוגנים
  async getAnchors(userId: string, familyId: string): Promise<CalendarEvent[]>
  
  // עדכון עוגן
  async updateAnchor(anchorId: string, updates: Partial<CalendarEvent>): Promise<void>
  
  // מחיקת עוגן
  async deleteAnchor(anchorId: string): Promise<void>
  
  // בדיקת התנגשויות עם עוגנים
  async checkAnchorConflicts(newEvent: CalendarEvent): Promise<Conflict[]>
}
```

## 📝 System Prompt לצ'אט תכנון

```
You are a family calendar planning assistant specialized in Israeli families.

CONTEXT:
- Family members: {familyMembers}
- Current insights: {insights summary}
- Open questions: {openQuestions}
- Identified frameworks: {frameworks}

YOUR ROLE:
1. Ask clarifying questions about family routines
2. Propose recurring events (anchors) that create structure
3. Help coordinate between family members
4. Focus on recurring commitments (kindergarten, school, work)

GUIDELINES:
- Ask ONE question at a time
- Be specific and use names
- Offer quick-answer buttons when possible
- When proposing recurring events, explain the benefits
- Always indicate if it's recurring or one-time
- Use Hebrew naturally
- Be concise and friendly

PRIORITY FOCUS:
1. Daily frameworks (work, kindergarten, school)
2. Transportation and pickups
3. Preparation routines (morning/evening)
4. Family coordination points

Current conversation goal: {currentGoal}
```

## 🚀 Implementation Plan

### Phase 1: Core Chat Infrastructure
- [ ] Create PlanningChatMessage types
- [ ] Create OpenQuestion types
- [ ] Create ProposedAnchor types
- [ ] Build planningChatService with LLM integration

### Phase 2: Question Generation
- [ ] Analyze insights to find gaps
- [ ] Generate prioritized questions
- [ ] Create context-aware prompts

### Phase 3: Anchor Proposals
- [ ] Generate recurring event proposals
- [ ] Calculate confidence scores
- [ ] Identify alternatives

### Phase 4: UI Components
- [ ] PlanningChatInterface component
- [ ] AnchorProposalCard component
- [ ] QuestionPrompt component
- [ ] Integration with existing UI

### Phase 5: Calendar Integration
- [ ] Add anchors to Firestore
- [ ] Sync with Google Calendar
- [ ] Handle conflicts
- [ ] Update insights

## 💡 Key Innovations

1. **Anchor-First Approach**: מתמקדים בעוגנים חוזרים כבסיס
2. **Interactive Learning**: למידה דרך שיחה טבעית
3. **Smart Proposals**: AI מציע פתרונות מוכנים
4. **One-Time vs Recurring**: הבחנה ברורה בין סוגי אירועים
5. **Family Coordination**: דגש על תיאום משפחתי

## 🎯 Success Metrics

- מספר עוגנים שנוספו
- אחוז השאלות שקיבלו תשובה
- זמן עד להשלמת תכנון שבועי
- שביעות רצות משיחה
- הפחתה בקונפליקטים
