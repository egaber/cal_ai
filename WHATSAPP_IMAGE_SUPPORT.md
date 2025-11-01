# WhatsApp Image Support with Multimodal AI

## 🎯 Current Status: NOT IMPLEMENTED ❌

The current WhatsApp webhook (`webhook-server/server.js` and `webhook-server/api-server.ts`) **does NOT handle image messages**. It only processes text messages.

## 📋 What Needs to Be Implemented

### 1. **Twilio Webhook Enhancement**

When a user sends an image via WhatsApp, Twilio includes these fields in the webhook payload:

```javascript
{
  Body: "Check out this receipt",  // Optional caption
  NumMedia: "1",                   // Number of media items
  MediaUrl0: "https://api.twilio.com/...",  // Media URL
  MediaContentType0: "image/jpeg"  // MIME type
}
```

### 2. **Image Download & Processing**

Need to:
1. Detect if `NumMedia > 0`
2. Download image from `MediaUrl0` (requires Twilio credentials)
3. Convert to base64 or pass URL to LLM
4. Use multimodal model for processing

### 3. **Multimodal Model Selection**

**Supported Models for Vision:**
- ✅ **Claude Sonnet 4.5** (Anthropic) - RECOMMENDED
- ✅ **GPT-4 Vision** / **GPT-4o** (Azure OpenAI)
- ✅ **Gemini 1.5 Pro/Flash** (Google)
- ❌ Regular text-only models won't work

## 🏗️ Implementation Plan

### Step 1: Update Webhook Server (`webhook-server/server.js`)

```javascript
// Add image detection
if (req.body.NumMedia && parseInt(req.body.NumMedia) > 0) {
  const mediaUrl = req.body.MediaUrl0;
  const mediaType = req.body.MediaContentType0;
  const caption = req.body.Body || '';
  
  console.log('📸 Image received:', mediaType);
  console.log('🔗 Media URL:', mediaUrl);
  
  // Download and process image
  await handleImageMessage(from, mediaUrl, mediaType, caption);
}
```

### Step 2: Download Image from Twilio

```javascript
async function downloadImage(mediaUrl) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  const response = await fetch(mediaUrl, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
    }
  });
  
  const buffer = await response.buffer();
  const base64 = buffer.toString('base64');
  
  return {
    buffer,
    base64,
    mimeType: response.headers.get('content-type')
  };
}
```

### Step 3: Update LLM Service for Vision

The `llmService` needs vision support. Check if it already handles images:

```typescript
// In llmService.chat()
interface Message {
  role: 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image';
    text?: string;
    image?: string; // base64 or URL
  }>;
}
```

### Step 4: Update API Server (`webhook-server/api-server.ts`)

```typescript
app.post('/chat', async (req, res) => {
  const { message, phoneNumber, conversationHistory, image } = req.body;
  
  if (image) {
    console.log('📸 Processing image message');
    // Use multimodal model
    const response = await generateAIResponseWithImage(
      message, 
      image, 
      conversationHistory, 
      phoneNumber
    );
    return res.json({ response });
  }
  
  // Regular text processing...
});

async function generateAIResponseWithImage(
  caption: string,
  imageData: { base64: string, mimeType: string },
  history: Message[],
  phoneNumber: string
): Promise<string> {
  // Select multimodal model
  const models = await llmService.getAvailableModels();
  const visionModel = models.find(m => 
    m.id.includes('claude-sonnet') || 
    m.id.includes('gpt-4') ||
    m.id.includes('gemini-1.5')
  );
  
  if (!visionModel) {
    return 'מצטער, אני לא יכול לעבד תמונות כרגע. אנא השתמש בטקסט בלבד.';
  }
  
  // Build message with image
  const messages: Message[] = [
    ...history,
    {
      role: 'user',
      content: [
        {
          type: 'image',
          image: `data:${imageData.mimeType};base64,${imageData.base64}`
        },
        {
          type: 'text',
          text: caption || 'מה אתה רואה בתמונה?'
        }
      ]
    }
  ];
  
  const response = await llmService.chat({
    messages,
    model: visionModel,
    systemPrompt: `You are Cal AI with vision capabilities.
    You can analyze images sent via WhatsApp.
    
    Common use cases:
    - 📝 Receipt/bill scanning → extract items and amounts
    - 📅 Event poster/flyer → extract date, time, location
    - 📋 Handwritten notes → convert to text
    - 🎨 Photos → describe content
    - 📊 Screenshots → extract information
    
    When you see a receipt or bill:
    - Extract line items and create tasks
    - Sum up the total
    - Offer to add to budget tracking
    
    When you see an event poster:
    - Extract date, time, location
    - Offer to add to calendar
    - Extract any important details
    
    Respond in Hebrew if the caption is in Hebrew, English otherwise.`
  });
  
  return response.content;
}
```

