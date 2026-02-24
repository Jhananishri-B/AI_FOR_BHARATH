#!/usr/bin/env python3
"""
Script to populate the database with realistic user data for leaderboard testing.
Creates users with varied XP, quiz history, and learning progress.
"""

import os
import sys
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.api.src.database import get_collection
from services.api.src.auth import get_password_hash
import bson

# Sample user data with realistic names and profiles
SAMPLE_USERS = [
    {"name": "Alex Chen", "email": "alex.chen@example.com", "role": "student"},
    {"name": "Sarah Johnson", "email": "sarah.johnson@example.com", "role": "student"},
    {"name": "Mike Rodriguez", "email": "mike.rodriguez@example.com", "role": "student"},
    {"name": "Emma Wilson", "email": "emma.wilson@example.com", "role": "student"},
    {"name": "David Kim", "email": "david.kim@example.com", "role": "student"},
    {"name": "Lisa Zhang", "email": "lisa.zhang@example.com", "role": "student"},
    {"name": "James Brown", "email": "james.brown@example.com", "role": "student"},
    {"name": "Anna Garcia", "email": "anna.garcia@example.com", "role": "student"},
    {"name": "Tom Anderson", "email": "tom.anderson@example.com", "role": "student"},
    {"name": "Maria Lopez", "email": "maria.lopez@example.com", "role": "student"},
    {"name": "Kevin Park", "email": "kevin.park@example.com", "role": "student"},
    {"name": "Rachel Green", "email": "rachel.green@example.com", "role": "student"},
    {"name": "Chris Taylor", "email": "chris.taylor@example.com", "role": "student"},
    {"name": "Sophie Martin", "email": "sophie.martin@example.com", "role": "student"},
    {"name": "Ryan Murphy", "email": "ryan.murphy@example.com", "role": "student"},
    {"name": "Jessica Lee", "email": "jessica.lee@example.com", "role": "student"},
    {"name": "Daniel White", "email": "daniel.white@example.com", "role": "student"},
    {"name": "Amanda Davis", "email": "amanda.davis@example.com", "role": "student"},
    {"name": "Brandon Scott", "email": "brandon.scott@example.com", "role": "student"},
    {"name": "Nicole Adams", "email": "nicole.adams@example.com", "role": "student"},
    {"name": "Tyler Wilson", "email": "tyler.wilson@example.com", "role": "student"},
    {"name": "Megan Thompson", "email": "megan.thompson@example.com", "role": "student"},
    {"name": "Jordan Miller", "email": "jordan.miller@example.com", "role": "student"},
    {"name": "Kayla Turner", "email": "kayla.turner@example.com", "role": "student"},
    {"name": "Cameron Hall", "email": "cameron.hall@example.com", "role": "student"},
    {"name": "Destiny Young", "email": "destiny.young@example.com", "role": "student"},
    {"name": "Austin King", "email": "austin.king@example.com", "role": "student"},
    {"name": "Samantha Wright", "email": "samantha.wright@example.com", "role": "student"},
    {"name": "Logan Clark", "email": "logan.clark@example.com", "role": "student"},
    {"name": "Brittany Lewis", "email": "brittany.lewis@example.com", "role": "student"},
]

# Badge options
BADGE_OPTIONS = [
    "Speed Learner", "Code Master", "Streak King", "Algorithm Expert", 
    "Problem Solver", "Data Structures Pro", "Quick Learner", "Consistent Coder",
    "Team Player", "Python Master", "JavaScript Expert", "Frontend Pro",
    "Backend Developer", "Full Stack", "Mobile Dev", "AI Enthusiast",
    "Database Guru", "Security Expert", "DevOps Master", "Cloud Architect"
]

# Course IDs (these should match existing courses)
COURSE_IDS = [
    "68f7ba8b531b6a649806df0d",  # Python for Beginners
    "68f87f7629f86830b07c877a",  # Practical Machine Learning
    "68f8981d1515e67cdf472464",  # Python Intermediate
    "68f8b5aa929f4cb9a87b5102",  # C Programming Basics
    "68f8f8d6264227b77d6caf8c",  # Data Structures for Beginners
    "68f90112264227b77d6caf8d",  # Intermediate DSA with Python
]

def generate_quiz_history(days_back: int = 90) -> List[Dict[str, Any]]:
    """Generate realistic quiz history for a user"""
    quiz_history = []
    now = datetime.utcnow()
    
    # Generate 5-50 quizzes over the past days_back days
    num_quizzes = random.randint(5, 50)
    
    for _ in range(num_quizzes):
        # Random date within the past days_back days
        days_ago = random.randint(0, days_back)
        quiz_date = now - timedelta(days=days_ago)
        
        # Generate realistic score (60-100, with some perfect scores)
        if random.random() < 0.1:  # 10% chance of perfect score
            score = 100
        else:
            score = random.randint(60, 99)
        
        # Generate wrong questions (0-5 questions wrong)
        wrong_questions = []
        num_wrong = random.randint(0, 5)
        for _ in range(num_wrong):
            wrong_questions.append({
                "q_id": str(bson.ObjectId()),
                "user_answer": "incorrect",
                "correct_answer": "correct"
            })
        
        quiz_history.append({
            "quiz_id": str(bson.ObjectId()),
            "score": score,
            "date": quiz_date,
            "wrong_questions": wrong_questions,
            "time_taken": random.randint(300, 1800),  # 5-30 minutes
            "difficulty": random.choice(["easy", "medium", "hard"])
        })
    
    # Sort by date (oldest first)
    quiz_history.sort(key=lambda x: x["date"])
    return quiz_history

