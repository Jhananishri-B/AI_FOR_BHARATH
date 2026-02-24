# LearnQuest Database Management Script
Write-Host "LearnQuest Database Management Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Choose an option:" -ForegroundColor Yellow
Write-Host "1. Export Database (Team Lead)" -ForegroundColor Green
Write-Host "2. Import Database (Team Member)" -ForegroundColor Green
Write-Host "3. Sync Database (Team Member)" -ForegroundColor Green
Write-Host "4. Start Services" -ForegroundColor Green
Write-Host "5. Stop Services" -ForegroundColor Green
Write-Host "6. Reset Database" -ForegroundColor Green
Write-Host ""

$choice = Read-Host "Enter your choice (1-6)"

switch ($choice) {
    "1" {
        Write-Host "Exporting database..." -ForegroundColor Yellow
        python scripts/export_database.py
        Read-Host "Press Enter to continue"
    }
    "2" {
        Write-Host "Importing database..." -ForegroundColor Yellow
        python scripts/import_database.py
        Read-Host "Press Enter to continue"
    }
    "3" {
        Write-Host "Syncing database..." -ForegroundColor Yellow
        python scripts/sync_database.py
        Read-Host "Press Enter to continue"
    }
    "4" {
        Write-Host "Starting services..." -ForegroundColor Yellow
        docker-compose up
    }
    "5" {
        Write-Host "Stopping services..." -ForegroundColor Yellow
        docker-compose down
        Read-Host "Press Enter to continue"
    }
    "6" {
        Write-Host "Resetting database..." -ForegroundColor Yellow
        docker-compose down -v
        docker-compose up
    }
    default {
        Write-Host "Invalid choice!" -ForegroundColor Red
        Read-Host "Press Enter to continue"
    }
}
