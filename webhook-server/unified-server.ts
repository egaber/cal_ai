// Unified WhatsApp Server - Combines webhook handling and AI chat API
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, orderBy, limit, addDoc, Timestamp } from 'firebase/firestore';
import { llmService, Message } from '../src/services/llmService';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase Admin SDK (for webhook operations)
let adminDb: admin.firestore.Firestore | null = null;
let adminInitialized = false;

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${projectId}.firebaseio.com`
      });
      adminDb = admin.firestore();
      adminInitialized = true;
      console.log('✅ Firebase Admin SDK initialized');
    } catch (error) {
      console.error('❌ Firebase Admin SDK initialization error:', error);
    }
  } else {
    console.warn('⚠️  Firebase Admin SDK credentials not found in environment variables');
    console.warn('   Please create webhook-server/.env file with FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY');
  }
}

// Initialize Firebase Client SDK (for API operations)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

let firebaseInitialized = false;
let clientDb: ReturnType<typeof getFirestore> | null = null;

try {
  const firebaseApp = initializeApp(firebaseConfig);
  clientDb = getFirestore(firebaseApp);
  firebaseInitialized = true;
  console.log('✅ Firebase Client SDK initialized');
} catch (error) {
  console.error('❌ Firebase Client SDK initialization error:', error);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Get user ID from phone number
async function getUserId(phoneNumber: string): Promise<string | null> {
  if (!firebaseInitialized || !clientDb) {
    return null;
  }

  try {
    let normalizedPhone = phoneNumber.replace(/[\s\-+]/g, '');
    if (normalizedPhone.startsWith('whatsapp:')) {
      normalizedPhone = normalizedPhone.substring(9);
    }
    
    const variants = [
      phoneNumber,
      normalizedPhone,
      '+' + normalizedPhone
    ];
    
    if (normalizedPhone.startsWith('972') && normalizedPhone.length === 12) {
      const withExtraZero = '972' + '0' + normalizedPhone.substring(3);
      variants.push('+' + withExtraZero);
      variants.push(withExtraZero);
    }
    
    if (normalizedPhone.startsWith('9720') && normalizedPhone.length === 13) {
      const withoutExtraZero = '972' + normalizedPhone.substring(4);
      variants.push('+' + withoutExtraZero);
      variants.push(withoutExtraZero);
    }
    
    const usersRef = collection(clientDb, 'users');
    
    for (const variant of variants) {
      const q = query(usersRef, where('phoneNumber', '==', variant), limit(1));
      const usersSnapshot = await getDocs(q);
      
      if (!usersSnapshot.empty) {
        return usersSnapshot.docs[0].id;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

// Get user's family ID
async function getUserFamilyId(userId: string): Promise<string | null> {
  if (!firebaseInitialized || !clientDb) {
    return null;
  }

  try {
    const familiesRef = collection(clientDb, 'families');
    const familyQuery = query(
      familiesRef,
      where('memberUserIds', 'array-contains', userId),
      limit(1)
    );
    const familySnapshot = await getDocs(familyQuery);
    
    if (!familySnapshot.empty) {
      return familySnapshot.docs[0].id;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding family:', error);
    return null;
  }
}

// Get user's tasks
async function getUserTasks(userId: string): Promise<Array<any>> {
  if (!firebaseInitialized || !clientDb) {
    return [];
  }

  try {
    const familyId = await getUserFamilyId(userId);
    if (!familyId) {
      return [];
    }
    
    const tasksRef = collection(clientDb, 'families', familyId, 'members', userId, 'todos');
    const tasksQuery = query(tasksRef, where('completed', '==', false), limit(20));
    const tasksSnapshot = await getDocs(tasksQuery);
    
    return tasksSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      const taskTitle = data.rawText || data.title || data.text || data.description || 'Untitled task';
      return {
        id: doc.id,
        title: taskTitle,
        dueDate: data.dueDate,
        priority: data.priority,
        completed: data.completed || false
      };
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}

// Get user's events
async function getUserEvents(userId: string): Promise<Array<any>> {
  if (!firebaseInitialized || !clientDb) {
    return [];
  }

  try {
    const familyId = await getUserFamilyId(userId);
    if (!familyId) {
      return [];
    }
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const nextWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const eventsRef = collection(clientDb, 'families', familyId, 'members', userId, 'calendars', 'cal_ai', 'events');
    const allEventsSnapshot = await getDocs(query(eventsRef, limit(50)));
    
    const events = allEventsSnapshot.docs
      .map((doc: any) => {
        const data = doc.data();
        let startDate;
        
        if (data.start) {
          if (data.start.toDate) {
            startDate = data.start.toDate();
          } else if (data.start.seconds) {
            startDate = new Date(data.start.seconds * 1000);
          } else if (typeof data.start === 'string') {
            startDate = new Date(data.start);
          }
        }
        
        return {
          id: doc.id,
          title: data.title,
          start: data.start,
          startDate,
          end: data.end,
          category: data.category
        };
      })
      .filter((event: any) => {
        if (!event.startDate) return false;
        return event.startDate >= startOfToday && event.startDate <= nextWeek;
      })
      .sort((a: any, b: any) => a.startDate - b.startDate)
      .slice(0, 20)
      .map(({ startDate, ...event }) => event);
    
    return events;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

// Create task
async function createTask(userId: string, taskData: {
  title: string;
  dueDate?: Date;
  priority?: string;
  category?: string;
}): Promise<string | null> {
  if (!firebaseInitialized || !clientDb) {
    return null;
  }

  try {
    const familyId = await getUserFamilyId(userId);
    if (!familyId) {
      return null;
    }
    
    const tasksRef = collection(clientDb, 'families', familyId, 'members', userId, 'todos');
    
    const newTask = {
      title: taskData.title,
      text: taskData.title,
      completed: false,
      createdAt: Timestamp.now(),
      createdVia: 'whatsapp',
      ...(taskData.dueDate && { dueDate: Timestamp.fromDate(taskData.dueDate) }),
      ...(taskData.priority && { priority: taskData.priority }),
      ...(taskData.category && { category: taskData.category })
    };
    
    const docRef = await addDoc(tasksRef, newTask);
    console.log(`✅ Task created: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error creating task:', error);
    return null;
  }
}

