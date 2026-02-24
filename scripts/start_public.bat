@echo off
echo 🚀 Starting LearnQuest Public Access...
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Start the application
echo Starting Docker containers...
docker-compose up -d

REM Wait a moment for services to start
timeout /t 5 /nobreak >nul

REM Start ngrok tunnels
echo.
echo 🌐 Starting ngrok tunnels...
echo Opening ngrok web interface at http://localhost:4040
echo.

REM Start API tunnel
start "ngrok-API" cmd /k "ngrok http 8000"

REM Start Web Frontend tunnel  
start "ngrok-Web" cmd /k "ngrok http 3000"

echo ✅ Setup complete!
echo.
echo 📋 Next Steps:
echo 1. Open http://localhost:4040 in your browser
echo 2. Copy the HTTPS URLs for your API and Web Frontend
echo 3. Update Google OAuth redirect URIs in Google Cloud Console
echo 4. Share the Web Frontend URL with your friends!
echo.
pause
