#!/usr/bin/env python3
"""
Seed script to populate cert_test_specs collection with sample certification tests
"""
from pymongo import MongoClient
import sys

def seed_cert_tests():
    # Connect to MongoDB
    client = MongoClient("mongodb://localhost:27017/")
    db = client["learnquest"]
    
    # Get collections
    cert_specs = db["cert_test_specs"]
    questions = db["questions"]
    
    # Get sample questions from the questions collection
    python_questions = list(questions.find({"tags": "python"}).limit(3))
    
    if not python_questions:
        print("⚠️  No Python questions found. Creating sample questions...")
        # Create sample questions
        sample_questions = [
            {
                "question_text": "What is React?",
                "options": ["A library", "A framework", "A language", "A database"],
                "correct_answer": "A library",
                "difficulty": "Easy",
                "tags": ["react", "javascript"]
            },
            {
                "question_text": "Which company developed React?",
                "options": ["Google", "Facebook", "Amazon", "Microsoft"],
                "correct_answer": "Facebook",
                "difficulty": "Easy",
                "tags": ["react", "javascript"]
            },
            {
                "question_text": "What is a React Hook?",
                "options": ["A function", "A class", "A component", "A library"],
                "correct_answer": "A function",
                "difficulty": "Medium",
                "tags": ["react", "javascript"]
            }
        ]
        question_ids = []
        for q in sample_questions:
            result = questions.insert_one(q)
            question_ids.append(str(result.inserted_id))
    else:
        question_ids = [str(q["_id"]) for q in python_questions]
    
    # Clear existing cert test specs
    cert_specs.delete_many({})
    
    # Create sample certification test specs
    test_specs = [
        {
            "cert_id": "DEMO-PYTHON",
            "difficulty": "Easy",
            "question_count": 3,
            "duration_minutes": 30,
            "pass_percentage": 70,
            "question_ids": question_ids,
            "prerequisite_course_id": "",
            "restrictions": {
                "copy_paste": False,
                "tab_switching": False,
                "right_click": False,
                "enable_fullscreen": True,
                "enable_proctoring": True
            }
        },
        {
            "cert_id": "DEMO-PYTHON",
            "difficulty": "Medium",
            "question_count": 3,
            "duration_minutes": 45,
            "pass_percentage": 75,
            "question_ids": question_ids,
            "prerequisite_course_id": "",
            "restrictions": {
                "copy_paste": False,
                "tab_switching": False,
                "right_click": False,
                "enable_fullscreen": True,
                "enable_proctoring": True
            }
        },
        {
            "cert_id": "Python Easy",
            "difficulty": "Easy",
            "question_count": 3,
            "duration_minutes": 30,
            "pass_percentage": 70,
            "question_ids": question_ids,
            "prerequisite_course_id": "",
            "restrictions": {
                "copy_paste": False,
                "tab_switching": False,
                "right_click": False,
                "enable_fullscreen": False,
                "enable_proctoring": False
            }
        }
    ]
    
    # Insert test specs
    result = cert_specs.insert_many(test_specs)
    
    print(f"✅ Successfully seeded {len(result.inserted_ids)} certification test specs!")
    print(f"   Question IDs used: {len(question_ids)}")
    
    # Display created specs
    print("\n📋 Created certification tests:")
    for spec in test_specs:
        print(f"   - {spec['cert_id']} ({spec['difficulty']}) - {spec['duration_minutes']} mins")

if __name__ == "__main__":
    try:
        seed_cert_tests()
    except Exception as e:
        print(f"❌ Error seeding cert tests: {e}")
        sys.exit(1)
