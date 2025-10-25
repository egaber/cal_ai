# Hybrid Memory System Documentation

## Overview

The Hybrid Memory System is a unified "memory layer" that stores everything the AI learns about your family - from places and preferences to habits and restrictions. It's designed to make the AI assistant more personalized and context-aware over time.

## 🎯 Design Goals

- **Unified Storage**: Single source of truth for all family knowledge
- **Structured + Flexible**: Supports both structured data and free-form text
- **AI-Friendly**: Compact format for efficient LLM context
- **Future-Proof**: Ready for semantic search, embeddings, and predictions
- **Multi-Source**: Memories can be created by users, system, or AI inference

## 📊 Architecture

### Firestore Structure

```
families/
  └── {familyId}/
      └── memory/
          ├── {memoryId1}  (type: place)
          ├── {memoryId2}  (type: preference)
          ├── {memoryId3}  (type: restriction)
          └── ...
```

### Memory Types

| Type | Description | Example |
|------|-------------|---------|
| `fact` | General information | "Alon's kindergarten ends at 16:30" |
| `preference` | User/family choices | "Dad prefers WhatsApp reminders" |
| `restriction` | Rules and limits | "No events after 21:00 for kids" |
| `place` | Important locations | "Home at 12 Ben Gurion St" |
| `habit` | Routine behaviors | "Family dinner at 19:00" |
| `event_pattern` | Predictive patterns | "Fridays, visit grandparents" |
| `note` | Free-form information | General notes and observations |

## 🔧 Core Components

### 1. Memory Types (`src/types/memory.ts`)

Comprehensive TypeScript definitions including:
- `FamilyMemory`: Main memory interface
- `MemoryType`: Union of all memory types
- Structured types for each memory kind
- Helper types for queries and filtering

### 2. Memory Service (`src/services/memoryService.ts`)

Firestore CRUD operations:

```typescript
// Create memory
await MemoryService.createMemory({
  familyId: 'family123',
  memoryType: 'place',
  text: "Alon's kindergarten at 123 Main St",
  structured: {
    name: "Alon's Kindergarten",
    address: "123 Main St",
    category: "kindergarten",
    relatedUsers: ["alon_user_id"],
  },
  source: 'user',
  tags: ['kindergarten', 'daily']
});

// Query memories
const places = await MemoryService.getMemoriesByType(familyId, 'place');

// Get LLM context
const context = await MemoryService.getMemoryContextString(
  familyId,
  userIdToNameMap,
  { memoryType: ['place', 'preference', 'restriction'] },
  50  // max memories
);
```

### 3. Memory Extraction Service (`src/services/memoryExtractionService.ts`)

AI-powered extraction from conversations:

```typescript
const result = await MemoryExtractionService.extractMemories(
  userMessage,
  conversationHistory,
  familyMembers
);

if (result.hasMemory) {
  await MemoryExtractionService.saveExtractedMemories(
    result.memories,
    familyMembers
  );
}
```

## 📝 Structured Data Examples

### Place Memory

```typescript
{
  memoryType: 'place',
  text: "Alon's kindergarten at Rainbow School, 123 Main St",
  structured: {
    name: "Rainbow School",
    address: "123 Main St, Tel Aviv",
    category: "kindergarten",
    relatedUsers: ["alon_user_id"],
    scheduleHints: {
      days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
      startTime: "08:00",
      endTime: "16:30"
    }
  }
}
```

### Restriction Memory

```typescript
{
  memoryType: 'restriction',
  text: "Kids can't have events after 21:00 on school nights",
  structured: {
    appliesTo: ["alon_user_id", "noa_user_id"],
    rule: "no_events_after",
    value: "21:00",
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]
  }
}
```

### Habit Memory

```typescript
{
  memoryType: 'habit',
  text: "Family dinner every evening at 19:00",
  structured: {
    activity: "Family dinner",
    time: "19:00",
    location: "Home"
  }
}
```

### Event Pattern Memory

```typescript
{
  memoryType: 'event_pattern',
  text: "Usually visit grandparents on Friday afternoons",
  structured: {
    trigger: "Friday",
    action: "Visit grandparents",
    time: "17:00",
    location: "Grandparents' house",
    confidence: 0.85
  }
}
```

## 🔐 Security Rules

Memory access is controlled via Firestore rules:

- **Family Members**: Can read/write all family memories
- **WhatsApp Webhook**: Can read/write (enables AI agent learning)
- **Unauthenticated**: Denied (except webhook)

```javascript
match /memory/{memoryId} {
  allow read: if isFamilyMember(familyId);
  allow create, update, delete: if isFamilyMember(familyId);
  allow read, write: if true;  // WhatsApp webhook access
}
```

## 🤖 AI Integration

### Client-Side AI Assistant

```typescript
import { MemoryService } from '@/services/memoryService';

// Get memory context for LLM
const memoryContext = await MemoryService.getMemoryContextString(
  familyId,
  userIdToNameMap
);

// Include in system prompt
const systemPrompt = `
You are a family AI assistant.

${memoryContext}

Use this context to provide personalized responses.
`;
```

