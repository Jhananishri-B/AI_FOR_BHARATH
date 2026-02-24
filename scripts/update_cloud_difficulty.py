#!/usr/bin/env python3
"""
Update cloud MongoDB cert_test_specs to use lowercase difficulty values
"""
from pymongo import MongoClient
import os

# Get MongoDB connection from environment
mongo_url = os.getenv('MONGO_URL', 'mongodb+srv://gokul9942786_db_user:eTMzG8J5Z3hC86C0@cluster0.qvkilbo.mongodb.net/learnquest?retryWrites=true&w=majority&appName=Cluster0')
mongo_db = os.getenv('MONGO_DB', 'learnquest')

print(f"Connecting to cloud MongoDB...")
client = MongoClient(mongo_url)
db = client[mongo_db]

# Update all Easy to easy
print("Updating difficulty values to lowercase...")
result = db.cert_test_specs.update_many(
    {'difficulty': 'Easy'}, 
    {'$set': {'difficulty': 'easy'}}
)
print(f"✅ Updated {result.modified_count} documents from 'Easy' to 'easy'")

# Update Medium and Hard too
result_medium = db.cert_test_specs.update_many(
    {'difficulty': 'Medium'}, 
    {'$set': {'difficulty': 'medium'}}
)
print(f"✅ Updated {result_medium.modified_count} documents from 'Medium' to 'medium'")

result_hard = db.cert_test_specs.update_many(
    {'difficulty': 'Hard'}, 
    {'$set': {'difficulty': 'tough'}}
)
print(f"✅ Updated {result_hard.modified_count} documents from 'Hard' to 'tough'")

# Display current specs
print("\nCurrent cert_test_specs:")
specs = list(db.cert_test_specs.find({}, {'cert_id': 1, 'difficulty': 1, '_id': 0}))
for spec in specs:
    print(f"  - {spec.get('cert_id', 'N/A')}: {spec.get('difficulty', 'N/A')}")

print("\n✅ All done!")