### Step 5: Memory Extraction from Images

Images can contain memorable information:

```typescript
// After processing image, extract memories
const memoriesFromImage = [
  {
    memoryType: 'place',
    text: 'מסעדה חדשה: שם המסעדה - כתובת מהחשבונית',
    tags: ['restaurant', 'location', 'from_receipt'],
    structured: {
      type: 'restaurant',
      name: '...',
      address: '...'
    }
  },
  {
    memoryType: 'fact',
    text: 'אירוע: שם האירוע ב-DD/MM/YYYY',
    tags: ['event', 'from_poster'],
    structured: {
      eventName: '...',
      date: '...',
      location: '...'
    }
  }
];
```

## 🔧 Required Environment Variables

Add to `.env`:

```bash
# Twilio (needed to download media)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# Ensure you have a multimodal model configured:
# - Claude Sonnet 3.5/4 (via API key)
# - GPT-4 Vision (via Azure OpenAI)
# - Gemini 1.5 Pro (via Google AI)
```

## 📱 Use Cases

### 1. **Receipt Scanning** 🧾
User sends photo of receipt
```
AI: "מצאתי חשבונית של 250 ש\"ח מסופר פארם:
• חלב - 8 ש\"ח
• לחם - 7 ש\"ח
• ...

האם תרצה שאוסיף את הקניות למשימות?"
```

### 2. **Event Posters** 📅
User sends photo of event flyer
```
AI: "ראיתי פוסטר לאירוע:
🎭 הופעה של להקת X
📅 יום שישי, 15.11.2025
🕐 20:00
📍 היכל התרבות

האם להוסיף ליומן?"
```

### 3. **Handwritten Notes** ✍️
User sends photo of shopping list
```
AI: "המרתי את הרשימה לטקסט:
• חלב
• ביצים
• לחם
• גבינה

האם להוסיף כמשימות?"
```

### 4. **Business Cards** 💼
User sends photo of business card
```
AI: "שמרתי את הפרטים:
👤 שם: יוסי כהן
📱 טלפון: 050-123-4567
📧 דוא\"ל: yossi@example.com
🏢 חברה: Tech Corp
```

## 🚨 Error Handling

```javascript
// If no multimodal model available
if (!hasVisionModel) {
  return 'מצטער, עיבוד תמונות לא זמין כרגע. 📸\n\n' +
         'אנא הוסף מפתח API למודל עם יכולות Vision:\n' +
         '• Claude Sonnet 3.5/4\n' +
         '• GPT-4 Vision\n' +
         '• Gemini 1.5 Pro';
}

// If image download fails
if (!imageData) {
  return 'לא הצלחתי להוריד את התמונה. נסה שוב. 🔄';
}

// If image is too large
if (imageData.buffer.length > 5 * 1024 * 1024) { // 5MB
  return 'התמונה גדולה מדי (מקס 5MB). אנא שלח תמונה קטנה יותר. 📏';
}
```

## 📊 Testing

```bash
# Test image processing
curl -X POST http://localhost:6000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "מה יש בתמונה?",
    "phoneNumber": "+972502234226",
    "image": {
      "base64": "iVBORw0KGgoAAAA...",
      "mimeType": "image/jpeg"
    }
  }'
```

## 🎯 Implementation Priority

1. ✅ **High Priority** - Receipt scanning (common use case)
2. ✅ **High Priority** - Event posters (calendar integration)
3. ⚠️ **Medium Priority** - Business cards (contact saving)
4. ⚠️ **Medium Priority** - Handwritten notes (task creation)
5. ℹ️ **Low Priority** - General image description

## 📝 Files to Modify

1. `webhook-server/server.js` - Add image detection & download
2. `webhook-server/api-server.ts` - Add multimodal processing
3. `src/services/llmService.ts` - Ensure vision support
4. `webhook-server/.env.example` - Add Twilio credentials
5. `WHATSAPP_COMPLETE_GUIDE.md` - Document image support

## 🚀 Next Steps

1. Check if `llmService` supports multimodal messages
2. Add Twilio image download logic
3. Implement vision model selection
4. Test with Claude Sonnet 3.5 or GPT-4 Vision
5. Add receipt parsing use case
6. Add event poster parsing use case
7. Document in user guide

## ⚠️ Current Limitation

**Users who send images will get:**
- Text-only response (image is ignored)
- No error message about images not being supported
- Potentially confusing experience

**Recommended immediate action:**
Add a detection message:
```javascript
if (req.body.NumMedia && parseInt(req.body.NumMedia) > 0) {
  await sendWhatsAppMessage(from, 
    '📸 קיבלתי תמונה, אבל עיבוד תמונות עדיין לא זמין.\n\n' +
    'בינתיים, אנא תאר במילים מה יש בתמונה ואעזור לך! ✍️'
  );
  return;
}
