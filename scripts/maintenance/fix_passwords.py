#!/usr/bin/env python3
"""
Fix password hashes for all users in the database
This ensures consistent password verification across the team
"""

import os
import sys
from pymongo import MongoClient
from passlib.context import CryptContext
import bcrypt

# Add the services/api/src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'src'))

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB", "learnquest")

def get_database():
    """Connect to MongoDB and return database instance"""
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    try:
        # Truncate password to 72 bytes to avoid bcrypt limitation
        truncated_password = password[:72]
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(truncated_password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    except Exception as e:
        print(f"Error hashing password: {e}")
        return None

def fix_user_passwords():
    """Fix password hashes for all users"""
    print("🔧 Fixing password hashes for all users...")
    
    db = get_database()
    users_collection = db.users
    
    # Get all users
    users = list(users_collection.find({}))
    
    if not users:
        print("❌ No users found in database")
        return
    
    print(f"Found {len(users)} users to process")
    
    # Define known passwords for users with fallback hashes
    known_passwords = {
        "gokul@gmail.com": "gokul123",
        "varun@gmail.com": "varun123", 
        "admin@learnquest.com": "admin123",
        "student@learnquest.com": "pass123",
        "test@example.com": "test123"  # Set a default password
    }
    
    updated_count = 0
    
    for user in users:
        email = user.get("email")
        current_password_hash = user.get("password", "")
        
        print(f"\nProcessing user: {email}")
        print(f"Current hash: {current_password_hash[:50]}...")
        
        # Check if password needs fixing
        needs_fix = False
        new_password = None
        
        if current_password_hash.startswith("fallback_hash_"):
            # Extract password from fallback hash
            password_part = current_password_hash.replace("fallback_hash_", "")
            if email in known_passwords:
                new_password = known_passwords[email]
                needs_fix = True
                print(f"Found fallback hash, will use: {new_password}")
        elif not current_password_hash or current_password_hash == "N/A":
            # User has no password
            if email in known_passwords:
                new_password = known_passwords[email]
                needs_fix = True
                print(f"No password found, will set: {new_password}")
        elif not current_password_hash.startswith("$2b$"):
            # Not a proper bcrypt hash
            if email in known_passwords:
                new_password = known_passwords[email]
                needs_fix = True
                print(f"Invalid hash format, will set: {new_password}")
        
        if needs_fix and new_password:
            # Hash the new password
            new_hash = hash_password(new_password)
            if new_hash:
                # Update user in database
                result = users_collection.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"password": new_hash}}
                )
                
                if result.modified_count > 0:
                    print(f"✅ Updated password hash for {email}")
                    updated_count += 1
                else:
                    print(f"❌ Failed to update {email}")
            else:
                print(f"❌ Failed to hash password for {email}")
        else:
            print(f"✅ Password hash is already correct for {email}")
    
    print(f"\n🎉 Password fix completed!")
    print(f"📊 Updated {updated_count} users")
    
    # Show final user list
    print(f"\n📋 Final user credentials:")
    users = list(users_collection.find({}))
    for user in users:
        email = user.get("email")
        password = known_passwords.get(email, "Unknown")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print("---")

def main():
    """Main function"""
    try:
        fix_user_passwords()
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
