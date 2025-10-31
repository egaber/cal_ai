# Unified WhatsApp Server

## Overview

The unified server consolidates the webhook handler and AI chat API into a single Node.js server. This simplifies deployment, reduces resource usage, and makes the system easier to manage.

## What Changed

### Before (2 Servers)
- **Server 1 (Port 3000)**: `server.js` - Handled Twilio webhook only
- **Server 2 (Port 6000)**: `api-server.ts` - Provided AI chat API only
- Required running 2 separate processes
- Required 2 separate ngrok tunnels (or complex routing)

### After (1 Server)
- **Unified Server (Port 6000)**: `unified-server.ts` - Handles both webhook and API
- Single process handles all WhatsApp functionality
- Only 1 ngrok tunnel needed
- Shared Firebase connections and LLM service initialization

## Architecture

```
┌─────────────────────────────────────────────┐
│     Unified WhatsApp Server (Port 6000)     │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │   Webhook    │      │   Chat API      │ │
│  │ POST /whatsapp│      │  POST /chat     │ │
│  └──────────────┘      └─────────────────┘ │
│         │                      │            │
│         └──────────┬───────────┘            │
│                    │                        │
│         ┌──────────▼──────────┐             │
│         │  AI Response Engine │             │
│         │  - LLM Service      │             │
│         │  - Context Aware    │             │
│         │  - Memory Extract   │             │
│         └──────────┬──────────┘             │
│                    │                        │
│         ┌──────────▼──────────┐             │
│         │     Firebase        │             │
│         │  - Admin SDK        │             │
│         │  - Client SDK       │             │
│         └─────────────────────┘             │
│                                             │
└─────────────────────────────────────────────┘
```

## Endpoints

### Health Check
```bash
GET / 
GET /health
```

Returns server status and available endpoints.

### WhatsApp Webhook (Twilio → Server)
```bash
POST /whatsapp
```

Receives messages from Twilio, processes them with AI, and responds via TwiML.

**Flow:**
1. Twilio sends message → `/whatsapp`
2. Server stores message in Firestore
3. Server generates AI response using `generateAIResponse()`
4. Server responds with TwiML containing AI reply
5. Twilio sends reply back to user

### Chat API (Programmatic Access)
```bash
POST /chat
Body: { message, phoneNumber, conversationHistory }
```

Allows programmatic access to AI chat functionality.

## Running the Server

### Quick Start
```powershell
cd webhook-server
npm install
npm start
```

The server will run on port 6000 (or `PORT` environment variable).

### Development Mode (Auto-Restart)
```powershell
npm run dev
```

### Legacy Servers (Still Available)
```powershell
# Webhook only
npm run start:webhook

# API only  
npm run start:api

# Both (2 processes)
npm run start:both
```

## Configuration

### Environment Variables

Create `.env` file in `webhook-server/` directory:

```env
# Firebase Admin SDK (for webhook operations)
FIREBASE_PROJECT_ID=studio-1327110304-6895e
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@studio-1327110304-6895e.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase Client SDK (for API operations)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=studio-1327110304-6895e
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...

# AI Models
VITE_GEMINI_API_KEY=...
VITE_AZURE_OPENAI_API_KEY=...

# Optional: Custom port
PORT=6000
```

## Features

### ✅ WhatsApp Webhook Handling
- Receives messages from Twilio
- Stores messages in Firestore
- Handles user join/help commands
- Supports TwiML responses

