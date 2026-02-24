#!/usr/bin/env python3
"""
Script to add sample dashboard data for testing
"""

import os
import sys
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson import ObjectId

# Add the services directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'src'))

def add_sample_data():
    """Add sample dashboard data to the database"""
    
    # Connect to MongoDB
    client = MongoClient("mongodb://localhost:27017")
    db = client.learnquest
    
    # Get users collection
    users_collection = db.users
    
    # Find a user to add sample data to
    user = users_collection.find_one({"email": "test@example.com"})
    
    if not user:
        print("No test user found. Creating one...")
        # Create a test user
        user_doc = {
            "name": "Test User",
            "email": "test@example.com",
            "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K",  # password: test123
            "role": "student",
            "xp": 2500,
            "level": 3,
            "badges": ["First Quiz", "Streak Master"],
            "enrolled_courses": [
                {
                    "course_id": "course1",
                    "progress_percent": 75,
                    "completed_modules": ["module1", "module2"]
                }
            ],
            "quiz_history": [],
            "completed_topics": [],
            "completed_modules": ["module1", "module2"],
            "streak_count": 8,
            "last_active_date": datetime.utcnow(),
            "created_at": datetime.utcnow()
        }
        
        result = users_collection.insert_one(user_doc)
        user_id = result.inserted_id
        print(f"Created test user with ID: {user_id}")
    else:
        user_id = user["_id"]
        print(f"Found existing test user with ID: {user_id}")
    
    # Add sample quiz history
    sample_quizzes = []
    base_date = datetime.utcnow() - timedelta(days=30)
    
    quiz_titles = [
        "JavaScript Fundamentals",
        "React Components",
        "CSS Grid Layout",
        "Node.js Basics",
        "Python Data Types",
        "SQL Queries",
        "HTML Semantics",
        "Git Version Control",
        "API Design",
        "Database Design"
    ]
    
    for i in range(15):
        quiz_date = base_date + timedelta(days=i*2)
        score = 70 + (i % 4) * 5  # Scores between 70-85
        
        quiz = {
            "quiz_id": f"quiz_{i}",
            "score": score,
            "date": quiz_date,
            "wrong_questions": []
        }
        sample_quizzes.append(quiz)
    
    # Add sample completed topics
    sample_topics = [
        "topic_1", "topic_2", "topic_3", "topic_4", "topic_5",
        "topic_6", "topic_7", "topic_8", "topic_9", "topic_10",
        "topic_11", "topic_12", "topic_13", "topic_14", "topic_15"
    ]
    
    # Update user with sample data
    users_collection.update_one(
        {"_id": user_id},
        {
            "$set": {
                "quiz_history": sample_quizzes,
                "completed_topics": sample_topics,
                "xp": 2500,
                "level": 3,
                "streak_count": 8,
                "last_active_date": datetime.utcnow(),
                "badges": ["First Quiz", "Streak Master", "Speed Learner"]
            }
        }
    )
    
    print("✅ Sample dashboard data added successfully!")
    print(f"   - Added {len(sample_quizzes)} quiz records")
    print(f"   - Added {len(sample_topics)} completed topics")
    print(f"   - Set XP to 2500")
    print(f"   - Set streak to 8 days")
    print(f"   - Added badges: First Quiz, Streak Master, Speed Learner")
    
    # Verify the data
    updated_user = users_collection.find_one({"_id": user_id})
    print(f"\n📊 User Stats:")
    print(f"   - XP: {updated_user.get('xp', 0)}")
    print(f"   - Level: {updated_user.get('level', 1)}")
    print(f"   - Streak: {updated_user.get('streak_count', 0)} days")
    print(f"   - Quizzes: {len(updated_user.get('quiz_history', []))}")
    print(f"   - Topics: {len(updated_user.get('completed_topics', []))}")
    print(f"   - Badges: {len(updated_user.get('badges', []))}")

if __name__ == "__main__":
    add_sample_data()
