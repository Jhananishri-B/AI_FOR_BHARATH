#!/usr/bin/env python3
"""
Initialize ChromaDB with the required collection for Learn Quest AI Tutor.
This script should be run after ChromaDB is started but before the API service.
"""

import os
import sys
import time
import chromadb
from chromadb.config import Settings

# Configuration
CHROMA_HOST = os.getenv("CHROMA_HOST", "chroma")
CHROMA_PORT = os.getenv("CHROMA_PORT", "8000")

def wait_for_chroma(max_retries=30, delay=2):
    """Wait for ChromaDB to be ready"""
    for attempt in range(max_retries):
        try:
            client = chromadb.HttpClient(
                host=CHROMA_HOST,
                port=int(CHROMA_PORT)
            )
            # Try to get server version to test connection
            client.heartbeat()
            print("✅ ChromaDB is ready!")
            return client
        except Exception as e:
            print(f"⏳ Waiting for ChromaDB... (attempt {attempt + 1}/{max_retries})")
            if attempt < max_retries - 1:
                time.sleep(delay)
            else:
                raise Exception(f"Failed to connect to ChromaDB after {max_retries} attempts: {e}")

def initialize_chroma():
    """Initialize ChromaDB with the required collection"""
    print("Starting ChromaDB initialization...")
    
    # Wait for ChromaDB to be ready
    client = wait_for_chroma()
    
    try:
        # Create the collection if it doesn't exist
        collection = client.get_or_create_collection(
            name="learnquest_content",
            metadata={"description": "Learn Quest course content embeddings"}
        )
        print(f"✅ Collection 'learnquest_content' is ready!")
        print(f"📊 Collection contains {collection.count()} embeddings")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to initialize ChromaDB: {e}")
        return False

if __name__ == "__main__":
    print("Initializing ChromaDB for Learn Quest AI Tutor...")
    print(f"Connecting to ChromaDB at {CHROMA_HOST}:{CHROMA_PORT}")
    
    try:
        success = initialize_chroma()
        if success:
            print("\n🎉 ChromaDB initialization completed successfully!")
            print("The AI Tutor system is now ready to use.")
        else:
            print("\n❌ ChromaDB initialization failed!")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ ChromaDB initialization error: {e}")
        sys.exit(1)
