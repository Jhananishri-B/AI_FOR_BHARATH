# 🚀 Team Setup Guide for LearnQuest

This guide helps your teammates set up the project locally with Google OAuth.

## 📋 Prerequisites

- Docker and Docker Compose installed
- Git installed
- Google account (for OAuth setup)

## 🔧 Step 1: Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd LearnQuest-Team4

# Copy environment template
cp env.example .env
```

## 🔑 Step 2: Google OAuth Setup (Each team member needs this)

### 2.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API

### 2.2 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Add these **Authorized redirect URIs**:
   - `http://localhost:3000/login`
   - `http://localhost:3000/auth/google/callback`
5. Copy the **Client ID** and **Client Secret**

### 2.3 Update Environment Variables

Edit your `.env` file:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/login

# Database Configuration
MONGODB_URL=mongodb://localhost:27017/learnquest
DATABASE_URL=mongodb://localhost:27017/learnquest

# API Configuration
API_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000
```

## 🐳 Step 3: Run the Application

```bash
# Start all services
docker-compose up -d

# Check if services are running
docker-compose ps
```

## ✅ Step 4: Verify Setup

1. Open http://localhost:3000
2. Click "Continue with Google"
3. You should be redirected to Google login
4. After login, you should be redirected back to the app

## 🔧 Troubleshooting

### Google OAuth Issues

**Error: "redirect_uri_mismatch"**
- Make sure your redirect URI in Google Console matches exactly: `http://localhost:3000/login`
- Check that your `.env` file has the correct `GOOGLE_REDIRECT_URI`

**Error: "Invalid client"**
- Verify your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
- Make sure there are no extra spaces or quotes

### Docker Issues

**Error: "Port already in use"**
```bash
# Stop existing containers
docker-compose down

# Start fresh
docker-compose up -d
```

**Error: "Cannot connect to database"**
```bash
# Check if MongoDB is running
docker-compose logs db

# Restart database
docker-compose restart db
```

## 🎯 Testing AI Features

Once logged in, test these features:

1. **AI Tutor**: Ask questions in any course
2. **AI Quiz**: Generate quizzes for topics
3. **Course Navigation**: Browse available courses

## 📞 Need Help?

If you encounter issues:

1. Check the logs: `docker-compose logs api`
2. Verify environment variables: `cat .env`
3. Test Google OAuth: Visit http://localhost:8000/api/auth/google/url
4. Contact the team lead for assistance

## 🔄 Updating the Project

```bash
# Pull latest changes
git pull origin main

# Restart services
docker-compose down
docker-compose up -d
```

---

**Note**: Each team member needs their own Google OAuth credentials. You cannot share the same credentials across different Google accounts.
