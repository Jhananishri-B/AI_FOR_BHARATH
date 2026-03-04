#!/usr/bin/env python3
"""
Database export script for Learn Quest
Exports all collections to JSON files for sharing with teammates
"""

import os
import sys
import json
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

def export_collection(db, collection_name, output_file):
    """Export a collection to JSON file"""
    collection = db[collection_name]
    documents = list(collection.find({}))
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(documents, f, default=json_serial, indent=2, ensure_ascii=False)
    
    print(f"Exported {len(documents)} documents from {collection_name} to {output_file}")

def main():
    """Main export function"""
    print("Starting database export...")
    
    try:
        db = get_database()
        print(f"Connected to database: {DB_NAME}")
        
        # Create exports directory
        exports_dir = "database_exports"
        os.makedirs(exports_dir, exist_ok=True)
        
        # Get all collections
        collections = db.list_collection_names()
        
        if not collections:
            print("No collections found in database")
            return
        
        print(f"Found collections: {collections}")
        
        # Export each collection
        for collection_name in collections:
            output_file = os.path.join(exports_dir, f"{collection_name}.json")
            export_collection(db, collection_name, output_file)
        
        # Create a metadata file
        metadata = {
            "export_date": datetime.utcnow().isoformat(),
            "database_name": DB_NAME,
            "collections": collections,
            "total_collections": len(collections)
        }
        
        metadata_file = os.path.join(exports_dir, "metadata.json")
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Database export completed successfully!")
        print(f"📁 Exported files are in: {exports_dir}/")
        print(f"📊 Exported {len(collections)} collections")
        
        # Create a zip file for easy sharing
        import zipfile
        zip_file = f"database_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
        with zipfile.ZipFile(zip_file, 'w') as zipf:
            for root, dirs, files in os.walk(exports_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    zipf.write(file_path, os.path.relpath(file_path, exports_dir))
        
        print(f"📦 Created zip file: {zip_file}")
        print(f"\n💡 Share this zip file with your teammates!")
        
    except Exception as e:
        print(f"❌ Error during export: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
