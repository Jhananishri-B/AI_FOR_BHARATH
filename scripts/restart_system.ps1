# Learn Quest System Restart Script (PowerShell)
# This script properly restarts the entire system with ChromaDB initialization

Write-Host "🔄 Restarting Learn Quest System..." -ForegroundColor Cyan

# Stop all services
Write-Host "⏹️  Stopping all services..." -ForegroundColor Yellow
docker-compose down -v

# Remove any orphaned containers
Write-Host "🧹 Cleaning up orphaned containers..." -ForegroundColor Yellow
docker-compose down --remove-orphans

# Rebuild the API service (in case of dependency changes)
Write-Host "🔨 Rebuilding API service..." -ForegroundColor Yellow
docker-compose build api

# Start services in the correct order
Write-Host "🚀 Starting services..." -ForegroundColor Green

# Start core services first
Write-Host "📊 Starting database services..." -ForegroundColor Blue
docker-compose up -d db chroma

# Wait for ChromaDB to be healthy
Write-Host "⏳ Waiting for ChromaDB to be ready..." -ForegroundColor Blue
Start-Sleep -Seconds 30

# Initialize ChromaDB
Write-Host "🔧 Initializing ChromaDB..." -ForegroundColor Blue
docker-compose up -d chroma-init

# Wait for initialization to complete
Write-Host "⏳ Waiting for ChromaDB initialization..." -ForegroundColor Blue
docker-compose logs -f chroma-init

# Start the API service
Write-Host "🔌 Starting API service..." -ForegroundColor Green
docker-compose up -d api

# Start the web frontend
Write-Host "🌐 Starting web frontend..." -ForegroundColor Green
docker-compose up -d web

# Start Judge0 services
Write-Host "⚖️  Starting Judge0 services..." -ForegroundColor Green
docker-compose up -d judge0-db judge0-redis judge0 judge0-worker

# Check system health
Write-Host "🏥 Checking system health..." -ForegroundColor Blue
Start-Sleep -Seconds 10

Write-Host "📊 System Status:" -ForegroundColor Cyan
Write-Host "API Health:"
try {
    $apiHealth = Invoke-RestMethod -Uri "http://localhost:8000/api/health" -Method Get
    $apiHealth | ConvertTo-Json
} catch {
    Write-Host "❌ API not responding" -ForegroundColor Red
}

Write-Host "AI Health:"
try {
    $aiHealth = Invoke-RestMethod -Uri "http://localhost:8000/api/ai/health" -Method Get
    $aiHealth | ConvertTo-Json
} catch {
    Write-Host "❌ AI service not responding" -ForegroundColor Red
}

Write-Host "✅ System restart completed!" -ForegroundColor Green
Write-Host "🌐 Web Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔌 API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📊 ChromaDB: http://localhost:8001" -ForegroundColor Cyan
Write-Host "⚖️  Judge0: http://localhost:2358" -ForegroundColor Cyan
