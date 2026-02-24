"""
Google OAuth authentication service
"""

import os
import httpx
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from ..database import get_collection
from ..models.user import User
from ..auth import create_access_token
from datetime import timedelta

# Google OAuth configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/google/callback")

class GoogleAuthService:
    """Service for handling Google OAuth authentication"""
    
    @staticmethod
    def get_google_auth_url() -> str:
        """Generate Google OAuth authorization URL"""
        if not GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google OAuth not configured"
            )
        
        params = {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "scope": "openid email profile",
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent"
        }
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"https://accounts.google.com/o/oauth2/v2/auth?{query_string}"
    
    @staticmethod
    async def exchange_code_for_token(code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google OAuth not configured"
            )
        
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": GOOGLE_REDIRECT_URI
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data)
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange code for token"
                )
            
            return response.json()
    
    @staticmethod
    async def get_user_info(access_token: str) -> Dict[str, Any]:
        """Get user information from Google using access token"""
        user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(user_info_url, headers=headers)
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user information from Google"
                )
            
            return response.json()
    
    @staticmethod
    async def authenticate_or_create_user(google_user_info: Dict[str, Any]) -> tuple[User, str]:
        """Authenticate existing user or create new user from Google info"""
        users_collection = get_collection("users")
        
        # Check if user exists by Google ID
        existing_user = users_collection.find_one({"google_id": google_user_info["id"]})
        
        if existing_user:
            # Update last active date
            users_collection.update_one(
                {"_id": existing_user["_id"]},
                {"$set": {"last_active_date": __import__('datetime').datetime.utcnow()}}
            )
            
            # Convert to User model
            existing_user["id"] = str(existing_user["_id"])
            del existing_user["_id"]
            user = User(**existing_user)
        else:
            # Check if user exists by email (for account linking)
            existing_user_by_email = users_collection.find_one({"email": google_user_info["email"]})
            
            if existing_user_by_email:
                # Link Google account to existing user
                users_collection.update_one(
                    {"_id": existing_user_by_email["_id"]},
                    {
                        "$set": {
                            "google_id": google_user_info["id"],
                            "auth_provider": "google",
                            "avatar_url": google_user_info.get("picture"),
                            "last_active_date": __import__('datetime').datetime.utcnow()
                        }
                    }
                )
                
                # Get updated user
                updated_user = users_collection.find_one({"_id": existing_user_by_email["_id"]})
                updated_user["id"] = str(updated_user["_id"])
                del updated_user["_id"]
                user = User(**updated_user)
            else:
                # Create new user
                from datetime import datetime
                new_user_data = {
                    "name": google_user_info["name"],
                    "email": google_user_info["email"],
                    "google_id": google_user_info["id"],
                    "auth_provider": "google",
                    "avatar_url": google_user_info.get("picture"),
                    "role": "student",
                    "xp": 0,
                    "level": 1,
                    "enrolled_courses": [],
                    "quiz_history": [],
                    "badges": [],
                    "last_active_date": datetime.utcnow(),
                    "streak_count": 0,
                    "created_at": datetime.utcnow()
                }
                
                result = users_collection.insert_one(new_user_data)
                new_user_data["id"] = str(result.inserted_id)
                del new_user_data["_id"]
                user = User(**new_user_data)
        
        # Create JWT token
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user.id},
            expires_delta=access_token_expires
        )
        
        return user, access_token
