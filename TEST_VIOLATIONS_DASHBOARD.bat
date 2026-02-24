@echo off
echo ========================================
echo  Exam Violations Dashboard - Quick Test
echo ========================================
echo.

echo [1/3] Checking if services are running...
echo.

REM Check if API is running
curl -s http://localhost:8000/api/health > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] API Server not running on port 8000
    echo Please start API server first:
    echo    cd services/api
    echo    uvicorn src.main:app --reload --port 8000
    echo.
    pause
    exit /b 1
)
echo [OK] API Server is running

REM Check if Admin Panel is running
curl -s http://localhost:5174 > nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Admin Panel not running on port 5174
    echo Please start Admin Panel first:
    echo    cd apps/admin-frontend
    echo    npm run dev
    echo.
    pause
    exit /b 1
)
echo [OK] Admin Panel is running

echo.
echo [2/3] All services are running!
echo.

echo [3/3] Opening Exam Violations Dashboard...
echo.

REM Open the dashboard in default browser
start http://localhost:5174/exam-violations

echo ========================================
echo  Dashboard opened in your browser!
echo ========================================
echo.
echo What to test:
echo  1. Login as admin if prompted
echo  2. View summary cards
echo  3. Try filtering candidates
echo  4. Click "View Details" on a candidate
echo  5. Review the 3 tabs
echo  6. Make an admin decision
echo  7. Export a report
echo.
echo Need help?
echo  - See EXAM_VIOLATIONS_QUICK_GUIDE.md
echo  - See EXAM_VIOLATIONS_TESTING_GUIDE.md
echo  - See IMPLEMENTATION_SUMMARY.md
echo.
echo API Documentation: http://localhost:8000/docs
echo Admin Panel: http://localhost:5174
echo.

pause