// Handle user joining
async function handleUserJoin(phoneNumber: string, profileName: string) {
  if (!adminDb) {
    console.error('❌ Admin DB not initialized');
    return;
  }
  
  const usersRef = adminDb.collection('whatsapp_users');
  const existingUser = await usersRef.where('phoneNumber', '==', phoneNumber).get();
  
  if (existingUser.empty) {
    await usersRef.add({
      phoneNumber,
      profileName: profileName || 'Unknown',
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true,
      taskCount: 0,
    });
    console.log('👤 New user joined:', phoneNumber);
  } else {
    const userDoc = existingUser.docs[0];
    await userDoc.ref.update({
      active: true,
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('👤 User reactivated:', phoneNumber);
  }
}

// Process task message (basic version for webhook)
async function processTaskMessage(phoneNumber: string, taskText: string, messageId: string) {
  if (!adminDb) {
    console.error('❌ Admin DB not initialized');
    return;
  }
  
  const usersSnapshot = await adminDb.collection('whatsapp_users')
    .where('phoneNumber', '==', phoneNumber)
    .get();

  if (usersSnapshot.empty) {
    console.warn('⚠️  User not found for phone:', phoneNumber);
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;

  const taskRef = await adminDb!.collection('mobile_tasks').add({
    rawText: taskText,
    owner: 'Unknown',
    timeBucket: 'unlabeled',
    priority: 'P2',
    tags: [],
    involvedMembers: [],
    locations: [],
    completed: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: userId,
    createdVia: 'whatsapp',
    whatsappMessageId: messageId,
    phoneNumber,
  });

  await userDoc.ref.update({
    taskCount: admin.firestore.FieldValue.increment(1),
    lastActive: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('✅ Task created:', taskRef.id);
}

// Escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Initialize LLM service
async function initializeLLMService() {
  try {
    const geminiKey = process.env.VITE_GEMINI_API_KEY || 'AIzaSyCTPjC9Cq5Ea14NipWu5JxkeFG2PSOJlMA';
    const azureKey = process.env.VITE_AZURE_OPENAI_API_KEY || '';
    
    if (geminiKey && geminiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
      llmService.setGeminiKey(geminiKey);
      console.log('✅ Gemini API key loaded');
    }
    
    if (azureKey) {
      llmService.setAzureOpenAIKey(azureKey);
      console.log('✅ Azure OpenAI API key loaded');
    }
    
    const models = await llmService.getAvailableModels();
    console.log(`✅ ${models.length} AI models available:`, models.map(m => m.name).join(', '));
    
    return models.length > 0;
  } catch (error) {
    console.error('❌ Error initializing LLM service:', error);
    return false;
  }
}

// Generate AI response
async function generateAIResponse(
  message: string, 
  history: Array<{role: 'user' | 'assistant', content: string}> = [],
  phoneNumber: string
): Promise<string> {
  try {
    const userId = await getUserId(phoneNumber);
    
    if (!userId) {
      return 'שלום! אני לא מזהה את המספר שלך במערכת. 📱\n\n' +
             'בבקשה הוסף את מספר הטלפון שלך בהגדרות האפליקציה תחת "חיבור ל-WhatsApp"';
    }
    
    let contextInfo = '';
    const lowerMessage = message.toLowerCase();
    
    const isAskingAboutTasks = ['משימות', 'משימה', 'todo', 'task'].some(kw => lowerMessage.includes(kw));
    const isAskingAboutEvents = ['אירועים', 'אירוע', 'יומן', 'לוח', 'event', 'schedule'].some(kw => lowerMessage.includes(kw));
    const shouldCreateTask = ['צור', 'הוסף', 'תזכיר', 'לקנות', 'להביא', 'create', 'add', 'remind', 'buy'].some(kw => lowerMessage.includes(kw));
    
    const tasks = await getUserTasks(userId);
    if (isAskingAboutTasks || tasks.length > 0) {
      if (tasks.length > 0) {
        contextInfo += '\n\n📋 משימות פתוחות:\n';
        tasks.forEach((task, index) => {
          contextInfo += `${index + 1}. ${task.title}`;
          if (task.dueDate) {
            const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate.seconds * 1000);
            contextInfo += ` (${dueDate.toLocaleDateString('he-IL')})`;
          }
          if (task.priority) {
            contextInfo += ` [${task.priority}]`;
          }
          contextInfo += '\n';
        });
      } else if (isAskingAboutTasks) {
        contextInfo += '\n\n📋 אין משימות פתוחות כרגע.\n';
      }
    }
    
    const events = await getUserEvents(userId);
    if (isAskingAboutEvents || events.length > 0) {
      if (events.length > 0) {
        contextInfo += '\n\n📅 אירועים קרובים (7 ימים):\n';
        events.forEach((event, index) => {
          const startDate = event.start.toDate ? event.start.toDate() : new Date(event.start.seconds * 1000);
          contextInfo += `${index + 1}. ${event.title} - ${startDate.toLocaleString('he-IL')}`;
          if (event.category) {
            contextInfo += ` [${event.category}]`;
          }
          contextInfo += '\n';
        });
      } else if (isAskingAboutEvents) {
        contextInfo += '\n\n📅 אין אירועים קרובים.\n';
      }
    }
    
    const models = await llmService.getAvailableModels();
    
    if (models.length === 0) {
      return `Got it! ✅\n\n"${message}"\n\nI've noted this down. Check the Cal AI app!`;
    }

    const preferredModelIds = [
      'copilot:gpt-4.1',
      'claude-sonnet-4',
      'gpt-4.1',
      'gpt-5-mini',
      'grok-4-fast-reasoning',
      'o3-mini'
    ];
    
    let model = models[0];
    
    for (const preferredId of preferredModelIds) {
      const found = models.find(m => m.id === preferredId || m.id.includes(preferredId));
      if (found) {
        model = found;
        break;
      }
    }
    
    if (!preferredModelIds.some(id => model.id === id || model.id.includes(id))) {
      const nonGeminiModel = models.find(m => m.provider !== 'gemini');
      if (nonGeminiModel) {
        model = nonGeminiModel;
      }
    }

    const messages: Message[] = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    messages.push({
      role: 'user',
      content: message
    });

    const systemPrompt = `You are Cal AI, a helpful personal assistant integrated with WhatsApp.
You help users manage their tasks, schedule, and family calendar.

Current context:
- User ID: ${userId}
- Phone: ${phoneNumber}
- Date: ${new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Time: ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
${contextInfo}

Guidelines:
- Respond in the same language as the user (Hebrew/English)
- Be concise and friendly (WhatsApp is for quick messages)
- Use emojis to make responses warm and engaging
- Keep responses under 300 characters when possible

Family members to recognize: Eyal, Ella, Hilly, Yael, Alon

IMPORTANT: Be conversational and helpful, not robotic.`;

    const response = await llmService.chat({
      messages,
      model,
      systemPrompt
    });

    if (response.error) {
      console.error('LLM Service Error:', response.error);
      return `Got it! ✅\n\n"${message}"\n\nI've noted this down!`;
    }

    let aiResponse = response.content || `Got it! ✅\n\n"${message}"\n\nI've noted this down!`;
    
    // Save memory if needed
    const memorySavePattern = /<MEMORY_SAVE>\s*(\{[\s\S]*?\})\s*<\/MEMORY_SAVE>/g;
    const memorySaveMatches = [...aiResponse.matchAll(memorySavePattern)];
    
    if (memorySaveMatches.length > 0 && userId && clientDb) {
      const familyId = await getUserFamilyId(userId);
      if (familyId) {
        const memoryRef = collection(clientDb, 'families', familyId, 'memory');
        
        for (const match of memorySaveMatches) {
          try {
            const memoryData = JSON.parse(match[1]);
            await addDoc(memoryRef, {
              memoryType: memoryData.memoryType,
              text: memoryData.text,
              source: 'ai_inferred',
              confidence: 0.95,
              tags: [...(memoryData.tags || []), 'whatsapp', 'llm'],
              structured: memoryData.structured || {},
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            });
            console.log(`✅ Memory saved`);
          } catch (error) {
            console.error(`❌ Failed to save memory:`, error);
          }
        }
        
        aiResponse = aiResponse.replace(memorySavePattern, '').trim();
      }
    }
    
    // Create task if needed
    if (shouldCreateTask && userId) {
      await createTask(userId, { title: message });
    }

    return aiResponse;

  } catch (error) {
    console.error('Error in generateAIResponse:', error);
    return `Got it! ✅\n\n"${message}"\n\nI've noted this down!`;
  }
}

// ============================================================================
// ENDPOINTS
// ============================================================================

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Cal AI Unified WhatsApp Server',
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook: 'POST /whatsapp',
      chat: 'POST /chat',
      health: 'GET /health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Cal AI Unified WhatsApp Server' });
});

