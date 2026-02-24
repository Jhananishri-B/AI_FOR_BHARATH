@echo off
echo ========================================
echo LearnQuest - Quick Start Guide
echo ========================================
echo.

echo Starting all services...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/3] Starting Docker services...
docker-compose up -d

echo.
echo Waiting for services to start...
timeout /t 15 /nobreak >nul

echo.
echo [2/3] Starting Web Frontend (Development Mode)...
start cmd /k "cd apps\web-frontend && npm run dev"

echo.
echo [3/3] Starting Admin Frontend (Development Mode)...
start cmd /k "cd apps\admin-frontend && npm run dev"

echo.
echo ========================================
echo Services Starting...
echo ========================================
echo.
echo Web Frontend:   http://localhost:5173
echo Admin Panel:    http://localhost:5174  
echo API Server:     http://localhost:8000
echo API Docs:       http://localhost:8000/docs
echo Certification:  http://localhost:5173/certification
echo.
echo Docker containers are running in detached mode.
echo Frontend dev servers are opening in separate windows.
echo.
echo Press any key to stop all services...
pause >nul

echo.
echo Stopping services...
docker-compose down
taskkill /F /IM node.exe /T >nul 2>&1

echo.
echo All services stopped!
pause