### ✅ AI-Powered Responses
- Uses LLM service for intelligent replies
- Context-aware (knows user's tasks and events)
- Supports multiple AI models (Gemini, Azure OpenAI, Copilot, Claude)
- Falls back to smart responses if AI unavailable

### ✅ Task Creation
- Automatically creates tasks from messages
- Parses dates, times, and priorities
- Stores in family-based Firestore structure

### ✅ Memory Extraction
- LLM can extract important info from conversations
- Saves memories to Firestore
- Supports multiple memory types (place, preference, habit, etc.)

### ✅ Context Awareness
- Fetches user's tasks and events
- Provides context to AI
- Responds in user's language (Hebrew/English)

## Setup with Twilio

1. Start the unified server:
   ```powershell
   cd webhook-server
   npm start
   ```

2. Start ngrok (in a new terminal):
   ```powershell
   ngrok http 6000
   ```

3. Copy the ngrok HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

4. Configure Twilio:
   - Go to [Twilio Console](https://console.twilio.com/)
   - Navigate to WhatsApp sandbox settings
   - Set webhook URL: `https://abc123.ngrok-free.app/whatsapp`
   - Method: **POST**
   - Save

5. Test by sending a message to the Twilio WhatsApp number!

## Benefits of Unified Server

### 1. Simplified Deployment
- Only one process to manage
- Only one ngrok tunnel needed
- Easier to monitor and debug

### 2. Resource Efficiency
- Shared Firebase connections
- Shared LLM service initialization
- Reduced memory footprint
- Single server process

### 3. Better Performance
- No inter-server communication needed
- Direct access to all functionality
- Faster response times

### 4. Easier Development
- One server to restart
- One set of logs to watch
- Simpler debugging

### 5. Cost Effective
- Only one server to host in production
- Reduced infrastructure complexity
- Lower hosting costs

## Migration from 2 Servers

If you're currently running the 2-server setup:

1. **Stop both servers** (Ctrl+C in both terminals)

2. **Install dependencies** (if not already):
   ```powershell
   cd webhook-server
   npm install
   ```

3. **Start unified server**:
   ```powershell
   npm start
   ```

4. **Update ngrok** (if running):
   - Stop old ngrok instances
   - Start new one: `ngrok http 6000`
   - Update Twilio webhook URL with new ngrok URL + `/whatsapp`

5. **Test**: Send a message to verify everything works!

## Troubleshooting

### Port Already in Use
```powershell
# Check what's using port 6000
netstat -ano | findstr :6000

# Kill the process
taskkill /PID <PID> /F

# Or use a different port
$env:PORT=6001; npm start
```

### Firebase Connection Error
- Verify `.env` file has correct credentials
- Check private key has `\n` for newlines
- Ensure both Admin and Client SDK configs are set

### AI Not Working
- Check if API keys are set in `.env`
- Server will fall back to basic responses if no models available
- Add API keys and restart server

### Webhook Not Receiving Messages
- Ensure ngrok is running and URL is correct
- Verify Twilio webhook URL includes `/whatsapp`
- Check server logs for incoming requests
- Use ngrok inspector: http://127.0.0.1:4040

## Logs

The server provides detailed logging:

```
📡 Server running on: http://localhost:3000
📱 Webhook endpoint: http://localhost:3000/whatsapp
🤖 Chat API endpoint: http://localhost:3000/chat
💚 Health check: http://localhost:3000/health
🚀 Cal AI Unified WhatsApp Server Started!
📡 Server running on: http://localhost:6000
📱 Webhook endpoint: http://localhost:6000/whatsapp
🤖 Chat API endpoint: http://localhost:6000/chat
💚 Health check: http://localhost:6000/health
============================================
📡 Server running on: http://localhost:3000
📱 Webhook endpoint: http://localhost:3000/whatsapp
🤖 Chat API endpoint: http://localhost:3000/chat
💚 Health check: http://localhost:3000/health

📋 Features:
  ✅ WhatsApp webhook handling
  ✅ AI-powered responses
  ✅ Task creation
  ✅ Memory extraction
  ✅ Context awareness

💡 Next steps:
1. Run ngrok: ngrok http 6000
2. Copy the ngrok HTTPS URL
3. Add /whatsapp to the end
4. Set it in Twilio webhook settings

Waiting for messages...
```

When a message is received:
```
� Received WhatsApp message: { from: '+1234567890', body: '...', timestamp: '...' }
✅ Message stored with ID: xxx
🤖 Generating AI response...
✅ AI Response: ...
📤 Sending response: ...
```

## Production Deployment

For production, deploy to a service like:
- **Railway**: Easiest, supports Express.js
- **Vercel**: Serverless functions
- **Heroku**: Classic PaaS
- **AWS Lambda**: Serverless with API Gateway
- **Google Cloud Run**: Container-based

The unified server makes deployment simpler since you only need to deploy one service!

## Summary

The unified server combines webhook handling and AI chat API into a single, efficient server that:
- ✅ Reduces complexity (1 server instead of 2)
- ✅ Improves performance (shared resources)
- ✅ Simplifies deployment (1 process)
- ✅ Maintains all functionality (webhook + API)
- ✅ Makes development easier (one codebase)

Start using it today with `npm start`! 🚀
