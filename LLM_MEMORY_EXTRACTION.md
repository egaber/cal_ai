# LLM-Based Memory Extraction System

## 🎯 Overview

The Cal AI app now features an intelligent memory extraction system that uses LLMs to automatically identify and save important information shared by users during conversations. This works in both:

1. **Mobile AI Chat** (`src/components/AIAssistant.tsx`)
2. **WhatsApp Integration** (`webhook-server/api-server.ts`)

## 🧠 How It Works

### 1. LLM Prompt Enhancement

The system prompt instructs the LLM to identify memorable information and output it in a structured format using `<MEMORY_SAVE>` tags:

```typescript
MEMORY EXTRACTION:
If the user shares information that should be remembered (preferences, locations, schedules, habits, restrictions), include a MEMORY_SAVE tool call in your response:

<MEMORY_SAVE>
{
  "memoryType": "place|preference|habit|restriction|fact|note",
  "text": "Human-readable description",
  "tags": ["tag1", "tag2"],
  "structured": {
    "key": "value"
  }
}
</MEMORY_SAVE>
```

### 2. Response Processing

After the LLM generates a response, the system:

1. **Extracts** memory data using regex pattern matching
2. **Parses** the JSON data structure
3. **Saves** to Firestore under `families/{familyId}/memory/`
4. **Removes** the `<MEMORY_SAVE>` tags from the user-visible response
5. **Notifies** the user about saved memories

### 3. Firestore Storage

Memories are stored with this structure:

