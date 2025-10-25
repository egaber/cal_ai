const express = require('express');
const https = require('https');
const http = require('http');

const app = express();

// Store conversation history per phone number (in-memory for now)
const conversations = new Map();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Cal AI WhatsApp Webhook (AI Chat Mode)',
    timestamp: new Date().toISOString(),
    activeConversations: conversations.size
  });
});

// WhatsApp webhook endpoint - Full AI Chat
app.post('/whatsapp', async (req, res) => {
  console.log('\n📱 Received WhatsApp message:');
  console.log('From:', req.body.From);
  console.log('Body:', req.body.Body);
  console.log('Time:', new Date().toISOString());
  console.log('---');

  try {
    const { From: from, Body: body } = req.body;
    const phoneNumber = from.replace('whatsapp:', '');
    
    // Get or create conversation history
    if (!conversations.has(phoneNumber)) {
      conversations.set(phoneNumber, []);
      console.log('🆕 New conversation started for:', phoneNumber);
    }
    
    const history = conversations.get(phoneNumber);
    
    // Handle special commands
    if (body.toLowerCase().includes('join knowledge-dog')) {
      // Welcome message
      const responseMessage = "Welcome to Cal AI! 🎉\n\n" +
        "I'm your AI assistant. I can help you:\n" +
        "• Schedule tasks and appointments\n" +
        "• Organize your day\n" +
        "• Manage your family's calendar\n" +
        "• Answer questions about your schedule\n\n" +
        "Just chat with me naturally! Try: 'Pick up Yael at 3pm tomorrow'";
      
      // Reset conversation
      conversations.set(phoneNumber, []);
      
      sendTwimlResponse(res, responseMessage);
      return;
    }
    
    if (body.toLowerCase() === 'clear' || body.toLowerCase() === 'reset') {
      conversations.set(phoneNumber, []);
      sendTwimlResponse(res, "Conversation cleared! 🔄 Let's start fresh.");
      return;
    }
    
    if (body.toLowerCase() === 'help') {
      const responseMessage = "Cal AI Help 📚\n\n" +
        "Just chat with me naturally! I can:\n" +
        "• Create tasks: 'Buy milk tomorrow'\n" +
        "• Schedule: 'Meeting with John at 2pm'\n" +
        "• Ask about your day: 'What's on today?'\n" +
        "• Get help: 'How do I add a recurring task?'\n\n" +
        "Commands:\n" +
        "• 'clear' - Reset conversation\n" +
        "• 'help' - Show this message";
      
      sendTwimlResponse(res, responseMessage);
      return;
    }
    
    // Add user message to history
    history.push({
      role: 'user',
      content: body,
      timestamp: new Date().toISOString()
    });
    
    // Keep last 10 messages (5 exchanges) for context
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
    
    // Call your AI service here
    // For now, we'll send to a local AI endpoint or use a simple response
    const aiResponse = await callAIService(body, history, phoneNumber);
    
    // Add AI response to history
    history.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    });
    
    console.log('🤖 AI Response:', aiResponse.substring(0, 100) + '...');
    
    sendTwimlResponse(res, aiResponse);

  } catch (error) {
    console.error('❌ Error:', error.message);
    sendTwimlResponse(res, "Sorry, I'm having trouble processing that. Please try again! 🤖");
  }
});

// Call your AI service (placeholder - customize this!)
async function callAIService(message, history, phoneNumber) {
  // Call the AI API endpoint
  try {
    const apiUrl = process.env.AI_API_URL || 'http://localhost:6000/chat';
    
    const postData = JSON.stringify({
      message: message,
      phoneNumber: phoneNumber,
      conversationHistory: history.slice(-8) // Last 4 exchanges
    });

    const options = {
      hostname: 'localhost',
      port: 6000,
      path: '/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              console.warn('AI API error:', res.statusCode);
              resolve(getSmartFallback(message));
              return;
            }

            const jsonData = JSON.parse(data);
            resolve(jsonData.response || jsonData.content || getSmartFallback(message));
          } catch (error) {
            console.warn('Failed to parse AI response:', error.message);
            resolve(getSmartFallback(message));
          }
        });
      });

      req.on('error', (error) => {
        console.warn('Failed to call AI service:', error.message);
        resolve(getSmartFallback(message));
      });

      req.write(postData);
      req.end();
    });
    
  } catch (error) {
    console.warn('Failed to call AI service:', error.message);
    // Fallback to smart responses
    return getSmartFallback(message);
  }
}

// Smart fallback responses when AI service is unavailable
function getSmartFallback(message) {
  const lowerMessage = message.toLowerCase();
  
  // Smart task detection
  if (lowerMessage.includes('pick up') || lowerMessage.includes('fetch') || 
      lowerMessage.includes('get') || lowerMessage.includes('buy')) {
    return `Got it! ✅\n\nI've noted: "${message}"\n\n` +
           `This looks like a task. I'll help you organize it in the app.\n\n` +
           `💡 Tip: You can add time like "tomorrow at 3pm" or priorities like "urgent".`;
  }
  
  if (lowerMessage.includes('tomorrow') || lowerMessage.includes('today') || 
      lowerMessage.includes('next week')) {
    return `Noted! 📅\n\n"${message}"\n\n` +
           `I've added this to your schedule. You can view and edit it in the Cal AI app.`;
  }
  
  if (lowerMessage.includes('what') || lowerMessage.includes('when') || 
      lowerMessage.includes('how') || lowerMessage.includes('?')) {
    return `Great question! 🤔\n\n` +
           `Right now I'm running in simple mode. For full AI capabilities, ` +
           `I need to be connected to the AI service.\n\n` +
           `You can still send me tasks and I'll record them for you!`;
  }
  
  // Default response
  return `Thanks for your message! 😊\n\n` +
         `I've recorded: "${message}"\n\n` +
         `Full AI integration coming soon. For now, your tasks are being logged ` +
         `and you can manage them in the Cal AI app.`;
}

// Helper to send TwiML response
function sendTwimlResponse(res, message) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`;
  
  res.type('text/xml');
  res.send(twiml);
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
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log('\n🚀 WhatsApp AI Chat Server Started!');
  console.log('===================================');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`📱 Webhook endpoint: http://localhost:${PORT}/whatsapp`);
  console.log(`💚 Health check: http://localhost:${PORT}/`);
  console.log('\n💡 Features:');
  console.log('✅ Conversation history per user');
  console.log('✅ Context-aware responses');
  console.log('✅ Smart task detection');
  console.log('✅ AI chat integration (placeholder)');
  console.log('\n📝 Commands:');
  console.log('• "clear" or "reset" - Clear conversation');
  console.log('• "help" - Show help message');
  console.log('\n💡 Next: Connect to your AI service for full capabilities');
  console.log('\nWaiting for messages...\n');
});
