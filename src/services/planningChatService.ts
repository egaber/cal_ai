import { 
  OpenQuestion, 
  ProposedAnchor, 
  PlanningChatMessage, 
  ChatContext,
  AnchorApprovalRequest,
} from '@/types/planningChat';
import { CalendarEvent } from '@/types/calendar';
import { RoutineInsights, DailyFramework } from '@/types/routineInsights';
import { llmService, type Message as LLMMessage } from './llmService';
import { modelConfigService } from './modelConfigService';

// Type for family member (simplified)
export interface FamilyMember {
  id: string;
  displayName: string;
  role?: string;
}

/**
 * PlanningChatService
 * מנהל את השיחה האינטראקטיבית לתכנון לוח הזמנים
 */
export class PlanningChatService {
  /**
   * יצירת פרומפט ראשוני לפתיחת סשן תכנון
   */
  async initializePlanningSession(
    insights: RoutineInsights,
    familyMembers: FamilyMember[]
  ): Promise<{ prompt: string; context: ChatContext }> {
    const sessionId = `session_${Date.now()}`;
    
    // סיכום התובנות
    const insightsSummary = this.summarizeInsights(insights, familyMembers);
    
    // יצירת הקשר השיחה
    const context: ChatContext = {
      sessionId,
      userId: insights.userId,
      familyId: insights.familyId,
      startTime: new Date().toISOString(),
      questions: [],
      answeredQuestions: new Map(),
      proposals: [],
      currentGoal: 'identify_frameworks',
      createdEvents: []
    };
    
    // פרומפט לפתיחת השיחה
    const prompt = `
אתה עוזר תכנון לוח זמנים חכם למשפחות ישראליות.

# הקשר משפחתי:
${insightsSummary}

# המטרה שלך:
1. להבין את השגרה המשפחתית
2. לזהות מסגרות קבועות (גן, עבודה, בית ספר)
3. להציע עוגנים חוזרים (recurring anchors) שיפשטו את ניהול היומן
4. לוודא שאין חפיפות או קונפליקטים

# כללי התנהגות:
- דבר בעברית טבעית וחמה
- שאל שאלה אחת בכל פעם
- היה ספציפי - השתמש בשמות
- הצע תשובות מוכנות בכפתורים כשאפשר
- הסבר למה אתה שואל כל שאלה

# השלב הנוכחי:
אתה בשלב זיהוי מסגרות. תתחיל בשאלה כללית על השגרה השבועית.

התחל את השיחה!
`;
    
    return { prompt, context };
  }
  
  /**
   * יצירת שאלות פתוחות מבוססות על התובנות
   */
  async generateOpenQuestions(
    insights: RoutineInsights,
    familyMembers: FamilyMember[]
  ): Promise<OpenQuestion[]> {
    const questions: OpenQuestion[] = [];
    
    // שאלות על מסגרות שזוהו אבל לא מלאות
    insights.frameworks.forEach(framework => {
      // בדוק אם יש מידע חסר
      if (!framework.address && !framework.location) {
        questions.push({
          id: `q_${Date.now()}_${Math.random()}`,
          category: 'framework',
          question: `איפה ${framework.memberName} ${this.getFrameworkAction(framework.type)} - ${framework.name}?`,
          context: {
            memberId: framework.memberId,
            frameworkId: framework.id
          },
          priority: 'high',
          suggestedAnswers: this.getLocationSuggestions(framework.type)
        });
      }
      
      // אם לא ברור מי מוביל
      if (framework.type === 'kindergarten' || framework.type === 'school') {
        const pickupSchedule = insights.pickupSchedules.find(p => p.frameworkId === framework.id);
        
        if (!pickupSchedule) {
          questions.push({
            id: `q_${Date.now()}_${Math.random() + 1}`,
            category: 'transportation',
            question: `מי מוביל את ${framework.memberName} ל${framework.name}?`,
            context: {
              memberId: framework.memberId,
              frameworkId: framework.id
            },
            priority: 'critical',
            suggestedAnswers: familyMembers.map(m => m.displayName)
          });
          
          questions.push({
            id: `q_${Date.now()}_${Math.random() + 2}`,
            category: 'transportation',
            question: `מי אוסף את ${framework.memberName} מ${framework.name}?`,
            context: {
              memberId: framework.memberId,
              frameworkId: framework.id
            },
            priority: 'critical',
            suggestedAnswers: familyMembers.map(m => m.displayName)
          });
        }
      }
    });
    
    // שאלות על העדפות
    if (familyMembers.length > 1) {
      questions.push({
        id: `q_pref_${Date.now()}`,
        category: 'preference',
        question: 'במקרה של חפיפה בין אירועים, למי יש עדיפות?',
        context: {},
        priority: 'medium',
        suggestedAnswers: [
          'לפי סדר כרונולוגי',
          'עבודה לפני פרטי',
          'ילדים לפני הורים'
        ]
      });
    }
    
    return questions.slice(0, 5); // מגביל ל-5 שאלות בכל פעם
  }
  
