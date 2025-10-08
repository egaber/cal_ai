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
}

// Singleton instance
export const llmService = new LLMService();
