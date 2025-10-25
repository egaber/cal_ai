const express = require('express');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Cal AI WhatsApp Webhook (Simple)',
    timestamp: new Date().toISOString()
  });
});

// WhatsApp webhook endpoint
app.post('/whatsapp', async (req, res) => {
  console.log('\n📱 Received WhatsApp message:');
  console.log('From:', req.body.From);
  console.log('Body:', req.body.Body);
  console.log('Time:', new Date().toISOString());
  console.log('---');

  try {
    const { Body: body } = req.body;
    
    // Process the message
    let responseMessage = '';

    if (body.toLowerCase().includes('join knowledge-dog')) {
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
        "• 'help' - Show this message\n\n" +
        "Examples:\n" +
        "• 'Dentist appointment tomorrow 2pm'\n" +
        "• 'Buy groceries today'\n" +
        "• 'Call mom this evening'";
    } else {
      responseMessage = "Got it! ✅\n\n" +
        `I've noted: "${body}"\n\n` +
        "(Running in test mode - not saving to database)";
    }

    console.log('📤 Responding:', responseMessage.substring(0, 50) + '...');

    // Send TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(responseMessage)}</Message>
</Response>`;

    res.type('text/xml');
    res.send(twiml);

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Sorry, something went wrong. Please try again later.</Message>
</Response>`;
    
    res.type('text/xml');
    res.send(errorTwiml);
  }
});

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
  console.log('\n🚀 WhatsApp Webhook Server Started (Simple Mode)!');
  console.log('================================================');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`📱 Webhook endpoint: http://localhost:${PORT}/whatsapp`);
  console.log(`💚 Health check: http://localhost:${PORT}/`);
  console.log('\n💡 Next steps:');
  console.log('1. Run ngrok: ngrok http ' + PORT);
  console.log('2. Copy the ngrok HTTPS URL');
  console.log('3. Add /whatsapp to the end');
  console.log('4. Set it in Twilio webhook settings');
  console.log('\n📝 Note: Running in simple mode - not saving to database');
  console.log('   Messages will only be logged here.');
  console.log('\nWaiting for messages...\n');
});
