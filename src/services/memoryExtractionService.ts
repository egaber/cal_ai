// Memory Extraction Service - Analyzes conversations to extract and store memories

import { llmService, Message } from './llmService';
import { StorageService } from './storageService';
import { UserMemory, FamilyMemory, Place, TravelInfo } from '@/types/memory';
import { FamilyMember } from '@/types/calendar';

export interface MemoryExtractionResult {
  hasMemory: boolean;
  memories: ExtractedMemory[];
}

export interface ExtractedMemory {
  type: 'user' | 'family' | 'place' | 'travel';
  data: Record<string, unknown>;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
}

export class MemoryExtractionService {
  static async extractMemories(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    familyMembers: FamilyMember[]
  ): Promise<MemoryExtractionResult> {
    try {
      const prompt = this.buildExtractionPrompt(userMessage, familyMembers);
      
      // Get first available model
      const models = await llmService.getAvailableModels();
      if (models.length === 0) {
        console.error('No LLM models available');
        return { hasMemory: false, memories: [] };
      }

      const messages: Message[] = [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ];

      const response = await llmService.chat({
        messages,
        model: models[0],
      });

      if (response.error || !response.content) {
        return { hasMemory: false, memories: [] };
      }

      // Parse the LLM response to extract memory objects
      return this.parseMemoryResponse(response.content, familyMembers);
    } catch (error) {
      console.error('Memory extraction failed:', error);
      return { hasMemory: false, memories: [] };
    }
  }

  private static buildExtractionPrompt(userMessage: string, familyMembers: FamilyMember[]): string {
    const membersList = familyMembers.map(m => `- ${m.name} (${m.role}) [ID: ${m.id}]`).join('\n');
    
    return `You are a memory extraction assistant. Your job is to analyze user messages and identify information that should be stored as memories.

Family Members:
${membersList}

Types of memories to extract:

1. USER MEMORY (for individual family members):
   - Personal preferences (e.g., "I prefer meetings in the morning")
   - Habits (e.g., "I usually exercise at 6 AM")
   - Constraints (e.g., "I can't schedule anything before 9 AM on Mondays")
   - Goals (e.g., "I want to spend more time with family")
   - Other important personal facts

2. FAMILY MEMORY (for the whole family):
   - Family preferences (e.g., "We like to have dinner together at 7 PM")
   - Family habits (e.g., "We go to church every Sunday")
   - Family constraints (e.g., "No activities during Shabbat")
   - Family traditions (e.g., "Game night every Friday")

3. PLACE (important locations):
   - Home address
   - Work locations
   - Schools/kindergartens
   - Frequently visited places
   - Include: name, address, type (home/work/school/kindergarten/other), associated member

4. TRAVEL INFO (travel between places):
   - Time to travel between locations
   - Transportation method (drive/walk/public_transport/bike)
   - If children need adult accompaniment
   - Who usually accompanies them

Analyze the user's message and respond ONLY with a JSON object in this exact format:
{
  "hasMemory": true/false,
  "memories": [
    {
      "type": "user",
      "userId": "member_id",
      "fact": "description of the fact",
      "category": "preference/habit/constraint/goal/other",
      "importance": "high/medium/low",
      "confidence": "high/medium/low",
      "explanation": "why this is a memory"
    },
    {
      "type": "family",
      "fact": "description of the fact",
      "category": "preference/habit/constraint/tradition/other",
      "importance": "high/medium/low",
      "affectedMembers": ["member_id1", "member_id2"],
      "confidence": "high/medium/low",
      "explanation": "why this is a memory"
    },
    {
      "type": "place",
      "name": "place name",
      "address": "full address",
      "placeType": "home/work/school/kindergarten/other",
      "associatedMemberId": "member_id or null",
      "confidence": "high/medium/low",
      "explanation": "why this is a memory"
    },
    {
      "type": "travel",
      "fromPlaceName": "place name",
      "toPlaceName": "place name",
      "method": "drive/walk/public_transport/bike",
      "durationMinutes": 30,
      "requiresAdult": true/false,
      "accompaniedByMemberId": "member_id or null",
      "confidence": "high/medium/low",
      "explanation": "why this is a memory"
    }
  ]
}

IMPORTANT RULES:
- Only extract clear, factual memories
- Don't extract temporary or one-time information
- Don't extract information about specific events (those are calendar events, not memories)
- Be conservative - only extract high confidence memories
- If no memories found, return {"hasMemory": false, "memories": []}
- Return ONLY valid JSON, no other text

Examples of what TO extract:
- "I work at Microsoft in Herzliya" → Place memory
- "The kids' school is 15 minutes away by car" → Place + Travel memory
- "I prefer morning meetings" → User memory (preference)
- "We always have dinner together at 7 PM" → Family memory (habit)

Examples of what NOT to extract:
- "Schedule a meeting tomorrow" → This is an action, not a memory
- "I have a doctor's appointment next week" → This is an event, not a memory
- "It's raining today" → Temporary information, not a memory`;
  }

