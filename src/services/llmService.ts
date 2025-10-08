// LLM Service - handles connections to different LLM providers

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMModel {
  id: string;
  name: string;
  vendor: string;
  provider: 'gemini' | 'local';
}

export interface ToolCall {
  tool: string;
  parameters: Record<string, unknown>;
}

export interface ChatRequest {
  messages: Message[];
  model: LLMModel;
  tools?: {
    name: string;
    description: string;
    parameters: unknown;
  }[];
  systemPrompt?: string;
}

export interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
  error?: string;
}

// Gemini API Handler
class GeminiHandler {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: Message[], systemPrompt?: string, tools?: ChatRequest['tools']): Promise<ChatResponse> {
    try {
      // Add system prompt as first message if provided
      const allMessages = systemPrompt
        ? [{ role: 'user' as const, content: systemPrompt }, ...messages]
        : messages;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: allMessages.map(msg => ({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }]
            }))
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

      return { 
        content,
        toolCalls: this.extractToolCalls(content)
      };
    } catch (error) {
      console.error('Gemini error:', error);
      return {
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private extractToolCalls(content: string): ToolCall[] | undefined {
    // Try to extract JSON tool calls from the response
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.tool && parsed.parameters) {
          return [parsed];
        }
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].tool) {
          return parsed;
        }
      } catch {
        // Not valid JSON, continue
      }
    }
    return undefined;
  }
}

