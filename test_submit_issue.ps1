#!/usr/bin/env pwsh
# Quick test script for Submit Problem issue

Write-Host "=== Submit Problem Debug Test ===" -ForegroundColor Cyan
Write-Host ""

# Check if containers are running
Write-Host "1. Checking container status..." -ForegroundColor Yellow
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Select-String "learnquest"
Write-Host ""

# Check if web frontend is accessible
Write-Host "2. Checking web frontend (http://localhost:3000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✓ Web frontend is accessible" -ForegroundColor Green
} catch {
    Write-Host "✗ Web frontend is not accessible" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Check if API is accessible
Write-Host "3. Checking API (http://localhost:8000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✓ API is accessible" -ForegroundColor Green
} catch {
    Write-Host "✗ API is not accessible" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Instructions
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open your browser and go to: http://localhost:3000" -ForegroundColor White
Write-Host "2. Press F12 to open Developer Console" -ForegroundColor White
Write-Host "3. Login and start a coding test" -ForegroundColor White
Write-Host "4. Write some code and click 'Submit Problem'" -ForegroundColor White
Write-Host "5. Watch the console for debug messages starting with ===" -ForegroundColor White
Write-Host ""
Write-Host "To view API logs in real-time, run:" -ForegroundColor Yellow
Write-Host "  docker compose logs -f api" -ForegroundColor Cyan
Write-Host ""
Write-Host "If the button stays 'Submitting...', copy all the console logs and report them." -ForegroundColor White
Write-Host ""
