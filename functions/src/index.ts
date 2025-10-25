import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as twilio from "twilio";

// Initialize Firebase Admin
admin.initializeApp();

/**
 * WhatsApp Webhook Endpoint
 * This function receives incoming WhatsApp messages from Twilio
 * 
 * Twilio will POST to this endpoint with the following data:
 * - From: The sender's WhatsApp number (format: whatsapp:+1234567890)
 * - To: Your Twilio WhatsApp number
 * - Body: The message text
 * - MessageSid: Unique message ID
 * - NumMedia: Number of media attachments
 */
export const whatsappWebhook = functions.https.onRequest(async (req, res) => {
  // Enable CORS if needed
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  // Only accept POST requests from Twilio
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    // Extract Twilio webhook data
    const {
      From: from,
      To: to,
      Body: body,
      MessageSid: messageSid,
      ProfileName: profileName,
      NumMedia: numMedia,
    } = req.body;

    // Log incoming message
    console.log("Received WhatsApp message:", {
      from,
      to,
      body,
      messageSid,
      profileName,
      numMedia,
    });

    // Extract phone number (remove 'whatsapp:' prefix)
    const phoneNumber = from.replace("whatsapp:", "");

    // Store message in Firestore
    const messageRef = await admin.firestore().collection("whatsapp_messages").add({
      from: phoneNumber,
      to: to.replace("whatsapp:", ""),
      body: body || "",
      messageSid,
      profileName: profileName || "Unknown",
      numMedia: parseInt(numMedia) || 0,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      processed: false,
    });

    console.log("Message stored with ID:", messageRef.id);

    // Process the message based on content
    let responseMessage = "";

    if (body.toLowerCase().includes("join knowledge-dog")) {
      // User is joining - create or update user record
      await handleUserJoin(phoneNumber, profileName);
      responseMessage = "Welcome to Cal AI! 🎉\n\n" +
        "You're now connected to your intelligent task assistant.\n\n" +
        "Send me tasks like:\n" +
        "• 'Pick up Yael from school tomorrow at 3pm'\n" +
        "• 'Buy milk today'\n" +
        "• 'Call Ella this evening'\n\n" +
        "I'll help you organize everything!";
    } else if (body.toLowerCase().includes("help")) {
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

    // Send response back via Twilio
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(responseMessage);

    // Set content type for Twilio
    res.type("text/xml");
    res.send(twiml.toString());
  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    
    // Send error response
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Sorry, something went wrong. Please try again later.");
    
    res.type("text/xml");
    res.send(twiml.toString());
  }
});

/**
 * Handle user joining the service
 */
async function handleUserJoin(phoneNumber: string, profileName?: string) {
  const usersRef = admin.firestore().collection("whatsapp_users");
  
  // Check if user already exists
  const existingUser = await usersRef.where("phoneNumber", "==", phoneNumber).get();
  
  if (existingUser.empty) {
    // Create new user
    await usersRef.add({
      phoneNumber,
      profileName: profileName || "Unknown",
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true,
      taskCount: 0,
    });
    console.log("New user joined:", phoneNumber);
  } else {
    // Update existing user
    const userDoc = existingUser.docs[0];
    await userDoc.ref.update({
      active: true,
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("User reactivated:", phoneNumber);
  }
}

/**
 * Process incoming task message
 */
async function processTaskMessage(phoneNumber: string, taskText: string, messageId: string) {
  // Find user by phone number
  const usersSnapshot = await admin.firestore()
    .collection("whatsapp_users")
    .where("phoneNumber", "==", phoneNumber)
    .get();

  if (usersSnapshot.empty) {
    console.warn("User not found for phone:", phoneNumber);
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;

  // Create a basic task
  // In production, you'd call your task parser service here
  const taskRef = await admin.firestore().collection("mobile_tasks").add({
    rawText: taskText,
    owner: "Unknown", // You'd parse this from the task text
    timeBucket: "unlabeled",
    priority: "P2",
    tags: [],
    involvedMembers: [],
    locations: [],
    completed: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: userId,
    createdVia: "whatsapp",
    whatsappMessageId: messageId,
    phoneNumber,
  });

  // Update user task count
  await userDoc.ref.update({
    taskCount: admin.firestore.FieldValue.increment(1),
    lastActive: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log("Task created:", taskRef.id);
}

/**
 * Health check endpoint
 */
export const healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: "ok",
    service: "cal-ai-whatsapp",
    timestamp: new Date().toISOString(),
  });
});