// Local VS LM API Handler
class LocalLMHandler {
  async getModels(): Promise<LLMModel[]> {
    try {
      const response = await fetch('http://localhost:3000/api/models');
      const data = await response.json();

      if (data.success && data.models) {
        return data.models.map((model: { id: string; name: string; vendor: string }) => ({
          id: model.id,
          name: model.name,
          vendor: model.vendor,
          provider: 'local' as const
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching local models:', error);
      return [];
    }
  }

  async chat(messages: Message[], modelId?: string, systemPrompt?: string, tools?: ChatRequest['tools']): Promise<ChatResponse> {
    try {
      // Add system prompt as first message if provided
      const allMessages = systemPrompt
        ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
        : messages;

      const requestBody: { 
        messages: { role: string; content: string }[];
        model?: { id: string };
        tools?: ChatRequest['tools'];
      } = {
        messages: allMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      };

      // Add model if specified
      if (modelId) {
        requestBody.model = { id: modelId };
      }

      // Add tools if specified
      if (tools) {
        requestBody.tools = tools;
      }

      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Local LM API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Extract content from response
      const content = data.response || 
                     data.choices?.[0]?.message?.content || 
                     data.message?.content || 
                     data.content || 
                     'No response';

      // Extract tool calls if present
      const toolCalls = data.tool_calls || 
                       data.choices?.[0]?.message?.tool_calls ||
                       this.extractToolCalls(content);

      return { content, toolCalls };
    } catch (error) {
      console.error('Local LM error:', error);
      return {
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private extractToolCalls(content: string): ToolCall[] | undefined {
    // Try to extract JSON tool calls from the response
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.tool && parsed.parameters) {
          return [parsed];
        }
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].tool) {
          return parsed;
        }
      } catch {
        // Not valid JSON, continue
      }
    }
    return undefined;
  }
}

// Main LLM Service
export class LLMService {
  private geminiHandler: GeminiHandler | null = null;
  private localHandler: LocalLMHandler;

  constructor() {
    this.localHandler = new LocalLMHandler();
  }

  setGeminiKey(apiKey: string) {
    this.geminiHandler = new GeminiHandler(apiKey);
  }

  async getAvailableModels(): Promise<LLMModel[]> {
    const models: LLMModel[] = [];

    // Add Gemini if API key is set
    if (this.geminiHandler) {
      models.push({
        id: 'gemini-pro',
        name: 'Gemini Pro',
        vendor: 'Google',
        provider: 'gemini'
      });
    }

    // Add local models
    const localModels = await this.localHandler.getModels();
    models.push(...localModels);

    return models;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { messages, model, tools, systemPrompt } = request;

    if (model.provider === 'gemini') {
      if (!this.geminiHandler) {
        return {
          content: '',
          error: 'Gemini API key not set'
        };
      }
      return this.geminiHandler.chat(messages, systemPrompt, tools);
    } else {
      return this.localHandler.chat(messages, model.id, systemPrompt, tools);
    }
  }

  async generateEventEmoji(title: string, description: string = '', category: string = ''): Promise<string> {
    try {
      const systemPrompt = `You are an emoji expert. Given an event title, description, and category, suggest a SINGLE most appropriate emoji that best represents the event. 
      
Rules:
- Return ONLY the emoji character, nothing else
- Choose an emoji that clearly represents the main activity or purpose
- Be creative but relevant
- Consider the context and category`;

      const userMessage = `Event: "${title}"${description ? `\nDescription: "${description}"` : ''}${category ? `\nCategory: ${category}` : ''}

What is the single best emoji for this event?`;

      const messages: Message[] = [
        { role: 'user', content: userMessage }
      ];

      // Try to get available models
      const models = await this.getAvailableModels();
      
      if (models.length === 0) {
        // Fallback to default emoji based on category if no LLM available
        return this.getDefaultEmojiForCategory(category);
      }

      const response = await this.chat({
        messages,
        model: models[0], // Use first available model
        systemPrompt
      });

      if (response.error || !response.content) {
        return this.getDefaultEmojiForCategory(category);
      }

      // Extract emoji from response (remove any extra text)
      const emojiMatch = response.content.match(/[\p{Emoji}]/u);
      if (emojiMatch) {
        return emojiMatch[0];
      }

      // If no emoji found, return default
      return this.getDefaultEmojiForCategory(category);
    } catch (error) {
      console.error('Error generating emoji:', error);
      return this.getDefaultEmojiForCategory(category);
    }
  }

  async generateEventMetadata(title: string, description: string = ''): Promise<{ emoji: string; category: string }> {
    try {
      const systemPrompt = `You are an intelligent event categorization assistant. Analyze event titles and descriptions to suggest the most appropriate category and emoji.

Available categories:
- health: Medical appointments, therapy, wellness
- work: Business meetings, work tasks, professional calls
- personal: Personal errands, self-care, individual tasks
- family: Family time, kids activities, family events
- education: Classes, courses, studying, learning
- social: Social gatherings, parties, meetups
- finance: Bills, payments, financial planning
- home: Household chores, maintenance, home improvement
- travel: Trips, flights, vacations
- fitness: Exercise, gym, sports activities
- food: Meals, cooking, restaurants
- shopping: Shopping trips, errands, purchases
- entertainment: Movies, shows, games, leisure
- sports: Sports games, athletic activities
- hobby: Hobbies, crafts, creative activities
- volunteer: Volunteering, community service
- appointment: General appointments, scheduled visits
- maintenance: Car maintenance, repairs, service
- celebration: Birthdays, anniversaries, special occasions
- meeting: Formal meetings, conferences
- childcare: Childcare, babysitting, kid-related
- pet: Pet care, vet visits, pet activities
- errand: Quick errands, tasks to complete
- transport: Transportation, commute, driving
- project: Project work, planning, tasks
- deadline: Important deadlines, time-sensitive tasks

Return ONLY a JSON object with this exact format:
{"emoji": "🎯", "category": "work"}

Choose the single most relevant category and a matching emoji.`;

      const userMessage = `Event: "${title}"${description ? `\nDescription: "${description}"` : ''}

Analyze this event and return the category and emoji.`;

      const messages: Message[] = [
        { role: 'user', content: userMessage }
      ];

      // Try to get available models
      const models = await this.getAvailableModels();
      
      if (models.length === 0) {
        // Fallback to defaults
        return { emoji: '📅', category: 'personal' };
      }

      const response = await this.chat({
        messages,
        model: models[0],
        systemPrompt
      });

      if (response.error || !response.content) {
        return { emoji: '📅', category: 'personal' };
      }

      // Try to extract JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.emoji && parsed.category) {
            // Validate category is in our list
            const validCategories = [
              'health', 'work', 'personal', 'family', 'education', 'social', 
              'finance', 'home', 'travel', 'fitness', 'food', 'shopping',
              'entertainment', 'sports', 'hobby', 'volunteer', 'appointment',
              'maintenance', 'celebration', 'meeting', 'childcare', 'pet',
              'errand', 'transport', 'project', 'deadline'
            ];
            
            if (validCategories.includes(parsed.category)) {
              return { emoji: parsed.emoji, category: parsed.category };
            }
          }
        } catch (e) {
          console.error('Failed to parse AI response:', e);
        }
      }

      // If parsing failed, return defaults
      return { emoji: '📅', category: 'personal' };
    } catch (error) {
      console.error('Error generating event metadata:', error);
      return { emoji: '📅', category: 'personal' };
    }
  }

  async generateEventTip(
    eventTitle: string,
    eventDescription: string,
    eventCategory: string,
    startTime: string,
    endTime: string,
    surroundingEvents: Array<{ title: string; startTime: string; endTime: string; category: string }>
  ): Promise<string> {
    try {
      // Detect if title is in Hebrew (contains Hebrew characters)
      const hasHebrew = /[\u0590-\u05FF]/.test(eventTitle);
      
      const systemPrompt = `You are a smart scheduling assistant. Analyze an event and its surrounding schedule to provide a helpful, concise tip or suggestion.

Your tips should be:
- Practical and actionable
- Context-aware (consider time of day, surrounding events, transitions)
- Brief (1-2 sentences max)
- Helpful for planning or preparation
${hasHebrew ? '- IMPORTANT: Respond in Hebrew since the event title is in Hebrew' : '- Respond in English'}

Focus on:
- Time management (buffer time, transitions)
- Preparation needed
- Potential conflicts or considerations
- Timing optimization
- Energy levels and breaks`;

      // Format surrounding events for context
      const scheduleContext = surroundingEvents.length > 0
        ? surroundingEvents.map(e => {
            const start = new Date(e.startTime);
            const end = new Date(e.endTime);
            return `- ${e.title} (${e.category}) ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
          }).join('\n')
        : 'No other events scheduled nearby';

      const eventStart = new Date(startTime);
      const eventEnd = new Date(endTime);
      const duration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);

      const userMessage = `Event to analyze:
Title: ${eventTitle}
Category: ${eventCategory}
Start: ${eventStart.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
End: ${eventEnd.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })}
Duration: ${duration} minutes
${eventDescription ? `Description: ${eventDescription}` : ''}

Surrounding events:
${scheduleContext}

Provide a brief, helpful scheduling tip or suggestion for this event.`;

      const messages: Message[] = [
        { role: 'user', content: userMessage }
      ];

      const models = await this.getAvailableModels();
      
      if (models.length === 0) {
        return ''; // No tip if no LLM available
      }

      const response = await this.chat({
        messages,
        model: models[0],
        systemPrompt
      });

      if (response.error || !response.content) {
        return '';
      }

      // Clean up the response - remove quotes and trim
      return response.content.trim().replace(/^["']|["']$/g, '');
    } catch (error) {
      console.error('Error generating event tip:', error);
      return '';
    }
  }

  private getDefaultEmojiForCategory(category: string): string {
    const categoryEmojiMap: Record<string, string> = {
      health: '🏥',
      work: '💼',
      personal: '👤',
      family: '👨‍👩‍👧‍👦',
      education: '📚',
      social: '🎉',
      finance: '💰',
      home: '🏠',
      travel: '✈️',
      fitness: '💪',
      food: '🍽️',
      shopping: '🛍️'
    };
    return categoryEmojiMap[category] || '📅';
  }
}

// Singleton instance
export const llmService = new LLMService();
