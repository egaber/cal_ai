// AI API Server - TypeScript version that directly uses llmService
import express from 'express';
import cors from 'cors';
import { llmService, Message } from '../src/services/llmService';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase with client SDK
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
let db: ReturnType<typeof getFirestore> | null = null;

try {
  const firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp);
  firebaseInitialized = true;
  console.log('✅ Firebase initialized');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// Get user ID from phone number
async function getUserId(phoneNumber: string): Promise<string | null> {
  if (!firebaseInitialized || !db) {
    return null;
  }

  try {
    // Normalize phone number (remove +, spaces, dashes)
    let normalizedPhone = phoneNumber.replace(/[\s\-+]/g, '');
    
    // Remove 'whatsapp:' prefix if present
    if (normalizedPhone.startsWith('whatsapp:')) {
      normalizedPhone = normalizedPhone.substring(9);
    }
    
    // Try to find user by phone number
    const usersRef = collection(db, 'users');
    
    // Create variants to try:
    // 1. Original (e.g., +972502234226)
    // 2. Normalized (e.g., 972502234226)
    // 3. With + prefix (e.g., +972502234226)
    // 4. With extra 0 after country code (e.g., +9720502234226) - common mistake
    const variants = [
      phoneNumber,
      normalizedPhone,
      '+' + normalizedPhone
    ];
    
    // Add variant with extra 0 if it's an Israeli number without it
    if (normalizedPhone.startsWith('972') && normalizedPhone.length === 12) {
      // 972502234226 -> 9720502234226 (add 0 after 972)
      const withExtraZero = '972' + '0' + normalizedPhone.substring(3);
      variants.push('+' + withExtraZero);
      variants.push(withExtraZero);
    }
    
    // Also try removing extra 0 if present
    if (normalizedPhone.startsWith('9720') && normalizedPhone.length === 13) {
      // 9720502234226 -> 972502234226 (remove 0 after 972)
      const withoutExtraZero = '972' + normalizedPhone.substring(4);
      variants.push('+' + withoutExtraZero);
      variants.push(withoutExtraZero);
    }
    
    console.log('🔍 Searching for user with phone number:', phoneNumber);
    console.log('📱 Normalized phone:', normalizedPhone);
    console.log('🔄 Will try these variants:', variants);
    
    // Try each variant
    for (const variant of variants) {
      console.log(`  → Trying: "${variant}"`);
      const q = query(usersRef, where('phoneNumber', '==', variant), limit(1));
      const usersSnapshot = await getDocs(q);
      
      if (!usersSnapshot.empty) {
        const userId = usersSnapshot.docs[0].id;
        const userPhone = usersSnapshot.docs[0].data().phoneNumber;
        console.log(`✅ MATCH FOUND!`);
        console.log(`   User ID: ${userId}`);
        console.log(`   DB phone: "${userPhone}"`);
        console.log(`   Matched variant: "${variant}"`);
        return userId;
      } else {
        console.log(`  ✗ No match for: "${variant}"`);
      }
    }
    
    console.log('❌ NO USER FOUND!');
    console.log('   Original phone:', phoneNumber);
    console.log('   Tried all variants:', variants);
    console.log('   Please check what is stored in Firestore under users/{userId}/phoneNumber');
    return null;
    
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

// Get user's family ID
async function getUserFamilyId(userId: string): Promise<string | null> {
  if (!firebaseInitialized || !db) {
    return null;
  }

  try {
    // Query families collection to find which family this user belongs to
    const familiesRef = collection(db, 'families');
    const familyQuery = query(
      familiesRef,
      where('memberUserIds', 'array-contains', userId),
      limit(1)
    );
    const familySnapshot = await getDocs(familyQuery);
    
    if (!familySnapshot.empty) {
      const familyId = familySnapshot.docs[0].id;
      console.log(`👨‍👩‍👧‍👦 Found family: ${familyId} for user ${userId}`);
      return familyId;
    }
    
    console.log(`⚠️  No family found for user ${userId}`);
    return null;
    
  } catch (error) {
    console.error('Error finding family:', error);
    return null;
  }
}

// Get user's tasks from Firestore (family-based structure)
async function getUserTasks(userId: string): Promise<Array<{
  id: string;
  title: string;
  dueDate?: any;
  priority?: string;
  completed: boolean;
}>> {
  if (!firebaseInitialized || !db) {
    return [];
  }

  try {
    // Get user's family ID
    const familyId = await getUserFamilyId(userId);
    if (!familyId) {
      console.log('📋 No family found, cannot fetch tasks');
      return [];
    }
    
    // Get user's tasks from family structure: /families/{familyId}/members/{userId}/todos/*
    const tasksRef = collection(db, 'families', familyId, 'members', userId, 'todos');
    const tasksQuery = query(
      tasksRef,
      where('completed', '==', false),
      limit(20)
    );
    const tasksSnapshot = await getDocs(tasksQuery);
    
    const tasks = tasksSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      // Priority: rawText (from mobile parser) > title > text > description
      const taskTitle = data.rawText || data.title || data.text || data.description || 'Untitled task';
      return {
        id: doc.id,
        title: taskTitle,
        dueDate: data.dueDate,
        priority: data.priority,
        completed: data.completed || false
      };
    });
    
    console.log(`📋 Found ${tasks.length} tasks for user ${userId}`);
    return tasks;
    
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}

// Get user's calendar events from Firestore (family-based structure)
async function getUserEvents(userId: string): Promise<Array<{
  id: string;
  title: string;
  start: any;
  end?: any;
  category?: string;
}>> {
  if (!firebaseInitialized || !db) {
    return [];
  }

  try {
    // Get user's family ID
    const familyId = await getUserFamilyId(userId);
    if (!familyId) {
      console.log('📅 No family found, cannot fetch events');
      return [];
    }
    
    // Get events from start of today to 7 days from now
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const nextWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    console.log(`📅 Querying events from ${startOfToday.toISOString()} to ${nextWeek.toISOString()}`);
    
    // Path: /families/{familyId}/members/{userId}/calendars/cal_ai/events/*
    const eventsRef = collection(db, 'families', familyId, 'members', userId, 'calendars', 'cal_ai', 'events');
    
    // Try without date filtering first to see if there are any events
    const allEventsSnapshot = await getDocs(query(eventsRef, limit(50)));
    console.log(`📅 Total events in collection: ${allEventsSnapshot.size}`);
    
    if (allEventsSnapshot.size > 0) {
      // Log first few events for debugging
      allEventsSnapshot.docs.slice(0, 3).forEach((doc: any) => {
        const data = doc.data();
        console.log(`  Event: "${data.title}" - start: ${data.start}`);
      });
    }
    
    // Filter events manually (to avoid Firestore index issues)
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
          } else {
            startDate = data.start;
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
        // Include events that start today or in the next 7 days
        if (!event.startDate) return false;
        return event.startDate >= startOfToday && event.startDate <= nextWeek;
      })
      .sort((a: any, b: any) => a.startDate - b.startDate)
      .slice(0, 20)
      .map(({ startDate, ...event }) => event); // Remove the temporary startDate field
    
    console.log(`📅 Found ${events.length} events for user ${userId} (filtered from ${allEventsSnapshot.size} total)`);
    return events;
    
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

// Create a new task in Firestore (family-based structure)
async function createTask(userId: string, taskData: {
  title: string;
  dueDate?: Date;
  priority?: string;
  category?: string;
}): Promise<string | null> {
  if (!firebaseInitialized || !db) {
    return null;
  }

  try {
    // Get user's family ID
    const familyId = await getUserFamilyId(userId);
    if (!familyId) {
      console.log('✏️ No family found, cannot create task');
      return null;
    }
    
    // Create task in family structure: /families/{familyId}/members/{userId}/todos/*
    const tasksRef = collection(db, 'families', familyId, 'members', userId, 'todos');
    const { addDoc, Timestamp } = await import('firebase/firestore');
    
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
    console.log(`✅ Created task: ${docRef.id}`);
    return docRef.id;
    
  } catch (error) {
    console.error('Error creating task:', error);
    return null;
  }
}

// Initialize LLM service with API keys
async function initializeLLMService() {
  try {
    // Try to get API keys from environment variables or hardcoded config
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Cal AI Chat API' });
});

// Chat endpoint for WhatsApp webhook
app.post('/chat', async (req, res) => {
  try {
    const { message, phoneNumber, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('\n🤖 AI Chat Request:');
    console.log('From:', phoneNumber);
    console.log('Message:', message);
    console.log('History length:', conversationHistory?.length || 0);

    // Generate AI response using actual LLM service
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

// Generate AI response using llmService
async function generateAIResponse(
  message: string, 
  history: Array<{role: 'user' | 'assistant', content: string}> = [],
  phoneNumber: string
): Promise<string> {
  try {
    // Get user ID
    const userId = await getUserId(phoneNumber);
    
    if (!userId) {
      return 'שלום! אני לא מזהה את המספר שלך במערכת. 📱\n\n' +
             'בבקשה הוסף את מספר הטלפון שלך בהגדרות האפליקציה תחת "חיבור ל-WhatsApp"';
    }
    
    // Get user's tasks and events context
    let contextInfo = '';
    const lowerMessage = message.toLowerCase();
    
    // Check what user is asking about
    const isAskingAboutTasks = ['משימות', 'משימה', 'todo', 'task'].some(kw => lowerMessage.includes(kw));
    const isAskingAboutEvents = ['אירועים', 'אירוע', 'יומן', 'לוח', 'event', 'schedule'].some(kw => lowerMessage.includes(kw));
    const shouldCreateTask = ['צור', 'הוסף', 'תזכיר', 'לקנות', 'להביא', 'create', 'add', 'remind', 'buy'].some(kw => lowerMessage.includes(kw));
    
    // Fetch tasks
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
    
    // Fetch events
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
    
    // Get available models
    const models = await llmService.getAvailableModels();
    
    if (models.length === 0) {
      return getSmartFallback(message, phoneNumber);
    }

    // Priority: Local Copilot 4.1 > Azure GPT-4.1 > Other Azure models > Any available
    // Avoid Gemini (overloaded)
    const preferredModelIds = [
      'copilot:gpt-4.1',           // Local VS Code Copilot
      'claude-sonnet-4',           // Local Claude
      'gpt-4.1',                   // Azure GPT-4.1
      'gpt-5-mini',                // Azure GPT-5 Mini
      'grok-4-fast-reasoning',     // Azure Grok
      'o3-mini'                    // Azure O3 Mini
    ];
    
    let model = models[0]; // Default to first model
    
    // Find first available preferred model
    for (const preferredId of preferredModelIds) {
      const found = models.find(m => m.id === preferredId || m.id.includes(preferredId));
      if (found) {
        model = found;
        console.log(`✅ Using model: ${model.name} (${model.provider})`);
        break;
      }
    }
    
    // If no preferred model found, use first non-Gemini model
    if (!preferredModelIds.some(id => model.id === id || model.id.includes(id))) {
      const nonGeminiModel = models.find(m => m.provider !== 'gemini');
      if (nonGeminiModel) {
        model = nonGeminiModel;
      }
      console.log(`✅ Using fallback model: ${model.name} (${model.provider})`);
    }

    // Build messages array
    const messages: Message[] = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    // System prompt for WhatsApp context
    const systemPrompt = `You are Cal AI, a helpful personal assistant integrated with WhatsApp.
You help users manage their tasks, schedule, and family calendar.

Current context:
- User ID: ${userId}
- Phone: ${phoneNumber}
- Date: ${new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Time: ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
${contextInfo}

IMPORTANT CAPABILITIES:
- You can see the user's actual tasks and events above
- When user asks to create a task, respond that you'll add it and note the details
- Format: "✅ הוספתי משימה: [task title]"

Guidelines:
- Respond in the same language as the user (Hebrew/English)
- Be concise and friendly (WhatsApp is for quick messages)
- Use emojis to make responses warm and engaging
- If user asks about their tasks/events, reference the actual data above
- If user wants to create a task, acknowledge and say it's been added
- Be proactive in helping organize their day
- Keep responses under 300 characters when possible

Family members to recognize: Eyal, Ella, Hilly, Yael, Alon

IMPORTANT: Be conversational and helpful, not robotic. Act like a smart assistant who knows them.`;

    // Call LLM service
    const response = await llmService.chat({
      messages,
      model,
      systemPrompt
    });

    if (response.error) {
      console.error('LLM Service Error:', response.error);
      return getSmartFallback(message, phoneNumber);
    }

    const aiResponse = response.content || getSmartFallback(message, phoneNumber);
    
    // Check if user is creating a task (after AI response)
    const isCreatingTask = shouldCreateTask || containsTaskKeywords(lowerMessage);
    
    if (isCreatingTask && userId) {
      // Extract task details from message
      const taskTitle = message;
      const dueDate = parseDate(lowerMessage);
      const priority = parsePriority(lowerMessage);
      
      // Create the task
      const taskId = await createTask(userId, {
        title: taskTitle,
        ...(dueDate && { dueDate }),
        ...(priority && { priority })
      });
      
      if (taskId) {
        console.log(`✅ Task created: ${taskId}`);
      }
    }

    return aiResponse;

  } catch (error) {
    console.error('Error in generateAIResponse:', error);
    return getSmartFallback(message, phoneNumber);
  }
}

// Smart fallback responses when LLM is not available
function getSmartFallback(message: string, phoneNumber: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Task creation
  if (containsTaskKeywords(lowerMessage)) {
    const timeInfo = extractTimeInfo(lowerMessage);
    const taskType = detectTaskType(lowerMessage);
    
    return `Got it! ✅\n\n` +
           `Task: "${message}"\n` +
           (timeInfo ? `⏰ ${timeInfo}\n` : '') +
           (taskType ? `📋 ${taskType}\n` : '') +
           `\nI've noted this down. Check the Cal AI app to see it!`;
  }
  
  // Questions about schedule
  if (lowerMessage.includes('what') && (lowerMessage.includes('today') || lowerMessage.includes('schedule'))) {
    return `📅 I'd love to show you your schedule!\n\n` +
           `Right now I need the Cal AI app running to access your calendar.\n\n` +
           `Open the app to see your full schedule! 📱`;
  }
  
  // Time-based tasks
  if (containsTimeReference(lowerMessage)) {
    const when = extractTimeReference(lowerMessage);
    return `Noted for ${when}! ✅\n\n` +
           `"${message}"\n\n` +
           `I've added this to your calendar. Check the Cal AI app to see it! 📱`;
  }
  
  // Family member mentions
  const familyMember = detectFamilyMember(lowerMessage);
  if (familyMember) {
    return `Got it! Noted for ${familyMember}. 👨‍👩‍👧‍👦\n\n` +
           `"${message}"\n\n` +
           `This is in the family calendar now!`;
  }
  
  // Default intelligent response
  return `Thanks for your message! 😊\n\n` +
         `I'm Cal AI, your personal assistant. Send me tasks, appointments, or questions ` +
         `and I'll help keep you organized!\n\n` +
         `💡 Try: "Buy milk tomorrow" or "What's my schedule today?"`;
}

// Helper functions
function containsTaskKeywords(text: string): boolean {
  const keywords = ['buy', 'get', 'pick up', 'pickup', 'fetch', 'call', 'email', 'send', 
                    'remember to', 'need to', 'have to', 'must', 'should', 'don\'t forget'];
  return keywords.some(keyword => text.includes(keyword));
}

function containsTimeReference(text: string): boolean {
  const timeWords = ['today', 'tomorrow', 'tonight', 'morning', 'afternoon', 
                     'evening', 'next week', 'monday', 'tuesday', 'wednesday',
                     'thursday', 'friday', 'saturday', 'sunday', 'this week'];
  return timeWords.some(word => text.includes(word)) || /\d{1,2}(am|pm|:)/i.test(text);
}

function extractTimeInfo(text: string): string | null {
  if (text.includes('today')) return 'Today';
  if (text.includes('tomorrow')) return 'Tomorrow';
  if (text.includes('tonight')) return 'Tonight';
  if (text.includes('next week')) return 'Next week';
  if (text.includes('this week')) return 'This week';
  
  // Check for specific time
  const timeMatch = text.match(/(\d{1,2})(:\d{2})?\s*(am|pm)/i);
  if (timeMatch) return `At ${timeMatch[0]}`;
  
  return null;
}

function extractTimeReference(text: string): string {
  if (text.includes('today')) return 'today';
  if (text.includes('tomorrow')) return 'tomorrow';
  if (text.includes('tonight')) return 'tonight';
  if (text.includes('next week')) return 'next week';
  if (text.includes('this evening')) return 'this evening';
  if (text.includes('this morning')) return 'this morning';
  if (text.includes('this afternoon')) return 'this afternoon';
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  for (const day of days) {
    if (text.includes(day)) return day.charAt(0).toUpperCase() + day.slice(1);
  }
  
  return 'soon';
}

function detectTaskType(text: string): string | null {
  if (text.includes('buy') || text.includes('shopping') || text.includes('get')) return 'Shopping';
  if (text.includes('pick up') || text.includes('pickup') || text.includes('fetch')) return 'Errand';
  if (text.includes('call') || text.includes('phone')) return 'Call';
  if (text.includes('email') || text.includes('send')) return 'Communication';
  if (text.includes('meeting') || text.includes('appointment')) return 'Meeting';
  return null;
}

function detectFamilyMember(text: string): string | null {
  const members = ['eyal', 'ella', 'hilly', 'yael', 'alon'];
  for (const member of members) {
    if (text.includes(member)) {
      return member.charAt(0).toUpperCase() + member.slice(1);
    }
  }
  return null;
}

// Parse date from message
function parseDate(text: string): Date | null {
  const now = new Date();
  
  // Hebrew
  if (text.includes('היום')) return now;
  if (text.includes('מחר')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  if (text.includes('מחרתיים')) {
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);
    return dayAfter;
  }
  
  // English
  if (text.includes('today')) return now;
  if (text.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  
  // Check for specific time
  const timeMatch = text.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|בבוקר|בערב)?/i);
  if (timeMatch) {
    const date = new Date(now);
    let hour = parseInt(timeMatch[1]);
    const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3]?.toLowerCase();
    
    if (period === 'pm' || period === 'בערב') {
      if (hour < 12) hour += 12;
    } else if (period === 'am' || period === 'בבוקר') {
      if (hour === 12) hour = 0;
    }
    
    date.setHours(hour, minute, 0, 0);
    return date;
  }
  
  return null;
}

// Parse priority from message
function parsePriority(text: string): string | null {
  if (text.includes('דחוף') || text.includes('urgent') || text.includes('חשוב')) return 'high';
  if (text.includes('רגיל') || text.includes('normal')) return 'medium';
  if (text.includes('נמוך') || text.includes('low')) return 'low';
  return null;
}

// Start server
const PORT = process.env.AI_API_PORT || 6000;

async function startServer() {
  console.log('\n🚀 Initializing Cal AI Chat API Server...\n');
  
  const hasModels = await initializeLLMService();
  
  if (!hasModels) {
    console.warn('\n⚠️  Warning: No AI models available!');
    console.warn('   The server will use smart fallback responses.');
    console.warn('   Add API keys in the Cal AI app to enable full AI features.\n');
  }
  
  app.listen(PORT, () => {
    console.log('\n🤖 Cal AI Chat API Server');
    console.log('=========================');
    console.log(`📡 Running on: http://localhost:${PORT}`);
    console.log(`💬 Chat endpoint: POST http://localhost:${PORT}/chat`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
    console.log('\n✅ Ready to serve AI responses!\n');
  });
}

startServer();
