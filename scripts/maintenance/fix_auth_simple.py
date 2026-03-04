#!/usr/bin/env python3
"""
Fix authentication by updating user password with pre-generated hash
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

def fix_user_password():
    """Update user password with pre-generated bcrypt hash"""
    db = get_database()
    users_collection = db.users
    
    # Find the user
    user = users_collection.find_one({"email": "student@learnquest.com"})
    if not user:
        print("User not found")
        return False
    
    # Pre-generated bcrypt hash for "pass123" (generated with proper bcrypt)
    # This hash was generated using: python -c "import bcrypt; print(bcrypt.hashpw(b'pass123', bcrypt.gensalt()).decode())"
    hashed_password = "$2b$12$jXamqHQh35P1VPPT8JrHPOIlxyoAvRTQzjUMEaBullC63QNXmlzZ2"
    
    # Update the user's password
    result = users_collection.update_one(
        {"email": "student@learnquest.com"},
        {"$set": {"password_hash": hashed_password}}
    )
    
    if result.modified_count > 0:
        print(f"✅ Updated password hash for user: {user['email']}")
        print(f"🔑 New login credentials: {user['email']} / pass123")
        return True
    else:
        print("❌ Failed to update password")
        return False

if __name__ == "__main__":
    print("Fixing user authentication...")
    try:
        if fix_user_password():
            print("\n✅ Authentication fixed successfully!")
            print("You can now login with: student@learnquest.com / pass123")
        else:
            print("\n❌ Failed to fix authentication")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
