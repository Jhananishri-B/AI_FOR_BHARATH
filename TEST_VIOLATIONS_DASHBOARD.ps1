# Exam Violations Dashboard - Quick Test Script
# PowerShell Version

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Exam Violations Dashboard - Quick Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Checking if services are running..." -ForegroundColor Yellow
Write-Host ""

# Check if API is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "[OK] API Server is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] API Server not running on port 8000" -ForegroundColor Red
    Write-Host "Please start API server first:" -ForegroundColor Yellow
    Write-Host "   cd services/api" -ForegroundColor White
    Write-Host "   uvicorn src.main:app --reload --port 8000" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Admin Panel is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5174" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "[OK] Admin Panel is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Admin Panel not running on port 5174" -ForegroundColor Red
    Write-Host "Please start Admin Panel first:" -ForegroundColor Yellow
    Write-Host "   cd apps/admin-frontend" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[2/3] All services are running!" -ForegroundColor Green
Write-Host ""

Write-Host "[3/3] Opening Exam Violations Dashboard..." -ForegroundColor Yellow
Write-Host ""

# Open the dashboard in default browser
Start-Process "http://localhost:5174/exam-violations"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Dashboard opened in your browser!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What to test:" -ForegroundColor Yellow
Write-Host " 1. Login as admin if prompted" -ForegroundColor White
Write-Host " 2. View summary cards" -ForegroundColor White
Write-Host " 3. Try filtering candidates" -ForegroundColor White
Write-Host " 4. Click 'View Details' on a candidate" -ForegroundColor White
Write-Host " 5. Review the 3 tabs" -ForegroundColor White
Write-Host " 6. Make an admin decision" -ForegroundColor White
Write-Host " 7. Export a report" -ForegroundColor White
Write-Host ""
Write-Host "Need help?" -ForegroundColor Yellow
Write-Host " - See EXAM_VIOLATIONS_QUICK_GUIDE.md" -ForegroundColor Cyan
Write-Host " - See EXAM_VIOLATIONS_TESTING_GUIDE.md" -ForegroundColor Cyan
Write-Host " - See IMPLEMENTATION_SUMMARY.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Magenta
Write-Host "Admin Panel: http://localhost:5174" -ForegroundColor Magenta
Write-Host ""

Read-Host "Press Enter to exit"
