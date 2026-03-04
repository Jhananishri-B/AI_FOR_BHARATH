#!/usr/bin/env python3
"""
Simple script to create a user with pre-hashed password
"""

import os
import sys
from datetime import datetime
from pymongo import MongoClient

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://db:27017")
DB_NAME = os.getenv("MONGO_DB", "learnquest")

def get_database():
    """Connect to MongoDB and return database instance"""
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]

def create_user():
    """Create a user with pre-hashed password"""
    db = get_database()
    users_collection = db.users
    
    # Check if user already exists
    existing_user = users_collection.find_one({"email": "student@learnquest.com"})
    if existing_user:
        print("User already exists")
        return existing_user["_id"]
    
    # Pre-hashed password for "password123" using bcrypt
    # This was generated using: python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('password123'))"
    hashed_password = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Kz8Kz2"
    
    user_data = {
        "name": "John Student",
        "email": "student@learnquest.com",
        "password_hash": hashed_password,
        "role": "admin",
        "avatar_url": None,
        "auth_provider": "email",
        "xp": 0,
        "level": 1,
        "enrolled_courses": [],
        "quiz_history": [],
        "badges": [],
        "created_at": datetime.utcnow()
    }
    
    result = users_collection.insert_one(user_data)
    print(f"Created user: {result.inserted_id}")
    return result.inserted_id

if __name__ == "__main__":
    print("Creating user...")
    try:
        create_user()
        print("✅ User created successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
