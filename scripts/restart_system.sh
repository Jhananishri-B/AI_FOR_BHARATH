#!/bin/bash
# Learn Quest System Restart Script
# This script properly restarts the entire system with ChromaDB initialization

echo "🔄 Restarting Learn Quest System..."

# Stop all services
echo "⏹️  Stopping all services..."
docker-compose down -v

# Remove any orphaned containers
echo "🧹 Cleaning up orphaned containers..."
docker-compose down --remove-orphans

# Rebuild the API service (in case of dependency changes)
echo "🔨 Rebuilding API service..."
docker-compose build api

# Start services in the correct order
echo "🚀 Starting services..."

# Start core services first
echo "📊 Starting database services..."
docker-compose up -d db chroma

# Wait for ChromaDB to be healthy
echo "⏳ Waiting for ChromaDB to be ready..."
docker-compose up -d chroma-init

# Wait for initialization to complete
echo "⏳ Waiting for ChromaDB initialization..."
docker-compose logs -f chroma-init

# Start the API service
echo "🔌 Starting API service..."
docker-compose up -d api

# Start the web frontend
echo "🌐 Starting web frontend..."
docker-compose up -d web

# Start Judge0 services
echo "⚖️  Starting Judge0 services..."
docker-compose up -d judge0-db judge0-redis judge0 judge0-worker

# Check system health
echo "🏥 Checking system health..."
sleep 10

echo "📊 System Status:"
echo "API Health:"
curl -s http://localhost:8000/api/health | jq .

echo "AI Health:"
curl -s http://localhost:8000/api/ai/health | jq .

echo "✅ System restart completed!"
echo "🌐 Web Frontend: http://localhost:3000"
echo "🔌 API: http://localhost:8000"
echo "📊 ChromaDB: http://localhost:8001"
echo "⚖️  Judge0: http://localhost:2358"