  /**
   * יצירת הצעות לעוגנים חוזרים
   */
  async generateAnchorProposals(
    insights: RoutineInsights,
    familyMembers: FamilyMember[],
    answeredQuestions: Map<string, string>
  ): Promise<ProposedAnchor[]> {
    const proposals: ProposedAnchor[] = [];
    
    // הצעות מבוססות על מסגרות שזוהו
    insights.frameworks.forEach(framework => {
      const member = familyMembers.find(m => m.id === framework.memberId);
      if (!member) return;
      
      // הצעה למסגרת קבועה
      proposals.push({
        id: `anchor_${Date.now()}_${Math.random()}`,
        type: 'framework',
        title: `${framework.name} - ${member.displayName}`,
        description: `מסגרת קבועה ${framework.schedule.daysOfWeek.length} ימים בשבוע`,
        event: {
          title: framework.name,
          startTime: this.timeStringToISO(framework.schedule.arrivalTime),
          endTime: this.timeStringToISO(framework.schedule.departureTime),
          recurrence: {
            frequency: 'weekly',
            daysOfWeek: framework.schedule.daysOfWeek,
            interval: 1
          },
          category: this.mapFrameworkTypeToCategory(framework.type),
          memberId: framework.memberId,
          location: framework.address,
          metadata: {
            isAnchor: true,
            confidence: framework.confidence,
            learnedFrom: framework.learnedFrom,
            source: 'ai_analysis'
          }
        },
        reasoning: `זוהתה בניתוח ${insights.eventsAnalyzed} אירועים`,
        benefits: [
          'לא צריך להזין כל שבוע מחדש',
          'תזכורות אוטומטיות',
          'זיהוי קונפליקטים'
        ],
        status: 'pending'
      });
      
      // הצעה לנסיעה (אם יש transportation info)
      if (framework.transportation && framework.transportation.travelTimeMinutes) {
        proposals.push({
          id: `travel_${Date.now()}_${Math.random()}`,
          type: 'travel',
          title: `נסיעה ל${framework.name}`,
          description: `תזכורת נסיעה ${framework.transportation.travelTimeMinutes} דקות לפני`,
          event: {
            title: `🚗 נסיעה ל${framework.name}`,
            startTime: this.subtractMinutesFromTime(framework.schedule.arrivalTime, framework.transportation.travelTimeMinutes),
            endTime: this.timeStringToISO(framework.schedule.arrivalTime),
            recurrence: {
              frequency: 'weekly',
              daysOfWeek: framework.schedule.daysOfWeek,
              interval: 1
            },
            category: 'transport' as CalendarEvent['category'],
            memberId: framework.memberId,
            metadata: {
              isAnchor: true,
              confidence: 0.9,
              learnedFrom: [framework.id],
              source: 'ai_analysis'
            }
          },
          reasoning: 'תזכורת לצאת בזמן',
          benefits: [
            'לא להגיע באיחור',
            'זמן להכנות',
            'הקלה על הלחץ'
          ],
          status: 'pending'
        });
      }
    });
    
    return proposals;
  }
  
