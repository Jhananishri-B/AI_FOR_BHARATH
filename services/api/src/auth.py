"""
Authentication utilities for JWT handling and password verification
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .database import get_collection
from .models.user import User

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer token scheme
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    # Check if it's a fallback hash first
    if hashed_password.startswith("fallback_hash_"):
        # For fallback hashes, do a simple comparison
        expected_fallback = f"fallback_hash_{plain_password[:20]}"
        print(f"Checking fallback hash: {hashed_password} vs {expected_fallback}")
        return hashed_password == expected_fallback
    
    # Check if it's a SHA256 hash (for manually created users)
    if len(hashed_password) == 64:  # SHA256 produces 64-character hex strings
        import hashlib
        expected_hash = hashlib.sha256(plain_password.encode()).hexdigest()
        return hashed_password == expected_hash
    
    # Use bcrypt for proper hashes
    try:
        import bcrypt
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    """Hash a password"""
    try:
        # Truncate password to 72 bytes to avoid bcrypt limitation
        truncated_password = password[:72]
        return pwd_context.hash(truncated_password)
    except Exception as e:
        print(f"Password hashing error: {e}")
        # Fallback to simple hash if bcrypt fails
        return f"fallback_hash_{password[:20]}"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get the current authenticated user from JWT token"""
    token = credentials.credentials
    payload = verify_token(token)
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    users_collection = get_collection("users")
    from bson import ObjectId
    user_data = users_collection.find_one({"_id": ObjectId(user_id)})
    
    if user_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Convert MongoDB document to User model
    user_data["id"] = str(user_data["_id"])
    del user_data["_id"]  # Remove the ObjectId field
    return User(**user_data)

async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[User]:
    """Get the current authenticated user from JWT token, returns None if not authenticated"""
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        payload = verify_token(token)
        
        user_id = payload.get("sub")
        if user_id is None:
            return None
        
        # Get user from database
        users_collection = get_collection("users")
        from bson import ObjectId
        user_data = users_collection.find_one({"_id": ObjectId(user_id)})
        
        if user_data is None:
            return None
        
        # Convert MongoDB document to User model
        user_data["id"] = str(user_data["_id"])
        del user_data["_id"]  # Remove the ObjectId field
        return User(**user_data)
    except:
        return None


async def require_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Require that the current user has admin role"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
