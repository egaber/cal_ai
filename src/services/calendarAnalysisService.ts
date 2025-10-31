import { CalendarEvent } from '@/types/calendar';
import { 
  CalendarInsights, 
  AnalyzeCalendarRequest,
  AnalyzeCalendarResponse 
} from '@/types/calendarInsights';
import { llmService } from './llmService';
import { createEventService } from './eventService';

class CalendarAnalysisService {
  /**
   * Load all events for analysis (both Google and local calendars)
   */
  async loadEventHistory(
    userId: string, 
    familyId: string
  ): Promise<CalendarEvent[]> {
    try {
      // Load from both sources
      const localService = createEventService(familyId, userId, 'cal_ai');
      const googleService = createEventService(familyId, userId, 'google');
      
      const [localEvents, googleEvents] = await Promise.all([
        localService.loadAllEvents(),
        googleService.loadAllEvents()
      ]);
      
      // Combine and sort by date
      const allEvents = [...localEvents, ...googleEvents];
      allEvents.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      
      return allEvents;
    } catch (error) {
      console.error('Failed to load event history:', error);
      throw error;
    }
  }

  /**
   * Prepare events for AI analysis (simplify and format)
   */
  prepareEventsForAnalysis(events: CalendarEvent[]): AnalyzeCalendarRequest['events'] {
    return events.map(event => ({
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      category: event.category,
      memberId: event.memberId,
      // location: event.location, // Not in CalendarEvent type yet
      description: event.description,
      isRecurring: !!event.recurrence
    }));
  }

