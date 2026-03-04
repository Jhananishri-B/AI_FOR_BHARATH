#!/usr/bin/env python3
"""
Database import script for Learn Quest
Imports database from JSON files exported by export_database.py
"""

import os
import sys
import json
import zipfile
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

def import_collection(db, collection_name, data):
    """Import data into a collection"""
    collection = db[collection_name]
    
    # Clear existing data
    collection.delete_many({})
    print(f"Cleared existing data from {collection_name}")
    
    # Insert new data
    if data:
        result = collection.insert_many(data)
        print(f"Imported {len(result.inserted_ids)} documents into {collection_name}")
    else:
        print(f"No data to import into {collection_name}")

def extract_zip_file(zip_path, extract_to="database_exports"):
    """Extract zip file to specified directory"""
    if not os.path.exists(zip_path):
        print(f"❌ Zip file not found: {zip_path}")
        return False
    
    os.makedirs(extract_to, exist_ok=True)
    
    with zipfile.ZipFile(zip_path, 'r') as zipf:
        zipf.extractall(extract_to)
    
    print(f"✅ Extracted zip file to: {extract_to}")
    return True

def main():
    """Main import function"""
    print("Starting database import...")
    
    # Check for command line arguments
    if len(sys.argv) > 1:
        zip_file = sys.argv[1]
        if not extract_zip_file(zip_file):
            sys.exit(1)
    else:
        # Look for zip files in current directory
        zip_files = [f for f in os.listdir('.') if f.startswith('database_export_') and f.endswith('.zip')]
        if zip_files:
            zip_file = sorted(zip_files)[-1]  # Use the most recent one
            print(f"Found zip file: {zip_file}")
            if not extract_zip_file(zip_file):
                sys.exit(1)
        else:
            print("No zip file found. Please provide a zip file as argument or place one in current directory.")
            print("Usage: python import_database.py [zip_file_path]")
            sys.exit(1)
    
    try:
        db = get_database()
        print(f"Connected to database: {DB_NAME}")
        
        exports_dir = "database_exports"
        
        # Read metadata
        metadata_file = os.path.join(exports_dir, "metadata.json")
        if os.path.exists(metadata_file):
            with open(metadata_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            print(f"Importing data exported on: {metadata.get('export_date', 'Unknown')}")
            print(f"Collections to import: {metadata.get('collections', [])}")
        
        # Import each collection
        for filename in os.listdir(exports_dir):
            if filename.endswith('.json') and filename != 'metadata.json':
                collection_name = filename[:-5]  # Remove .json extension
                file_path = os.path.join(exports_dir, filename)
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                import_collection(db, collection_name, data)
        
        print(f"\n✅ Database import completed successfully!")
        print(f"📊 All collections have been updated with shared data")
        
        # Clean up extracted files
        import shutil
        shutil.rmtree(exports_dir)
        print(f"🧹 Cleaned up temporary files")
        
    except Exception as e:
        print(f"❌ Error during import: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
