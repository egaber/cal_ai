const express = require('express');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
// Option 1: Use service account key file
// const serviceAccount = require('./serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// Option 2: Use environment variables (recommended)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
}

const db = admin.firestore();
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Cal AI WhatsApp Webhook',
    timestamp: new Date().toISOString()
  });
});

// WhatsApp webhook endpoint
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

    // Extract phone number (remove 'whatsapp:' prefix)
    const phoneNumber = from.replace('whatsapp:', '');

    // Store message in Firestore
    const messageRef = await db.collection('whatsapp_messages').add({
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

    // Process the message based on content
    let responseMessage = '';

    if (body.toLowerCase().includes('join knowledge-dog')) {
      // User is joining
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
      // Parse as a task
      await processTaskMessage(phoneNumber, body, messageRef.id);
      responseMessage = "Got it! ✅\n\n" +
        `I've added: "${body}"\n\n` +
        "You can view all your tasks in the Cal AI app.";
    }

    console.log('📤 Sending response:', responseMessage);

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

// Handle user joining
async function handleUserJoin(phoneNumber, profileName) {
  const usersRef = db.collection('whatsapp_users');
  
  // Check if user already exists
  const existingUser = await usersRef.where('phoneNumber', '==', phoneNumber).get();
  
  if (existingUser.empty) {
    // Create new user
    await usersRef.add({
      phoneNumber,
      profileName: profileName || 'Unknown',
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true,
      taskCount: 0,
    });
    console.log('👤 New user joined:', phoneNumber);
  } else {
    // Update existing user
    const userDoc = existingUser.docs[0];
    await userDoc.ref.update({
      active: true,
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('👤 User reactivated:', phoneNumber);
  }
}

// Process incoming task message
async function processTaskMessage(phoneNumber, taskText, messageId) {
  // Find user by phone number
  const usersSnapshot = await db.collection('whatsapp_users')
    .where('phoneNumber', '==', phoneNumber)
    .get();

  if (usersSnapshot.empty) {
    console.warn('⚠️  User not found for phone:', phoneNumber);
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;

  // Create a basic task
  const taskRef = await db.collection('mobile_tasks').add({
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

  // Update user task count
  await userDoc.ref.update({
    taskCount: admin.firestore.FieldValue.increment(1),
    lastActive: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('✅ Task created:', taskRef.id);
}

// Helper to escape XML special characters
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n🚀 WhatsApp Webhook Server Started!');
  console.log('=====================================');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`📱 Webhook endpoint: http://localhost:${PORT}/whatsapp`);
  console.log(`💚 Health check: http://localhost:${PORT}/`);
  console.log('\n💡 Next steps:');
  console.log('1. Run ngrok: ngrok http ' + PORT);
  console.log('2. Copy the ngrok HTTPS URL');
  console.log('3. Add /whatsapp to the end');
  console.log('4. Set it in Twilio webhook settings');
  console.log('\nWaiting for messages...\n');
});
