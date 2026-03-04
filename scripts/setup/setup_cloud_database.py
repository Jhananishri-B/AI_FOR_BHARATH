#!/usr/bin/env python3
"""
Cloud Database Setup Script for LearnQuest Team
This script helps set up a shared cloud database for team collaboration.
"""

import os
import sys
import json
from datetime import datetime

def create_env_file():
    """Create .env file for cloud database configuration"""
    env_content = """# LearnQuest Environment Variables
# MongoDB Atlas Connection (for team collaboration)
MONGO_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
MONGO_DB=learnquest

# JWT Secret (use a strong secret for production)
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production

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
    
    print("✅ Created .env file")
    print("📝 Please update the MONGO_URL with your Atlas connection string")

def create_cloud_docker_compose():
    """Create docker-compose.override.yml for cloud database"""
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

  # Remove local MongoDB when using cloud database
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
    
    print("✅ Created docker-compose.override.yml for cloud database")

def create_team_setup_guide():
    """Create team setup guide"""
    guide_content = """# Team Cloud Database Setup Guide

## Quick Setup for Team Members

### 1. Get Database Credentials
Ask your team lead for:
- MongoDB Atlas connection string
- JWT secret key
- Any other environment variables

### 2. Configure Environment
1. Copy `.env.example` to `.env`
2. Update the values with your team's credentials:
   ```bash
   cp .env.example .env
   # Edit .env with your team's values
   ```

### 3. Start Services
```bash
docker-compose up
```

### 4. Verify Connection
Check if the API is connected to the cloud database:
```bash
curl http://localhost:8000/api/health
```

## For Team Leads

### Setting up MongoDB Atlas:
1. Go to https://www.mongodb.com/atlas
2. Create free account
3. Create new project "LearnQuest"
4. Create free cluster (M0 Sandbox)
5. Create database user with read/write access
6. Add network access (0.0.0.0/0 for development)
7. Get connection string
8. Share connection string with team

### Sharing Credentials:
- Use secure communication (Slack, Teams, etc.)
- Never commit credentials to git
- Use environment variables for all sensitive data

## Troubleshooting

### Connection Issues:
1. Check if MONGO_URL is correct
2. Verify network access in Atlas
3. Check if database user has correct permissions

### Team Sync Issues:
1. Make sure everyone uses the same database
2. Export/import data when needed
3. Use the sync script for complex merges

## Security Best Practices:
1. Use strong passwords
2. Limit network access to team IPs
3. Rotate credentials regularly
4. Never commit .env files to git
"""
    
    with open('TEAM_CLOUD_SETUP.md', 'w') as f:
        f.write(guide_content)
    
    print("✅ Created TEAM_CLOUD_SETUP.md guide")

def main():
    print("🌐 Setting up cloud database for team collaboration...")
    print()
    
    # Create necessary files
    create_env_file()
    create_cloud_docker_compose()
    create_team_setup_guide()
    
    print()
    print("🎉 Cloud database setup complete!")
    print()
    print("Next steps:")
    print("1. Set up MongoDB Atlas account")
    print("2. Update .env file with your connection string")
    print("3. Share credentials with your team")
    print("4. Run: docker-compose up")
    print()
    print("📖 See TEAM_CLOUD_SETUP.md for detailed instructions")

if __name__ == "__main__":
    main()
