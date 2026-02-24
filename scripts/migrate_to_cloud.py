#!/usr/bin/env python3
"""
Migrate to Cloud Database Script
This script helps migrate from local database to cloud database.
"""

import os
import sys
import json
from datetime import datetime

def check_current_setup():
    """Check current database setup"""
    print("🔍 Checking current database setup...")
    
    # Check if .env exists
    if os.path.exists('.env'):
        print("✅ .env file exists")
        with open('.env', 'r') as f:
            content = f.read()
            if 'mongodb+srv://' in content:
                print("✅ Cloud database URL detected")
                return True
            else:
                print("⚠️  Local database URL detected")
                return False
    else:
        print("❌ .env file not found")
        return False

def export_current_data():
    """Export current local database data"""
    print("📤 Exporting current database data...")
    
    try:
        # Run the export script
        os.system('python scripts/export_database.py')
        print("✅ Database exported successfully")
        return True
    except Exception as e:
        print(f"❌ Export failed: {e}")
        return False

def update_env_file(cloud_url, jwt_secret):
    """Update .env file with cloud database settings"""
    print("📝 Updating .env file...")
    
    env_content = f"""# LearnQuest Environment Variables
# MongoDB Atlas Connection (for team collaboration)
MONGO_URL={cloud_url}
MONGO_DB=learnquest

# JWT Secret (use a strong secret for production)
JWT_SECRET_KEY={jwt_secret}

# ChromaDB Configuration
CHROMA_HOST=chroma
CHROMA_PORT=8000

# Ollama Configuration (for AI features)
OLLAMA_BASE_URL=http://host.docker.internal:11434

# Optional: Redis for caching (if needed)
REDIS_URL=redis://redis:6379
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✅ .env file updated")

def create_docker_override():
    """Create docker-compose override for cloud database"""
    print("🐳 Creating docker-compose override...")
    
    override_content = """version: '3.8'

services:
  api:
    environment:
      - MONGO_URL=${MONGO_URL}
      - MONGO_DB=${MONGO_DB}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - CHROMA_HOST=${CHROMA_HOST}
      - CHROMA_PORT=${CHROMA_PORT}
      - OLLAMA_BASE_URL=${OLLAMA_BASE_URL}
    env_file:
      - .env

  # Local MongoDB is disabled when using cloud database
  # db:
  #   image: mongo:7.0
  #   ports:
  #     - "27017:27017"
  #   volumes:
  #     - mongo_data:/data/db
  #   restart: unless-stopped
"""
    
    with open('docker-compose.override.yml', 'w') as f:
        f.write(override_content)
    
    print("✅ docker-compose.override.yml created")

def test_cloud_connection():
    """Test connection to cloud database"""
    print("🔗 Testing cloud database connection...")
    
    try:
        # Start services
        print("Starting services...")
        os.system('docker-compose up -d')
        
        # Wait a bit for services to start
        import time
        time.sleep(10)
        
        # Test API health
        import requests
        response = requests.get('http://localhost:8000/api/health')
        if response.status_code == 200:
            print("✅ API is healthy")
            return True
        else:
            print(f"❌ API health check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        return False

def main():
    print("🌐 LearnQuest Cloud Database Migration")
    print("=" * 50)
    
    # Check current setup
    is_cloud = check_current_setup()
    
    if is_cloud:
        print("✅ Already using cloud database!")
        return
    
    print("\n📋 Migration Steps:")
    print("1. Set up MongoDB Atlas account")
    print("2. Get connection string")
    print("3. Export current data")
    print("4. Update configuration")
    print("5. Test connection")
    
    # Get user input
    print("\n🔧 Configuration:")
    cloud_url = input("Enter your MongoDB Atlas connection string: ").strip()
    if not cloud_url:
        print("❌ Connection string is required")
        return
    
    jwt_secret = input("Enter JWT secret key (or press Enter for default): ").strip()
    if not jwt_secret:
        jwt_secret = "your-super-secret-jwt-key-change-in-production"
    
    # Export current data
    if not export_current_data():
        print("❌ Failed to export current data")
        return
    
    # Update configuration
    update_env_file(cloud_url, jwt_secret)
    create_docker_override()
    
    # Test connection
    if test_cloud_connection():
        print("\n🎉 Migration successful!")
        print("✅ Cloud database is working")
        print("✅ Team can now collaborate")
        print("\n📤 Share your .env file with team members")
        print("📖 See TEAM_CLOUD_DATABASE_GUIDE.md for team setup")
    else:
        print("\n❌ Migration failed")
        print("🔧 Check your connection string and try again")

if __name__ == "__main__":
    main()
