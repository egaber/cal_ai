// Centralized Model Configuration Service
// Manages model selection across all components

import { LLMModel } from './llmService';

const MODEL_CONFIG_KEY = 'selected_model_config';

export interface ModelConfig {
  selectedModelId: string | null;
  selectedProvider: 'gemini' | 'local' | 'azure-openai' | 'azure-xai' | null;
}

class ModelConfigService {
  private static instance: ModelConfigService;
  private listeners: Set<() => void> = new Set();

  private constructor() {}

  static getInstance(): ModelConfigService {
    if (!ModelConfigService.instance) {
      ModelConfigService.instance = new ModelConfigService();
    }
    return ModelConfigService.instance;
  }

  // Get the current model configuration
  getModelConfig(): ModelConfig {
    const stored = localStorage.getItem(MODEL_CONFIG_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { selectedModelId: null, selectedProvider: null };
      }
    }
    return { selectedModelId: null, selectedProvider: null };
  }

  // Set the selected model
  setSelectedModel(model: LLMModel | null) {
    const config: ModelConfig = model
      ? { selectedModelId: model.id, selectedProvider: model.provider }
      : { selectedModelId: null, selectedProvider: null };
    
    localStorage.setItem(MODEL_CONFIG_KEY, JSON.stringify(config));
    this.notifyListeners();
  }

  // Get the default model based on priority:
  // 1. VS Code LM API (local) - Copilot Sonnet 4
  // 2. Azure GPT-4.1
  // 3. First available model
  getDefaultModel(availableModels: LLMModel[]): LLMModel | null {
    if (availableModels.length === 0) return null;

    // Priority 1: VS Code LM API (local provider) with Copilot or Sonnet in name
    const vsCodeModel = availableModels.find(
      m => m.provider === 'local' && 
      (m.name.toLowerCase().includes('copilot') || 
       m.name.toLowerCase().includes('sonnet') ||
       m.id.toLowerCase().includes('claude'))
    );
    if (vsCodeModel) return vsCodeModel;

    // Priority 2: Azure GPT-4.1
    const azureGPT41 = availableModels.find(
      m => m.provider === 'azure-openai' && m.id === 'gpt-4.1'
    );
    if (azureGPT41) return azureGPT41;

    // Priority 3: Any Azure OpenAI model
    const azureModel = availableModels.find(m => m.provider === 'azure-openai');
    if (azureModel) return azureModel;

    // Fallback: First available model
    return availableModels[0];
  }

  // Find the model in available models list
  findModel(availableModels: LLMModel[]): LLMModel | null {
    const config = this.getModelConfig();
    
    if (!config.selectedModelId || !config.selectedProvider) {
      return this.getDefaultModel(availableModels);
    }

    // Try to find the exact model
    const model = availableModels.find(
      m => m.id === config.selectedModelId && m.provider === config.selectedProvider
    );

    if (model) return model;

    // If not found, return default
    return this.getDefaultModel(availableModels);
  }

  // Subscribe to model changes
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

export const modelConfigService = ModelConfigService.getInstance();
