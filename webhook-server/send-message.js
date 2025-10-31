// Helper script to send WhatsApp messages to users via Twilio
require('dotenv').config();
const twilio = require('twilio');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.error('❌ Missing Twilio credentials in .env file!');
  console.error('Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

/**
 * Send a WhatsApp message to a user
 * @param {string} toPhoneNumber - Recipient's phone number (e.g., '+972502234226')
 * @param {string} message - Message text to send
 * @returns {Promise<object>} - Twilio message object
 */
async function sendWhatsAppMessage(toPhoneNumber, message) {
  try {
    // Ensure phone number has whatsapp: prefix
    const from = `whatsapp:${twilioPhoneNumber}`;
    const to = toPhoneNumber.startsWith('whatsapp:') 
      ? toPhoneNumber 
      : `whatsapp:${toPhoneNumber}`;

    console.log('\n📤 Sending WhatsApp message:');
    console.log('From:', from);
    console.log('To:', to);
    console.log('Message:', message.substring(0, 100) + (message.length > 100 ? '...' : ''));

    const twilioMessage = await client.messages.create({
      from: from,
      to: to,
      body: message
    });

    console.log('✅ Message sent successfully!');
    console.log('Message SID:', twilioMessage.sid);
    console.log('Status:', twilioMessage.status);

    return twilioMessage;

  } catch (error) {
    console.error('❌ Error sending message:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.moreInfo) {
      console.error('More info:', error.moreInfo);
    }
    throw error;
  }
}

/**
 * Send a task reminder to a user
 * @param {string} phoneNumber - User's phone number
 * @param {string} taskTitle - Task title
 * @param {string} dueTime - When the task is due (e.g., 'in 1 hour', 'at 3pm')
 */
async function sendTaskReminder(phoneNumber, taskTitle, dueTime) {
  const message = `⏰ תזכורת!\n\n` +
    `📋 ${taskTitle}\n` +
    `🕐 ${dueTime}\n\n` +
    `פתח את Cal AI לעוד פרטים 📱`;
  
  return sendWhatsAppMessage(phoneNumber, message);
}

/**
 * Send event notification to a user
 * @param {string} phoneNumber - User's phone number
 * @param {string} eventTitle - Event title
 * @param {string} eventTime - When the event starts
 * @param {string} location - Event location (optional)
 */
async function sendEventNotification(phoneNumber, eventTitle, eventTime, location = null) {
  let message = `📅 אירוע קרוב!\n\n` +
    `${eventTitle}\n` +
    `🕐 ${eventTime}\n`;
  
  if (location) {
    message += `📍 ${location}\n`;
  }
  
  message += `\nנא להגיע בזמן! 🎯`;
  
  return sendWhatsAppMessage(phoneNumber, message);
}

/**
 * Send daily summary to a user
 * @param {string} phoneNumber - User's phone number
 * @param {Array} tasks - Array of task objects
 * @param {Array} events - Array of event objects
 */
async function sendDailySummary(phoneNumber, tasks, events) {
  let message = `🌅 סיכום יומי\n\n`;
  
  if (events && events.length > 0) {
    message += `📅 אירועים היום:\n`;
    events.forEach((event, i) => {
      message += `${i + 1}. ${event.title} - ${event.time}\n`;
    });
    message += '\n';
  }
  
  if (tasks && tasks.length > 0) {
    message += `📋 משימות לביצוע:\n`;
    tasks.forEach((task, i) => {
      message += `${i + 1}. ${task.title}\n`;
    });
    message += '\n';
  }
  
  if (!events?.length && !tasks?.length) {
    message += `היום נראה רגוע! 😌\n\n`;
  }
  
  message += `יום נעים! ☀️`;
  
  return sendWhatsAppMessage(phoneNumber, message);
}

// Export functions for use in other modules
module.exports = {
  sendWhatsAppMessage,
  sendTaskReminder,
  sendEventNotification,
  sendDailySummary
};

// If run directly from command line, send a test message
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('\n📱 WhatsApp Message Sender');
    console.log('========================\n');
    console.log('Usage: node send-message.js <phone_number> <message>');
    console.log('\nExample:');
    console.log('  node send-message.js +972502234226 "Hello from Cal AI!"');
    console.log('\nOr use helper functions:');
    console.log('  const { sendTaskReminder } = require("./send-message");');
    console.log('  await sendTaskReminder("+972502234226", "Buy milk", "in 1 hour");');
    console.log('\n');
    process.exit(1);
  }
  
  const phoneNumber = args[0];
  const message = args.slice(1).join(' ');
  
  sendWhatsAppMessage(phoneNumber, message)
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed:', error.message);
      process.exit(1);
    });
}
