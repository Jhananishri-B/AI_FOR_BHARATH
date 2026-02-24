#!/usr/bin/env python3
"""
Database synchronization script for Learn Quest
Helps teams synchronize database changes
"""

import os
import sys
import json
import shutil
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId

# Add the services/api/src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services', 'api', 'src'))

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB", "learnquest")

def get_database():
    """Connect to MongoDB and return database instance"""
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def backup_current_database():
    """Create a backup of current database"""
    print("Creating backup of current database...")
    
    db = get_database()
    backup_dir = f"database_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    os.makedirs(backup_dir, exist_ok=True)
    
    collections = db.list_collection_names()
    
    for collection_name in collections:
        collection = db[collection_name]
        documents = list(collection.find({}))
        
        backup_file = os.path.join(backup_dir, f"{collection_name}.json")
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(documents, f, default=json_serial, indent=2, ensure_ascii=False)
    
    print(f"✅ Backup created in: {backup_dir}")
    return backup_dir

def merge_collections(local_data, remote_data, collection_name):
    """Merge local and remote data for a collection"""
    print(f"Merging {collection_name} collection...")
    
    # For most collections, we'll use a simple merge strategy
    # This can be customized per collection type
    
    if collection_name == "users":
        # For users, merge by email (unique identifier)
        merged = {}
        
        # Add remote users
        for user in remote_data:
            email = user.get("email")
            if email:
                merged[email] = user
        
        # Add local users (local takes precedence for conflicts)
        for user in local_data:
            email = user.get("email")
            if email:
                merged[email] = user
        
        return list(merged.values())
    
    elif collection_name == "courses":
        # For courses, merge by slug (unique identifier)
        merged = {}
        
        # Add remote courses
        for course in remote_data:
            slug = course.get("slug")
            if slug:
                merged[slug] = course
        
        # Add local courses (local takes precedence)
        for course in local_data:
            slug = course.get("slug")
            if slug:
                merged[slug] = course
        
        return list(merged.values())
    
    elif collection_name in ["quizzes", "questions"]:
        # For quizzes and questions, merge by ID
        merged = {}
        
        # Add remote items
        for item in remote_data:
            item_id = str(item.get("_id", ""))
            if item_id:
                merged[item_id] = item
        
        # Add local items (local takes precedence)
        for item in local_data:
            item_id = str(item.get("_id", ""))
            if item_id:
                merged[item_id] = item
        
        return list(merged.values())
    
    else:
        # Default: combine all data, remove duplicates by _id
        merged = {}
        
        for item in remote_data + local_data:
            item_id = str(item.get("_id", ""))
            if item_id:
                merged[item_id] = item
        
        return list(merged.values())

def sync_with_team():
    """Main synchronization function"""
    print("🔄 Starting database synchronization...")
    
    # Step 1: Create backup
    backup_dir = backup_current_database()
    
    try:
        db = get_database()
        print(f"Connected to database: {DB_NAME}")
        
        # Step 2: Export current local data
        print("Exporting current local data...")
        local_data = {}
        collections = db.list_collection_names()
        
        for collection_name in collections:
            collection = db[collection_name]
            local_data[collection_name] = list(collection.find({}))
        
        # Step 3: Look for team data files
        team_files = [f for f in os.listdir('.') if f.startswith('database_export_') and f.endswith('.zip')]
        
        if not team_files:
            print("❌ No team database files found!")
            print("💡 Ask your team lead to export and share the database")
            return
        
        # Use the most recent team file
        latest_team_file = sorted(team_files)[-1]
        print(f"Found team database file: {latest_team_file}")
        
        # Step 4: Extract team data
        import zipfile
        team_data_dir = "team_data_temp"
        os.makedirs(team_data_dir, exist_ok=True)
        
        with zipfile.ZipFile(latest_team_file, 'r') as zipf:
            zipf.extractall(team_data_dir)
        
        # Step 5: Load team data
        team_data = {}
        for filename in os.listdir(team_data_dir):
            if filename.endswith('.json') and filename != 'metadata.json':
                collection_name = filename[:-5]
                file_path = os.path.join(team_data_dir, filename)
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    team_data[collection_name] = json.load(f)
        
        # Step 6: Merge data
        print("Merging local and team data...")
        merged_data = {}
        
        all_collections = set(local_data.keys()) | set(team_data.keys())
        
        for collection_name in all_collections:
            local_collection = local_data.get(collection_name, [])
            team_collection = team_data.get(collection_name, [])
            
            merged_data[collection_name] = merge_collections(
                local_collection, team_collection, collection_name
            )
        
        # Step 7: Import merged data
        print("Importing merged data...")
        for collection_name, data in merged_data.items():
            collection = db[collection_name]
            
            # Clear existing data
            collection.delete_many({})
            
            # Insert merged data
            if data:
                result = collection.insert_many(data)
                print(f"✅ Imported {len(result.inserted_ids)} documents into {collection_name}")
        
        # Step 8: Clean up
        shutil.rmtree(team_data_dir)
        
        print(f"\n🎉 Database synchronization completed!")
        print(f"📊 Synchronized {len(merged_data)} collections")
        print(f"💾 Backup available in: {backup_dir}")
        
    except Exception as e:
        print(f"❌ Error during synchronization: {e}")
        print(f"💾 Your data is backed up in: {backup_dir}")
        sys.exit(1)

def main():
    """Main function"""
    if len(sys.argv) > 1 and sys.argv[1] == "--help":
        print("Database Synchronization Script")
        print("Usage: python sync_database.py")
        print("\nThis script will:")
        print("1. Backup your current database")
        print("2. Find the latest team database export")
        print("3. Merge your data with team data")
        print("4. Import the merged data")
        print("\nMake sure you have the latest database export from your team lead!")
        return
    
    sync_with_team()

if __name__ == "__main__":
    main()