def generate_completed_topics() -> List[str]:
    """Generate completed topics for a user"""
    # Generate 5-30 completed topics
    num_topics = random.randint(5, 30)
    completed_topics = []
    
    for _ in range(num_topics):
        completed_topics.append(str(bson.ObjectId()))
    
    return completed_topics

def generate_badges(xp: int, streak: int, quizzes: int) -> List[str]:
    """Generate badges based on user achievements"""
    badges = []
    
    if xp >= 1000:
        badges.append("XP Collector")
    if xp >= 5000:
        badges.append("XP Master")
    if streak >= 7:
        badges.append("Week Warrior")
    if streak >= 30:
        badges.append("Streak King")
    if quizzes >= 10:
        badges.append("Quiz Master")
    if quizzes >= 50:
        badges.append("Quiz Legend")
    
    # Add random badges
    available_badges = [b for b in BADGE_OPTIONS if b not in badges]
    num_random_badges = random.randint(0, min(3, len(available_badges)))
    badges.extend(random.sample(available_badges, num_random_badges))
    
    return badges

def calculate_level(xp: int) -> int:
    """Calculate user level based on XP"""
    # Simple level calculation: every 1000 XP = 1 level
    return max(1, xp // 1000 + 1)

def generate_user_data(user_info: Dict[str, str]) -> Dict[str, Any]:
    """Generate complete user data for a single user"""
    # Generate XP (0-20000)
    xp = random.randint(0, 20000)
    
    # Generate quiz history
    quiz_history = generate_quiz_history()
    
    # Calculate streak (0-50 days)
    streak_count = random.randint(0, 50)
    
    # Generate completed topics
    completed_topics = generate_completed_topics()
    
    # Generate badges
    badges = generate_badges(xp, streak_count, len(quiz_history))
    
    # Calculate level
    level = calculate_level(xp)
    
    # Generate join date (30-365 days ago)
    join_days_ago = random.randint(30, 365)
    join_date = datetime.utcnow() - timedelta(days=join_days_ago)
    
    # Generate last active date (0-7 days ago)
    last_active_days_ago = random.randint(0, 7)
    last_active_date = datetime.utcnow() - timedelta(days=last_active_days_ago)
    
    # Generate enrolled courses
    num_enrolled = random.randint(1, min(4, len(COURSE_IDS)))
    enrolled_courses = random.sample(COURSE_IDS, num_enrolled)
    
    # Generate completed modules
    completed_modules = []
    if random.random() < 0.3:  # 30% chance of completing a module
        completed_modules.append(str(bson.ObjectId()))
    
    return {
        "name": user_info["name"],
        "email": user_info["email"],
        "password_hash": get_password_hash("password123"),  # Default password
        "role": user_info["role"],
        "xp": xp,
        "level": level,
        "streak_count": streak_count,
        "badges": badges,
        "quiz_history": quiz_history,
        "completed_topics": completed_topics,
        "completed_modules": completed_modules,
        "enrolled_courses": enrolled_courses,
        "created_at": join_date,
        "last_active_date": last_active_date,
        "avatar_url": None
    }

def populate_users():
    """Populate the database with realistic user data"""
    print("🚀 Populating database with realistic user data...")
    
    # Get users collection
    users_collection = get_collection("users")
    
    # Clear existing users (except admin)
    print("  → Clearing existing users (except admin)...")
    users_collection.delete_many({"role": {"$ne": "admin"}})
    
    # Generate and insert users
    print(f"  → Creating {len(SAMPLE_USERS)} realistic users...")
    
    users_data = []
    for user_info in SAMPLE_USERS:
        user_data = generate_user_data(user_info)
        users_data.append(user_data)
    
    # Insert all users
    result = users_collection.insert_many(users_data)
    print(f"  → Inserted {len(result.inserted_ids)} users")
    
    # Display sample of created users
    print("\n📊 Sample of created users:")
    sample_users = list(users_collection.find().limit(5))
    for user in sample_users:
        print(f"  • {user['name']} - Level {user['level']}, {user['xp']} XP, {len(user.get('quiz_history', []))} quizzes")
    
    print("\n✅ Realistic user data population completed!")
    print(f"   Total users: {users_collection.count_documents({})}")
    print(f"   Students: {users_collection.count_documents({'role': 'student'})}")
    print(f"   Admins: {users_collection.count_documents({'role': 'admin'})}")

if __name__ == "__main__":
    populate_users()
