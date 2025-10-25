#!/usr/bin/env pwsh
# WhatsApp Webhook Setup Script for Windows (PowerShell)

Write-Host "🚀 Cal AI - WhatsApp Webhook Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
Write-Host "📦 Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseCli = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseCli) {
    Write-Host "❌ Firebase CLI not found. Installing..." -ForegroundColor Red
    npm install -g firebase-tools
} else {
    Write-Host "✅ Firebase CLI found" -ForegroundColor Green
}

# Check if logged in to Firebase
Write-Host ""
Write-Host "🔐 Checking Firebase authentication..." -ForegroundColor Yellow
$loginCheck = firebase login:list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Firebase. Please log in:" -ForegroundColor Red
    firebase login
} else {
    Write-Host "✅ Firebase authenticated" -ForegroundColor Green
}

# Install functions dependencies
Write-Host ""
Write-Host "📦 Installing Cloud Functions dependencies..." -ForegroundColor Yellow
Set-Location functions
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Build functions
Write-Host ""
Write-Host "🔨 Building Cloud Functions..." -ForegroundColor Yellow
Set-Location functions
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Functions built successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

# Ask if user wants to deploy
Write-Host ""
Write-Host "🌐 Ready to deploy Cloud Functions" -ForegroundColor Cyan
$deploy = Read-Host "Do you want to deploy now? (y/n)"

if ($deploy -eq "y" -or $deploy -eq "Y") {
    Write-Host ""
    Write-Host "🚀 Deploying to Firebase..." -ForegroundColor Yellow
    firebase deploy --only functions
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Deployment successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Next Steps:" -ForegroundColor Cyan
        Write-Host "1. Copy your Cloud Function URL from above" -ForegroundColor White
        Write-Host "2. Go to Twilio Console: https://console.twilio.com/" -ForegroundColor White
        Write-Host "3. Navigate to: Messaging > Try it out > WhatsApp sandbox settings" -ForegroundColor White
        Write-Host "4. Paste the URL in 'When a message comes in' field" -ForegroundColor White
        Write-Host "5. Set HTTP method to POST" -ForegroundColor White
        Write-Host "6. Save and test by sending 'join knowledge-dog' to +1 (415) 523-8886" -ForegroundColor White
        Write-Host ""
        Write-Host "📚 Full guide: See WHATSAPP_WEBHOOK_SETUP.md" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Deployment failed. Check the errors above." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "⏸️  Skipping deployment." -ForegroundColor Yellow
    Write-Host "   Run 'firebase deploy --only functions' when ready." -ForegroundColor White
}

Write-Host ""
Write-Host "✨ Setup complete! Check WHATSAPP_WEBHOOK_SETUP.md for next steps." -ForegroundColor Green
