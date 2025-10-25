#!/bin/bash
# WhatsApp Webhook Setup Script for Mac/Linux

echo "🚀 Cal AI - WhatsApp Webhook Setup"
echo "================================="
echo ""

# Check if Firebase CLI is installed
echo "📦 Checking Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
else
    echo "✅ Firebase CLI found"
fi

# Check if logged in to Firebase
echo ""
echo "🔐 Checking Firebase authentication..."
if ! firebase login:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please log in:"
    firebase login
else
    echo "✅ Firebase authenticated"
fi

# Install functions dependencies
echo ""
echo "📦 Installing Cloud Functions dependencies..."
cd functions
npm install
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
cd ..

# Build functions
echo ""
echo "🔨 Building Cloud Functions..."
cd functions
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Functions built successfully"
else
    echo "❌ Build failed"
    cd ..
    exit 1
fi
cd ..

# Ask if user wants to deploy
echo ""
echo "🌐 Ready to deploy Cloud Functions"
read -p "Do you want to deploy now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Deploying to Firebase..."
    firebase deploy --only functions
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Deployment successful!"
        echo ""
        echo "📋 Next Steps:"
        echo "1. Copy your Cloud Function URL from above"
        echo "2. Go to Twilio Console: https://console.twilio.com/"
        echo "3. Navigate to: Messaging > Try it out > WhatsApp sandbox settings"
        echo "4. Paste the URL in 'When a message comes in' field"
        echo "5. Set HTTP method to POST"
        echo "6. Save and test by sending 'join knowledge-dog' to +1 (415) 523-8886"
        echo ""
        echo "📚 Full guide: See WHATSAPP_WEBHOOK_SETUP.md"
    else
        echo "❌ Deployment failed. Check the errors above."
        exit 1
    fi
else
    echo ""
    echo "⏸️  Skipping deployment."
    echo "   Run 'firebase deploy --only functions' when ready."
fi

echo ""
echo "✨ Setup complete! Check WHATSAPP_WEBHOOK_SETUP.md for next steps."
