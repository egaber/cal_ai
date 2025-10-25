// AI-Powered Task Parser
// Uses LLM with full family context to parse tasks intelligently

import { ParsedTask, FamilyMemberName, TimeValue, TimeBucket, RecurringPattern } from '../types/mobileTask';
import { FAMILY_MEMBERS, KNOWN_PLACES } from '../utils/patterns';
import { parseTask } from './taskParser'; // Fallback to rule-based parser

// This would be imported from your main app's LLM service
interface LLMService {
  chat: (request: {
    messages: Array<{ role: string; content: string }>;
    model: { id: string; provider: string };
    systemPrompt?: string;
  }) => Promise<{ content: string; error?: string }>;
  getAvailableModels: () => Promise<Array<{ id: string; provider: string; name: string }>>;
}

interface AIParseResult {
  involvedMembers?: FamilyMemberName[];
  location?: string;
  specificDate?: string;
  specificTime?: { hour: number; minute: number };
  timeBucket?: 'today' | 'tomorrow' | 'this-week' | 'next-week' | 'unlabeled';
  priority?: 'P1' | 'P2' | 'P3';
  recurring?: string;
  category?: string;
  categoryIcon?: string;
  requiresDriving?: boolean;
  drivingDuration?: number;
  reasoning?: string;
  confidence?: number;
}

export class AITaskParser {
  private llmService: LLMService | null = null;
  
  constructor(llmService?: LLMService) {
    this.llmService = llmService || null;
  }

  setLLMService(service: LLMService) {
    this.llmService = service;
  }

  /**
   * Build comprehensive system prompt with all family context
   */
  private buildSystemPrompt(): string {
    return `You are an intelligent task parsing assistant for a family calendar app. Your role is to parse Hebrew and English task descriptions into structured data.

# Family Context

## Family Members:
${FAMILY_MEMBERS.map(m => `- ${m.name} (${m.displayNameHebrew}): ${m.age ? `${m.age} years old` : 'adult'}, ${m.isChild ? 'child' : 'adult'}${m.needsSupervision ? ', needs supervision' : ''}`).join('\n')}

## Known Locations:
${KNOWN_PLACES.map(p => `- ${p.displayNameHebrew} (${p.displayName}): ${p.drivingTimeFromHome} min drive${p.requiresDriving ? ', requires driving' : ''}`).join('\n')}

## Special Locations (Relationships):
- Moshav Arugot (ערוגות): Ella's parents live here, 60 min drive, all family visits
- Tel Aviv (תל אביב): Eyal's parents live here, 45 min drive

# Parsing Rules

## 1. Activity-Based Children Selection:
- **Kindergarten (גן)**: Include Yael (5.5 years) and Alon (3 years) ONLY
- **School (בית ספר)**: Include Hilly (11 years) ONLY
- **Family events**: Include ALL family members

## 2. Activity-Based Time Inference:
- Kindergarten pickup (איסוף מהגן): 16:00
- School pickup: 14:00
- Kindergarten drop-off: 08:00
- School drop-off: 07:30
- Dinner (ארוחת ערב): 19:00
- Lunch (ארוחת צהריים): 13:00
- Breakfast: 07:30
- Bedtime (שינה): 21:00 for children

## 3. Location Detection:
- Direct mention: "בערוגות" → Moshav Arugot
- Relationship: "הורים של אלה" → Moshav Arugot
- Cross-validate when both mentioned

## 4. Time of Day Defaults:
- Morning (בוקר): 09:00
- Afternoon (אחר הצהריים): 14:00
- Evening (ערב): 18:00
- Night (לילה): 22:00

## 5. Day of Week:
- Friday evening (שישי בערב): Friday 17:00
- Weekend (סוף שבוע): Friday-Saturday

## 6. Hebrew Date Parsing:
- "ב22 לאוקטובר" → October 22, 2025
- Hebrew months: ינואר=Jan, פברואר=Feb, מרץ=Mar, אפריל=Apr, מאי=May, יוני=Jun, יולי=Jul, אוגוסט=Aug, ספטמבר=Sep, אוקטובר=Oct, נובמבר=Nov, דצמבר=Dec

## 7. Category Classification:
Choose the most appropriate category or create a new one:
- health, work, personal, family, education, social, finance, home, travel, fitness
- food, shopping, entertainment, sports, hobby, volunteer, appointment, maintenance
- celebration, meeting, childcare, pet, errand, transport, project, deadline
- If none fit perfectly, suggest a new category with appropriate emoji

## 8. Driving Requirements:
- Location requires driving + children need supervision = driving required
- Calculate duration from known locations
- Consider if adults only (may not need children's car seats)

## 9. Multiple Recurring Days:
- "כל יום שני וחמישי" = Monday (1) and Thursday (4)
- "ראשון ושלישי" = Sunday (0) and Tuesday (2)
- Return as array: [1, 4] for multiple days
- Single day uses string: "weekday-1" for Monday only

# Output Format

Return ONLY a JSON object with this structure (omit fields that don't apply):

{
  "involvedMembers": ["Name1", "Name2"],
  "location": "location name",
  "specificDate": "YYYY-MM-DD",
  "specificTime": { "hour": 16, "minute": 0 },
  "timeBucket": "today|tomorrow|this-week|next-week|unlabeled",
  "priority": "P1|P2|P3",
  "recurring": "daily|weekly|monthly|weekday-0|morning|evening|none" OR [1, 4] for multiple days,
  "category": "category name",
  "categoryIcon": "emoji",
  "requiresDriving": true,
  "drivingDuration": 60,
  "reasoning": "Brief explanation of your inference",
  "confidence": 0.95
}

# Important Guidelines:
- Be precise with children age ranges
- Cross-validate location hints
- Infer implicit information (family visits = all members)
- Consider Hebrew date formats carefully
- Use confidence score (0-1) to indicate certainty
- Provide reasoning for complex inferences
- Return ONLY valid JSON, no extra text`;
  }

