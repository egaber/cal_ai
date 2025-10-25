# 🚀 Quick Start: WhatsApp Integration

## Setup in 3 Steps

### 1️⃣ Install & Deploy

```bash
# Windows (PowerShell)
.\setup-whatsapp.ps1

# Mac/Linux
chmod +x setup-whatsapp.sh
./setup-whatsapp.sh
```

### 2️⃣ Configure Twilio

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to: **Messaging** → **Try it out** → **WhatsApp sandbox settings**
3. Paste your Cloud Function URL:
   ```
   https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/whatsappWebhook
   ```
4. Set method to **POST**
5. Save

### 3️⃣ Test It!

Send this to **+1 (415) 523-8886**:
```
join knowledge-dog
```

You should receive a welcome message! 🎉

## 📱 How It Works

```
User's WhatsApp
    ↓
Twilio WhatsApp API
    ↓
Google Cloud Function (whatsappWebhook)
    ↓
Firebase Firestore (stores tasks)
    ↓
Cal AI App (displays tasks)
```

## 💬 Try These Messages

```
join knowledge-dog          → Welcome & setup
Pick up Yael at 3pm        → Creates a task
Buy milk today             → Creates a task
help                       → Shows commands
```

## 📚 Full Documentation

See **[WHATSAPP_WEBHOOK_SETUP.md](./WHATSAPP_WEBHOOK_SETUP.md)** for complete setup guide.

## 🔍 Monitoring

```bash
# View real-time logs
firebase functions:log

# Or check Firebase Console:
# Functions → whatsappWebhook → Logs
```

## 🐛 Troubleshooting

**Not receiving messages?**
- Check Twilio webhook URL is correct
- Verify function is deployed: `firebase functions:list`
- Check logs: `firebase functions:log`

**Messages received but no response?**
- Check Firebase Functions logs for errors
- Verify Twilio account has credits
- Check Firestore rules allow writing

## 🎯 Next Steps

1. ✅ Deploy function
2. ✅ Configure Twilio webhook  
3. ✅ Test with WhatsApp
4. 🔄 Integrate task parser (see functions/src/index.ts)
5. 🔄 Add user authentication linking
6. 🔄 Implement two-way sync (send updates to WhatsApp)

---

**Need help?** Check the full setup guide or Firebase/Twilio documentation.
