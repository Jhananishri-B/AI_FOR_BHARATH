#!/usr/bin/env python3
"""
Import database export into MongoDB Atlas cloud database.
This script imports the extracted JSON files into the cloud database.
"""

import os
import json
import sys
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId

# Configuration
MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://gokul9942786_db_user:eTMzG8J5Z3hC86C0@cluster0.qvkilbo.mongodb.net/learnquest?retryWrites=true&w=majority&appName=Cluster0")
DB_NAME = os.getenv("MONGO_DB", "learnquest")

def get_database():
    """Connect to MongoDB Atlas"""
    try:
        client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=10000)
        client.admin.command('ping')
        print("✅ Connected to MongoDB Atlas")
        return client[DB_NAME]
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB Atlas: {e}")
        sys.exit(1)

def convert_object_ids(data):
    """Convert string IDs to ObjectId for MongoDB"""
    if isinstance(data, dict):
        for key, value in data.items():
            if key == "_id" and isinstance(value, str) and len(value) == 24:
                try:
                    data[key] = ObjectId(value)
                except:
                    pass  # Keep as string if conversion fails
            else:
                data[key] = convert_object_ids(value)
    elif isinstance(data, list):
        data = [convert_object_ids(item) for item in data]
    return data

def import_collection(db, collection_name, file_path):
    """Import a single collection from JSON file"""
    try:
        print(f"\n📥 Importing {collection_name}...")
        
        # Read JSON file
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not data:
            print(f"  ⚠️  No data found in {file_path}")
            return 0
        
        # Convert string IDs to ObjectId
        data = convert_object_ids(data)
        
        # Get collection
        collection = db[collection_name]
        
        # Clear existing data (optional - comment out if you want to keep existing data)
        print(f"  🗑️  Clearing existing {collection_name} data...")
        collection.delete_many({})
        
        # Insert data
        if isinstance(data, list):
            if len(data) > 0:
                result = collection.insert_many(data)
                print(f"  ✅ Inserted {len(result.inserted_ids)} documents")
                return len(result.inserted_ids)
        else:
            result = collection.insert_one(data)
            print(f"  ✅ Inserted 1 document")
            return 1
            
    except Exception as e:
        print(f"  ❌ Error importing {collection_name}: {e}")
        return 0

def main():
    """Main import function"""
    print("🚀 Starting database import to MongoDB Atlas...")
    print(f"📅 Import started at: {datetime.now()}")
    
    # Connect to database
    db = get_database()
    
    # Define import order (important for foreign key relationships)
    import_files = [
        ("users", "temp_export/users.json"),
        ("courses", "temp_export/courses.json"),
        ("quizzes", "temp_export/quizzes.json"),
        ("questions", "temp_export/questions.json")
    ]
    
    total_imported = 0
    
    # Import each collection
    for collection_name, file_path in import_files:
        if os.path.exists(file_path):
            imported_count = import_collection(db, collection_name, file_path)
            total_imported += imported_count
        else:
            print(f"  ⚠️  File not found: {file_path}")
    
    # Print summary
    print(f"\n📊 Import Summary:")
    print(f"  Total documents imported: {total_imported}")
    
    # Show collection counts
    for collection_name, _ in import_files:
        try:
            count = db[collection_name].count_documents({})
            print(f"  {collection_name}: {count} documents")
        except:
            print(f"  {collection_name}: Error counting")
    
    print(f"\n✅ Database import completed successfully!")
    print(f"📅 Import finished at: {datetime.now()}")

if __name__ == "__main__":
    main()
