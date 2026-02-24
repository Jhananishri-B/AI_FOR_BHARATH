@echo off
echo ======================================
echo Starting LearnQuest Admin Panel
echo ======================================
echo.

cd apps/admin-frontend

echo Checking if node_modules exists...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo Starting admin panel on http://localhost:5174
echo.
echo Close this window to stop the server
echo.
pause

call npm run dev

