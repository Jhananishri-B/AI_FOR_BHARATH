#!/usr/bin/env python3
"""
Seed 10-15 practice problems linked to existing courses and topics.
Links each problem with course_id and topic_id so GNN and AI coach can reason about them.
"""

import os
import sys
from datetime import datetime
import random
from pymongo import MongoClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB", "learnquest")

def get_db():
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]

def pick_topics(db):
    courses = list(db.courses.find({}))
    topic_refs = []
    for c in courses:
        for m in c.get('modules', []):
            for t in m.get('topics', []):
                topic_refs.append({
                    'course_id': str(c['_id']),
                    'topic_id': t.get('topic_id'),
                    'topic_title': t.get('title', 'Topic')
                })
    return topic_refs

def main():
    db = get_db()
    topic_refs = pick_topics(db)
    if not topic_refs:
        print("No topics found. Create courses/modules/topics first.")
        return

    questions = db.questions
    existing = questions.count_documents({"seed_tag": "practice_seed_v1"})
    if existing >= 10:
        print("Practice problems already seeded.")
        return

    problem_specs = [
        ("Two Sum", "Given an array and a target, return indices of numbers that add up to target.", [
            {"input": "4\n2 7 11 15\n9\n", "expected_output": "0 1", "is_hidden": False},
        ]),
        ("Valid Palindrome", "Check if a string is a palindrome ignoring non-alphanumeric and case.", [
            {"input": "A man, a plan, a canal: Panama\n", "expected_output": "true", "is_hidden": False},
        ]),
        ("Fibonacci", "Print n-th Fibonacci number (0-indexed, fib(0)=0,fib(1)=1).", [
            {"input": "5\n", "expected_output": "5", "is_hidden": False},
        ]),
        ("Factorial", "Compute factorial of n.", [
            {"input": "5\n", "expected_output": "120", "is_hidden": False},
        ]),
        ("Reverse String", "Reverse the given string.", [
            {"input": "hello\n", "expected_output": "olleh", "is_hidden": False},
        ]),
        ("Anagram Check", "Check if two strings are anagrams.", [
            {"input": "listen\nsilent\n", "expected_output": "true", "is_hidden": False},
        ]),
        ("Max Subarray Sum", "Kadane's algorithm to find maximum subarray sum.", [
            {"input": "5\n-2 1 -3 4 -1\n", "expected_output": "4", "is_hidden": False},
        ]),
        ("Count Vowels", "Count vowels in a string.", [
            {"input": "education\n", "expected_output": "5", "is_hidden": False},
        ]),
        ("Unique Elements", "Return number of unique elements.", [
            {"input": "6\n1 2 2 3 4 4\n", "expected_output": "4", "is_hidden": False},
        ]),
        ("Matrix Diagonal Sum", "Sum of primary diagonal.", [
            {"input": "3\n1 2 3\n4 5 6\n7 8 9\n", "expected_output": "15", "is_hidden": False},
        ]),
        ("Valid Parentheses", "Check if parentheses string is valid.", [
            {"input": "()[]{}\n", "expected_output": "true", "is_hidden": False},
        ]),
        ("First Non-Repeating", "First non-repeating character index.", [
            {"input": "leetcode\n", "expected_output": "0", "is_hidden": False},
        ]),
        ("Merge Two Sorted Lists", "Merge two sorted lists.", [
            {"input": "3\n1 3 5\n3\n2 4 6\n", "expected_output": "1 2 3 4 5 6", "is_hidden": False},
        ]),
        ("Binary Search", "Find index of target in sorted array.", [
            {"input": "5\n1 3 5 7 9\n7\n", "expected_output": "3", "is_hidden": False},
        ]),
        ("Two Pointers Sum <= K", "Count pairs with sum <= K.", [
            {"input": "4\n1 2 3 4\n5\n", "expected_output": "4", "is_hidden": False},
        ]),
    ]

    titles = [t for t, _, _ in problem_specs]
    random.shuffle(topic_refs)

    created = 0
    for idx, (title, prompt, tests) in enumerate(problem_specs):
        if created >= 15:
            break
        topic = topic_refs[idx % len(topic_refs)]
        doc = {
            "type": "code",
            "title": title,
            "prompt": prompt,
            "course_id": topic['course_id'],
            "topic_id": topic['topic_id'],
            "topic_name": topic.get('topic_title'),
            "difficulty": random.choice(["easy", "medium"]),
            "tags": [topic.get('topic_title', 'general')],
            "code_starter": "def solve():\n    pass\n\nif __name__ == '__main__':\n    print('')\n",
            "test_cases": tests,
            "created_at": datetime.utcnow(),
            "seed_tag": "practice_seed_v1"
        }
        questions.insert_one(doc)
        created += 1

    print(f"Created {created} practice problems linked to courses/topics.")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Seed script to add demo practice problems to the Learn Quest platform.