```typescript
{
  memoryType: "place" | "preference" | "habit" | "restriction" | "fact" | "note",
  text: "Human-readable description",
  source: "ai_inferred",
  confidence: 0.95, // High confidence from LLM
  tags: ["tag1", "tag2", "mobile_chat" | "whatsapp", "llm"],
  structured: {
    // Type-specific structured data
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 📝 Memory Types

### 1. **Place** - Locations and venues
```json
{
  "memoryType": "place",
  "text": "מקום עבודה: מיקרוסופט הרצליה - רחוב אלן טיורינג 3",
  "tags": ["work", "location"],
  "structured": {
    "type": "work",
    "company": "מיקרוסופט",
    "address": "רחוב אלן טיורינג 3"
  }
}
```

### 2. **Preference** - User preferences and constraints
```json
{
  "memoryType": "preference",
  "text": "אין פגישות לפני 9:00 בבוקר",
  "tags": ["meetings", "preference"],
  "structured": {
    "category": "meetings",
    "constraint": "no_meetings_before",
    "time": "09:00"
  }
}
```

### 3. **Habit** - Recurring behaviors or routines
```json
{
  "memoryType": "habit",
  "text": "ארוחת ערב משפחתית כל יום ו' ב-19:00",
  "tags": ["family", "dinner", "routine"],
  "structured": {
    "activity": "family_dinner",
    "frequency": "weekly",
    "day": "Friday",
    "time": "19:00"
  }
}
```

### 4. **Restriction** - Rules or limitations
```json
{
  "memoryType": "restriction",
  "text": "אין אירועים לאחר 21:00 עבור הילדים",
  "tags": ["children", "bedtime", "rule"],
  "structured": {
    "appliesTo": ["children"],
    "rule": "no_events_after",
    "time": "21:00"
  }
}
```

### 5. **Fact** - General information
```json
{
  "memoryType": "fact",
  "text": "הגן של אלון נפתח ב-7:30, הגעה עד 8:30",
  "tags": ["kindergarten", "schedule", "child:Alon"],
  "structured": {
    "type": "kindergarten",
    "child": "אלון",
    "openTime": "7:30",
    "arrivalDeadline": "8:30"
  }
}
```

### 6. **Note** - Free-form notes
```json
{
  "memoryType": "note",
  "text": "לזכור להביא מתנה למסיבת יומהולדת של דניאל",
  "tags": ["reminder", "birthday", "manual"],
  "structured": {
    "category": "reminder"
  }
}
```

## 💻 Implementation Details

### Mobile AI Chat (`src/components/AIAssistant.tsx`)

```typescript
// Extract and process MEMORY_SAVE tool calls from LLM response
if (response.content && user?.familyId) {
  const memorySavePattern = /<MEMORY_SAVE>\s*(\{[\s\S]*?\})\s*<\/MEMORY_SAVE>/g;
  const memorySaveMatches = [...response.content.matchAll(memorySavePattern)];
  
  if (memorySaveMatches.length > 0) {
    console.log(`\n🤖 LLM MEMORY EXTRACTION: Found ${memorySaveMatches.length} memories`);
    
    const { getFirestore, collection, addDoc, Timestamp } = await import('firebase/firestore');
    const db = getFirestore();
    const memoryRef = collection(db, 'families', user.familyId, 'memory');
    
    for (const match of memorySaveMatches) {
      try {
        const memoryData = JSON.parse(match[1]);
        
        await addDoc(memoryRef, {
          memoryType: memoryData.memoryType,
          text: memoryData.text,
          source: 'ai_inferred',
          confidence: 0.95,
          tags: [...(memoryData.tags || []), 'mobile_chat', 'llm'],
          structured: memoryData.structured || {},
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        
        toast({
          title: "💡 Memory Saved",
          description: `I learned: ${memoryData.text.substring(0, 50)}...`,
        });
      } catch (error) {
        console.error(`❌ Failed to parse/save LLM memory:`, error);
      }
    }
  }
}

// Remove MEMORY_SAVE tags from displayed content
displayContent = displayContent.replace(/<MEMORY_SAVE>\s*\{[\s\S]*?\}\s*<\/MEMORY_SAVE>/g, '').trim();
```

### WhatsApp Integration (`webhook-server/api-server.ts`)

Similar implementation but adapted for the WhatsApp webhook server context.

## 🎨 Example Conversations

### Example 1: Work Location
**User:** "אני עובד במיקרוסופט הרצליה ברחוב אלן טיורינג 3"

**AI Response:** "רשמתי! 💼 מקום העבודה שלך במיקרוסופט הרצליה נשמר."

**Behind the scenes:**
- Memory saved with type: `place`
- Text: "מקום עבודה: מיקרוסופט הרצליה - רחוב אלן טיורינג 3"
- Tags: `["work", "location", "mobile_chat", "llm"]`

### Example 2: Meeting Preference
**User:** "תזכור שאני לא אוהב פגישות לפני 9 בבוקר"

**AI Response:** "נרשם! אני לא אתזמן לך פגישות לפני 9:00."

**Behind the scenes:**
- Memory saved with type: `preference`
- Constraint stored for future scheduling decisions

### Example 3: Kindergarten Schedule
**User:** "הגן של אלון נפתח ב-7:30 ופתיחה עד 8:30"

**AI Response:** "רשמתי את זמני הגן! זה יעזור לי לתכנן את הבוקר שלכם."

**Behind the scenes:**
- Memory saved with type: `fact`
- Schedule data structured for calendar planning

## 🔄 Dual Memory System

The system maintains **two parallel memory extraction approaches**:

### 1. **LLM-Based (New)** 🤖
- Uses structured prompts and JSON parsing
- Higher confidence (0.95)
- More flexible and context-aware
- Works for complex, nuanced information
- Tags: `['llm', 'mobile_chat' or 'whatsapp']`

### 2. **Pattern-Based (Fallback)** 📝
- Uses regex patterns for specific cases
- Lower confidence (0.85-0.9)
- Fast and deterministic
- Works for well-defined patterns
- Tags: `['whatsapp']`

Both systems run in parallel, with the LLM-based system handling most cases and the pattern-based system providing a safety net for specific scenarios.

## 🚀 Benefits

1. **Automatic Context Building** - The AI learns user preferences automatically
2. **Better Scheduling** - Uses learned constraints for smarter suggestions
3. **Personalization** - Remembers user habits and preferences
4. **Reduced User Input** - No need to manually configure every preference
5. **Continuous Learning** - Improves understanding over time

## 📊 Monitoring

Check Firestore Console:
```
families/{familyId}/memory/
```

Look for documents with:
- `source: "ai_inferred"`
- `confidence: 0.95`
- `tags` containing `"llm"`

## 🎯 Future Enhancements

1. **Memory Retrieval** - Query and use saved memories in conversations
2. **Memory Consolidation** - Merge duplicate/conflicting memories
3. **Memory Expiry** - Auto-expire outdated information
4. **User Confirmation** - Ask user to confirm inferred memories
5. **Memory Categories** - Better organize by domain (work, family, personal)
6. **Semantic Search** - Use embeddings for similarity search

## 🔧 Configuration

No configuration needed! The system works out of the box. The LLM automatically detects memorable information based on the conversation context.

## 📝 Notes

- Memories are family-scoped (stored under `families/{familyId}/memory/`)
- All family members can benefit from shared memories
- Privacy: Only information explicitly shared in conversation is saved
- Confidence level indicates how certain the AI is about the extracted information
