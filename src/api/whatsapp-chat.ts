import { Request, Response } from 'express';
import { LLMService, Message } from '../services/llmService';
import { CalendarService } from '../services/calendarService';

// API endpoint for WhatsApp webhook to call
// This will be exposed via Vite's server middleware

let llmService: LLMService | null = null;

// Initialize LLM service
function getLLMService() {
  if (!llmService) {
    llmService = new LLMService();
    
    // Load API keys from environment or localStorage
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
    const azureKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY || localStorage.getItem('azure_openai_api_key');
    const azureXAIKey = import.meta.env.VITE_AZURE_XAI_API_KEY || localStorage.getItem('azure_xai_api_key');
    
    if (geminiKey) llmService.setGeminiKey(geminiKey);
    if (azureKey) llmService.setAzureOpenAIKey(azureKey);
    if (azureXAIKey) llmService.setAzureXAIKey(azureXAIKey);
  }
  return llmService;
}

export async function handleWhatsAppChat(req: Request, res: Response) {
  try {
    const { message, phoneNumber, conversationHistory } = req.body;

    if (!message || !phoneNumber) {
      return res.status(400).json({ 
        error: 'Missing required fields: message and phoneNumber' 
      });
    }

    // Get LLM service
    const service = getLLMService();
    const models = await service.getAvailableModels();
    
    if (models.length === 0) {
      return res.status(500).json({ 
        error: 'No AI models configured. Please set up API keys.' 
      });
    }

    // Use first available model
    const model = models[0];

    // Build context
    const systemPrompt = `You are Cal AI, an intelligent personal assistant for task and calendar management.

Current date: ${new Date().toLocaleDateString()}
User: Phone ${phoneNumber}

You help users:
- Create and manage tasks
- Schedule appointments
- Organize their day
- Answer questions about their schedule

Be concise and friendly. Keep responses under 300 characters when possible (WhatsApp limit).
Use emojis sparingly but effectively.

IMPORTANT: If the user's message is a task (contains actions like "buy", "pick up", "call", "schedule", etc.):
- Acknowledge it briefly
- Extract key details (what, when, who)
- Confirm it's been noted

If it's a question:
- Answer directly and concisely
- Offer helpful suggestions

Keep the conversation natural and helpful!`;

    // Prepare messages array
    const messages: Message[] = [];
    
    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg: any) => {
        if (msg.role && msg.content) {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      });
    }
    
    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    // Call LLM
    const response = await service.chat({
      messages,
      model,
      systemPrompt
    });

    if (response.error) {
      return res.status(500).json({ 
        error: response.error 
      });
    }

    // Return AI response
    return res.json({
      response: response.content,
      model: model.name,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('WhatsApp chat API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
