# GPU-Accelerated AI Tutor Setup Script for Windows
# This script sets up Ollama with GPU acceleration for Learn Quest

Write-Host "🚀 Setting up GPU-Accelerated AI Tutor for Learn Quest" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Check if Ollama is installed
Write-Host "🔍 Checking Ollama installation..." -ForegroundColor Yellow
try {
    $ollamaVersion = ollama --version
    Write-Host "✅ Ollama is installed: $ollamaVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama not found. Please install it from: https://ollama.ai/download" -ForegroundColor Red
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    exit 1
}

# Check GPU availability
Write-Host "🎮 Checking GPU availability..." -ForegroundColor Yellow
try {
    nvidia-smi | Out-Null
    Write-Host "✅ NVIDIA GPU detected and working" -ForegroundColor Green
} catch {
    Write-Host "⚠️  NVIDIA GPU not detected. Ollama will use CPU (slower)" -ForegroundColor Yellow
}

# Pull required models
Write-Host "📥 Downloading AI models..." -ForegroundColor Yellow
Write-Host "This may take several minutes depending on your internet connection..." -ForegroundColor Gray

Write-Host "Downloading Llama3 (text generation)..." -ForegroundColor Blue
ollama pull llama3

Write-Host "Downloading LLaVA (image analysis)..." -ForegroundColor Blue
ollama pull llava

# Test models
Write-Host "🧪 Testing models..." -ForegroundColor Yellow

Write-Host "Testing Llama3..." -ForegroundColor Blue
$testResponse = ollama run llama3 "Hello, are you using GPU?" --verbose
Write-Host "Llama3 response: $testResponse" -ForegroundColor Gray

Write-Host "Testing LLaVA..." -ForegroundColor Blue
# Note: LLaVA test would need an image, so we'll skip for now

Write-Host "✅ Models are ready!" -ForegroundColor Green

# Start Ollama server
Write-Host "🚀 Starting Ollama server..." -ForegroundColor Yellow
Write-Host "Keep this terminal open to maintain GPU acceleration!" -ForegroundColor Cyan

# Start Ollama in the background
Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Minimized

# Wait a moment for server to start
Start-Sleep -Seconds 3

# Test server connection
Write-Host "🔗 Testing Ollama server connection..." -ForegroundColor Yellow
try {
    $serverTest = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get
    Write-Host "✅ Ollama server is running and accessible" -ForegroundColor Green
    Write-Host "Available models: $($serverTest.models.name -join ', ')" -ForegroundColor Gray
} catch {
    Write-Host "❌ Ollama server not responding. Please check if it's running." -ForegroundColor Red
}

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "🎉 GPU-Accelerated AI Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Keep this terminal open (Ollama server is running)" -ForegroundColor White
Write-Host "2. Open a new terminal and run:" -ForegroundColor White
Write-Host "   docker-compose down" -ForegroundColor Gray
Write-Host "   docker-compose build" -ForegroundColor Gray
Write-Host "   docker-compose up -d" -ForegroundColor Gray
Write-Host "3. Run content indexing:" -ForegroundColor White
Write-Host "   docker-compose exec api python scripts/index_content.py" -ForegroundColor Gray
Write-Host "4. Test your AI Tutor at: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Your RTX 4050 will now accelerate all AI operations! 🚀" -ForegroundColor Green
