# Local WhatsApp Webhook Server Setup

## 🚀 Quick Start (3 Steps)

### 1. Install Dependencies
```powershell
cd webhook-server
npm install
```

### 2. Configure Firebase
Create `.env` file from the example:
```powershell
cp .env.example .env
```

**Get your Firebase credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `studio-1327110304-6895e`
3. Click ⚙️ gear icon → **Project settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Save the JSON file

**Edit `.env` file with your credentials:**
```env
FIREBASE_PROJECT_ID=studio-1327110304-6895e
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@studio-1327110304-6895e.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### 3. Run the Server
```powershell
npm start
```

You should see:
```
🚀 WhatsApp Webhook Server Started!
=====================================
📡 Server running on: http://localhost:6000
📱 Webhook endpoint: http://localhost:6000/whatsapp
💚 Health check: http://localhost:6000/

Waiting for messages...
```

## 🌐 Expose with ngrok

### Install ngrok
```powershell
# Using Chocolatey
choco install ngrok

# Or download from: https://ngrok.com/download
```

### Run ngrok
In a **new terminal window**:
```powershell
ngrok http 6000
```

You'll see something like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

## 📱 Configure Twilio

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to: **Messaging** → **Try it out** → **WhatsApp sandbox settings**
3. In **"When a message comes in"**, paste:
   ```
   https://abc123.ngrok-free.app/whatsapp
   ```
4. Set method to **POST**
5. Click **Save**

## 🧪 Test It!

Send this to **+1 (415) 523-8886**:
```
join knowledge-dog
```

You should see:
- ✅ Message logged in your server terminal
- ✅ Response sent back to WhatsApp
- ✅ Data stored in Firestore

### Test Messages
```
1. Join:        "join knowledge-dog"
2. Task:        "Buy milk tomorrow"
3. Task:        "Pick up Yael at 3pm"
4. Help:        "help"
```

## 🔍 Monitoring

### Server Logs
Watch your terminal where the server is running. You'll see:
```
📱 Received WhatsApp message: { from: '+1234567890', body: '...' }
✅ Message stored with ID: xxx
👤 New user joined: +1234567890
✅ Task created: yyy
📤 Sending response: Got it! ✅
```

### Firestore Console
Check [Firestore Database](https://console.firebase.google.com/project/studio-1327110304-6895e/firestore) for:
- `whatsapp_messages` collection
- `whatsapp_users` collection
- `mobile_tasks` collection

### ngrok Inspector
Open http://127.0.0.1:4040 to see all webhook requests in real-time!

## 🛠️ Development Mode

Run with auto-restart on file changes:
```powershell
npm install -g nodemon
npm run dev
```

## 🐛 Troubleshooting

### Server not starting?
```powershell
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill the process if needed
taskkill /PID <PID> /F

# Or use a different port
$env:PORT=3001; npm start
```

### Firebase connection error?
- Verify your `.env` file has correct credentials
- Make sure the private key includes `\n` for newlines
- Check Firebase project ID is correct

### ngrok not working?
- Make sure you're using the HTTPS URL (not HTTP)
- ngrok free tier URLs change each time you restart
- Update Twilio webhook URL when ngrok restarts

### Not receiving messages?
- Check server is running (terminal shows logs)
- Verify ngrok is active (shows Forwarding message)
- Confirm Twilio webhook URL matches ngrok URL
- Check ngrok inspector at http://127.0.0.1:4040

## 📊 What Gets Stored

### whatsapp_messages
```javascript
{
  from: "+1234567890",
  to: "+14155238886",
  body: "Buy milk tomorrow",
  messageSid: "SM...",
  profileName: "John",
  timestamp: Timestamp,
  processed: false
}
```

### whatsapp_users
```javascript
{
  phoneNumber: "+1234567890",
  profileName: "John",
  joinedAt: Timestamp,
  active: true,
  taskCount: 5,
  lastActive: Timestamp
}
```

### mobile_tasks
```javascript
{
  rawText: "Buy milk tomorrow",
  owner: "Unknown",
  timeBucket: "unlabeled",
  priority: "P2",
  completed: false,
  createdVia: "whatsapp",
  phoneNumber: "+1234567890",
  createdAt: Timestamp
}
```

## 🎯 Next Steps

1. ✅ Get it working locally
2. 🔄 Integrate with your task parser
3. 👥 Link to Firebase Auth users
4. 📱 Add two-way messaging
5. 🚀 Deploy to Vercel/Railway for permanent hosting

## 💡 Tips

- **Keep ngrok running** while testing
- **Free ngrok URLs expire** when you close ngrok
- **Upgrade ngrok** for permanent custom URLs
- **Use nodemon** for faster development
- **Check ngrok inspector** to debug webhook issues

## 🔄 Making Changes

After editing `server.js`:
1. Save the file
2. Restart the server (Ctrl+C, then `npm start`)
3. Test the changes
4. No need to restart ngrok!

---

**Ready to go?** Run:
```powershell
cd webhook-server
npm install
npm start
```

Then in another terminal:
```powershell
ngrok http 3000
```
