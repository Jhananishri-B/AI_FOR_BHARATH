#!/usr/bin/env python3
"""
Diagnostic script to identify and fix login issues
"""

import os
import sys
from pymongo import MongoClient
from bson import ObjectId
import hashlib

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://db:27017")
DB_NAME = os.getenv("MONGO_DB", "learnquest")

def get_database():
    """Connect to MongoDB and return database instance"""
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]

def check_users():
    """Check existing users and their password fields"""
    db = get_database()
    users_collection = db.users
    
    print("\n=== Checking Existing Users ===")
    users = list(users_collection.find({}))
    print(f"Total users in database: {len(users)}")
    
    for user in users:
        print(f"\nUser: {user.get('email')} ({user.get('name')})")
        print(f"  ID: {user['_id']}")
        print(f"  Role: {user.get('role', 'N/A')}")
        
        # Check password fields
        if 'password' in user:
            print(f"  Has 'password' field: Yes (length: {len(user['password'])})")
        else:
            print(f"  Has 'password' field: No")
            
        if 'password_hash' in user:
            print(f"  Has 'password_hash' field: Yes (length: {len(user['password_hash'])})")
        else:
            print(f"  Has 'password_hash' field: No")

def create_test_users():
    """Create test users with known passwords"""
    db = get_database()
    users_collection = db.users
    
    print("\n=== Creating Test Users ===")
    
    # Test user 1: student@learnquest.com
    test_user_1 = {
        "name": "Test Student",
        "email": "student@learnquest.com",
        "password": "pass123",  # Plain password (will be used as-is for SHA256)
        "password_hash": hashlib.sha256("pass123".encode()).hexdigest(),
        "role": "student",
        "avatar_url": None,
        "auth_provider": "email",
        "xp": 0,
        "level": 1,
        "streak_count": 0,
        "enrolled_courses": [],
        "quiz_history": [],
        "badges": [],
        "completed_topics": [],
        "completed_modules": []
    }
    
    # Check if user exists
    existing = users_collection.find_one({"email": "student@learnquest.com"})
    if existing:
        print("Updating existing user: student@learnquest.com")
        users_collection.update_one(
            {"email": "student@learnquest.com"},
            {"$set": {
                "password_hash": test_user_1["password_hash"],
                "password": test_user_1["password"]
            }}
        )
    else:
        users_collection.insert_one(test_user_1)
        print("Created user: student@learnquest.com")
    
    # Test user 2: admin user
    test_user_2 = {
        "name": "Test Admin",
        "email": "admin@learnquest.com",
        "password": "admin123",
        "password_hash": hashlib.sha256("admin123".encode()).hexdigest(),
        "role": "admin",
        "avatar_url": None,
        "auth_provider": "email",
        "xp": 0,
        "level": 1,
        "streak_count": 0,
        "enrolled_courses": [],
        "quiz_history": [],
        "badges": [],
        "completed_topics": [],
        "completed_modules": []
    }
    
    existing = users_collection.find_one({"email": "admin@learnquest.com"})
    if existing:
        print("Updating existing user: admin@learnquest.com")
        users_collection.update_one(
            {"email": "admin@learnquest.com"},
            {"$set": {
                "password_hash": test_user_2["password_hash"],
                "password": test_user_2["password"]
            }}
        )
    else:
        users_collection.insert_one(test_user_2)
        print("Created user: admin@learnquest.com")
    
    print("\n✅ Test users created/updated!")
    print("\n=== Login Credentials ===")
    print("Student: student@learnquest.com / pass123")
    print("Admin:   admin@learnquest.com / admin123")

def fix_all_passwords():
    """Fix all users to have both password_hash (SHA256) and password fields"""
    db = get_database()
    users_collection = db.users
    
    print("\n=== Fixing All User Passwords ===")
    users = list(users_collection.find({}))
    
    default_password = "pass123"
    default_hash = hashlib.sha256(default_password.encode()).hexdigest()
    
    for user in users:
        email = user.get('email')
        
        # Update to have consistent password fields
        update_data = {}
        
        if 'password_hash' not in user:
            update_data['password_hash'] = default_hash
            
        if 'password' not in user:
            update_data['password'] = default_password
        elif not user.get('password_hash'):
            # If password exists but no hash, create hash
            update_data['password_hash'] = hashlib.sha256(user['password'].encode()).hexdigest()
        
        if update_data:
            users_collection.update_one(
                {"_id": user['_id']},
                {"$set": update_data}
            )
            print(f"Fixed: {email}")
        else:
            print(f"Already OK: {email}")
    
    print("\n✅ All passwords fixed!")

def main():
    try:
        print("=== LearnQuest Login Diagnostic Tool ===\n")
        
        # Check existing users
        check_users()
        
        # Ask what to do
        print("\n=== What would you like to do? ===")
        print("1. Create test users (student@learnquest.com / pass123)")
        print("2. Fix all existing passwords")
        print("3. Both")
        
        choice = input("\nEnter choice (1/2/3): ").strip()
        
        if choice in ['1', '3']:
            create_test_users()
        
        if choice in ['2', '3']:
            fix_all_passwords()
        
        # Re-check users
        print("\n=== Final Check ===")
        check_users()
        
        print("\n✅ Done! You can now login with:")
        print("student@learnquest.com / pass123")
        print("admin@learnquest.com / admin123")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