  private static parseMemoryResponse(
    response: string,
    familyMembers: FamilyMember[]
  ): MemoryExtractionResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { hasMemory: false, memories: [] };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.hasMemory || !parsed.memories || parsed.memories.length === 0) {
        return { hasMemory: false, memories: [] };
      }

      const memories: ExtractedMemory[] = [];

      for (const mem of parsed.memories) {
        // Only include high confidence memories
        if (mem.confidence !== 'high') {
          continue;
        }

        memories.push({
          type: mem.type,
          data: mem,
          confidence: mem.confidence,
          explanation: mem.explanation || '',
        });
      }

      return {
        hasMemory: memories.length > 0,
        memories,
      };
    } catch (error) {
      console.error('Failed to parse memory response:', error);
      return { hasMemory: false, memories: [] };
    }
  }

  static async saveExtractedMemories(
    memories: ExtractedMemory[],
    familyMembers: FamilyMember[]
  ): Promise<{ saved: number; errors: string[] }> {
    let saved = 0;
    const errors: string[] = [];

    for (const memory of memories) {
      try {
        switch (memory.type) {
          case 'user':
            await this.saveUserMemory(memory.data);
            saved++;
            break;
          
          case 'family':
            await this.saveFamilyMemory(memory.data);
            saved++;
            break;
          
          case 'place':
            await this.savePlace(memory.data);
            saved++;
            break;
          
          case 'travel':
            await this.saveTravelInfo(memory.data);
            saved++;
            break;
        }
      } catch (error) {
        errors.push(`Failed to save ${memory.type} memory: ${error}`);
      }
    }

    return { saved, errors };
  }

  private static async saveUserMemory(data: Record<string, unknown>): Promise<void> {
    const memory: UserMemory = {
      id: `user_mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: data.userId as string,
      fact: data.fact as string,
      category: data.category as UserMemory['category'],
      importance: data.importance as UserMemory['importance'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    StorageService.addUserMemory(memory);
  }

  private static async saveFamilyMemory(data: Record<string, unknown>): Promise<void> {
    const memory: FamilyMemory = {
      id: `family_mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fact: data.fact as string,
      category: data.category as FamilyMemory['category'],
      importance: data.importance as FamilyMemory['importance'],
      affectedMembers: (data.affectedMembers as string[]) || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    StorageService.addFamilyMemory(memory);
  }

  private static async savePlace(data: Record<string, unknown>): Promise<void> {
    const place: Place = {
      id: `place_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name as string,
      address: data.address as string,
      type: data.placeType as Place['type'],
      associatedMemberId: (data.associatedMemberId as string) || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    StorageService.addPlace(place);
  }

  private static async saveTravelInfo(data: Record<string, unknown>): Promise<void> {
    // For travel info, we need to find or create places first
    const memoryData = StorageService.loadMemoryData();
    
    const fromPlace = memoryData.places.find(p => p.name === data.fromPlaceName);
    const toPlace = memoryData.places.find(p => p.name === data.toPlaceName);

    // If places don't exist, we can't create travel info
    if (!fromPlace || !toPlace) {
      throw new Error('Places must exist before creating travel info');
    }

    const travel: TravelInfo = {
      id: `travel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromPlaceId: fromPlace.id,
      toPlaceId: toPlace.id,
      method: data.method as TravelInfo['method'],
      durationMinutes: data.durationMinutes as number,
      requiresAdult: data.requiresAdult as boolean,
      accompaniedByMemberId: (data.accompaniedByMemberId as string) || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    StorageService.addTravelInfo(travel);
  }
}
