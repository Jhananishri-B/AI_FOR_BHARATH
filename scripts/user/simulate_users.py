#!/usr/bin/env python3
"""
User simulation script for GNN training data
Creates fake users with practice history to train the recommendation system
"""

import sys
import os
import random
from datetime import datetime
from pymongo import MongoClient
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
        truncated_password = password[:72]
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(truncated_password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    except Exception as e:
        print(f"Error hashing password: {e}")
        return f"fallback_hash_{password[:20]}"

def simulate_users():
    """Create fake users with practice history for GNN training"""
    print("🎭 Starting user simulation for GNN training...")
    
    db = get_database()
    
    # Get all code problems (practice problems)
    problems_collection = db.questions
    all_problems = list(problems_collection.find({"type": "code"}))
    
    if not all_problems:
        print("❌ No code problems found! Please create some practice problems first.")
        print("💡 Go to Admin Panel -> Practice Problems and create at least 10-15 coding problems.")
        return
    
    all_problem_ids = [str(problem["_id"]) for problem in all_problems]
    print(f"Found {len(all_problem_ids)} code problems for simulation")
    
    # Get users collection
    users_collection = db.users
    
    # Create 50 fake users
    created_users = 0
    
    for i in range(1, 51):  # Create users 1-50
        email = f'user{i}@test.com'
        name = f'Test User {i}'
        
        # Check if user already exists
        existing_user = users_collection.find_one({"email": email})
        if existing_user:
            print(f"User {email} already exists, skipping...")
            continue
        
        # Randomly select 5-10 problems this user has solved
        num_solved = random.randint(5, min(10, len(all_problem_ids)))
        solved_problems = random.sample(all_problem_ids, num_solved)
        
        # Create user document
        user_data = {
            "name": name,
            "email": email,
            "password": hash_password("test123"),  # All test users have same password
            "role": "student",
            "avatar_url": None,
            "auth_provider": "email",
            "xp": random.randint(50, 500),  # Random XP
            "level": random.randint(1, 5),  # Random level
            "enrolled_courses": [],
            "quiz_history": [],
            "badges": [],
            "solved_problems": solved_problems,  # Key field for GNN
            "completed_topics": [],
            "completed_modules": [],
            "created_at": datetime.utcnow()
        }
        
        # Insert user
        result = users_collection.insert_one(user_data)
        created_users += 1
        
        if created_users % 10 == 0:
            print(f"Created {created_users} users...")
    
    print(f"✅ Successfully simulated {created_users} users with practice history!")
    print(f"📊 Each user solved 5-10 problems randomly")
    print(f"🔗 This creates the (User) -[:SOLVED]-> (Problem) relationships for GNN training")
    
    # Show some statistics
    total_users = users_collection.count_documents({})
    total_problems = len(all_problem_ids)
    
    print(f"\n📈 Database Statistics:")
    print(f"  - Total users: {total_users}")
    print(f"  - Total code problems: {total_problems}")
    print(f"  - Average problems per user: {created_users * 7.5 / created_users:.1f}")

def main():
    """Main function"""
    try:
        simulate_users()
    except Exception as e:
        print(f"❌ Error during simulation: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
