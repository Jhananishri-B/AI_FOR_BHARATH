#!/usr/bin/env python3
from pymongo import MongoClient
import os

mongo_url = os.getenv('MONGO_URL')
client = MongoClient(mongo_url)
db = client['learnquest']

# Check problems collection
problems = list(db.problems.find({}, {'_id': 1, 'title': 1, 'prompt': 1}).limit(10))
print(f"Found {len(problems)} coding problems in problems collection")

if len(problems) > 0:
    problem_ids = [str(p['_id']) for p in problems[:5]]
    print(f"Assigning {len(problem_ids)} problems to DEMO-PYTHON test")
    
    result = db.cert_test_specs.update_one(
        {'cert_id': 'DEMO-PYTHON', 'difficulty': 'easy'},
        {'$set': {'question_ids': problem_ids}}
    )
    
    print(f"✅ Updated! Modified count: {result.modified_count}")
else:
    print("❌ No problems found in problems collection")
