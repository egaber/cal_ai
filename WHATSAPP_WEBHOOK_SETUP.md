# WhatsApp Webhook Setup Guide

This guide walks you through setting up a Google Cloud Function to receive WhatsApp messages via Twilio.

## 📋 Prerequisites

1. **Firebase Project** (already set up)
2. **Twilio Account** with WhatsApp enabled
3. **Node.js 18+** installed
4. **Firebase CLI** installed (`npm install -g firebase-tools`)

## 🚀 Step 1: Update Firebase Configuration

Update your `firebase.json` to include functions:

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18",
    "ignore": [
      "node_modules",
      ".git",
      "firebase-debug.log",
      "firebase-debug.*.log"
    ]
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## 🔧 Step 2: Install Functions Dependencies

```bash
cd functions
npm install
```

## 🧪 Step 3: Test Locally (Optional)

```bash
# From the functions directory
npm run serve

# The emulator will show your local endpoint:
# http://localhost:5001/YOUR_PROJECT_ID/us-central1/whatsappWebhook
```

## 🌐 Step 4: Deploy to Google Cloud

```bash
# From the root directory
firebase deploy --only functions

# Or deploy specific function:
firebase deploy --only functions:whatsappWebhook
```

After deployment, you'll get a URL like:
```
https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/whatsappWebhook
```

**Important:** Copy this URL - you'll need it for Twilio!

## 📱 Step 5: Set Up Twilio WhatsApp

### 5.1 Get Twilio WhatsApp Sandbox (Development)

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Messaging > Try it out > Send a WhatsApp message**
3. Follow instructions to connect your WhatsApp to the sandbox
4. Send `join knowledge-dog` (or your sandbox code) to the Twilio number

### 5.2 Configure Webhook in Twilio

1. In Twilio Console, go to **Messaging > Settings > WhatsApp sandbox settings**
2. Under **"When a message comes in"**, paste your Cloud Function URL:
   ```
   https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/whatsappWebhook
   ```
3. Set HTTP Method to **POST**
4. Click **Save**

### 5.3 Production WhatsApp Number (Optional)

For production use with your own WhatsApp Business number:

1. Apply for WhatsApp Business API access via Twilio
2. Get approved (can take several days)
3. Configure the webhook for your production number
4. Update your app to use the production number

## 🔐 Step 6: Add Firestore Security Rules

Add rules for WhatsApp collections in `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // WhatsApp messages - only cloud functions can write
    match /whatsapp_messages/{messageId} {
      allow read: if request.auth != null;
      allow write: if false; // Only Cloud Functions can write
    }
    
    // WhatsApp users - only cloud functions can write
    match /whatsapp_users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Only Cloud Functions can write
    }
    
    // Mobile tasks created via WhatsApp
    match /mobile_tasks/{taskId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.createdBy == request.auth.uid;
    }
  }
}
```

Deploy the rules:
```bash
firebase deploy --only firestore:rules
```

## 🧪 Step 7: Test the Integration

1. **Join the service:**
   - Send `join knowledge-dog` to your Twilio WhatsApp number (+1 415 523 8886)
   - You should receive a welcome message

2. **Create a task:**
   - Send: `Pick up Yael from school tomorrow at 3pm`
   - You should receive confirmation

3. **Get help:**
   - Send: `help`
   - You should receive usage instructions

## 🔍 Step 8: Monitor and Debug

### View Logs
```bash
# Real-time logs
firebase functions:log --only whatsappWebhook

# Or in Firebase Console:
# Functions > whatsappWebhook > Logs
```

### Check Firestore Collections

Your Firebase Console should now have these collections:
- `whatsapp_messages` - All incoming messages
- `whatsapp_users` - Users who joined via WhatsApp
- `mobile_tasks` - Tasks created via WhatsApp

### Twilio Debugger

Check Twilio Console > Monitor > Logs for webhook call details

## 🔄 Step 9: Connect to Your App

To display WhatsApp-created tasks in your app, query with the filter:

```typescript
// In your task service
const whatsappTasks = await db.collection('mobile_tasks')
  .where('createdVia', '==', 'whatsapp')
  .where('createdBy', '==', userId)
  .orderBy('createdAt', 'desc')
  .get();
```

## 🎯 Advanced Features (Future Enhancements)

1. **Task Parsing Integration:**
   - Call your existing task parser service from the Cloud Function
   - Extract time buckets, priorities, family members, etc.

2. **Two-Way Sync:**
   - Send task updates back to WhatsApp
   - Notify users when tasks are completed

3. **Rich Messages:**
   - Send task lists with WhatsApp buttons
   - Use WhatsApp templates for formatted messages

4. **User Authentication:**
   - Link WhatsApp users to Firebase Auth users
   - Support multi-device access

5. **Voice Messages:**
   - Process WhatsApp voice messages
   - Convert to text using Speech-to-Text API

## 💰 Pricing Considerations

- **Firebase Functions:** Free tier includes 125K invocations/month
- **Firestore:** Free tier includes 50K reads, 20K writes/day
- **Twilio WhatsApp:** Charges apply per message (check Twilio pricing)

## 🔒 Security Best Practices

1. **Validate Twilio Requests:**
   - Add Twilio signature verification (see Twilio docs)
   - Prevent unauthorized webhook calls

2. **Rate Limiting:**
   - Implement rate limits per user
   - Prevent abuse

3. **Data Privacy:**
   - Don't log sensitive information
   - Follow GDPR/data protection guidelines

4. **Environment Variables:**
   - Store Twilio credentials in Firebase config:
   ```bash
   firebase functions:config:set twilio.account_sid="YOUR_SID"
   firebase functions:config:set twilio.auth_token="YOUR_TOKEN"
   ```

## 📚 Resources

- [Twilio WhatsApp API Docs](https://www.twilio.com/docs/whatsapp)
- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Twilio Webhook Security](https://www.twilio.com/docs/usage/webhooks/webhooks-security)

## 🐛 Troubleshooting

### Issue: Webhook not receiving messages
- Check Twilio webhook configuration
- Verify Cloud Function is deployed
- Check Firebase Functions logs for errors

### Issue: Messages stored but no response
- Check TwiML response format
- Verify Twilio account is active
- Check for function timeout errors

### Issue: Tasks not appearing in app
- Verify Firestore collection names match
- Check security rules allow reading
- Ensure user is authenticated in app

## ✅ Next Steps

1. Deploy the function
2. Configure Twilio webhook
3. Test with a few messages
4. Integrate task parsing logic
5. Add user authentication linking
6. Implement notification system
