# Switch to Public Configuration for LearnQuest
param(
    [Parameter(Mandatory=$true)]
    [string]$WebUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$ApiUrl
)

Write-Host "🌐 Switching to Public Configuration" -ForegroundColor Green
Write-Host "Web URL: $WebUrl" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl" -ForegroundColor Cyan

# Update .env file
$envPath = "services/api/.env"
$envContent = Get-Content $envPath

# Update redirect URI
$envContent = $envContent -replace "GOOGLE_REDIRECT_URI=.*", "GOOGLE_REDIRECT_URI=$WebUrl/login"

# Update API URLs
$envContent = $envContent -replace "API_URL=.*", "API_URL=$ApiUrl"
$envContent = $envContent -replace "VITE_API_URL=.*", "VITE_API_URL=$ApiUrl"

# Write back to file
$envContent | Set-Content $envPath

Write-Host "✅ Configuration updated!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update Google Cloud Console with: $WebUrl/login" -ForegroundColor White
Write-Host "2. Restart your Docker containers: docker-compose restart" -ForegroundColor White
Write-Host "3. Share this URL with your friends: $WebUrl" -ForegroundColor White
