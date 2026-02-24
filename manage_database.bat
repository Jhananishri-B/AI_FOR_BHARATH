@echo off
echo LearnQuest Database Management Script
echo ====================================
echo.
echo Choose an option:
echo 1. Export Database (Team Lead)
echo 2. Import Database (Team Member)
echo 3. Sync Database (Team Member)
echo 4. Start Services
echo 5. Stop Services
echo 6. Reset Database
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" (
    echo Exporting database...
    python scripts/export_database.py
    pause
) else if "%choice%"=="2" (
    echo Importing database...
    python scripts/import_database.py
    pause
) else if "%choice%"=="3" (
    echo Syncing database...
    python scripts/sync_database.py
    pause
) else if "%choice%"=="4" (
    echo Starting services...
    docker-compose up
) else if "%choice%"=="5" (
    echo Stopping services...
    docker-compose down
    pause
) else if "%choice%"=="6" (
    echo Resetting database...
    docker-compose down -v
    docker-compose up
) else (
    echo Invalid choice!
    pause
)
