# GPU Setup for Windows - Learn Quest AI Tutor

## Current Status
- ✅ **RTX 4050 Detected**: Your GPU is working (CUDA 13.0, Driver 581.42)
- ❌ **Docker GPU Support**: Not configured (Windows limitation)
- 🔧 **Current Solution**: CPU-based AI processing (still functional)

## Why GPU Support is Limited on Windows

Docker Desktop on Windows has limited GPU support compared to Linux. The `--gpus` flag works but requires additional setup.

## Option 1: Enable Docker Desktop GPU Support (Recommended)

### Prerequisites
1. **Windows 11** or **Windows 10** (version 1903 or later)
2. **WSL 2** installed and enabled
3. **Docker Desktop** with WSL 2 backend

### Steps to Enable GPU Support

#### 1. Enable WSL 2 with GPU Support
```powershell
# Install WSL 2
wsl --install

# Install Ubuntu
wsl --install -d Ubuntu

# Update WSL
wsl --update
```

#### 2. Install NVIDIA WSL Driver
1. Download and install the latest NVIDIA driver from: https://www.nvidia.com/drivers/
2. Make sure it includes WSL support

#### 3. Configure Docker Desktop
1. Open Docker Desktop
2. Go to **Settings** → **Resources** → **WSL Integration**
3. Enable **"Use the WSL 2 based engine"**
4. Enable **"Enable integration with my default WSL distro"**
5. Restart Docker Desktop

#### 4. Test GPU Support
```bash
# Test in WSL
wsl
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi
```

## Option 2: Run AI Models Locally (Alternative)

If Docker GPU support doesn't work, you can run the AI models locally on your Windows machine:

### 1. Install Python Locally
```bash
# Install Python 3.10
# Download from: https://www.python.org/downloads/

# Install PyTorch with CUDA
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Install other dependencies
pip install sentence-transformers chromadb fastapi uvicorn
```

### 2. Run AI Service Locally
```bash
# Set environment variables
set MONGO_URL=mongodb://localhost:27017
set MONGO_DB=learnquest
set CHROMA_HOST=localhost
set CHROMA_PORT=8001

# Run the AI service
python services/api/src/main.py
```

## Option 3: Use Ollama for GPU Acceleration

Ollama can use your GPU directly on Windows:

### 1. Install Ollama
```bash
# Download from: https://ollama.ai/download
# Install Ollama for Windows
```

### 2. Pull AI Models
```bash
# Pull models that will use your GPU
ollama pull llama3
ollama pull llava
```

### 3. Verify GPU Usage
```bash
# Check if models are using GPU
ollama list
ollama run llama3 "Hello, are you using GPU?"
```

## Current System Status

The Learn Quest system is currently running with:
- **CPU-based AI**: Models run on CPU (slower but functional)
- **Ollama Integration**: Can use GPU for text generation
- **ChromaDB**: Vector database for embeddings
- **Full Functionality**: All features work, just slower AI processing

## Performance Comparison

| Setup | Embedding Speed | Text Generation | Overall Performance |
|-------|----------------|-----------------|-------------------|
| CPU Only | ~2-5 seconds | ~10-30 seconds | ⭐⭐⭐ |
| GPU Enabled | ~0.5-1 seconds | ~2-5 seconds | ⭐⭐⭐⭐⭐ |
| Ollama GPU | ~2-5 seconds | ~1-3 seconds | ⭐⭐⭐⭐ |

## Next Steps

1. **Try Option 1** (Docker Desktop GPU) first
2. **Fall back to Option 2** (Local Python) if needed
3. **Use Option 3** (Ollama) for text generation acceleration

The system will work perfectly with CPU processing, but GPU acceleration will make it much faster!
