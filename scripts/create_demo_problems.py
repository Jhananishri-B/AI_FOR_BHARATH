#!/usr/bin/env python3
"""
Create sample coding problems for certification test
"""
from pymongo import MongoClient
import os

mongo_url = os.getenv('MONGO_URL')
client = MongoClient(mongo_url)
db = client['learnquest']

print("Creating sample coding problems...")

# Create sample coding problems with proper test case structure
coding_problems = [
    {
        "title": "Two Sum",
        "prompt": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
        "content": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        "difficulty": "easy",
        "tags": ["array", "hash-table"],
        "constraints": "• 2 <= nums.length <= 10^4\n• -10^9 <= nums[i] <= 10^9\n• -10^9 <= target <= 10^9\n• Only one valid answer exists.",
        "examples": [
            {
                "input": "nums = [2,7,11,15], target = 9",
                "output": "[0,1]",
                "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
            },
            {
                "input": "nums = [3,2,4], target = 6",
                "output": "[1,2]",
                "explanation": "Because nums[1] + nums[2] == 6, we return [1, 2]."
            }
        ],
        "public_test_cases": [
            {"input": "[2,7,11,15]\n9", "expected_output": "[0, 1]", "is_hidden": False},
            {"input": "[3,2,4]\n6", "expected_output": "[1, 2]", "is_hidden": False}
        ],
        "hidden_test_cases": [
            {"input": "[3,3]\n6", "expected_output": "[0, 1]", "is_hidden": True},
            {"input": "[1,2,3,4,5]\n9", "expected_output": "[3, 4]", "is_hidden": True}
        ],
        "starter_code": "def two_sum(nums, target):\n    # Write your code here\n    pass"
    },
    {
        "title": "Reverse String",
        "prompt": "Write a function that reverses a string. The input string is given as an array of characters s.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.",
        "content": "Write a function that reverses a string.",
        "difficulty": "easy",
        "tags": ["string", "two-pointers"],
        "constraints": "• 1 <= s.length <= 10^5\n• s[i] is a printable ascii character.",
        "examples": [
            {
                "input": 's = ["h","e","l","l","o"]',
                "output": '["o","l","l","e","h"]',
                "explanation": "Reverse the string."
            }
        ],
        "public_test_cases": [
            {"input": '["h","e","l","l","o"]', "expected_output": '["o","l","l","e","h"]', "is_hidden": False}
        ],
        "hidden_test_cases": [
            {"input": '["H","a","n","n","a","h"]', "expected_output": '["h","a","n","n","a","H"]', "is_hidden": True},
            {"input": '["A"]', "expected_output": '["A"]', "is_hidden": True}
        ],
        "starter_code": "def reverse_string(s):\n    # Write your code here\n    pass"
    },
    {
        "title": "FizzBuzz",
        "prompt": "Given an integer n, return a string array answer (1-indexed) where:\n\n• answer[i] == 'FizzBuzz' if i is divisible by 3 and 5.\n• answer[i] == 'Fizz' if i is divisible by 3.\n• answer[i] == 'Buzz' if i is divisible by 5.\n• answer[i] == i (as a string) if none of the above conditions are true.",
        "content": "Classic FizzBuzz problem",
        "difficulty": "easy",
        "tags": ["math", "string"],
        "constraints": "• 1 <= n <= 10^4",
        "examples": [
            {
                "input": "n = 3",
                "output": '["1","2","Fizz"]',
                "explanation": ""
            },
            {
                "input": "n = 5",
                "output": '["1","2","Fizz","4","Buzz"]',
                "explanation": ""
            }
        ],
        "public_test_cases": [
            {"input": "3", "expected_output": '["1","2","Fizz"]', "is_hidden": False},
            {"input": "5", "expected_output": '["1","2","Fizz","4","Buzz"]', "is_hidden": False}
        ],
        "hidden_test_cases": [
            {"input": "15", "expected_output": '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]', "is_hidden": True}
        ],
        "starter_code": "def fizzbuzz(n):\n    # Write your code here\n    pass"
    }
]

result = db.problems.insert_many(coding_problems)
problem_ids = [str(pid) for pid in result.inserted_ids]

print(f"✅ Created {len(problem_ids)} coding problems")

# Assign to DEMO-PYTHON test
db.cert_test_specs.update_one(
    {'cert_id': 'DEMO-PYTHON', 'difficulty': 'easy'},
    {'$set': {'question_ids': problem_ids}}
)

print(f"✅ Assigned problems to DEMO-PYTHON test")
print(f"Problem IDs: {problem_ids}")
