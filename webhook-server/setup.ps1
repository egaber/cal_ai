# Quick Setup Script for WhatsApp Webhook
# This extracts Firebase credentials from your service account JSON file

Write-Host "🔧 WhatsApp Webhook Quick Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if service account JSON exists
$jsonFiles = Get-ChildItem -Path . -Filter "*.json" | Where-Object { $_.Name -like "*studio-1327110304-6895e*" }

if ($jsonFiles.Count -eq 0) {
    Write-Host "❌ Service account JSON file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Download the JSON file from Firebase Console" -ForegroundColor White
    Write-Host "2. Save it in this folder (webhook-server/)" -ForegroundColor White
    Write-Host "3. Run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "Or manually create .env file with your credentials" -ForegroundColor Yellow
    exit 1
}

$jsonFile = $jsonFiles[0]
Write-Host "✅ Found service account file: $($jsonFile.Name)" -ForegroundColor Green
Write-Host ""

# Read and parse JSON
$json = Get-Content $jsonFile.FullName | ConvertFrom-Json

# Create .env file
$envContent = @"
# Firebase Configuration
FIREBASE_PROJECT_ID=$($json.project_id)
FIREBASE_CLIENT_EMAIL=$($json.client_email)
FIREBASE_PRIVATE_KEY="$($json.private_key)"

# Server Configuration
PORT=3000
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✅ Created .env file with Firebase credentials" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Ready to start!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: npm start" -ForegroundColor White
Write-Host "2. In another terminal, run: ngrok http 3000" -ForegroundColor White
Write-Host "3. Copy the ngrok HTTPS URL" -ForegroundColor White
Write-Host "4. Configure it in Twilio" -ForegroundColor White
Write-Host ""
