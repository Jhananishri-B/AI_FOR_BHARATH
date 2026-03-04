# ngrok Setup Script for LearnQuest
# This script helps you expose your local application to the internet

Write-Host "🚀 LearnQuest Public Access Setup" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Check if ngrok is installed
$ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokPath) {
    Write-Host "❌ ngrok is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install ngrok from https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "After installation, add ngrok to your PATH or use full path" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ ngrok found at: $($ngrokPath.Source)" -ForegroundColor Green

# Check if auth token is configured
$configPath = "$env:USERPROFILE\.ngrok2\ngrok.yml"
if (-not (Test-Path $configPath)) {
    Write-Host "⚠️  ngrok auth token not configured" -ForegroundColor Yellow
    Write-Host "Please run: ngrok config add-authtoken YOUR_AUTH_TOKEN" -ForegroundColor Yellow
    Write-Host "Get your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌐 Starting ngrok tunnels..." -ForegroundColor Blue

# Start ngrok for API (port 8000)
Write-Host "Starting API tunnel (port 8000)..." -ForegroundColor Cyan
Start-Process -FilePath "ngrok" -ArgumentList "http", "8000" -WindowStyle Minimized

# Start ngrok for Web Frontend (port 3000)
Write-Host "Starting Web Frontend tunnel (port 3000)..." -ForegroundColor Cyan
Start-Process -FilePath "ngrok" -ArgumentList "http", "3000" -WindowStyle Minimized

Write-Host ""
Write-Host "✅ ngrok tunnels started!" -ForegroundColor Green
Write-Host "Check the ngrok web interface at: http://localhost:4040" -ForegroundColor Blue
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:4040 in your browser" -ForegroundColor White
Write-Host "2. Copy the HTTPS URLs for your API and Web Frontend" -ForegroundColor White
Write-Host "3. Update Google OAuth redirect URIs in Google Cloud Console" -ForegroundColor White
Write-Host "4. Share the Web Frontend URL with your friends!" -ForegroundColor White
