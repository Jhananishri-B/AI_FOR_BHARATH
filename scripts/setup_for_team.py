#!/usr/bin/env python3
"""
Quick setup script for team members
"""

import os
import shutil
from pathlib import Path

def setup_environment():
    """Setup environment for team members"""
    print("🚀 LearnQuest Team Setup")
    print("=" * 40)
    
    # Check if .env exists
    env_file = Path(".env")
    env_example = Path("env.example")
    
    if not env_file.exists():
        if env_example.exists():
            print("📋 Creating .env file from template...")
            shutil.copy(env_example, env_file)
            print("✅ .env file created")
        else:
            print("❌ env.example not found!")
            return False
    else:
        print("✅ .env file already exists")
    
    print("\n🔧 Next Steps:")
    print("1. Edit .env file with your Google OAuth credentials")
    print("2. Get credentials from: https://console.cloud.google.com/")
    print("3. Add these redirect URIs in Google Console:")
    print("   - http://localhost:3000/login")
    print("   - http://localhost:3000/auth/google/callback")
    print("4. Run: docker-compose up -d")
    print("5. Open: http://localhost:3000")
    
    return True

def check_docker():
    """Check if Docker is available"""
    print("\n🐳 Checking Docker...")
    try:
        import subprocess
        result = subprocess.run(["docker", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Docker is available")
            return True
        else:
            print("❌ Docker not found")
            return False
    except FileNotFoundError:
        print("❌ Docker not installed")
        return False

def main():
    print("Welcome to LearnQuest Team Setup! 🎉")
    
    # Check Docker
    docker_ok = check_docker()
    
    # Setup environment
    env_ok = setup_environment()
    
    if docker_ok and env_ok:
        print("\n🎉 Setup complete!")
        print("\n📖 Read docs/TEAM_SETUP_GUIDE.md for detailed instructions")
    else:
        print("\n⚠️  Some issues found. Please check the setup guide.")

if __name__ == "__main__":
    main()
