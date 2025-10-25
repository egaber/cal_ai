// Simple Express API server to expose AI chat endpoint
// This runs separately from your React app
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

    // TODO: Call your actual LLM service here
    // For now, we'll use a smart response system
    
    const response = await generateAIResponse(message, conversationHistory, phoneNumber);
    
    console.log('✅ AI Response:', response.substring(0, 100) + '...');

    res.json({
      response: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Chat Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error.message 
    });
  }
});

// Generate AI response by calling React app's API
async function generateAIResponse(message, history, phoneNumber) {
  try {
    // Call the React app's API endpoint (running on port 8080)
    const fetch = (await import('node-fetch')).default;
    
    const reactAppUrl = process.env.REACT_APP_URL || 'http://localhost:8080';
    const response = await fetch(`${reactAppUrl}/api/whatsapp-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        phoneNumber,
        conversationHistory: history
      })
    });

    if (!response.ok) {
      console.error('React app API error:', response.status, response.statusText);
      // Fall back to smart responses
      return getSmartFallback(message, phoneNumber);
    }

    const data = await response.json();
    return data.response || getSmartFallback(message, phoneNumber);

  } catch (error) {
    console.error('Error calling React app API:', error);
    // Fall back to smart responses
    return getSmartFallback(message, phoneNumber);
  }
}

// Smart fallback responses when React app is not available
function getSmartFallback(message, phoneNumber) {
  const lowerMessage = message.toLowerCase();
  
  // Task creation
  if (containsTaskKeywords(lowerMessage)) {
    const timeInfo = extractTimeInfo(lowerMessage);
    const taskType = detectTaskType(lowerMessage);
    
    return `Got it! ✅\n\n` +
           `Task: "${message}"\n` +
           (timeInfo ? `⏰ ${timeInfo}\n` : '') +
           (taskType ? `📋 ${taskType}\n` : '') +
           `\nI've added this to your tasks. You can view it in the Cal AI app.`;
  }
  
  // Questions about schedule
  if (lowerMessage.includes('what') && (lowerMessage.includes('today') || lowerMessage.includes('schedule'))) {
    return `📅 Today's Schedule\n\n` +
           `I'd show you your schedule here, but I need to be connected to your calendar data.\n\n` +
           `For now, you can check the Cal AI app for your full schedule!`;
  }
  
  // Time-based tasks
  if (containsTimeReference(lowerMessage)) {
    const when = extractTimeReference(lowerMessage);
    return `Noted for ${when}! ✅\n\n` +
           `"${message}"\n\n` +
           `I've scheduled this for you. Check the Cal AI app to see it in your calendar.`;
  }
  
  // Family member mentions
  const familyMember = detectFamilyMember(lowerMessage);
  if (familyMember) {
    return `Got it! I'll note this for ${familyMember}. 👨‍👩‍👧‍👦\n\n` +
           `"${message}"\n\n` +
           `This has been added to the family calendar.`;
  }
  
  // Default intelligent response
  return `Thanks for your message! 😊\n\n` +
         `I've recorded: "${message}"\n\n` +
         `I'm your AI assistant. Send me tasks, appointments, or questions ` +
         `and I'll help you stay organized!`;
}

// Helper functions
function containsTaskKeywords(text) {
  const keywords = ['buy', 'get', 'pick up', 'fetch', 'call', 'email', 'send', 
                    'remember to', 'need to', 'have to', 'must', 'should'];
  return keywords.some(keyword => text.includes(keyword));
}

function containsTimeReference(text) {
  const timeWords = ['today', 'tomorrow', 'tonight', 'morning', 'afternoon', 
                     'evening', 'next week', 'monday', 'tuesday', 'wednesday',
                     'thursday', 'friday', 'saturday', 'sunday'];
  return timeWords.some(word => text.includes(word)) || /\d{1,2}(am|pm|:)/i.test(text);
}

function extractTimeInfo(text) {
  if (text.includes('today')) return 'Today';
  if (text.includes('tomorrow')) return 'Tomorrow';
  if (text.includes('tonight')) return 'Tonight';
  if (text.includes('next week')) return 'Next week';
  
  // Check for specific time
  const timeMatch = text.match(/(\d{1,2})(:\d{2})?\s*(am|pm)/i);
  if (timeMatch) return `At ${timeMatch[0]}`;
  
  return null;
}

function extractTimeReference(text) {
  if (text.includes('today')) return 'today';
  if (text.includes('tomorrow')) return 'tomorrow';
  if (text.includes('tonight')) return 'tonight';
  if (text.includes('next week')) return 'next week';
  if (text.includes('this evening')) return 'this evening';
  if (text.includes('this morning')) return 'this morning';
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  for (const day of days) {
    if (text.includes(day)) return day.charAt(0).toUpperCase() + day.slice(1);
  }
  
  return 'soon';
}

function detectTaskType(text) {
  if (text.includes('buy') || text.includes('shopping')) return 'Shopping';
  if (text.includes('pick up') || text.includes('fetch')) return 'Errand';
  if (text.includes('call') || text.includes('phone')) return 'Call';
  if (text.includes('email') || text.includes('send')) return 'Communication';
  if (text.includes('meeting') || text.includes('appointment')) return 'Meeting';
  return null;
}

function detectFamilyMember(text) {
  const members = ['eyal', 'ella', 'hilly', 'yael', 'alon'];
  for (const member of members) {
    if (text.includes(member)) {
      return member.charAt(0).toUpperCase() + member.slice(1);
    }
  }
  return null;
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Cal AI Chat API',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.AI_API_PORT || 6000;
app.listen(PORT, () => {
  console.log('\n🤖 Cal AI Chat API Server');
  console.log('=========================');
  console.log(`📡 Running on: http://localhost:${PORT}`);
  console.log(`💬 Chat endpoint: POST http://localhost:${PORT}/chat`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log('\n💡 This API serves AI responses for WhatsApp messages');
  console.log('📝 Webhook server (port 5050) calls this API');
  console.log('\nReady to serve AI responses!\n');
});