### WhatsApp Webhook Integration

```typescript
// In webhook-server/api-server.ts or api-server.js

import { MemoryService } from '../src/services/memoryService';

// Extract and save memories from conversation
const memories = await extractMemoriesFromMessage(message, familyId);
await MemoryService.batchCreateMemories(memories);

// Get context for response
const context = await MemoryService.getMemoryContextString(
  familyId,
  userIdToNameMap,
  undefined,
  30  // Limit for webhook to save tokens
);
```

## 📊 Query Examples

### Get All Places

```typescript
const places = await MemoryService.getMemoriesByType(familyId, 'place');
```

### Get User-Specific Memories

```typescript
const userMemories = await MemoryService.getMemoriesForUser(
  familyId,
  userId
);
```

### Search by Tags

```typescript
const schoolMemories = await MemoryService.searchMemoriesByTags(
  familyId,
  ['school', 'kindergarten']
);
```

### Advanced Filtering

```typescript
const memories = await MemoryService.queryMemories(
  familyId,
  {
    memoryType: ['place', 'restriction'],
    relatedUserId: userId,
    minConfidence: 0.8,
    source: 'ai_inferred'
  },
  20  // limit
);
```

## 🎨 Compact Format for LLM

To minimize token usage, use the compact format:

```typescript
const compactMemories = await MemoryService.getCompactMemoriesForLLM(
  familyId,
  userIdToNameMap,
  { memoryType: ['place', 'preference', 'restriction'] },
  50
);

// Output:
// [
//   { type: 'place', text: "Home at 12 Ben Gurion St", users: ['Family'] },
//   { type: 'preference', text: "Dad prefers morning meetings", users: ['Dad'] },
//   { type: 'restriction', text: "No events after 21:00 for kids", users: ['Alon', 'Noa'] }
// ]
```

Or use the formatted string:

```typescript
const contextString = await MemoryService.getMemoryContextString(
  familyId,
  userIdToNameMap
);

// Output:
// Family Memory Context:
//
// PLACE:
// - Home at 12 Ben Gurion St [Family]
// - Alon's kindergarten at Rainbow School [Alon]
//
// PREFERENCE:
// - Dad prefers morning meetings [Dad]
//
// RESTRICTION:
// - No events after 21:00 for kids [Alon, Noa]
```

## 🔄 Batch Operations

Create multiple memories efficiently:

```typescript
const memories: CreateMemoryInput[] = [
  {
    familyId,
    memoryType: 'place',
    text: "Home at 12 Ben Gurion St",
    structured: { name: "Home", address: "12 Ben Gurion St" },
    source: 'user'
  },
  {
    familyId,
    memoryType: 'preference',
    text: "Dad prefers WhatsApp reminders",
    structured: { owner: "Dad", category: "reminder_channel", value: "WhatsApp" },
    source: 'user'
  }
];

await MemoryService.batchCreateMemories(memories);
```

## 🧹 Maintenance

### Delete Expired Memories

```typescript
const deletedCount = await MemoryService.deleteExpiredMemories(familyId);
console.log(`Deleted ${deletedCount} expired memories`);
```

### Get Statistics

```typescript
const stats = await MemoryService.getMemoryStats(familyId);
console.log(stats);
// {
//   total: 45,
//   byType: { place: 10, preference: 15, restriction: 5, ... },
//   bySource: { user: 20, ai_inferred: 15, system: 10 }
// }
```

## 🚀 Future Enhancements

### Semantic Search (Future)

```typescript
// Coming soon: vector embeddings
const similarMemories = await MemoryService.semanticSearch(
  familyId,
  "places related to kids' education",
  10
);
```

### Confidence Scoring (Implemented)

Memories created by AI inference include confidence scores:

```typescript
{
  confidence: 0.85,  // 85% confidence
  source: 'ai_inferred'
}
```

### Expiration (Implemented)

Temporary memories auto-expire:

```typescript
{
  expiresAt: new Date('2025-12-31'),
  text: "On vacation this week"
}
```

## 🐛 Troubleshooting

### Memory Not Saving

1. Check Firestore rules are deployed
2. Verify familyId is correct
3. Check user has family membership

### Memory Not Appearing in LLM Context

1. Verify memory is not expired
2. Check filters aren't too restrictive
3. Ensure userIdToNameMap is populated

### WhatsApp Agent Not Creating Memories

1. Verify webhook has unauthenticated access
2. Check memory extraction is enabled
3. Review webhook logs for errors

## 📚 Related Documentation

- [FIRESTORE_SCHEMA_V2.md](./FIRESTORE_SCHEMA_V2.md) - Database structure
- [LLM_INTEGRATION.md](./LLM_INTEGRATION.md) - AI integration
- [WHATSAPP_ARCHITECTURE.md](./WHATSAPP_ARCHITECTURE.md) - WhatsApp setup

## 🤝 Contributing

When adding new memory types:

1. Update `MemoryType` in `src/types/memory.ts`
2. Add structured interface
3. Update extraction prompts in `memoryExtractionService.ts`
4. Add examples to this documentation

## 📄 License

Part of the Cal AI project.