// WhatsApp webhook endpoint (receives messages from Twilio)
app.post('/whatsapp', async (req, res) => {
  console.log('\n📱 Received WhatsApp message:', {
    from: req.body.From,
    body: req.body.Body,
    timestamp: new Date().toISOString()
  });

  try {
    const {
      From: from,
      To: to,
      Body: body,
      MessageSid: messageSid,
      ProfileName: profileName,
      NumMedia: numMedia,
    } = req.body;

    const phoneNumber = from.replace('whatsapp:', '');

    // Store message in Firestore
    if (!adminDb) {
      console.error('❌ Admin DB not initialized, cannot store message');
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Server configuration error. Please contact support.</Message>
</Response>`;
      res.type('text/xml');
      return res.send(errorTwiml);
    }

    const messageRef = await adminDb.collection('whatsapp_messages').add({
      from: phoneNumber,
      to: to.replace('whatsapp:', ''),
      body: body || '',
      messageSid,
      profileName: profileName || 'Unknown',
      numMedia: parseInt(numMedia) || 0,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      processed: false,
    });

    console.log('✅ Message stored with ID:', messageRef.id);

    let responseMessage = '';

    if (body.toLowerCase().includes('join knowledge-dog')) {
      await handleUserJoin(phoneNumber, profileName);
      responseMessage = "Welcome to Cal AI! 🎉\n\n" +
        "You're now connected to your intelligent task assistant.\n\n" +
        "Send me tasks like:\n" +
        "• 'Pick up Yael from school tomorrow at 3pm'\n" +
        "• 'Buy milk today'\n" +
        "• 'Call Ella this evening'\n\n" +
        "I'll help you organize everything!";
    } else if (body.toLowerCase().includes('help')) {
      responseMessage = "Cal AI Help 📚\n\n" +
        "I can help you manage tasks via WhatsApp!\n\n" +
        "Commands:\n" +
        "• Send any task naturally\n" +
        "• 'list' - Show your tasks\n" +
        "• 'help' - Show this message\n\n" +
        "Examples:\n" +
        "• 'Dentist appointment tomorrow 2pm'\n" +
        "• 'Buy groceries today'\n" +
        "• 'Call mom this evening'";
    } else {
      // Use AI to generate response
      const aiResponse = await generateAIResponse(body, [], phoneNumber);
      responseMessage = aiResponse;
      
      // Also process as task in the old system for compatibility
      await processTaskMessage(phoneNumber, body, messageRef.id);
    }

    console.log('📤 Sending response:', responseMessage.substring(0, 100) + '...');

    // Send TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(responseMessage)}</Message>
</Response>`;

    res.type('text/xml');
    res.send(twiml);

  } catch (error) {
    console.error('❌ Error processing message:', error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Sorry, something went wrong. Please try again later.</Message>
</Response>`;
    
    res.type('text/xml');
    res.send(errorTwiml);
  }
});

// Chat API endpoint (for programmatic access)
app.post('/chat', async (req, res) => {
  try {
    const { message, phoneNumber, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('\n🤖 AI Chat Request:');
    console.log('From:', phoneNumber);
    console.log('Message:', message);

    const response = await generateAIResponse(message, conversationHistory, phoneNumber);
    
    console.log('✅ AI Response:', response.substring(0, 100) + (response.length > 100 ? '...' : ''));

    res.json({
      response: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Chat Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// START SERVER
// ============================================================================

const PORT = process.env.PORT || 6000;

async function startServer() {
  console.log('\n🚀 Initializing Cal AI Unified WhatsApp Server...\n');
  
  const hasModels = await initializeLLMService();
  
  if (!hasModels) {
    console.warn('\n⚠️  Warning: No AI models available!');
    console.warn('   The server will use basic responses.');
    console.warn('   Add API keys in .env to enable full AI features.\n');
  }
  
  app.listen(PORT, () => {
    console.log('\n🚀 Cal AI Unified WhatsApp Server Started!');
    console.log('============================================');
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`📱 Webhook endpoint: http://localhost:${PORT}/whatsapp`);
    console.log(`🤖 Chat API endpoint: http://localhost:${PORT}/chat`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
    console.log('\n📋 Features:');
    console.log('  ✅ WhatsApp webhook handling');
    console.log('  ✅ AI-powered responses');
    console.log('  ✅ Task creation');
    console.log('  ✅ Memory extraction');
    console.log('  ✅ Context awareness');
    console.log('\n💡 Next steps:');
    console.log('1. Run ngrok: ngrok http ' + PORT);
    console.log('2. Copy the ngrok HTTPS URL');
    console.log('3. Add /whatsapp to the end');
    console.log('4. Set it in Twilio webhook settings');
    console.log('\nWaiting for messages...\n');
  });
}

startServer();
