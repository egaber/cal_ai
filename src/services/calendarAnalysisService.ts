import { CalendarEvent, FamilyMember } from '@/types/calendar';
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
   * Format family members for prompt
   */
  formatFamilyMembersForPrompt(familyMembers: FamilyMember[]): string {
    return familyMembers.map((member, index) => {
      const ageStr = member.age && member.age > 0 ? `, ${member.age} years old` : '';
      const roleStr = member.role ? ` (${member.role})` : '';
      return `${index + 1}. ${member.name}${roleStr}${ageStr}`;
    }).join('\n');
  }

  /**
   * Build the analysis prompt (in English for better results)
   */
  buildAnalysisPrompt(events: CalendarEvent[], familyMembers: FamilyMember[]): string {
    const totalEvents = events.length;
    const dateRange = this.getDateRange(events);
    const eventsFormatted = this.formatEventsForPrompt(events);
    const familyMembersFormatted = this.formatFamilyMembersForPrompt(familyMembers);
    
    const prompt = `You are an AI family planner that analyzes a family's shared calendar and produces structured insights about their life patterns and responsibilities.

## Family Members:
${familyMembersFormatted || 'No family member information provided'}

## Calendar Events (${totalEvents} events from ${dateRange}):
${eventsFormatted}

## Your Task:
Extract meaningful, structured insights ("facts") about how the family operates — routines, roles, dependencies, and time use patterns.

## Analysis Guidelines:
- Focus only on insights that are **recurrent, consistent, or functionally significant**
- Each insight should reference **specific family members** when relevant
- Do not invent information — infer only from observed patterns
- Include logistical details if relevant (e.g., who drives, estimated travel time, dependencies)
- Note potential conflicts between events (overlaps) as separate insights
- Skip vague events unless they are clearly meaningful
- For activities with locations, try to understand travel logistics (who takes/picks up, travel time)

## Available Categories (choose the most relevant):
טיפול בילדים | הסעות | נסיעות | תחזוקת בית | זמן משותף | עבודה | פגישות חברתיות | אירוח משפחה | התארחות אצל משפחה | חופשה בארץ | חופשה בחו״ל | ספורט | אירוע | זום | אסיפת הורים | יום הורים | בייביסיטר | חגים | אחר

## Output Format (JSON only, no additional text):
{
  "insights": [
    {
      "summary": "Short natural language sentence describing the insight",
      "related_people": ["family member names involved"],
      "category": "one of the categories above",
      "importance": "נמוכה | בינונית | גבוהה",
      "confidence": 0.85,
      "source_events": ["relevant event titles"]
    }
  ],
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
    familyId: string,
    familyMembers: FamilyMember[] = []
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
      
      // Build prompt with family members
      const prompt = this.buildAnalysisPrompt(events, familyMembers);
      console.log('📝 Prompt built, sending to AI...');
      
      // Get user's selected model from modelConfigService
      const { modelConfigService } = await import('./modelConfigService');
      const availableModels = await llmService.getAvailableModels();
      
      if (availableModels.length === 0) {
        throw new Error('No LLM models available. Please configure API keys in Account Settings.');
      }
      
      const selectedModel = modelConfigService.findModel(availableModels);
      
      if (!selectedModel) {
        throw new Error('No LLM model found. Please select a model in Account Settings.');
      }
      
      console.log(`🤖 Using selected model: ${selectedModel.name} (${selectedModel.provider})`);
      
      // Send to AI
      const response = await llmService.chat({
        messages: [{ role: 'user', content: prompt }],
        model: selectedModel
      });
      
      console.log('✅ Received AI response');
      
      // Parse JSON response
      let insightsData;
      try {
        // Extract text from response
        let responseText = response.content || '';
        
        // Remove markdown code blocks if present
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // Remove any leading/trailing whitespace
        responseText = responseText.trim();
        
        // Fix common JSON issues from Hebrew text
        // Replace problematic backslashes in Hebrew text
        responseText = responseText.replace(/אחה\\"צ/g, 'אחר הצהריים');
        responseText = responseText.replace(/בוקר\\/g, 'בוקר ');
        responseText = responseText.replace(/צהריים\\/g, 'צהריים ');
        responseText = responseText.replace(/ערב\\/g, 'ערב ');
        
        // Try to extract JSON from response (find first { to last })
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonStr = responseText.substring(firstBrace, lastBrace + 1);
          insightsData = JSON.parse(jsonStr);
        } else {
          // Fallback: try to parse as-is
          insightsData = JSON.parse(responseText);
        }
        
        console.log('✅ Successfully parsed insights data');
      } catch (parseError) {
        console.error('❌ Failed to parse AI response as JSON:', parseError);
        console.log('📄 Raw response (first 1000 chars):', response.content?.substring(0, 1000));
        console.log('📄 Problem area (around error):', response.content?.substring(1350, 1450));
        throw new Error(`AI response is not valid JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
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

  /**
   * Predict upcoming events for the next 7 days
   */
  async predictUpcomingEvents(
    userId: string,
    familyId: string,
    familyMembers: FamilyMember[] = []
  ): Promise<import('@/types/calendarInsights').PredictEventsResponse> {
    try {
      console.log('🔮 Starting event prediction...');
      
      // Load insights if available
      const insights = await this.loadInsights(userId);
      
      // Load historical events
      const events = await this.loadEventHistory(userId, familyId);
      
      if (events.length === 0) {
        return {
          success: false,
          error: 'No historical events to base predictions on'
        };
      }
      
      const familyMembersFormatted = this.formatFamilyMembersForPrompt(familyMembers);
      const eventsFormatted = this.formatEventsForPrompt(events.slice(-50)); // Last 50 events
      
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      const prompt = `You are an AI family planner. Based on historical calendar data and learned patterns, predict upcoming events for the next 7 days.

## Family Members:
${familyMembersFormatted || 'No family member information'}

## Recent Events (last 50):
${eventsFormatted}

${insights ? `## Learned Insights:
- Recurring activities: ${insights.recurringAnchors.map(a => `${a.activity} on ${a.dayOfWeek} at ${a.time}`).join(', ')}
- Key responsibilities: ${insights.familyMembers.map(m => `${m.name}: ${m.responsibilities.join(', ')}`).join(' | ')}
` : ''}

## Task:
Predict likely events for the period: ${today.toLocaleDateString('he-IL')} to ${nextWeek.toLocaleDateString('he-IL')}

Consider:
- Recurring patterns from historical data
- Day of week patterns
- Family member responsibilities
- Typical timing and duration
- Potential scheduling conflicts

## Available Categories:
טיפול בילדים | הסעות | נסיעות | תחזוקת בית | זמן משותף | עבודה | פגישות חברתיות | אירוח משפחה | התארחות אצל משפחה | חופשה בארץ | חופשה בחו״ל | ספורט | אירוע | זום | אסיפת הורים | יום הורים | בייביסיטר | חגים | אחר

## Output (JSON only):
{
  "predictions": [
    {
      "title": "event title",
      "predicted_date": "2025-11-01",
      "predicted_time": "08:00",
      "duration": 60,
      "category": "category from list",
      "responsible_people": ["names"],
      "confidence": 0.85,
      "reasoning": "why this prediction",
      "potential_conflicts": ["possible conflicts"]
    }
  ]
}`;

      // Get selected model
      const { modelConfigService } = await import('./modelConfigService');
      const availableModels = await llmService.getAvailableModels();
      const selectedModel = modelConfigService.findModel(availableModels);
      
      if (!selectedModel) {
        throw new Error('No LLM model available');
      }
      
      console.log(`🤖 Using model: ${selectedModel.name}`);
      
      const response = await llmService.chat({
        messages: [{ role: 'user', content: prompt }],
        model: selectedModel
      });
      
      // Parse response
      let responseText = response.content || '';
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const firstBrace = responseText.indexOf('{');
      const lastBrace = responseText.lastIndexOf('}');
      const jsonStr = responseText.substring(firstBrace, lastBrace + 1);
      const predData = JSON.parse(jsonStr);
      
      const predictions: import('@/types/calendarInsights').CalendarPredictions = {
        userId,
        predictedAt: new Date().toISOString(),
        predictionPeriod: {
          from: today.toISOString(),
          to: nextWeek.toISOString()
        },
        predictions: predData.predictions || [],
        basedOnInsights: !!insights,
        confidence: predData.predictions?.length > 0 ? 
          predData.predictions.reduce((sum: number, p: { confidence: number }) => sum + p.confidence, 0) / predData.predictions.length * 100 : 0
      };
      
      console.log('🔮 Predictions complete:', predictions);
      
      return {
        success: true,
        predictions
      };
      
    } catch (error) {
      console.error('❌ Prediction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const calendarAnalysisService = new CalendarAnalysisService();
