if (Test-Path "bin") {
    # Already in root
} elseif (Test-Path "..\bin") {
    Set-Location ..
}

Write-Host "Starting Admin Frontend..." -ForegroundColor Green
Set-Location apps\admin-frontend
npm run dev
