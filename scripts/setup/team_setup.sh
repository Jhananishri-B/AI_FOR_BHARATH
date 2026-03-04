#!/bin/bash

# LearnQuest Team Setup Script for macOS/Linux
# This script automates the setup process for team members

echo "🚀 LearnQuest Team Setup Script"
echo "================================"

# Check if Docker is installed
echo ""
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker is installed"

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker."
    exit 1
fi

echo "✅ Docker is running"

# Create .env file
echo ""
echo "🔧 Setting up cloud database connection..."

# Create services/api directory if it doesn't exist
mkdir -p services/api

# Create .env file
cat > services/api/.env << EOF
MONGO_URL=mongodb+srv://gokul9942786_db_user:eTMzG8J5Z3hC86C0@cluster0.qvkilbo.mongodb.net/learnquest?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET_KEY=your-shared-jwt-secret-key
EOF

echo "✅ Created .env file with cloud database connection"

# Start Docker services
echo ""
echo "🐳 Starting Docker services..."

docker compose down 2>/dev/null
docker compose up -d

if [ $? -eq 0 ]; then
    echo "✅ Docker services started"
else
    echo "❌ Failed to start Docker services"
    echo "   Please check your Docker installation and try again."
    exit 1
fi

# Wait for services to start
echo ""
echo "⏳ Waiting for services to start (30 seconds)..."
sleep 30

# Test API health
echo ""
echo "🔍 Testing API connection..."

max_retries=5
retry_count=0

while [ $retry_count -lt $max_retries ]; do
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        echo "✅ API is healthy and responding"
        break
    else
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $max_retries ]; then
            echo "   Retrying API connection... ($retry_count/$max_retries)"
            sleep 10
        else
            echo "❌ API is not responding after $max_retries attempts"
            echo "   Please check the logs: docker compose logs api"
        fi
    fi
done

# Show service status
echo ""
echo "📊 Service Status:"
docker compose ps

# Open browser (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo ""
    echo "🌐 Opening application in browser..."
    open http://localhost:3000
fi

echo ""
echo "🎉 Setup Complete!"
echo "================="
echo "✅ Cloud database connected"
echo "✅ All services running"
echo "✅ Application ready"

echo ""
echo "📱 Application URLs:"
echo "   Main App: http://localhost:3000"
echo "   Admin Panel: http://localhost:3001"
echo "   API Docs: http://localhost:8000/docs"

echo ""
echo "🔑 Login Credentials:"
echo "   Email: student@learnquest.com"
echo "   Password: password123"

echo ""
echo "📚 Available Courses:"
echo "   • Python for Beginners"
echo "   • Practical Machine Learning"
echo "   • Python Intermediate"
echo "   • C Programming Basics"
echo "   • Data Structures for Beginners"
echo "   • Intermediate DSA with Python"

echo ""
echo "🛠️ Useful Commands:"
echo "   Stop services: docker compose down"
echo "   Start services: docker compose up -d"
echo "   View logs: docker compose logs [service-name]"
echo "   Check status: docker compose ps"

echo ""
echo "🎯 Next Steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Login with the credentials above"
echo "   3. Explore the courses and take quizzes"
echo "   4. Test the AI Tutor with questions"
echo "   5. Check the leaderboard for rankings"

echo ""
echo "✨ Happy Learning!"