"""

import os
import sys
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
import uuid

# Add the services/api/src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'src'))

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://db:27017")
DB_NAME = os.getenv("MONGO_DB", "learnquest")

def get_database():
    """Connect to MongoDB and return database instance"""
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]

def add_practice_problems():
    """Add demo practice problems to the questions collection"""
    db = get_database()
    questions = db.questions
    courses = db.courses
    
    # Find the Python Basics course to get its ID
    python_course = courses.find_one({"slug": "python-basics"})
    if not python_course:
        print("Python Basics course not found")
        return
    
    course_id = str(python_course["_id"])
    
    # Add practice problems to the questions collection
    practice_problems = [
        {
            "type": "code",
            "course_id": course_id,
            "quiz_id": None,  # Practice problems don't belong to a quiz
            "prompt": "Two Sum - Find two numbers that add up to a target",
            "code_starter": "def two_sum(nums, target):\n    # Your code here\n    pass\n\n# Test your function\nif __name__ == '__main__':\n    import sys\n    data = sys.stdin.read().strip()\n    lines = data.split('\\n')\n    nums = list(map(int, lines[0].split()))\n    target = int(lines[1])\n    result = two_sum(nums, target)\n    print(' '.join(map(str, result)))",
            "test_cases": [
                {
                    "input": "2 7 11 15\n9",
                    "expected_output": "0 1",
                    "is_hidden": False
                },
                {
                    "input": "3 2 4\n6",
                    "expected_output": "1 2",
                    "is_hidden": False
                },
                {
                    "input": "3 3\n6",
                    "expected_output": "0 1",
                    "is_hidden": True
                }
            ],
            "difficulty": "easy",
            "tags": ["arrays", "hash-table"],
            "xp_reward": 15,
            "is_practice_problem": True,
            "explanation": "Use a hash map to store numbers and their indices. For each number, check if target - number exists in the map.",
            "created_at": datetime.utcnow()
        },
        {
            "type": "code",
            "course_id": course_id,
            "quiz_id": None,
            "prompt": "Reverse String - Reverse a string in-place",
            "code_starter": "def reverse_string(s):\n    # Your code here\n    pass\n\n# Test your function\nif __name__ == '__main__':\n    import sys\n    s = sys.stdin.read().strip()\n    reverse_string(s)\n    print(s)",
            "test_cases": [
                {
                    "input": "hello",
                    "expected_output": "olleh",
                    "is_hidden": False
                },
                {
                    "input": "abcd",
                    "expected_output": "dcba",
                    "is_hidden": False
                },
                {
                    "input": "a",
                    "expected_output": "a",
                    "is_hidden": True
                }
            ],
            "difficulty": "easy",
            "tags": ["two-pointers", "string"],
            "xp_reward": 10,
            "is_practice_problem": True,
            "explanation": "Use two pointers, one at the start and one at the end. Swap characters and move pointers towards the center.",
            "created_at": datetime.utcnow()
        },
        {
            "type": "code",
            "course_id": course_id,
            "quiz_id": None,
            "prompt": "Valid Parentheses - Check if parentheses are balanced",
            "code_starter": "def is_valid(s):\n    # Your code here\n    pass\n\n# Test your function\nif __name__ == '__main__':\n    import sys\n    s = sys.stdin.read().strip()\n    result = is_valid(s)\n    print('true' if result else 'false')",
            "test_cases": [
                {
                    "input": "()",
                    "expected_output": "true",
                    "is_hidden": False
                },
                {
                    "input": "()[]{}",
                    "expected_output": "true",
                    "is_hidden": False
                },
                {
                    "input": "(]",
                    "expected_output": "false",
                    "is_hidden": False
                },
                {
                    "input": "([)]",
                    "expected_output": "false",
                    "is_hidden": True
                }
            ],
            "difficulty": "easy",
            "tags": ["stack", "string"],
            "xp_reward": 12,
            "is_practice_problem": True,
            "explanation": "Use a stack to keep track of opening brackets. When you encounter a closing bracket, check if it matches the most recent opening bracket.",
            "created_at": datetime.utcnow()
        },
        {
            "type": "code",
            "course_id": course_id,
            "quiz_id": None,
            "prompt": "Maximum Subarray - Find the contiguous subarray with maximum sum",
            "code_starter": "def max_subarray(nums):\n    # Your code here\n    pass\n\n# Test your function\nif __name__ == '__main__':\n    import sys\n    data = sys.stdin.read().strip()\n    nums = list(map(int, data.split()))\n    result = max_subarray(nums)\n    print(result)",
            "test_cases": [
                {
                    "input": "-2 1 -3 4 -1 2 1 -5 4",
                    "expected_output": "6",
                    "is_hidden": False
                },
                {
                    "input": "1",
                    "expected_output": "1",
                    "is_hidden": False
                },
                {
                    "input": "5 4 -1 7 8",
                    "expected_output": "23",
                    "is_hidden": True
                }
            ],
            "difficulty": "medium",
            "tags": ["array", "divide-and-conquer", "dynamic-programming"],
            "xp_reward": 20,
            "is_practice_problem": True,
            "explanation": "Use Kadane's algorithm. Keep track of the maximum sum ending at each position and the global maximum sum.",
            "created_at": datetime.utcnow()
        },
        {
            "type": "code",
            "course_id": course_id,
            "quiz_id": None,
            "prompt": "Binary Tree Inorder Traversal - Traverse a binary tree in-order",
            "code_starter": "def inorder_traversal(root):\n    # Your code here\n    pass\n\n# Test your function\nif __name__ == '__main__':\n    import sys\n    # This is a simplified test - in practice you'd build the tree from input\n    data = sys.stdin.read().strip()\n    # For demo purposes, assume input is a list of values\n    values = data.split() if data else []\n    result = inorder_traversal(values)\n    print(' '.join(map(str, result)))",
            "test_cases": [
                {
                    "input": "1 null 2 3",
                    "expected_output": "1 3 2",
                    "is_hidden": False
                },
                {
                    "input": "",
                    "expected_output": "",
                    "is_hidden": False
                },
                {
                    "input": "1",
                    "expected_output": "1",
                    "is_hidden": True
                }
            ],
            "difficulty": "easy",
            "tags": ["stack", "tree", "depth-first-search"],
            "xp_reward": 15,
            "is_practice_problem": True,
            "explanation": "In-order traversal: left subtree, root, right subtree. Use recursion or a stack to implement.",
            "created_at": datetime.utcnow()
        }
    ]
    
    # Insert practice problems into the questions collection
    for problem in practice_problems:
        questions.insert_one(problem)
    
    print(f"✅ Added {len(practice_problems)} practice problems to the questions collection")

def main():
    """Main function"""
    print("Starting practice problems seeding...")
    
    try:
        add_practice_problems()
        print("✅ Practice problems seeding completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