  /**
   * Format events for the AI prompt
   */
  formatEventsForPrompt(events: CalendarEvent[]): string {
    return events.map((event, index) => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      const duration = Math.round((end.getTime() - start.getTime()) / 60000); // minutes
      
      const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
      const dayOfWeek = dayNames[start.getDay()];
      
      const timeStr = start.toLocaleTimeString('he-IL', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      
      const dateStr = start.toLocaleDateString('he-IL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      let eventStr = `${index + 1}. "${event.title}"`;
      eventStr += `\n   תאריך: ${dateStr} (${dayOfWeek})`;
      eventStr += `\n   שעה: ${timeStr}`;
      eventStr += `\n   משך: ${duration} דקות`;
      eventStr += `\n   קטגוריה: ${event.category}`;
      
      // Location not in CalendarEvent type yet
      // if (event.location) {
      //   eventStr += `\n   מיקום: ${event.location}`;
      // }
      
      if (event.recurrence) {
        eventStr += `\n   חוזר: כן`;
      }
      
      return eventStr;
    }).join('\n\n');
  }

  /**
   * Build the analysis prompt (in Hebrew)
   */
  buildAnalysisPrompt(events: CalendarEvent[]): string {
    const totalEvents = events.length;
    const dateRange = this.getDateRange(events);
    const eventsFormatted = this.formatEventsForPrompt(events);
    
    const prompt = `אתה עוזר בינה מלאכותית מתקדם שלומד את ההרגלים, הדפוסים והמבנה המשפחתי של משתמשים מתוך ניתוח היומן שלהם.

משימתך: נתח את רשימת האירועים הבאה והסק תובנות מעמיקות על:
1. בני המשפחה ותפקידיהם
2. פעולות קבועות (עוגנים יומיים/שבועיים)
3. הרגלי עבודה ופנאי
4. העדפות זמן ותזמון
5. דפוסים חוזרים

נתונים:
- סה"כ אירועים: ${totalEvents}
- טווח תאריכים: ${dateRange}

רשימת אירועים:
${eventsFormatted}

הנחיות לניתוח:
1. חפש דפוסים חוזרים - אירועים שקורים באותו יום/שעה
2. זהה תפקידים - מי עושה מה (עבודה, הסעות, פגישות)
3. מצא עוגנים - פעילויות קבועות שמסביבן מתארגן השבוע
4. זהה העדפות זמן - מתי יש פגישות, מתי זמן חופשי
5. הצע תובנות - מה אפשר ללמוד על סדר היום והרגלים

דרישות תשובה:
- השב ב-JSON בלבד, ללא טקסט נוסף
- כלול רמת ביטחון (0-100) לכל תובנה
- היה ספציפי ומדויק בהתבסס על הנתונים
- אם אין מספיק נתונים למסקנה, ציין זאת

מבנה JSON מצופה:
{
  "familyMembers": [
    {
      "name": "שם או תיאור",
      "role": "תפקיד/תיאור",
      "responsibilities": ["אחריות 1", "אחריות 2"],
      "confidence": 85
    }
  ],
  "recurringAnchors": [
    {
      "activity": "שם הפעילות",
      "dayOfWeek": "יום בשבוע",
      "time": "08:00",
      "duration": 60,
      "participants": ["מי מעורב"],
      "location": "מיקום (אופציונלי)",
      "confidence": 90,
      "frequency": "כל יום / פעם בשבוע"
    }
  ],
  "habits": [
    {
      "description": "תיאור ההרגל",
      "pattern": "daily/weekly/monthly",
      "timePreference": "בוקר/צהריים/ערב",
      "confidence": 80,
      "examples": ["דוגמה 1", "דוגמה 2"]
    }
  ],
  "timePreferences": {
    "workingHours": {
      "start": "09:00",
      "end": "17:00",
      "confidence": 85
    },
    "meetingPreferences": {
      "preferredTimes": ["10:00-12:00"],
      "avoidedTimes": ["08:00-09:00"],
      "averageDuration": 60,
      "confidence": 75
    },
    "personalTime": {
      "breakTimes": ["12:00-13:00"],
      "familyTime": ["17:00-19:00"],
      "confidence": 80
    }
  },
  "generalInsights": [
    {
      "type": "pattern/conflict/opportunity/recommendation",
      "title": "כותרת התובנה",
      "description": "תיאור מפורט",
      "impact": "positive/neutral/negative",
      "confidence": 85,
      "suggestedAction": "המלצה לפעולה (אופציונלי)"
    }
  ],
  "confidence": 85,
  "needsMoreData": false,
  "suggestedAnalysisFrequency": "weekly/monthly"
}

התחל בניתוח:`;

    return prompt;
  }

  /**
   * Get date range from events
   */
  private getDateRange(events: CalendarEvent[]): string {
    if (events.length === 0) return 'אין אירועים';
    
    const dates = events.map(e => new Date(e.startTime));
    const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
    const latest = new Date(Math.max(...dates.map(d => d.getTime())));
    
    const formatDate = (date: Date) => date.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    return `${formatDate(earliest)} - ${formatDate(latest)}`;
  }

  /**
   * Analyze calendar with AI
   */
  async analyzeCalendar(
    userId: string,
    familyId: string
  ): Promise<AnalyzeCalendarResponse> {
    try {
      console.log('🧠 Starting calendar analysis...');
      
      // Load all events
      const events = await this.loadEventHistory(userId, familyId);
      console.log(`📊 Loaded ${events.length} events for analysis`);
      
      if (events.length === 0) {
        return {
          success: false,
          error: 'No events found to analyze'
        };
      }
      
      // Build prompt
      const prompt = this.buildAnalysisPrompt(events);
      console.log('📝 Prompt built, sending to AI...');
      
      // Get available models
      const availableModels = await llmService.getAvailableModels();
      if (availableModels.length === 0) {
        throw new Error('No LLM models available. Please configure API keys.');
      }
      
      // Use first available model (prefer Azure OpenAI or Gemini)
      const model = availableModels.find(m => m.provider === 'azure-openai' || m.provider === 'gemini') 
                   || availableModels[0];
      
      console.log(`🤖 Using model: ${model.name} (${model.provider})`);
      
      // Send to AI
      const response = await llmService.chat({
        messages: [{ role: 'user', content: prompt }],
        model
      });
      
      console.log('✅ Received AI response');
      
      // Parse JSON response
      let insightsData;
      try {
        // Extract text from response
        const responseText = response.content || '';
        
        // Try to extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          insightsData = JSON.parse(jsonMatch[0]);
        } else {
          insightsData = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        console.log('Raw response:', response);
        throw new Error('AI response is not valid JSON');
      }
      
      // Build full insights object
      const insights: CalendarInsights = {
        userId,
        analyzedAt: new Date().toISOString(),
        eventsAnalyzed: events.length,
        dateRange: {
          from: events[0].startTime,
          to: events[events.length - 1].startTime
        },
        ...insightsData
      };
      
      console.log('💾 Analysis complete:', insights);
      
      return {
        success: true,
        insights
      };
      
    } catch (error) {
      console.error('❌ Calendar analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save insights to storage (localStorage for now, Firestore later)
   */
  async saveInsights(insights: CalendarInsights): Promise<void> {
    try {
      localStorage.setItem(
        `calendar_insights_${insights.userId}`,
        JSON.stringify(insights)
      );
      console.log('💾 Insights saved to localStorage');
    } catch (error) {
      console.error('Failed to save insights:', error);
    }
  }

  /**
   * Load insights from storage
   */
  async loadInsights(userId: string): Promise<CalendarInsights | null> {
    try {
      const stored = localStorage.getItem(`calendar_insights_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('Failed to load insights:', error);
      return null;
    }
  }
}

export const calendarAnalysisService = new CalendarAnalysisService();
