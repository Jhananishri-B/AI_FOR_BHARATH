#!/usr/bin/env python3
"""
Simple seeding script that creates basic data without bcrypt issues
"""

import os
import sys
from datetime import datetime
from pymongo import MongoClient
import uuid

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://db:27017")
DB_NAME = os.getenv("MONGO_DB", "learnquest")

def get_database():
    """Connect to MongoDB and return database instance"""
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]

def create_user():
    """Create a user with simple password hash"""
    db = get_database()
    users_collection = db.users
    
    # Check if user already exists
    existing_user = users_collection.find_one({"email": "student@learnquest.com"})
    if existing_user:
        print("User already exists")
        return existing_user["_id"]
    
    # Simple hash for "password123" - in production, use proper bcrypt
    user_data = {
        "name": "John Student",
        "email": "student@learnquest.com",
        "password_hash": "simple_hash_password123",  # This will be replaced by proper auth
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

def create_courses():
    """Create sample courses"""
    db = get_database()
    courses_collection = db.courses
    
    # Check if courses already exist
    existing_courses = list(courses_collection.find({}))
    if existing_courses:
        print("Courses already exist")
        return [course["_id"] for course in existing_courses]
    
    # Python Basics Course
    python_course = {
        "title": "Python Basics",
        "slug": "python-basics",
        "description": "Learn the fundamentals of Python programming language",
        "xp_reward": 100,
        "modules": [
            {
                "module_id": str(uuid.uuid4()),
                "title": "Introduction to Python",
                "order": 1,
                "topics": [
                    {
                        "topic_id": str(uuid.uuid4()),
                        "title": "What is Python?",
                        "content_url": "/content/python-intro"
                    },
                    {
                        "topic_id": str(uuid.uuid4()),
                        "title": "Python Syntax",
                        "content_url": "/content/python-syntax"
                    }
                ]
            },
            {
                "module_id": str(uuid.uuid4()),
                "title": "Variables and Data Types",
                "order": 2,
                "topics": [
                    {
                        "topic_id": str(uuid.uuid4()),
                        "title": "Variables in Python",
                        "content_url": "/content/python-variables"
                    },
                    {
                        "topic_id": str(uuid.uuid4()),
                        "title": "Data Types",
                        "content_url": "/content/python-data-types"
                    }
                ]
            }
        ],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Insert course
    python_result = courses_collection.insert_one(python_course)
    print(f"Created Python Basics course: {python_result.inserted_id}")
    
    return [python_result.inserted_id]

def main():
    """Main seeding function"""
    print("Starting simple database seeding...")
    
    try:
        db = get_database()
        print(f"Connected to database: {DB_NAME}")
        
        # Create user
        user_id = create_user()
        
        # Create courses
        course_ids = create_courses()
        
        print("\n✅ Simple database seeding completed successfully!")
        print(f"📊 Created:")
        print(f"  - 1 user (student@learnquest.com)")
        print(f"  - {len(course_ids)} courses")
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