  /**
   * Parse task using AI with full context
   */
  async parseWithAI(
    text: string,
    existingTasks?: string[],
    existingCategories?: string[]
  ): Promise<ParsedTask> {
    if (!this.llmService) {
      console.warn('LLM service not available, falling back to rule-based parser');
      return parseTask(text);
    }

    try {
      // Get fastest available model
      const models = await this.llmService.getAvailableModels();
      
      // Prefer FASTEST models first (GPT-5 Mini is fastest)
      const preferredModels = ['gpt-5-mini', 'gemini-2.0-flash-exp', 'grok-4-fast-reasoning', 'gpt-4.1'];
      const selectedModel = models.find(m => preferredModels.includes(m.id)) || models[0];
      
      if (!selectedModel) {
        throw new Error('No LLM models available');
      }

      console.log(`[AI Parser] Using model: ${selectedModel.name}`);
      
      // Build context-rich prompt
      let userPrompt = `Parse this task: "${text}"`;
      
      if (existingTasks && existingTasks.length > 0) {
        userPrompt += `\n\nRecent tasks for context:\n${existingTasks.slice(0, 5).join('\n')}`;
      }
      
      if (existingCategories && existingCategories.length > 0) {
        userPrompt += `\n\nExisting categories:\n${existingCategories.join(', ')}`;
      }

      const startTime = Date.now();
      
      const response = await this.llmService.chat({
        messages: [
          { role: 'user', content: userPrompt }
        ],
        model: selectedModel,
        systemPrompt: this.buildSystemPrompt()
      });

      const latency = Date.now() - startTime;
      console.log(`[AI Parser] Latency: ${latency}ms`);

      if (response.error) {
        throw new Error(response.error);
      }

      // Extract JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const aiResult: AIParseResult = JSON.parse(jsonMatch[0]);
      
      console.log('[AI Parser] Result:', aiResult);
      console.log('[AI Parser] Reasoning:', aiResult.reasoning);
      console.log('[AI Parser] Confidence:', aiResult.confidence);

      // Get base parse from rule-based parser
      const baseParse = parseTask(text);
      
      // Build enhanced text by ADDING inferred information
      let enhancedText = text;
      const addedParts: string[] = [];
      
      // Add location if AI inferred it and parser didn't find it
      if (aiResult.location && !baseParse.location) {
        addedParts.push(`📍${aiResult.location}`);
      }
      
      // Add involved members if AI found more than parser
      if (aiResult.involvedMembers && aiResult.involvedMembers.length > baseParse.involvedMembers.length) {
        const newMembers = aiResult.involvedMembers.filter(m => !baseParse.involvedMembers.includes(m));
        if (newMembers.length > 0) {
          const hebrewNames = newMembers.map(m => {
            const member = FAMILY_MEMBERS.find(fm => fm.name === m);
            return member?.displayNameHebrew || m;
          });
          addedParts.push(`עם ${hebrewNames.join(', ')}`);
        }
      }
      
      // Add time if AI inferred it and parser didn't
      if (aiResult.specificTime && !baseParse.specificTime) {
        addedParts.push(`בשעה ${String(aiResult.specificTime.hour).padStart(2, '0')}:${String(aiResult.specificTime.minute).padStart(2, '0')}`);
      }
      
      // Add date if AI inferred it and parser didn't
      if (aiResult.specificDate && !baseParse.specificDate) {
        const date = new Date(aiResult.specificDate);
        addedParts.push(`ב-${date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}`);
      }
      
      // Add driving info if AI inferred it
      if (aiResult.requiresDriving && aiResult.drivingDuration && !baseParse.drivingDuration) {
        addedParts.push(`🚗 ${aiResult.drivingDuration} דקות נסיעה`);
      }
      
      // Combine original text with added parts (if any)
      if (addedParts.length > 0) {
        enhancedText = `${text} (${addedParts.join(', ')})`;
        console.log('[AI Parser] Added inferred info:', addedParts.join(', '));
      }
      
      // Add category marker if AI suggested one
      if (aiResult.category && aiResult.categoryIcon) {
        enhancedText = `@category:${aiResult.category}:${aiResult.categoryIcon} ${enhancedText}`;
      }
      
      // Re-parse the enhanced text to get new highlighted segments
      const enhancedParse = parseTask(enhancedText);
      
      // Add AI metadata
      enhancedParse.metadata = {
        usedAI: true,
        aiModel: selectedModel.name,
        aiLatency: latency,
        aiConfidence: aiResult.confidence,
        aiReasoning: aiResult.reasoning,
        category: aiResult.category,
        categoryIcon: aiResult.categoryIcon
      };

      return enhancedParse;

    } catch (error) {
      console.error('[AI Parser] Error:', error);
      console.warn('[AI Parser] Falling back to rule-based parser');
      return parseTask(text);
    }
  }

  /**
   * Test AI parser with example inputs
   */
  async testAIParsing() {
    const testCases = [
      'לקחת את הילדים לגן',
      'שיננית ב22 לאוקטובר',
      'ארוחת שישי השבוע בערוגות אצל ההורים של אלה',
      'הולכים להורים של אלה בשישי בערב',
      'איסוף מהגן',
      'קניות ביום הולדת של יעל',
      'פגישת הורים בבית הספר'
    ];

    console.log('=== AI Parser Test Results ===\n');
    
    for (const testCase of testCases) {
      console.log(`Input: "${testCase}"`);
      try {
        const result = await this.parseWithAI(testCase);
        console.log('Result:', {
          involved: result.involvedMembers,
          location: result.location,
          time: result.specificTime,
          date: result.specificDate,
          bucket: result.timeBucket,
          driving: result.requiresDriving ? `${result.drivingDuration}min` : 'no',
          category: result.metadata?.category,
          confidence: result.metadata?.aiConfidence,
          reasoning: result.metadata?.aiReasoning
        });
      } catch (error) {
        console.error('Error:', error);
      }
      console.log('---\n');
    }
  }
}

// Export singleton instance
export const aiTaskParser = new AITaskParser();
