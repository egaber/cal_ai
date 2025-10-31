import { Request, Response } from 'express';
import { LLMService, Message } from '../services/llmService';
import { MemoryService } from '../services/memoryService';
import { MemoryExtractionService } from '../services/memoryExtractionService';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FamilyMember } from '../types/calendar';

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

    // Look up user and family by phone number
    let userId: string | null = null;
    let familyId: string | null = null;
    let familyMembers: FamilyMember[] = [];
    
    try {
      // Find user by phone number
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phoneNumber', '==', phoneNumber), limit(1));
      const userSnapshot = await getDocs(q);
      
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        userId = userDoc.id;
        
        // Find user's family
        const familiesRef = collection(db, 'families');
        const familyQuery = query(
          familiesRef,
          where('memberUserIds', 'array-contains', userId),
          limit(1)
        );
        const familySnapshot = await getDocs(familyQuery);
        
        if (!familySnapshot.empty) {
          const familyDoc = familySnapshot.docs[0];
          familyId = familyDoc.id;
          const familyData = familyDoc.data();
          
          // Get family members for memory extraction
          familyMembers = familyData.members || [];
        }
      }
    } catch (error) {
      console.error('Error looking up user/family:', error);
      // Continue without memory features
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

    // Load memory context if family is found
    let memoryContext = '';
    if (familyId && familyMembers.length > 0) {
      try {
        const userIdToNameMap = new Map<string, string>();
        familyMembers.forEach(member => {
          userIdToNameMap.set(member.id, member.name);
        });
        
        memoryContext = await MemoryService.getMemoryContextString(
          familyId,
          userIdToNameMap,
          undefined,
          30  // Limit to 30 memories for WhatsApp to save tokens
        );
      } catch (error) {
        console.error('Error loading memory context:', error);
      }
    }

    // Build context with memory
    const systemPrompt = `You are Cal AI, an intelligent personal assistant for task and calendar management.

Current date: ${new Date().toLocaleDateString()}
User: Phone ${phoneNumber}

${memoryContext ? `\n${memoryContext}\n` : ''}

You help users:
- Create and manage tasks
- Schedule appointments
- Organize their day
- Answer questions about their schedule
- Learn from conversations to provide personalized assistance

Be concise and friendly. Keep responses under 300 characters when possible (WhatsApp limit).
Use emojis sparingly but effectively.

IMPORTANT: If the user's message is a task (contains actions like "buy", "pick up", "call", "schedule", etc.):
- Acknowledge it briefly
- Extract key details (what, when, who)
- Confirm it's been noted

If it's a question:
- Answer directly and concisely
- Use context from family memories when relevant
- Offer helpful suggestions

Keep the conversation natural and helpful!`;

    // Prepare messages array
    const messages: Message[] = [];
    
    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg: { role: string; content: string }) => {
        const validRole = msg.role as 'user' | 'assistant' | 'system';
        if (validRole && msg.content) {
          messages.push({
            role: validRole,
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

    // Extract and save memories if family context is available
    if (familyId && familyMembers.length > 0) {
      try {
        const memoryResult = await MemoryExtractionService.extractMemories(
          message,
          conversationHistory || [],
          familyMembers
        );
        
        if (memoryResult.hasMemory && memoryResult.memories.length > 0) {
          console.log(`📝 Extracted ${memoryResult.memories.length} memories from conversation`);
          
          // Save memories to Firestore
          await MemoryExtractionService.saveExtractedMemories(
            memoryResult.memories,
            familyMembers
          );
          
          console.log('✅ Memories saved successfully');
        }
      } catch (error) {
        console.error('Error extracting/saving memories:', error);
        // Don't fail the request if memory extraction fails
      }
    }

    // Return AI response
    return res.json({
      response: response.content,
      model: model.name,
      timestamp: new Date().toISOString(),
      memoriesExtracted: familyId ? true : false
    });

  } catch (error) {
    console.error('WhatsApp chat API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
