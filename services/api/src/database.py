"""
Database connection utility for MongoDB
"""

import os
from pymongo import MongoClient
from pymongo.database import Database

# MongoDB configuration
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB", "learnquest")

# Global database instance
_db: Database = None

def get_database() -> Database:
    """
    Get MongoDB database instance
    Creates connection if not already established
    """
    global _db
    if _db is None:
        client = MongoClient(MONGO_URL)
        _db = client[DB_NAME]
    return _db

def get_collection(collection_name: str):
    """
    Get a specific collection from the database
    """
    db = get_database()
    return db[collection_name]
