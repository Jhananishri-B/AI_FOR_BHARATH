@echo off
if exist "bin" (
    rem Already in root
) else if exist "..\bin" (
    cd ..
)

echo 🚀 LearnQuest Team Setup Script
echo This script will help you set up the project correctly.
echo.

REM Check if we're in the right directory
if not exist "docker-compose.yml" (
    echo ❌ Please run this script from the LearnQuest project root directory
    pause
    exit /b 1
)

echo 📋 Checking prerequisites...
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/downloads/
    pause
    exit /b 1
)
echo ✅ Python is installed

REM Check if Docker is available
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not running
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)
echo ✅ Docker is installed

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not available
    echo Please make sure Docker Desktop is running
    pause
    exit /b 1
)
echo ✅ Docker Compose is available

echo.
echo 🔧 Creating environment configuration...

REM Create the .env file if it doesn't exist
if not exist "services\api\.env" (
    mkdir "services\api" 2>nul
    echo # Database Configuration > "services\api\.env"
    echo MONGO_URL=mongodb+srv://gokul9942786_db_user:eTMzG8J5Z3hC86C0@cluster0.qvkilbo.mongodb.net/learnquest?retryWrites=true^&w=majority^&appName=Cluster0 >> "services\api\.env"
    echo MONGO_DB=learnquest >> "services\api\.env"
    echo. >> "services\api\.env"
    echo # Security >> "services\api\.env"
    echo JWT_SECRET_KEY=learnquest-jwt-secret-key-2024 >> "services\api\.env"
    echo. >> "services\api\.env"
    echo # Google OAuth Configuration >> "services\api\.env"
    echo # Get these from Google Cloud Console: https://console.cloud.google.com/ >> "services\api\.env"
    echo # 1. Create a new project or select existing >> "services\api\.env"
    echo # 2. Enable Google+ API >> "services\api\.env"
    echo # 3. Create OAuth 2.0 credentials (Web application) >> "services\api\.env"
    echo # 4. Add authorized redirect URI: http://localhost:3000/login >> "services\api\.env"
    echo GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com >> "services\api\.env"
    echo GOOGLE_CLIENT_SECRET=your-google-client-secret >> "services\api\.env"
    echo GOOGLE_REDIRECT_URI=http://localhost:3000/login >> "services\api\.env"
    echo. >> "services\api\.env"
    echo # ChromaDB Configuration (for Docker) >> "services\api\.env"
    echo CHROMA_HOST=chroma >> "services\api\.env"
    echo CHROMA_PORT=8000 >> "services\api\.env"
    echo. >> "services\api\.env"
    echo # Ollama Configuration (for AI features) >> "services\api\.env"
    echo # Make sure Ollama is running on your host machine >> "services\api\.env"
    echo OLLAMA_BASE_URL=http://host.docker.internal:11434 >> "services\api\.env"
    echo. >> "services\api\.env"
    echo # API Configuration >> "services\api\.env"
    echo API_URL=http://localhost:8000 >> "services\api\.env"
    echo VITE_API_URL=http://localhost:8000 >> "services\api\.env"
    echo ✅ Created services\api\.env file
) else (
    echo ✅ services\api\.env already exists
)

echo.
echo 🐳 Starting Docker services...
echo ⏳ This may take a few minutes on first run...

docker-compose up --build -d

if %errorlevel% neq 0 (
    echo ❌ Failed to start Docker services
    echo Please check Docker Desktop is running and try again
    pause
    exit /b 1
)

echo ✅ Docker services started successfully!

echo.
echo 🔍 Verifying setup...

REM Wait a moment for services to start
timeout /t 10 /nobreak >nul

REM Test API
curl -s http://localhost:8000/ >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ API Server is working
) else (
    echo ❌ API Server is not responding
)

REM Test Frontend
curl -s http://localhost:3000/ >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is working
) else (
    echo ❌ Frontend is not responding
)

echo.
echo 🎉 Setup Complete!
echo.
echo 📱 Access your application:
echo    • Main App: http://localhost:3000
echo    • Admin Panel: http://localhost:5174
echo    • API Docs: http://localhost:8000/docs
echo.
echo 🔧 Optional: Set up Google OAuth
echo    1. Go to https://console.cloud.google.com/
echo    2. Create OAuth 2.0 credentials
echo    3. Add redirect URI: http://localhost:3000/login
echo    4. Update services\api\.env with your credentials
echo.
echo 🤖 AI Features:
echo    • AI Tutor is available in courses
echo    • Install Ollama from https://ollama.ai/download
echo    • Run: ollama serve
echo    • Pull models: ollama pull llama3
echo.
echo 📚 Test Account:
echo    • Email: student@learnquest.com
echo    • Password: password123
echo.
echo 🛠️ Useful Commands:
echo    • Stop services: docker-compose down
echo    • Start services: docker-compose up -d
echo    • View logs: docker-compose logs [service-name]
echo    • Check status: docker-compose ps
echo.
pause
