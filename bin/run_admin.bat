@echo off
if exist "bin" (
    rem Already in root
) else if exist "..\bin" (
    cd ..
)

echo Starting Admin Frontend...
cd apps\admin-frontend
npm run dev
