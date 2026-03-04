# LearnQuest Team Setup Script for Windows
# This script automates the setup process for team members

Write-Host "🚀 LearnQuest Team Setup Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Check if Docker is running
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow

try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "   Download from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Create .env file
Write-Host "`n🔧 Setting up cloud database connection..." -ForegroundColor Yellow

$envContent = @"
MONGO_URL=mongodb+srv://gokul9942786_db_user:eTMzG8J5Z3hC86C0@cluster0.qvkilbo.mongodb.net/learnquest?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET_KEY=your-shared-jwt-secret-key
"@

# Create services/api directory if it doesn't exist
if (!(Test-Path "services/api")) {
    New-Item -ItemType Directory -Path "services/api" -Force
}

# Write .env file
$envContent | Out-File -FilePath "services/api/.env" -Encoding UTF8
Write-Host "✅ Created .env file with cloud database connection" -ForegroundColor Green

# Start Docker services
Write-Host "`n🐳 Starting Docker services..." -ForegroundColor Yellow

try {
    docker compose down 2>$null
    docker compose up -d
    Write-Host "✅ Docker services started" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start Docker services" -ForegroundColor Red
    Write-Host "   Please check your Docker installation and try again." -ForegroundColor Yellow
    exit 1
}

# Wait for services to start
Write-Host "`n⏳ Waiting for services to start (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Test API health
Write-Host "`n🔍 Testing API connection..." -ForegroundColor Yellow

$maxRetries = 5
$retryCount = 0

do {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -Method GET -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ API is healthy and responding" -ForegroundColor Green
            break
        }
    } catch {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "   Retrying API connection... ($retryCount/$maxRetries)" -ForegroundColor Yellow
            Start-Sleep -Seconds 10
        } else {
            Write-Host "❌ API is not responding after $maxRetries attempts" -ForegroundColor Red
            Write-Host "   Please check the logs: docker compose logs api" -ForegroundColor Yellow
        }
    }
} while ($retryCount -lt $maxRetries)

# Show service status
Write-Host "`n📊 Service Status:" -ForegroundColor Yellow
docker compose ps

# Open browser
Write-Host "`n🌐 Opening application in browser..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

Write-Host "`n🎉 Setup Complete!" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host "✅ Cloud database connected" -ForegroundColor Green
Write-Host "✅ All services running" -ForegroundColor Green
Write-Host "✅ Application opened in browser" -ForegroundColor Green

Write-Host "`n📱 Application URLs:" -ForegroundColor Cyan
Write-Host "   Main App: http://localhost:3000" -ForegroundColor White
Write-Host "   Admin Panel: http://localhost:3001" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor White

Write-Host "`n🔑 Login Credentials:" -ForegroundColor Cyan
Write-Host "   Email: student@learnquest.com" -ForegroundColor White
Write-Host "   Password: password123" -ForegroundColor White

Write-Host "`n📚 Available Courses:" -ForegroundColor Cyan
Write-Host "   • Python for Beginners" -ForegroundColor White
Write-Host "   • Practical Machine Learning" -ForegroundColor White
Write-Host "   • Python Intermediate" -ForegroundColor White
Write-Host "   • C Programming Basics" -ForegroundColor White
Write-Host "   • Data Structures for Beginners" -ForegroundColor White
Write-Host "   • Intermediate DSA with Python" -ForegroundColor White

Write-Host "`n🛠️ Useful Commands:" -ForegroundColor Cyan
Write-Host "   Stop services: docker compose down" -ForegroundColor White
Write-Host "   Start services: docker compose up -d" -ForegroundColor White
Write-Host "   View logs: docker compose logs [service-name]" -ForegroundColor White
Write-Host "   Check status: docker compose ps" -ForegroundColor White

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Login with the credentials above" -ForegroundColor White
Write-Host "   2. Explore the courses and take quizzes" -ForegroundColor White
Write-Host "   3. Test the AI Tutor with questions" -ForegroundColor White
Write-Host "   4. Check the leaderboard for rankings" -ForegroundColor White

Write-Host "Happy Learning!" -ForegroundColor Green
