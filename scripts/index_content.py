#!/usr/bin/env python3
"""
Multimodal content indexing script for Learn Quest AI Tutor.
Indexes course content (text and images) into ChromaDB for RAG-based AI tutoring.
This is a self-contained script that performs the entire indexing process.
"""

import os
import sys
import base64
import time
from typing import List, Dict, Any
from datetime import datetime

import pymongo
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import requests
from PIL import Image
import io

# Configuration
MONGO_URL = os.getenv("MONGO_URL", "mongodb://db:27017")
DB_NAME = os.getenv("MONGO_DB", "learnquest")
CHROMA_HOST = os.getenv("CHROMA_HOST", "chroma")
CHROMA_PORT = os.getenv("CHROMA_PORT", "8000")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")

def get_database():
    """Connect to MongoDB and return database instance"""
    client = pymongo.MongoClient(MONGO_URL)
    return client[DB_NAME]

def get_chroma_client():
    """Connect to ChromaDB and return client instance"""
    return chromadb.HttpClient(
        host=CHROMA_HOST,
        port=int(CHROMA_PORT)
    )

def wait_for_chroma(max_retries=30, delay=2):
    """Wait for ChromaDB to be ready"""
    for attempt in range(max_retries):
        try:
            client = get_chroma_client()
            # Try to get server version to test connection
            client.heartbeat()
            print("✅ ChromaDB connection established!")
            return client
        except Exception as e:
            print(f"⏳ Waiting for ChromaDB... (attempt {attempt + 1}/{max_retries})")
            if attempt < max_retries - 1:
                time.sleep(delay)
            else:
                raise Exception(f"Failed to connect to ChromaDB after {max_retries} attempts: {e}")

def describe_image_with_llava(image_url: str) -> str:
    """Use LLaVA model to generate text description of an image"""
    try:
        # Download and encode image
        response = requests.get(image_url, timeout=30)
        response.raise_for_status()
        
        # Convert to base64
        image_base64 = base64.b64encode(response.content).decode('utf-8')
        
        # Call Ollama LLaVA API
        payload = {
            "model": "llava",
            "prompt": "Describe this image in detail, focusing on educational content, diagrams, code, or any learning materials visible.",
            "images": [image_base64],
            "stream": False
        }
        
        ollama_response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json=payload,
            timeout=60
        )
        ollama_response.raise_for_status()
        
        result = ollama_response.json()
        return result.get("response", "Unable to describe image")
        
    except Exception as e:
        print(f"Error describing image {image_url}: {e}")
        return f"Image description unavailable: {str(e)}"

def index_topic_content(topic: Dict[str, Any], course_id: str, chroma_collection, embedding_model):
    """Index a single topic's content (text and image) into ChromaDB"""
    topic_id = topic.get("topic_id")
    title = topic.get("title", "")
    content = topic.get("content", "")
    image_url = topic.get("image_url")
    
    # Prepare text content for embedding
    text_content = f"Title: {title}\nContent: {content}".strip()
    
    if not text_content:
        print(f"Skipping topic {topic_id} - no text content")
        return
    
    # Generate embedding for text content
    text_embedding = embedding_model.encode(text_content).tolist()
    
    # Store text embedding
    chroma_collection.add(
        embeddings=[text_embedding],
        documents=[text_content],
        metadatas=[{
            "topic_id": str(topic_id),
            "course_id": str(course_id),
            "type": "text",
            "title": title
        }],
        ids=[f"text_{topic_id}"]
    )
    print(f"Indexed text content for topic: {title}")
    
    # Process image if present
    if image_url:
        try:
            # Generate image description using LLaVA
            image_description = describe_image_with_llava(image_url)
            
            # Generate embedding for image description
            image_embedding = embedding_model.encode(image_description).tolist()
            
            # Store image embedding
            chroma_collection.add(
                embeddings=[image_embedding],
                documents=[image_description],
                metadatas=[{
                    "topic_id": str(topic_id),
                    "course_id": str(course_id),
                    "type": "image",
                    "image_url": image_url,
                    "title": title
                }],
                ids=[f"image_{topic_id}"]
            )
            print(f"Indexed image content for topic: {title}")
            
        except Exception as e:
            print(f"Failed to process image for topic {topic_id}: {e}")

def sync_all_content():
    """Main function to sync all course content to ChromaDB"""
    print("Starting multimodal content indexing...")
    
    # Initialize embedding model
    print("Loading sentence transformer model...")
    # Check if CUDA is available
    import torch
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")
    
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2', device=device)
    
    # Connect to databases
    print("Connecting to databases...")
    db = get_database()
    chroma_client = wait_for_chroma()
    
    # Get or create collection
    try:
        collection = chroma_client.get_collection("learnquest_content")
        print("Using existing ChromaDB collection")
    except:
        collection = chroma_client.create_collection(
            name="learnquest_content",
            metadata={"description": "Learn Quest course content embeddings"}
        )
        print("Created new ChromaDB collection")
    
    # Get all courses
    courses_collection = db.courses
    courses = list(courses_collection.find())
    
    print(f"Found {len(courses)} courses to index")
    
    total_topics = 0
    for course in courses:
        course_id = str(course["_id"])
        course_title = course.get("title", "Untitled")
        modules = course.get("modules", [])
        
        print(f"\nProcessing course: {course_title}")
        
        for module in modules:
            module_title = module.get("title", "Untitled Module")
            topics = module.get("topics", [])
            
            print(f"  Module: {module_title} ({len(topics)} topics)")
            
            for topic in topics:
                index_topic_content(topic, course_id, collection, embedding_model)
                total_topics += 1
    
    print(f"\n✅ Indexing completed! Processed {total_topics} topics across {len(courses)} courses")
    print(f"ChromaDB collection now contains {collection.count()} embeddings")

if __name__ == "__main__":
    print("Starting multimodal content indexing...")
    print("This will index all course content (text and images) into ChromaDB for AI tutoring.")
    print("Make sure Ollama is running locally with llama3 and llava models installed.")
    print()
    
    try:
        sync_all_content()
        print("\n✅ Content indexing completed successfully!")
        print("You can now use the AI Tutor feature.")
    except Exception as e:
        print(f"\n❌ Content indexing failed: {e}")
        sys.exit(1)
