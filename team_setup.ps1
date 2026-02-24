# LearnQuest Team Setup Script (PowerShell)
# This script helps teammates set up the project quickly and correctly.

Write-Host "🚀 LearnQuest Team Setup Script" -ForegroundColor Green
Write-Host "This script will help you set up the project correctly." -ForegroundColor Yellow
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ Please run this script from the LearnQuest project root directory" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "📋 Checking prerequisites..." -ForegroundColor Cyan
Write-Host ""

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python is installed: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python from https://www.python.org/downloads/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Docker is available
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Docker Compose is available
try {
    $composeVersion = docker-compose --version 2>&1
    Write-Host "✅ Docker Compose is available: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not available" -ForegroundColor Red
    Write-Host "Please make sure Docker Desktop is running" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🔧 Creating environment configuration..." -ForegroundColor Cyan

# Create the .env file if it doesn't exist
$envPath = "services\api\.env"
if (-not (Test-Path $envPath)) {
    # Create directory if it doesn't exist
    $envDir = Split-Path $envPath -Parent
    if (-not (Test-Path $envDir)) {
        New-Item -ItemType Directory -Path $envDir -Force | Out-Null
    }
    
    $envContent = @"
# Database Configuration
MONGO_URL=mongodb+srv://gokul9942786_db_user:eTMzG8J5Z3hC86C0@cluster0.qvkilbo.mongodb.net/learnquest?retryWrites=true&w=majority&appName=Cluster0
MONGO_DB=learnquest

# Security
JWT_SECRET_KEY=learnquest-jwt-secret-key-2024

# Google OAuth Configuration
# Get these from Google Cloud Console: https://console.cloud.google.com/
# 1. Create a new project or select existing
# 2. Enable Google+ API
# 3. Create OAuth 2.0 credentials (Web application)
# 4. Add authorized redirect URI: http://localhost:3000/login
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/login

# ChromaDB Configuration (for Docker)
CHROMA_HOST=chroma
CHROMA_PORT=8000

# Ollama Configuration (for AI features)
# Make sure Ollama is running on your host machine
OLLAMA_BASE_URL=http://host.docker.internal:11434

# API Configuration
API_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000
"@
    
    Set-Content -Path $envPath -Value $envContent -Encoding UTF8
    Write-Host "✅ Created $envPath file" -ForegroundColor Green
    Write-Host "📝 Note: You can edit this file to add your Google OAuth credentials" -ForegroundColor Yellow
} else {
    Write-Host "✅ $envPath already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "🐳 Starting Docker services..." -ForegroundColor Cyan
Write-Host "⏳ This may take a few minutes on first run..." -ForegroundColor Yellow

try {
    $result = docker-compose up --build -d 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker services started successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to start Docker services" -ForegroundColor Red
        Write-Host "Error: $result" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} catch {
    Write-Host "❌ Failed to start Docker services: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🔍 Verifying setup..." -ForegroundColor Cyan

# Wait a moment for services to start
Start-Sleep -Seconds 10

# Test API
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ API Server is working" -ForegroundColor Green
} catch {
    Write-Host "❌ API Server is not responding" -ForegroundColor Red
}

# Test Frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Frontend is working" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend is not responding" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Access your application:" -ForegroundColor Cyan
Write-Host "   • Main App: http://localhost:3000" -ForegroundColor White
Write-Host "   • Admin Panel: http://localhost:5174" -ForegroundColor White
Write-Host "   • API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Optional: Set up Google OAuth" -ForegroundColor Cyan
Write-Host "   1. Go to https://console.cloud.google.com/" -ForegroundColor White
Write-Host "   2. Create OAuth 2.0 credentials" -ForegroundColor White
Write-Host "   3. Add redirect URI: http://localhost:3000/login" -ForegroundColor White
Write-Host "   4. Update $envPath with your credentials" -ForegroundColor White
Write-Host ""
Write-Host "🤖 AI Features:" -ForegroundColor Cyan
Write-Host "   • AI Tutor is available in courses" -ForegroundColor White
Write-Host "   • Install Ollama from https://ollama.ai/download" -ForegroundColor White
Write-Host "   • Run: ollama serve" -ForegroundColor White
Write-Host "   • Pull models: ollama pull llama3" -ForegroundColor White
Write-Host ""
Write-Host "📚 Test Account:" -ForegroundColor Cyan
Write-Host "   • Email: student@learnquest.com" -ForegroundColor White
Write-Host "   • Password: password123" -ForegroundColor White
Write-Host ""
Write-Host "🛠️ Useful Commands:" -ForegroundColor Cyan
Write-Host "   • Stop services: docker-compose down" -ForegroundColor White
Write-Host "   • Start services: docker-compose up -d" -ForegroundColor White
Write-Host "   • View logs: docker-compose logs [service-name]" -ForegroundColor White
Write-Host "   • Check status: docker-compose ps" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