  /**
   * שליחת הודעה והמשך שיחה
   */
  async sendMessage(
    sessionId: string,
    message: string,
    context: ChatContext
  ): Promise<{ message: PlanningChatMessage; context: ChatContext }> {
    // בנה את ההודעות לשיחה
    const messages: LLMMessage[] = [
      {
        role: 'user',
        content: message
      }
    ];
    
    // קבל את המודל שנבחר על ידי המשתמש
    const availableModels = await llmService.getAvailableModels();
    const selectedModel = modelConfigService.findModel(availableModels);
    
    if (!selectedModel) {
      throw new Error('No AI model available. Please configure an AI model in settings.');
    }
    
    // שלח בקשה למודל
    const response = await llmService.chat({
      messages,
      model: selectedModel,
      systemPrompt: this.getSystemPrompt(context)
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    // צור הודעת תגובה
    const responseMessage: PlanningChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'ai',
      content: response.content,
      timestamp: new Date().toISOString()
    };
    
    return {
      message: responseMessage,
      context: context // TODO: update context based on response
    };
  }
  
  /**
   * אישור והוספת עוגן ליומן
   */
  async approveAnchor(
    request: AnchorApprovalRequest,
    userId: string,
    familyId: string
  ): Promise<CalendarEvent> {
    const { anchor, modifications } = request;
    
    // מיזוג שינויים
    const finalEvent = {
      ...anchor.event,
      ...modifications
    };
    
    // יצירת אירוע ליומן
    const calendarEvent: Omit<CalendarEvent, 'id'> = {
      title: finalEvent.title,
      startTime: finalEvent.startTime,
      endTime: finalEvent.endTime,
      category: finalEvent.category,
      memberId: finalEvent.memberId,
      location: finalEvent.location,
      isRecurring: true,
      recurrenceRule: {
        frequency: finalEvent.recurrence.frequency,
        daysOfWeek: finalEvent.recurrence.daysOfWeek,
        interval: finalEvent.recurrence.interval || 1
      },
      metadata: {
        ...finalEvent.metadata,
        anchorId: anchor.id,
        approvedAt: new Date().toISOString()
      },
      userId,
      familyId
    };
    
    return calendarEvent as CalendarEvent;
  }
  
  // ============ Helper Methods ============
  
  private summarizeInsights(insights: RoutineInsights, members: FamilyMember[]): string {
    let summary = `# נתוני המשפחה:\n\n`;
    
    // בני משפחה
    summary += `## בני משפחה (${members.length}):\n`;
    members.forEach(m => {
      summary += `- ${m.displayName}${m.role ? ` (${m.role})` : ''}\n`;
    });
    
    // מסגרות שזוהו
    if (insights.frameworks.length > 0) {
      summary += `\n## מסגרות קבועות שזוהו (${insights.frameworks.length}):\n`;
      insights.frameworks.forEach(framework => {
        summary += `- ${framework.memberName}: ${framework.name} (${framework.type})\n`;
        summary += `  שעות: ${framework.schedule.arrivalTime}-${framework.schedule.departureTime}\n`;
        summary += `  ימים: ${framework.schedule.daysOfWeek.map(d => ['א','ב','ג','ד','ה','ו','ש'][d]).join(',')}\n`;
        if (framework.address) {
          summary += `  מיקום: ${framework.address}\n`;
        }
      });
    } else {
      summary += `\n## מסגרות: לא זוהו מסגרות קבועות\n`;
    }
    
    // לוחות זמנים
    if (insights.memberSchedules.length > 0) {
      summary += `\n## עומס שבועי:\n`;
      const uniqueMembers = new Set(insights.memberSchedules.map(s => s.memberName));
      uniqueMembers.forEach(memberName => {
        const memberSchedules = insights.memberSchedules.filter(s => s.memberName === memberName);
        const avgBusyTime = memberSchedules.reduce((sum, s) => sum + s.metrics.totalBusyTime, 0) / memberSchedules.length;
        const maxStress = memberSchedules.reduce((max, s) => 
          s.metrics.stressLevel === 'high' ? 'high' : 
          s.metrics.stressLevel === 'medium' && max !== 'high' ? 'medium' : max, 
          'low' as 'low' | 'medium' | 'high'
        );
        summary += `- ${memberName}: ממוצע ${Math.round(avgBusyTime)} דקות/יום, רמת לחץ: ${maxStress}\n`;
      });
    }
    
    // קונפליקטים
    if (insights.criticalConflicts.length > 0) {
      summary += `\n## ⚠️ קונפליקטים (${insights.criticalConflicts.length}):\n`;
      insights.criticalConflicts.slice(0, 3).forEach(conflict => {
        summary += `- ${conflict.description}\n`;
      });
    }
    
    // סטטיסטיקה
    summary += `\n## סטטיסטיקה:\n`;
    summary += `- ${insights.eventsAnalyzed} אירועים נותחו\n`;
    summary += `- ${insights.timeRangeDays} ימים נסקרו\n`;
    summary += `- רמת ביטחון: ${insights.confidence}%\n`;
    
    return summary;
  }
  
  private getFrameworkAction(type: DailyFramework['type']): string {
    const actions: Record<DailyFramework['type'], string> = {
      kindergarten: 'הולך לגן',
      school: 'הולך לבית ספר',
      work: 'עובד',
      daycare: 'במעון',
      university: 'באוניברסיטה'
    };
    return actions[type] || 'נמצא';
  }
  
  private getLocationSuggestions(type: DailyFramework['type']): string[] {
    const suggestions: Record<string, string[]> = {
      kindergarten: ['גן ילדים בשכונה', 'גן פרטי', 'מעון יום'],
      school: ['בית ספר יסודי', 'בית ספר תיכון', 'בית ספר פרטי'],
      work: ['במשרד', 'מהבית', 'נסיעות'],
      daycare: ['מעון יום', 'פעוטון'],
      university: ['אוניברסיטה', 'מכללה']
    };
    return suggestions[type] || ['לא ידוע'];
  }
  
  private mapFrameworkTypeToCategory(type: DailyFramework['type']): CalendarEvent['category'] {
    const mapping: Record<DailyFramework['type'], CalendarEvent['category']> = {
      kindergarten: 'childcare',
      school: 'education',
      work: 'work',
      daycare: 'childcare',
      university: 'education'
    };
    return mapping[type];
  }
  
  private timeStringToISO(timeString: string): string {
    // המרת "08:00" ל-ISO string של היום
    const today = new Date();
    const [hours, minutes] = timeString.split(':').map(Number);
    today.setHours(hours, minutes, 0, 0);
    return today.toISOString();
  }
  
  private subtractMinutesFromTime(timeString: string, minutes: number): string {
    // המרת "08:00" להפחתת דקות
    const date = new Date();
    const [hours, mins] = timeString.split(':').map(Number);
    date.setHours(hours, mins - minutes, 0, 0);
    return date.toISOString();
  }
  
  private getSystemPrompt(context: ChatContext): string {
    return `
אתה עוזר תכנון לוח זמנים חכם.

שלב נוכחי: ${context.currentGoal}

עקרונות:
1. שאל שאלה אחת בכל פעם
2. היה ספציפי ומעשי
3. הצע עוגנים חוזרים כשיש מספיק מידע
4. השתמש בעברית טבעית
`;
  }
}

// ייצוא instance יחיד
export const planningChatService = new PlanningChatService();
