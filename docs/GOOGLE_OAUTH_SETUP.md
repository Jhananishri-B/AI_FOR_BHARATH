# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for LearnQuest.

## Prerequisites

- Google Cloud Console account
- Access to your LearnQuest project

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application" as the application type
   - Add authorized redirect URIs:
     - For development: `http://localhost:3000/login`
     - For production: `https://yourdomain.com/login`

## Step 2: Configure Environment Variables

1. Copy the `env.example` file to `.env`:
   ```bash
   cp env.example .env
   ```

2. Update the `.env` file with your Google OAuth credentials:
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id-here
   GOOGLE_CLIENT_SECRET=your-google-client-secret-here
   GOOGLE_REDIRECT_URI=http://localhost:3000/login
   ```

## Step 3: Update Frontend Configuration

The frontend is already configured to handle Google OAuth. The login page will automatically show a "Continue with Google" button when the backend is properly configured.

## Step 4: Test the Integration

1. Start your development servers:
   ```bash
   # Backend
   cd services/api
   pip install -r requirements.txt
   python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

   # Frontend
   cd apps/web-frontend
   npm install
   npm run dev
   ```

2. Navigate to `http://localhost:3000/login`
3. Click "Continue with Google"
4. Complete the OAuth flow
5. You should be redirected back to the application and logged in

## Features

- **Automatic User Creation**: New users are automatically created when they first log in with Google
- **Account Linking**: If a user with the same email already exists, their account will be linked to Google
- **Profile Sync**: User's name and avatar are synced from their Google profile
- **Seamless Integration**: Works alongside existing email/password authentication

## Troubleshooting

### Common Issues

1. **"Google OAuth not configured" error**:
   - Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in your `.env` file
   - Restart your backend server after updating environment variables

2. **"Invalid redirect URI" error**:
   - Ensure the redirect URI in your Google Cloud Console matches exactly what's in your `.env` file
   - Check for trailing slashes and protocol (http vs https)

3. **"Access blocked" error**:
   - Make sure your Google Cloud project has the Google+ API enabled
   - Check that your OAuth consent screen is properly configured

### Development vs Production

- **Development**: Use `http://localhost:3000/login` as the redirect URI
- **Production**: Use your actual domain (e.g., `https://learnquest.com/login`)

## Security Notes

- Never commit your `.env` file to version control
- Use different OAuth credentials for development and production
- Regularly rotate your client secrets
- Monitor OAuth usage in the Google Cloud Console

## Database Schema

The user model has been updated to support Google OAuth:

```python
class User(BaseModel):
    # ... existing fields ...
    google_id: Optional[str] = None  # Google user ID
    auth_provider: str = "email"     # "email" or "google"
    # ... rest of fields ...
```

Users can authenticate using either:
- Email/password (existing functionality)
- Google OAuth (new functionality)
