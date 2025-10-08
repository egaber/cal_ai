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

export interface ChatRequest {
  messages: Message[];
  model: LLMModel;
}

export interface ChatResponse {
  content: string;
  error?: string;
}

// Gemini API Handler
class GeminiHandler {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: Message[]): Promise<ChatResponse> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: messages.map(msg => ({
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

      return { content };
    } catch (error) {
      console.error('Gemini error:', error);
      return {
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
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

  async chat(messages: Message[], modelId?: string): Promise<ChatResponse> {
    try {
      const requestBody: { 
        messages: { content: string }[];
        model?: { id: string };
      } = {
        messages: messages.map(msg => ({
          content: msg.content
        }))
      };

      // Add model if specified
      if (modelId) {
        requestBody.model = { id: modelId };
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

      return { content };
    } catch (error) {
      console.error('Local LM error:', error);
      return {
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
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
    const { messages, model } = request;

    if (model.provider === 'gemini') {
      if (!this.geminiHandler) {
        return {
          content: '',
          error: 'Gemini API key not set'
        };
      }
      return this.geminiHandler.chat(messages);
    } else {
      return this.localHandler.chat(messages, model.id);
    }
  }
}

// Singleton instance
export const llmService = new LLMService();
