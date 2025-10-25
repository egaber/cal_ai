# WhatsApp Integration Architecture

## 🏗️ System Architecture

```
┌─────────────────┐
│   User Phone    │
│   (WhatsApp)    │
└────────┬────────┘
         │
         │ 1. Send message
         │ "Pick up Yael at 3pm"
         ▼
┌─────────────────┐
│  Twilio API     │
│  WhatsApp       │
│  Sandbox/Prod   │
└────────┬────────┘
         │
         │ 2. HTTP POST webhook
         │ Body: { From, To, Body, MessageSid }
         ▼
┌──────────────────────────────────────┐
│  Google Cloud Function               │
│  whatsappWebhook()                   │
│                                      │
│  • Validate request                  │
│  • Parse message                     │
│  • Store in Firestore               │
│  • Process command/task             │
│  • Generate TwiML response          │
└────────┬─────────────────────────────┘
         │
         │ 3. Store data
         ▼
┌─────────────────────────────────────┐
│  Firebase Firestore                 │
│                                     │
│  Collections:                       │
│  • whatsapp_messages               │
│  • whatsapp_users                  │
│  • mobile_tasks                    │
└────────┬────────────────────────────┘
         │
         │ 4. Real-time sync
         ▼
┌─────────────────┐
│   Cal AI App    │
│  (React/TS)     │
│                 │
│  • Display tasks│
│  • Edit/update  │
│  • Schedule     │
└─────────────────┘
```

## 🔄 Message Flow

### Incoming Message Flow

1. **User sends WhatsApp message** → Twilio receives it
2. **Twilio webhook fires** → POSTs to Cloud Function URL
3. **Cloud Function processes**:
   ```typescript
   - Extracts: from, body, messageSid
   - Stores in: whatsapp_messages collection
   - Identifies user: whatsapp_users collection
   - Parses task: creates mobile_tasks document
   - Generates response: TwiML message
   ```
4. **Twilio sends reply** → User receives confirmation
5. **App syncs** → Task appears in Cal AI mobile app

### Data Flow

```
WhatsApp Message
    ↓
{
  From: "whatsapp:+1234567890",
  To: "whatsapp:+14155238886",
  Body: "Pick up Yael from school at 3pm tomorrow",
  MessageSid: "SM...",
  ProfileName: "John"
}
    ↓
Cloud Function Processing
    ↓
Firestore Documents Created:

1. whatsapp_messages/{messageId}
   {
     from: "+1234567890",
     body: "Pick up Yael...",
     timestamp: ServerTimestamp,
     processed: true
   }

2. mobile_tasks/{taskId}
   {
     rawText: "Pick up Yael...",
     createdVia: "whatsapp",
     createdBy: userId,
     timeBucket: "tomorrow",
     completed: false
   }
    ↓
TwiML Response
    ↓
{
  message: "Got it! ✅\n\nI've added: 'Pick up Yael...'"
}
    ↓
User receives confirmation in WhatsApp
```

## 📊 Firestore Schema

### whatsapp_messages
```typescript
{
  id: string (auto-generated)
  from: string              // "+1234567890"
  to: string                // "+14155238886"
  body: string              // Message text
  messageSid: string        // Twilio ID
  profileName: string       // User's WhatsApp name
  numMedia: number          // Number of attachments
  timestamp: Timestamp      // Server time
  processed: boolean        // Processing status
}
```

### whatsapp_users
```typescript
{
  id: string (auto-generated)
  phoneNumber: string       // "+1234567890"
  profileName: string       // WhatsApp display name
  joinedAt: Timestamp       // When joined
  active: boolean           // Active status
  taskCount: number         // Total tasks created
  lastActive: Timestamp     // Last message time
  linkedUserId?: string     // Firebase Auth UID (future)
}
```

### mobile_tasks (WhatsApp-created)
```typescript
{
  id: string (auto-generated)
  rawText: string           // Original message
  owner: string             // Parsed or "Unknown"
  timeBucket: string        // "today" | "tomorrow" | etc.
  priority: string          // "P1" | "P2" | "P3"
  tags: Tag[]              // Parsed tags
  involvedMembers: string[] // Family members
  locations: string[]       // Places mentioned
  completed: boolean        // Task status
  createdAt: Timestamp      // Creation time
  createdBy: string         // whatsapp_users ID
  createdVia: "whatsapp"    // Source marker
  whatsappMessageId: string // Link to message
  phoneNumber: string       // User's phone
}
```

## 🔐 Security Model

### Cloud Function
```
• HTTPS only
• Validates Twilio signature (recommended)
• Rate limiting per phone number
• No direct user access
```

### Firestore Rules
```javascript
// Only authenticated users can read their own data
// Only Cloud Functions can write
match /whatsapp_messages/{messageId} {
  allow read: if request.auth != null;
  allow write: if false;
}

match /whatsapp_users/{userId} {
  allow read: if request.auth != null && 
              request.auth.uid == userId;
  allow write: if false;
}

match /mobile_tasks/{taskId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update, delete: if request.auth.uid == 
                           resource.data.createdBy;
}
```

## 🎯 Command Processing Logic

```typescript
if (message.includes("join knowledge-dog")) {
  → Create/update whatsapp_users
  → Send welcome message
  
} else if (message.includes("help")) {
  → Send help text
  
} else if (message.includes("list")) {
  → Query user's tasks
  → Send formatted list
  
} else {
  → Parse as task
  → Create mobile_tasks document
  → Send confirmation
}
```

## 🚀 Deployment Architecture

```
Development:
  Local → Firebase Emulators
  Test → Twilio Sandbox

Production:
  Cloud Functions → us-central1 region
  Firestore → Multi-region
  Twilio → Production WhatsApp number
```

## 📈 Scaling Considerations

### Current Setup (Starter)
- Firebase Functions: 125K calls/month free
- Firestore: 50K reads, 20K writes/day free
- Suitable for: Personal use, small teams

### Growth Path
- Add caching with Redis
- Implement message queues
- Use Cloud Run for more control
- Add load balancing
- Implement batch processing

## 🔄 Future Enhancements

1. **Enhanced Task Parsing**
   - Use existing task parser service
   - Extract times, priorities, family members
   - Support complex recurrence patterns

2. **Two-Way Sync**
   - Send task updates to WhatsApp
   - Notify on completions
   - Daily summaries

3. **Rich Messaging**
   - WhatsApp buttons/templates
   - Interactive lists
   - Quick reply options

4. **Voice Support**
   - Process voice messages
   - Speech-to-text conversion
   - Voice responses (TTS)

5. **Multi-User**
   - Link WhatsApp to Firebase Auth
   - Family account linking
   - Shared task lists

6. **Analytics**
   - Usage tracking
   - Popular commands
   - Response times
   - User engagement metrics
