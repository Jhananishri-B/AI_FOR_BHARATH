#!/usr/bin/env python3
"""
Assign questions to cert_test_specs
"""
from pymongo import MongoClient
import os
from bson import ObjectId

# Get MongoDB connection
mongo_url = os.getenv('MONGO_URL')
client = MongoClient(mongo_url)
db = client['learnquest']

print("Checking available questions...")
questions_count = db.questions.count_documents({})
print(f"Total questions in database: {questions_count}")

if questions_count == 0:
    print("\n⚠️  No questions found! Creating sample questions...")
    # Create sample MCQ questions
    sample_questions = [
        {
            "question_text": "What is React?",
            "options": ["A library", "A framework", "A language", "A database"],
            "correct_answer": "A library",
            "difficulty": "Easy",
            "tags": ["react", "javascript", "frontend"]
        },
        {
            "question_text": "Which company developed React?",
            "options": ["Google", "Facebook", "Amazon", "Microsoft"],
            "correct_answer": "Facebook",
            "difficulty": "Easy",
            "tags": ["react", "javascript"]
        },
        {
            "question_text": "What is JSX?",
            "options": ["JavaScript XML", "Java Syntax Extension", "JSON Extension", "JavaScript Extra"],
            "correct_answer": "JavaScript XML",
            "difficulty": "Easy",
            "tags": ["react", "javascript", "jsx"]
        },
        {
            "question_text": "What is Python primarily used for?",
            "options": ["Web development", "Data science", "Automation", "All of the above"],
            "correct_answer": "All of the above",
            "difficulty": "Easy",
            "tags": ["python", "general"]
        },
        {
            "question_text": "Which of these is a Python web framework?",
            "options": ["Django", "React", "Angular", "Vue"],
            "correct_answer": "Django",
            "difficulty": "Easy",
            "tags": ["python", "web", "django"]
        }
    ]
    
    result = db.questions.insert_many(sample_questions)
    question_ids = [str(qid) for qid in result.inserted_ids]
    print(f"✅ Created {len(question_ids)} sample questions")
else:
    # Get existing question IDs
    questions = list(db.questions.find({}).limit(5))
    question_ids = [str(q['_id']) for q in questions]
    print(f"✅ Found {len(question_ids)} existing questions to use")

print(f"\nQuestion IDs to assign: {question_ids[:3]}...")

# Update all cert_test_specs to have these questions
print("\nUpdating cert_test_specs...")
specs = list(db.cert_test_specs.find({}))

for spec in specs:
    cert_id = spec.get('cert_id', 'Unknown')
    current_count = len(spec.get('question_ids', []))
    
    # Assign questions
    result = db.cert_test_specs.update_one(
        {'_id': spec['_id']},
        {'$set': {'question_ids': question_ids}}
    )
    
    if result.modified_count > 0:
        print(f"  ✅ Updated {cert_id}: {current_count} -> {len(question_ids)} questions")
    else:
        print(f"  ℹ️  {cert_id}: Already has questions")

print("\n✅ All done! Cert tests now have questions assigned.")

# Display summary
print("\n📋 Summary:")
for spec in db.cert_test_specs.find({}):
    print(f"  - {spec.get('cert_id', 'N/A')} ({spec.get('difficulty', 'N/A')}): {len(spec.get('question_ids', []))} questions")
