#!/usr/bin/env python3
"""
Seed script for Learn Quest with practice problems and comprehensive test data.
"""

import os
import sys
import json
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson import ObjectId
from passlib.context import CryptContext

# Add the parent directory to the path so we can import from services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Database connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB", "learnquest")

def get_database():
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]

def get_collection(collection_name):
    db = get_database()
    return db[collection_name]

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_sample_users():
    """Create sample users for testing"""
    users = get_collection("users")
    
    # Clear existing users
    users.delete_many({})
    
    # Create admin user
    admin_password = pwd_context.hash("admin123")
    admin_user = {
        "_id": ObjectId(),
        "email": "admin@learnquest.com",
        "password": admin_password,
        "name": "Admin User",
        "role": "admin",
        "xp": 0,
        "level": 1,
        "streak_count": 0,
        "last_activity": datetime.utcnow(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    users.insert_one(admin_user)
    
    # Create student user
    student_password = pwd_context.hash("password123")
    student_user = {
        "_id": ObjectId(),
        "email": "student@learnquest.com",
        "password": student_password,
        "name": "Test Student",
        "role": "student",
        "xp": 150,
        "level": 2,
        "streak_count": 3,
        "last_activity": datetime.utcnow(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    users.insert_one(student_user)
    
    print("✅ Created sample users")

def create_sample_courses():
    """Create sample courses with practice problems"""
    courses = get_collection("courses")
    
    # Clear existing courses
    courses.delete_many({})
    
    # Python Programming Course
    python_course = {
        "_id": ObjectId(),
        "title": "Python Programming Mastery",
        "slug": "python-programming",
        "description": "Master Python programming from basics to advanced concepts",
        "instructor": "Dr. Sarah Johnson",
        "duration": "8 weeks",
        "level": "Beginner to Intermediate",
        "price": 99.99,
        "rating": 4.8,
        "students_count": 1250,
        "image_url": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=500",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "modules": [
            {
                "module_id": "module_1",
                "title": "Python Fundamentals",
                "description": "Learn the basics of Python programming",
                "duration": "2 weeks",
                "topics": [
                    {
                        "topic_id": "topic_1_1",
                        "title": "Variables and Data Types",
                        "description": "Understanding Python variables and data types",
                        "duration": "30 minutes",
                        "xp_reward": 50,
                        "cards": [
                            {
                                "card_id": "card_1_1_1",
                                "type": "theory",
                                "content": "Python Variables and Data Types",
                                "explanation": "In Python, variables are containers for storing data values. Python has several built-in data types including integers, floats, strings, booleans, lists, tuples, and dictionaries.",
                                "order": 1
                            },
                            {
                                "card_id": "card_1_1_2",
                                "type": "mcq",
                                "content": "What is the correct way to declare a variable in Python?",
                                "choices": [
                                    "var name = 'John'",
                                    "name = 'John'",
                                    "String name = 'John'",
                                    "name := 'John'"
                                ],
                                "correct_choice_index": 1,
                                "explanation": "In Python, you don't need to declare variables with a type. Simply assign a value using the = operator.",
                                "order": 2
                            },
                            {
                                "card_id": "card_1_1_3",
                                "type": "code",
                                "content": "Create a variable called 'age' and assign it the value 25",
                                "starter_code": "# Create a variable called 'age' and assign it the value 25\n",
                                "test_cases": [
                                    {
                                        "input": "",
                                        "expected_output": "25"
                                    }
                                ],
                                "order": 3
                            }
                        ]
                    }
                ]
            },
            {
                "module_id": "module_2",
                "title": "Data Structures and Algorithms",
                "description": "Master Python data structures and algorithm implementation",
                "duration": "3 weeks",
                "topics": [
                    {
                        "topic_id": "topic_2_1",
                        "title": "Arrays and Lists",
                        "description": "Working with Python lists and arrays",
                        "duration": "45 minutes",
                        "xp_reward": 75,
                        "cards": [
                            {
                                "card_id": "card_2_1_1",
                                "type": "theory",
                                "content": "Python Lists",
                                "explanation": "Lists in Python are ordered, mutable collections that can hold items of different data types. They are one of the most versatile data structures in Python.",
                                "order": 1
                            },
                            {
                                "card_id": "card_2_1_2",
                                "type": "mcq",
                                "content": "Which method is used to add an element to the end of a list?",
                                "choices": [
                                    "list.insert()",
                                    "list.append()",
                                    "list.add()",
                                    "list.push()"
                                ],
                                "correct_choice_index": 1,
                                "explanation": "The append() method adds an element to the end of a list.",
                                "order": 2
                            }
                        ]
                    }
                ]
            }
        ]
    }
    
    # Add practice problems to the course
    practice_problems = [
        {
            "card_id": "practice_1",
            "type": "code",
            "content": "Two Sum Problem",
            "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nExample:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].",
            "difficulty": "Easy",
            "tags": ["Array", "Hash Table"],
            "is_practice_problem": True,
            "starter_code": "def two_sum(nums, target):\n    # Your code here\n    pass",
            "test_cases": [
                {
                    "input": "nums = [2,7,11,15], target = 9",
                    "expected_output": "[0,1]"
                },
                {
                    "input": "nums = [3,2,4], target = 6",
                    "expected_output": "[1,2]"
                },
                {
                    "input": "nums = [3,3], target = 6",
                    "expected_output": "[0,1]"
                }
            ],
            "order": 1
        },
        {
            "card_id": "practice_2",
            "type": "code",
            "content": "Reverse String",
            "description": "Write a function that reverses a string. The input string is given as an array of characters s.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.\n\nExample:\nInput: s = [\"h\",\"e\",\"l\",\"l\",\"o\"]\nOutput: [\"o\",\"l\",\"l\",\"e\",\"h\"]",
            "difficulty": "Easy",
            "tags": ["Two Pointers", "String"],
            "is_practice_problem": True,
            "starter_code": "def reverse_string(s):\n    # Your code here\n    pass",
            "test_cases": [
                {
                    "input": "s = [\"h\",\"e\",\"l\",\"l\",\"o\"]",
                    "expected_output": "[\"o\",\"l\",\"l\",\"e\",\"h\"]"
                },
                {
                    "input": "s = [\"H\",\"a\",\"n\",\"n\",\"a\",\"h\"]",
                    "expected_output": "[\"h\",\"a\",\"n\",\"n\",\"a\",\"H\"]"
                }
            ],
            "order": 2
        },
        {
            "card_id": "practice_3",
            "type": "code",
            "content": "Valid Parentheses",
            "description": "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.\n\nExample:\nInput: s = \"()\"\nOutput: true",
            "difficulty": "Easy",
            "tags": ["String", "Stack"],
            "is_practice_problem": True,
            "starter_code": "def is_valid(s):\n    # Your code here\n    pass",
            "test_cases": [
                {
                    "input": "s = \"()\"",
                    "expected_output": "True"
                },
                {
                    "input": "s = \"()[]{}\"",
                    "expected_output": "True"
                },
                {
                    "input": "s = \"(]\"",
                    "expected_output": "False"
                }
            ],
            "order": 3
        },
        {
            "card_id": "practice_4",
            "type": "code",
            "content": "Maximum Subarray",
            "description": "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.\n\nExample:\nInput: nums = [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6\nExplanation: [4,-1,2,1] has the largest sum = 6.",
            "difficulty": "Medium",
            "tags": ["Array", "Dynamic Programming"],
            "is_practice_problem": True,
            "starter_code": "def max_subarray(nums):\n    # Your code here\n    pass",
            "test_cases": [
                {
                    "input": "nums = [-2,1,-3,4,-1,2,1,-5,4]",
                    "expected_output": "6"
                },
                {
                    "input": "nums = [1]",
                    "expected_output": "1"
                },
                {
                    "input": "nums = [5,4,-1,7,8]",
                    "expected_output": "23"
                }
            ],
            "order": 4
        },
        {
            "card_id": "practice_5",
            "type": "code",
            "content": "Binary Tree Inorder Traversal",
            "description": "Given the root of a binary tree, return the inorder traversal of its nodes' values.\n\nExample:\nInput: root = [1,null,2,3]\nOutput: [1,3,2]",
            "difficulty": "Easy",
            "tags": ["Tree", "Depth-First Search"],
            "is_practice_problem": True,
            "starter_code": "def inorder_traversal(root):\n    # Your code here\n    pass",
            "test_cases": [
                {
                    "input": "root = [1,null,2,3]",
                    "expected_output": "[1,3,2]"
                },
                {
                    "input": "root = []",
                    "expected_output": "[]"
                },
                {
                    "input": "root = [1]",
                    "expected_output": "[1]"
                }
            ],
            "order": 5
        }
    ]
    
    # Add practice problems to a new module
    practice_module = {
        "module_id": "module_practice",
        "title": "Practice Problems",
        "description": "LeetCode-style coding challenges to sharpen your skills",
        "duration": "Ongoing",
        "topics": [
            {
                "topic_id": "topic_practice",
                "title": "Coding Challenges",
                "description": "Solve real-world coding problems",
                "duration": "Variable",
                "xp_reward": 100,
                "cards": practice_problems
            }
        ]
    }
    
    python_course["modules"].append(practice_module)
    courses.insert_one(python_course)
    
    # JavaScript Course
    js_course = {
        "_id": ObjectId(),
        "title": "JavaScript Fundamentals",
        "slug": "javascript-fundamentals",
        "description": "Learn JavaScript from scratch with hands-on projects",
        "instructor": "Mike Chen",
        "duration": "6 weeks",
        "level": "Beginner",
        "price": 79.99,
        "rating": 4.6,
        "students_count": 890,
        "image_url": "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=500",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "modules": [
            {
                "module_id": "module_js_1",
                "title": "JavaScript Basics",
                "description": "Introduction to JavaScript programming",
                "duration": "2 weeks",
                "topics": [
                    {
                        "topic_id": "topic_js_1_1",
                        "title": "Variables and Functions",
                        "description": "Understanding JavaScript variables and functions",
                        "duration": "30 minutes",
                        "xp_reward": 50,
                        "cards": [
                            {
                                "card_id": "card_js_1_1_1",
                                "type": "theory",
                                "content": "JavaScript Variables",
                                "explanation": "JavaScript variables are declared using var, let, or const. Each has different scoping rules and mutability.",
                                "order": 1
                            }
                        ]
                    }
                ]
            }
        ]
    }
    courses.insert_one(js_course)
    
    print("✅ Created sample courses with practice problems")

def create_sample_quizzes():
    """Create sample quizzes"""
    quizzes = get_collection("quizzes")
    
    # Clear existing quizzes
    quizzes.delete_many({})
    
    quiz = {
        "_id": ObjectId(),
        "title": "Python Fundamentals Quiz",
        "description": "Test your knowledge of Python basics",
        "course_id": "python-programming",
        "duration": 30,  # minutes
        "total_questions": 5,
        "passing_score": 70,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "questions": [
            {
                "question_id": "q1",
                "question": "What is the correct way to create a list in Python?",
                "type": "mcq",
                "options": [
                    "list = []",
                    "list = new List()",
                    "list = Array()",
                    "list = list()"
                ],
                "correct_answer": 0,
                "explanation": "In Python, you create a list using square brackets [] or the list() constructor."
            },
            {
                "question_id": "q2",
                "question": "Which keyword is used to define a function in Python?",
                "type": "mcq",
                "options": [
                    "function",
                    "def",
                    "func",
                    "define"
                ],
                "correct_answer": 1,
                "explanation": "The 'def' keyword is used to define functions in Python."
            }
        ]
    }
    quizzes.insert_one(quiz)
    
    print("✅ Created sample quizzes")

def main():
    """Main seeding function"""
    print("🌱 Starting database seeding...")
    
    try:
        # Test database connection
        db = get_database()
        db.command('ping')
        print("✅ Database connection successful")
        
        # Create collections and seed data
        create_sample_users()
        create_sample_courses()
        create_sample_quizzes()
        
        print("\n🎉 Database seeding completed successfully!")
        print("\n📋 Sample accounts created:")
        print("   Admin: admin@learnquest.com / admin123")
        print("   Student: student@learnquest.com / password123")
        print("\n🚀 You can now start the application and test the features!")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
