# Alternative: Express API on Firebase Hosting (Free Tier)

Since Cloud Functions require the Blaze plan, here's an alternative using Firebase Hosting which is available on the free Spark plan.

## Option A: Use a Third-Party Serverless Platform (Free)

### 1. Vercel (Recommended - Free Tier)

Deploy your webhook as a Vercel serverless function (free tier):

**Create `api/whatsapp.ts`:**
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

// Initialize Firebase Admin with your credentials
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { From, To, Body, MessageSid, ProfileName } = req.body;
    
    // Store in Firestore (same logic as Cloud Function)
    await admin.firestore().collection('whatsapp_messages').add({
      from: From.replace('whatsapp:', ''),
      to: To.replace('whatsapp:', ''),
      body: Body || '',
      messageSid: MessageSid,
      profileName: ProfileName || 'Unknown',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send TwiML response
    const responseMessage = `Got it! ✅\n\nI've added: "${Body}"`;
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Message>${responseMessage}</Message>
      </Response>`;
    
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing message');
  }
}
```

**Deploy:**
```bash
npm install -g vercel
vercel login
vercel
```

Your webhook URL will be: `https://your-project.vercel.app/api/whatsapp`

### 2. Netlify Functions (Free Tier)

Similar setup with Netlify serverless functions.

### 3. Railway.app (Free Tier)

Deploy a simple Express server on Railway.

## Option B: Self-Hosted Webhook Server

Run a simple Express server on your own machine or a free hosting service:

**Create `server.js`:**
```javascript
const express = require('express');
const admin = require('firebase-admin');

// Initialize Firebase
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(express.urlencoded({ extended: true }));

app.post('/whatsapp', async (req, res) => {
  const { From, To, Body, MessageSid, ProfileName } = req.body;
  
  try {
    // Store message
    await admin.firestore().collection('whatsapp_messages').add({
      from: From.replace('whatsapp:', ''),
      to: To.replace('whatsapp:', ''),
      body: Body || '',
      messageSid: MessageSid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // TwiML response
    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Message>Got it! ✅ I've added: "${Body}"</Message>
      </Response>`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Run:**
```bash
npm install express firebase-admin
node server.js
```

Use **ngrok** to expose locally for testing:
```bash
ngrok http 3000
```

## Option C: Wait and Use Emulator for Testing

Test everything locally with Firebase Emulators (completely free):

```bash
cd functions
npm run serve
```

This gives you a local endpoint for testing. When ready for production, upgrade to Blaze plan.

## 💡 Recommendation

**Best approach:**

1. **Short-term (Testing):** Use Firebase Emulators locally
2. **Production (Best):** Upgrade to Blaze plan (likely free for your usage)
3. **Alternative:** Use Vercel/Netlify serverless (truly free, no card required)

The Blaze plan upgrade is worth it because:
- ✅ 2M function calls/month FREE
- ✅ Native Firebase integration
- ✅ Better security
- ✅ Easier to maintain
- ✅ You'll likely never pay anything for personal use

Would you like me to:
1. Set up the Vercel alternative?
2. Create a local testing setup with emulators?
3. Help you with the Blaze plan upgrade?
