#!/usr/bin/env python3
"""
LearnQuest Certification Module Setup Script
This script sets up the complete proctoring system with all dependencies
"""

import os
import sys
import subprocess
import platform
import json
from pathlib import Path

def run_command(command, cwd=None, shell=True):
    """Run a command and return the result"""
    try:
        result = subprocess.run(command, shell=shell, cwd=cwd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error running command: {command}")
            print(f"Error: {result.stderr}")
            return False
        return True
    except Exception as e:
        print(f"Exception running command {command}: {e}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 9):
        print("Error: Python 3.9+ is required")
        return False
    print(f"✓ Python {version.major}.{version.minor}.{version.micro} detected")
    return True

def check_node_version():
    """Check if Node.js version is compatible"""
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✓ Node.js {version} detected")
            return True
    except:
        pass
    
    print("Error: Node.js 18+ is required")
    return False

def check_docker():
    """Check if Docker is available"""
    try:
        result = subprocess.run(["docker", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✓ Docker {version} detected")
            return True
    except:
        pass
    
    print("Warning: Docker not found. You can still run locally without Docker.")
    return False

def setup_python_dependencies():
    """Setup Python dependencies for the API"""
    print("\n📦 Setting up Python dependencies...")
    
    api_path = Path("services/api")
    if not api_path.exists():
        print("Error: services/api directory not found")
        return False
    
    # Create virtual environment
    venv_path = api_path / "venv"
    if not venv_path.exists():
        print("Creating Python virtual environment...")
        if not run_command(f"python -m venv venv", cwd=api_path):
            return False
    
    # Determine activation script based on OS
    if platform.system() == "Windows":
        activate_script = venv_path / "Scripts" / "activate.bat"
        pip_path = venv_path / "Scripts" / "pip"
    else:
        activate_script = venv_path / "bin" / "activate"
        pip_path = venv_path / "bin" / "pip"
    
    # Install dependencies
    print("Installing Python packages...")
    if not run_command(f'"{pip_path}" install -r requirements.txt', cwd=api_path):
        return False
    
    print("✓ Python dependencies installed successfully")
    return True

def setup_node_dependencies():
    """Setup Node.js dependencies for frontend apps"""
    print("\n📦 Setting up Node.js dependencies...")
    
    # Install root dependencies
    if Path("package.json").exists():
        print("Installing root dependencies...")
        if not run_command("npm install"):
            return False
    
    # Install web-frontend dependencies
    web_frontend_path = Path("apps/web-frontend")
    if web_frontend_path.exists():
        print("Installing web-frontend dependencies...")
        if not run_command("npm install", cwd=web_frontend_path):
            return False
    
    # Install admin-frontend dependencies
    admin_frontend_path = Path("apps/admin-frontend")
    if admin_frontend_path.exists():
        print("Installing admin-frontend dependencies...")
        if not run_command("npm install", cwd=admin_frontend_path):
            return False
    
    print("✓ Node.js dependencies installed successfully")
    return True

def create_env_files():
    """Create necessary .env files"""
    print("\n🔧 Creating environment files...")
    
    # Create API .env file
    api_env_path = Path("services/api/.env")
    if not api_env_path.exists():
        env_content = """# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
MONGO_DB=learnquest

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production

# Proctoring Configuration
CHROMA_HOST=chroma
CHROMA_PORT=8000
OLLAMA_BASE_URL=http://host.docker.internal:11434

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Proctoring Settings
FACE_DETECTION_THRESHOLD=0.5
NOISE_THRESHOLD_DB=40.0
SPEECH_DETECTION_ENABLED=true
FACE_ABSENCE_TIMEOUT=5
HEAD_TURN_THRESHOLD=0.3
MAX_VIOLATIONS=10
BEHAVIOR_SCORE_WEIGHT=0.4
TEST_SCORE_WEIGHT=0.6
"""
        api_env_path.write_text(env_content)
        print("✓ Created services/api/.env")
    
    # Create root .env file
    root_env_path = Path(".env")
    if not root_env_path.exists():
        env_content = """# LearnQuest Environment Configuration
NODE_ENV=development
VITE_API_URL=http://localhost:8000

# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
MONGO_DB=learnquest

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
"""
        root_env_path.write_text(env_content)
        print("✓ Created root .env")
    
    return True

def create_directories():
    """Create necessary directories"""
    print("\n📁 Creating necessary directories...")
    
    directories = [
        "temp_video",
        "temp_audio", 
        "face_encodings",
        "violation_logs",
        "certificates",
        "services/api/models",
        "services/api/logs"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✓ Created directory: {directory}")
    
    return True

def download_yolo_model():
    """Download YOLOv8 model"""
    print("\n🤖 Downloading YOLOv8 model...")
    
    try:
        # This will be handled by the ultralytics package when first imported
        print("✓ YOLOv8 model will be downloaded automatically on first use")
        return True
    except Exception as e:
        print(f"Warning: Could not prepare YOLOv8 model: {e}")
        return True  # Non-critical error

def create_startup_scripts():
    """Create startup scripts for different platforms"""
    print("\n🚀 Creating startup scripts...")
    
    # Windows batch script
    windows_script = """@echo off
echo Starting LearnQuest with Proctoring...

REM Start MongoDB (if running locally)
REM mongod --dbpath ./data/db

REM Start API
cd services/api
call venv\\Scripts\\activate.bat
start "API Server" cmd /k "uvicorn src.main:app --reload --port 8000"

REM Start Web Frontend
cd ..\\..\\apps\\web-frontend
start "Web Frontend" cmd /k "npm run dev"

REM Start Admin Frontend
cd ..\\admin-frontend
start "Admin Frontend" cmd /k "npm run dev"

echo All services started!
echo Web Frontend: http://localhost:5173
echo Admin Frontend: http://localhost:5174
echo API: http://localhost:8000
pause
"""
    
    Path("start_learnquest.bat").write_text(windows_script)
    print("✓ Created start_learnquest.bat")
    
    # Unix shell script
    unix_script = """#!/bin/bash
echo "Starting LearnQuest with Proctoring..."

# Start API
cd services/api
source venv/bin/activate
uvicorn src.main:app --reload --port 8000 &
API_PID=$!

# Start Web Frontend
cd ../../apps/web-frontend
npm run dev &
WEB_PID=$!

# Start Admin Frontend
cd ../admin-frontend
npm run dev &
ADMIN_PID=$!

echo "All services started!"
echo "Web Frontend: http://localhost:5173"
echo "Admin Frontend: http://localhost:5174"
echo "API: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "kill $API_PID $WEB_PID $ADMIN_PID; exit" INT
wait
"""
    
    unix_script_path = Path("start_learnquest.sh")
    unix_script_path.write_text(unix_script)
    unix_script_path.chmod(0o755)
    print("✓ Created start_learnquest.sh")
    
    return True

def create_docker_setup():
    """Create Docker setup instructions"""
    print("\n🐳 Docker setup instructions...")
    
    docker_instructions = """# LearnQuest Proctoring with Docker

## Quick Start with Docker

1. Make sure Docker Desktop is running
2. Run the following commands:

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

## Services

- **Web Frontend**: http://localhost:3000
- **Admin Frontend**: http://localhost:5174
- **API**: http://localhost:8000
- **Judge0**: http://localhost:2358
- **ChromaDB**: http://localhost:8001

## Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete all data)
docker-compose down -v
```

## Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs api
docker-compose logs web
```

## Troubleshooting

1. If you get permission errors, make sure Docker Desktop is running
2. If ports are in use, check what's running on ports 3000, 5174, 8000, 2358, 8001
3. For GPU acceleration issues, check the GPU setup guide in docs/
"""
    
    Path("DOCKER_SETUP.md").write_text(docker_instructions)
    print("✓ Created DOCKER_SETUP.md")
    
    return True

def main():
    """Main setup function"""
    print("🚀 LearnQuest Proctoring Module Setup")
    print("=" * 50)
    
    # Check prerequisites
    if not check_python_version():
        return False
    
    if not check_node_version():
        return False
    
    check_docker()
    
    # Setup steps
    steps = [
        ("Creating directories", create_directories),
        ("Setting up Python dependencies", setup_python_dependencies),
        ("Setting up Node.js dependencies", setup_node_dependencies),
        ("Creating environment files", create_env_files),
        ("Preparing AI models", download_yolo_model),
        ("Creating startup scripts", create_startup_scripts),
        ("Creating Docker setup", create_docker_setup),
    ]
    
    for step_name, step_func in steps:
        print(f"\n{step_name}...")
        if not step_func():
            print(f"❌ Failed: {step_name}")
            return False
        print(f"✅ Completed: {step_name}")
    
    print("\n" + "=" * 50)
    print("🎉 Setup completed successfully!")
    print("\nNext steps:")
    print("1. Configure your .env files with your settings")
    print("2. Set up Google OAuth (optional) - see docs/GOOGLE_OAUTH_SETUP.md")
    print("3. Start the services:")
    if platform.system() == "Windows":
        print("   - Run: start_learnquest.bat")
        print("   - Or: docker-compose up -d")
    else:
        print("   - Run: ./start_learnquest.sh")
        print("   - Or: docker-compose up -d")
    print("\n4. Access the application:")
    print("   - Web Frontend: http://localhost:5173 (dev) or http://localhost:3000 (Docker)")
    print("   - Admin Frontend: http://localhost:5174")
    print("   - API: http://localhost:8000")
    print("   - Certification: http://localhost:5173/certification")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
