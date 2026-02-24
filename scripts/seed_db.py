#!/usr/bin/env python3
"""
Database seeding script for Learn Quest MVP
Creates sample data for users, courses, modules, quizzes, and questions
"""

import os
import sys
from datetime import datetime
from pymongo import MongoClient
from passlib.context import CryptContext
import uuid

# Add the services/api/src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'src'))

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://db:27017")
DB_NAME = os.getenv("MONGO_DB", "learnquest")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Fix for bcrypt version issue in Docker
try:
    import bcrypt
    if not hasattr(bcrypt, '__about__'):
        bcrypt.__about__ = type('obj', (object,), {'__version__': '5.0.0'})()
except ImportError:
    pass

def get_database():
    """Connect to MongoDB and return database instance"""
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]

def hash_password(password: str) -> str:
    """Hash a password using bcrypt (same method as auth system)"""
    import bcrypt
    # Truncate password to 72 bytes to avoid bcrypt limitation
    truncated_password = password[:72]
    # Use bcrypt directly to match the auth system
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(truncated_password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_sample_user(db):
    """Create a sample user with hashed password"""
    users_collection = db.users
    
    # Check if user already exists
    existing_user = users_collection.find_one({"email": "student@learnquest.com"})
    if existing_user:
        # Ensure the sample user is an admin
        if existing_user.get("role") != "admin":
            db.users.update_one({"_id": existing_user["_id"]}, {"$set": {"role": "admin"}})
        print("Sample user already exists")
        return existing_user["_id"]
    
    user_data = {
        "name": "John Student",
        "email": "student@learnquest.com",
        "password": hash_password("pass123"),
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
    print(f"Created sample user: {result.inserted_id}")
    return result.inserted_id

def create_sample_courses(db):
    """Create sample courses with modules"""
    courses_collection = db.courses
    
    # Check if courses already exist
    existing_courses = list(courses_collection.find({}))
    if existing_courses:
        print("Courses already exist, skipping course creation")
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
            },
            {
                "module_id": str(uuid.uuid4()),
                "title": "Control Flow",
                "order": 3,
                "topics": [
                    {
                        "topic_id": str(uuid.uuid4()),
                        "title": "If Statements",
                        "content_url": "/content/python-if"
                    },
                    {
                        "topic_id": str(uuid.uuid4()),
                        "title": "Loops",
                        "content_url": "/content/python-loops"
                    }
                ]
            }
        ],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Data Structures Course
    ds_course = {
        "title": "Data Structures",
        "slug": "data-structures",
        "description": "Master fundamental data structures and algorithms",
        "xp_reward": 150,
        "modules": [
            {
                "module_id": str(uuid.uuid4()),
                "title": "Arrays and Lists",
                "order": 1,
                "topics": [
                    {
                        "topic_id": str(uuid.uuid4()),
                        "title": "Array Basics",
                        "content_url": "/content/arrays-basics"
                    }
                ]
            },
            {
                "module_id": str(uuid.uuid4()),
                "title": "Linked Lists",
                "order": 2,
                "topics": [
                    {
                        "topic_id": str(uuid.uuid4()),
                        "title": "Singly Linked Lists",
                        "content_url": "/content/linked-lists"
                    }
                ]
            }
        ],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Insert courses
    python_result = courses_collection.insert_one(python_course)
    ds_result = courses_collection.insert_one(ds_course)
    
    print(f"Created Python Basics course: {python_result.inserted_id}")
    print(f"Created Data Structures course: {ds_result.inserted_id}")
    
    return python_result.inserted_id, ds_result.inserted_id

def create_sample_quiz(db, course_id, course_title):
    """Create a sample quiz for a course"""
    quizzes_collection = db.quizzes
    
    # Check if quiz already exists for this course
    existing_quiz = quizzes_collection.find_one({"course_id": str(course_id)})
    if existing_quiz:
        print(f"Quiz already exists for {course_title}")
        return existing_quiz["_id"]
    
    quiz_data = {
        "course_id": str(course_id),
        "title": f"{course_title} Quiz",
        "duration_seconds": 1800,  # 30 minutes
        "question_ids": [],
        "xp_reward": 50,
        "created_at": datetime.utcnow()
    }
    
    result = quizzes_collection.insert_one(quiz_data)
    print(f"Created quiz for {course_title}: {result.inserted_id}")
    return result.inserted_id

def create_sample_questions(db, quiz_id, course_id, course_title):
    """Create sample MCQ questions for the quiz and one coding question for Python Basics"""
    quizzes_collection = db.quizzes
    questions_collection = db.questions
    
    # Check if questions already exist for this quiz
    existing_questions = list(questions_collection.find({"quiz_id": str(quiz_id)}))
    if existing_questions:
        print(f"Questions already exist for {course_title} quiz")
        return [q["_id"] for q in existing_questions]
    
    # Different questions based on course
    if course_title == "Python Basics":
        questions = [
            {
                "type": "mcq",
                "course_id": str(course_id),
                "quiz_id": str(quiz_id),
                "prompt": "What is the correct way to declare a variable in Python?",
                "choices": [
                    "var x = 5",
                    "x = 5",
                    "int x = 5",
                    "x := 5"
                ],
                "correct_choice": 1,  # Index 1 is "x = 5"
                "difficulty": "easy",
                "tags": ["variables", "syntax"],
                "created_at": datetime.utcnow()
            },
            {
                "type": "mcq",
                "course_id": str(course_id),
                "quiz_id": str(quiz_id),
                "prompt": "Which of the following is NOT a Python data type?",
                "choices": [
                    "int",
                    "string",
                    "char",
                    "float"
                ],
                "correct_choice": 2,  # Index 2 is "char"
                "difficulty": "easy",
                "tags": ["data-types"],
                "created_at": datetime.utcnow()
            },
            {
                "type": "mcq",
                "course_id": str(course_id),
                "quiz_id": str(quiz_id),
                "prompt": "What does the 'len()' function do in Python?",
                "choices": [
                    "Returns the length of a string or list",
                    "Returns the largest number",
                    "Returns the smallest number",
                    "Returns the sum of numbers"
                ],
                "correct_choice": 0,  # Index 0
                "difficulty": "easy",
                "tags": ["functions", "built-in"],
                "created_at": datetime.utcnow()
            },
            {
                "type": "mcq",
                "course_id": str(course_id),
                "quiz_id": str(quiz_id),
                "prompt": "Which keyword is used to define a function in Python?",
                "choices": [
                    "function",
                    "def",
                    "define",
                    "func"
                ],
                "correct_choice": 1,  # Index 1 is "def"
                "difficulty": "medium",
                "tags": ["functions", "syntax"],
                "created_at": datetime.utcnow()
            },
            {
                "type": "mcq",
                "course_id": str(course_id),
                "quiz_id": str(quiz_id),
                "prompt": "What is the output of: print(3 * 2 + 1)?",
                "choices": [
                    "7",
                    "9",
                    "6",
                    "5"
                ],
                "correct_choice": 0,  # Index 0 is "7"
                "difficulty": "easy",
                "tags": ["operators", "arithmetic"],
                "created_at": datetime.utcnow()
            },
            {
                "type": "code",
                "course_id": str(course_id),
                "quiz_id": str(quiz_id),
                "prompt": "Implement function solve(n) that prints the factorial of n. Read integer n from input and print result without extra text.",
                "code_starter": "def solve(n):\n    # your code here\n    return 1\n\nif __name__ == '__main__':\n    import sys\n    data = sys.stdin.read().strip()\n    n = int(data) if data else 0\n    print(solve(n))\n",
                "test_cases": [
                    {"input": "0\n", "expected_output": "1", "is_hidden": False},
                    {"input": "3\n", "expected_output": "6", "is_hidden": True},
                    {"input": "5\n", "expected_output": "120", "is_hidden": True}
                ],
                "difficulty": "easy",
                "tags": ["functions", "loops"],
                "created_at": datetime.utcnow()
            }
        ]
    else:  # Data Structures course
        questions = [
            {
                "type": "mcq",
                "course_id": str(course_id),
                "quiz_id": str(quiz_id),
                "prompt": "What is the time complexity of accessing an element in an array?",
                "choices": [
                    "O(1)",
                    "O(n)",
                    "O(log n)",
                    "O(n²)"
                ],
                "correct_choice": 0,  # Index 0 is "O(1)"
                "difficulty": "medium",
                "tags": ["arrays", "time-complexity"],
                "created_at": datetime.utcnow()
            },
            {
                "type": "mcq",
                "course_id": str(course_id),
                "quiz_id": str(quiz_id),
                "prompt": "Which data structure follows LIFO (Last In, First Out) principle?",
                "choices": [
                    "Queue",
                    "Stack",
                    "Array",
                    "Linked List"
                ],
                "correct_choice": 1,  # Index 1 is "Stack"
                "difficulty": "easy",
                "tags": ["stack", "data-structures"],
                "created_at": datetime.utcnow()
            },
            {
                "type": "mcq",
                "course_id": str(course_id),
                "quiz_id": str(quiz_id),
                "prompt": "What is the main advantage of a linked list over an array?",
                "choices": [
                    "Faster access time",
                    "Dynamic size",
                    "Less memory usage",
                    "Better cache performance"
                ],
                "correct_choice": 1,  # Index 1 is "Dynamic size"
                "difficulty": "medium",
                "tags": ["linked-list", "arrays", "advantages"],
                "created_at": datetime.utcnow()
            }
        ]
    
    question_ids = []
    for question in questions:
        result = questions_collection.insert_one(question)
        question_ids.append(str(result.inserted_id))
        print(f"Created question: {result.inserted_id}")
    
    # Update quiz with question IDs
    quizzes_collection.update_one(
        {"_id": quiz_id},
        {"$set": {"question_ids": question_ids}}
    )
    
    return question_ids

def main():
    """Main seeding function"""
    print("Starting database seeding...")
    
    try:
        db = get_database()
        print(f"Connected to database: {DB_NAME}")
        
        # Create sample user
        user_id = create_sample_user(db)
        
        # Create sample courses
        course_ids = create_sample_courses(db)
        if len(course_ids) >= 2:
            python_course_id, ds_course_id = course_ids[0], course_ids[1]
        else:
            print("Not enough courses found, skipping quiz creation")
            return
        
        # Create sample quiz for Python course
        python_quiz_id = create_sample_quiz(db, python_course_id, "Python Basics")
        
        # Create sample quiz for Data Structures course
        ds_quiz_id = create_sample_quiz(db, ds_course_id, "Data Structures")
        
        # Create sample questions for Python quiz
        create_sample_questions(db, python_quiz_id, python_course_id, "Python Basics")
        
        # Create sample questions for Data Structures quiz
        create_sample_questions(db, ds_quiz_id, ds_course_id, "Data Structures")
        
        print("\n✅ Database seeding completed successfully!")
        print(f"📊 Created:")
        print(f"  - 1 user (student@learnquest.com / password123)")
        print(f"  - 2 courses (Python Basics, Data Structures)")
        print(f"  - 2 quizzes with questions")
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
