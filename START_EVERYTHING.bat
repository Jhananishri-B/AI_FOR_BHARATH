@echo off
echo ======================================
echo LearnQuest Startup Script
echo ======================================
echo.

echo Starting all services...
echo.

echo 1. Starting MongoDB...
start "MongoDB" cmd /k "docker run -d --name mongo -p 27017:27017 mongo:7.0"

echo 2. Starting API Server...
cd services/api
start "API Server" cmd /k "uvicorn src.main:app --reload --port 8000"
cd ../..

echo 3. Starting Web Frontend...
cd apps/web-frontend
start "Web Frontend" cmd /k "npm run dev"
cd ../..

echo 4. Starting Admin Frontend...
cd apps/admin-frontend
start "Admin Frontend" cmd /k "npm run dev"
cd ../..

echo.
echo ======================================
echo All services starting in separate windows
echo ======================================
echo.
echo Web Frontend: http://localhost:5173
echo Admin Panel:  http://localhost:5174
echo API Health:   http://localhost:8000/api/health
echo.
echo Press any key to exit...
pause >nul

