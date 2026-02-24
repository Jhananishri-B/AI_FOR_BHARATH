#!/usr/bin/env python3
"""
Team Setup Script for LearnQuest
This script helps teammates set up the project quickly and correctly.
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def print_step(step_num, description):
    """Print a formatted step"""
    print(f"\n{'='*60}")
    print(f"STEP {step_num}: {description}")
    print(f"{'='*60}")

def run_command(command, shell=True):
    """Run a command and return success status"""
    try:
        result = subprocess.run(command, shell=shell, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def check_prerequisites():
    """Check if required tools are installed"""
    print_step(1, "Checking Prerequisites")
    
    tools = {
        'git': 'Git',
        'docker': 'Docker',
        'docker-compose': 'Docker Compose'
    }
    
    missing_tools = []
    
    for tool, name in tools.items():
        success, _, _ = run_command(f"{tool} --version")
        if success:
            print(f"✅ {name} is installed")
        else:
            print(f"❌ {name} is NOT installed")
            missing_tools.append(name)
    
    if missing_tools:
        print(f"\n❌ Missing required tools: {', '.join(missing_tools)}")
        print("Please install them before continuing:")
        print("- Git: https://git-scm.com/downloads")
        print("- Docker Desktop: https://www.docker.com/products/docker-desktop/")
        return False
    
    print("\n✅ All prerequisites are installed!")
    return True

def create_env_file():
    """Create the required .env file"""
    print_step(2, "Creating Environment Configuration")
    
    env_path = Path("services/api/.env")
    
    if env_path.exists():
        print("✅ services/api/.env already exists")
        return True
    
    # Create the directory if it doesn't exist
    env_path.parent.mkdir(parents=True, exist_ok=True)
    
     env_content = """# Database Configuration
MONGO_URL=mongodb+srv://gokul9942786_db_user:eTMzG8J5Z3hC86C0@cluster0.qvkilbo.mongodb.net/learnquest?retryWrites=true&w=majority&appName=Cluster0
MONGO_DB=learnquest

# Security
JWT_SECRET_KEY=learnquest-jwt-secret-key-2024

# Google OAuth Configuration
# Get these from Google Cloud Console: https://console.cloud.google.com/
# 1. Create a new project or select existing
# 2. Enable Google+ API
# 3. Create OAuth 2.0 credentials (Web application)
# 4. Add authorized redirect URI: http://localhost:3000/login
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/login

# ChromaDB Configuration (for Docker)
CHROMA_HOST=chroma
CHROMA_PORT=8000

# Ollama Configuration (for AI features)
# Make sure Ollama is running on your host machine
OLLAMA_BASE_URL=http://host.docker.internal:11434

# API Configuration
API_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000
"""
    
    try:
        with open(env_path, 'w') as f:
            f.write(env_content)
        print("✅ Created services/api/.env file")
        print("📝 Note: You can edit this file to add your Google OAuth credentials")
        return True
    except Exception as e:
        print(f"❌ Failed to create .env file: {e}")
        return False

def check_ollama():
    """Check if Ollama is installed and running"""
    print_step(3, "Checking Ollama Setup")
    
    # Check if Ollama is installed
    success, _, _ = run_command("ollama --version")
    if not success:
        print("❌ Ollama is not installed")
        print("📝 Please install Ollama from https://ollama.ai/download")
        print("📝 After installation, run: ollama serve")
        return False
    
    print("✅ Ollama is installed")
    
    # Check if Ollama service is running
    success, _, _ = run_command("curl -s http://localhost:11434/api/tags")
    if not success:
        print("❌ Ollama service is not running")
        print("📝 Please start Ollama: ollama serve")
        return False
    
    print("✅ Ollama service is running")
    
    # Check if llama3 model is available
    success, output, _ = run_command("curl -s http://localhost:11434/api/tags")
    if success and "llama3" in output:
        print("✅ llama3 model is available")
    else:
        print("❌ llama3 model is not available")
        print("📝 Please pull the model: ollama pull llama3")
        return False
    
    return True

def start_docker_services():
    """Start Docker services"""
    print_step(4, "Starting Docker Services")
    
    print("🔄 Building and starting Docker containers...")
    print("⏳ This may take a few minutes on first run...")
    
    success, stdout, stderr = run_command("docker-compose up --build -d")
    
    if success:
        print("✅ Docker services started successfully!")
        return True
    else:
        print("❌ Failed to start Docker services")
        print(f"Error: {stderr}")
        return False

def verify_setup():
    """Verify that everything is working"""
    print_step(5, "Verifying Setup")
    
    checks = [
        ("API Server", "http://localhost:8000/"),
        ("Google OAuth", "http://localhost:8000/api/auth/google/url"),
        ("ChromaDB", "http://localhost:8001/api/v2/heartbeat"),
        ("Frontend", "http://localhost:3000")
    ]
    
    all_passed = True
    
    for name, url in checks:
        if url.startswith("http://localhost:8001"):
            # ChromaDB check
            success, _, _ = run_command(f"curl -s {url}")
        else:
            # Other checks
            success, _, _ = run_command(f"curl -s {url}")
        
        if success:
            print(f"✅ {name} is working")
        else:
            print(f"❌ {name} is not responding")
            all_passed = False
    
    return all_passed

def print_next_steps():
    """Print next steps for the user"""
    print_step(6, "Setup Complete!")
    
    print("🎉 Your LearnQuest application is now running!")
    print("\n📱 Access your application:")
    print("   • Main App: http://localhost:3000")
    print("   • Admin Panel: http://localhost:5174")
    print("   • API Docs: http://localhost:8000/docs")
    
    print("\n🔧 Optional: Set up Google OAuth")
    print("   1. Go to https://console.cloud.google.com/")
    print("   2. Create OAuth 2.0 credentials")
    print("   3. Add redirect URI: http://localhost:3000/login")
    print("   4. Update services/api/.env with your credentials")
    
    print("\n🤖 AI Features:")
    print("   • AI Tutor is available in courses")
    print("   • Make sure Ollama is running: ollama serve")
    print("   • Pull models as needed: ollama pull llama3")
    
    print("\n📚 Test Accounts:")
    print("   • Email: student@learnquest.com")
    print("   • Password: password123")
    
    print("\n🛠️ Useful Commands:")
    print("   • Stop services: docker-compose down")
    print("   • Start services: docker-compose up -d")
    print("   • View logs: docker-compose logs [service-name]")
    print("   • Check status: docker-compose ps")

def main():
    """Main setup function"""
    print("🚀 LearnQuest Team Setup Script")
    print("This script will help you set up the project correctly.")
    
    # Check if we're in the right directory
    if not Path("docker-compose.yml").exists():
        print("❌ Please run this script from the LearnQuest project root directory")
        sys.exit(1)
    
    # Run setup steps
    steps = [
        check_prerequisites,
        create_env_file,
        check_ollama,
        start_docker_services,
        verify_setup
    ]
    
    for step in steps:
        if not step():
            print(f"\n❌ Setup failed at step: {step.__name__}")
            print("Please fix the issue and run the script again.")
            sys.exit(1)
    
    print_next_steps()

if __name__ == "__main__":
    main()
