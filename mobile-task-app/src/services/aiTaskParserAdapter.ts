// Adapter to connect AI Task Parser with main LLM Service

import { llmService, type LLMModel } from '../../../src/services/llmService';
import { aiTaskParser } from './aiTaskParser';

/**
 * Adapter class that bridges the AI Task Parser with the main LLM Service
 */
class AITaskParserAdapter {
  private initialized = false;

  /**
   * Initialize the AI parser with the LLM service
   */
  initialize() {
    if (this.initialized) return;

    // Create adapter that matches the interface expected by aiTaskParser
    const llmServiceAdapter = {
      async chat(request: {
        messages: Array<{ role: string; content: string }>;
        model: { id: string; provider: string };
        systemPrompt?: string;
      }) {
        // Convert to LLMModel format
        const model: LLMModel = {
          id: request.model.id,
          name: request.model.id,
          vendor: request.model.provider,
          provider: request.model.provider as any
        };

        const response = await llmService.chat({
          messages: request.messages.map(m => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content
          })),
          model,
          systemPrompt: request.systemPrompt
        });

        return response;
      },

      async getAvailableModels() {
        const models = await llmService.getAvailableModels();
        return models.map(m => ({
          id: m.id,
          provider: m.provider,
          name: m.name
        }));
      }
    };

    aiTaskParser.setLLMService(llmServiceAdapter as any);
    this.initialized = true;
    console.log('[AI Parser Adapter] Initialized successfully');
  }

  /**
   * Parse task using AI
   */
  async parseTask(text: string, existingTasks?: string[], existingCategories?: string[]) {
    if (!this.initialized) {
      this.initialize();
    }
    
    return aiTaskParser.parseWithAI(text, existingTasks, existingCategories);
  }

  /**
   * Run test cases
   */
  async runTests() {
    if (!this.initialized) {
      this.initialize();
    }
    
    return aiTaskParser.testAIParsing();
  }
}

// Export singleton instance
export const aiTaskParserAdapter = new AITaskParserAdapter();
