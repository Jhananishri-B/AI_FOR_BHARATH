#!/usr/bin/env python3
"""
Quick fix: Assign existing coding problems to DEMO-PYTHON cert test
"""
from pymongo import MongoClient
import os

mongo_url = os.getenv('MONGO_URL')
client = MongoClient(mongo_url)
db = client['learnquest']

print("Fetching coding problems from courses...")
courses = list(db.courses.find({}))

problem_ids = []
for course in courses:
    for module in course.get('modules', []):
        for topic in module.get('topics', []):
            # Find practice problems
            for item in topic.get('practice_problems', []):
                if 'problem_id' in item:
                    problem_ids.append(item['problem_id'])
            
print(f"Found {len(problem_ids)} coding problems")

if len(problem_ids) > 0:
    # Take first 5 problems
    selected_problems = problem_ids[:5]
    print(f"Using {len(selected_problems)} problems: {selected_problems}")
    
    # Update DEMO-PYTHON spec
    result = db.cert_test_specs.update_one(
        {'cert_id': 'DEMO-PYTHON', 'difficulty': 'easy'},
        {'$set': {'question_ids': selected_problems}}
    )
    
    if result.modified_count > 0:
        print("✅ Updated DEMO-PYTHON test with coding problems!")
    else:
        print("⚠️ No update - spec not found or already has these problems")
    
    # Verify
    spec = db.cert_test_specs.find_one({'cert_id': 'DEMO-PYTHON'})
    print(f"\nDEMO-PYTHON now has {len(spec.get('question_ids', []))} question IDs")
else:
    print("❌ No coding problems found in courses!")
