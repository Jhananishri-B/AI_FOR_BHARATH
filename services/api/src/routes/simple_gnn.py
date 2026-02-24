"""
Simplified GNN API Routes for LearnQuest Recommendation System
Uses simple embeddings for recommendations
"""

import json
import os
import random
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
import sys

# Add the services/api/src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'api', 'src'))

from ..auth import get_current_user
from ..models.user import User
from ..database import get_collection

router = APIRouter(prefix="/api/gnn", tags=["gnn"])

# Global variables for loaded embeddings and mappings
embeddings = None
node_mappings = None

class RecommendationRequest(BaseModel):
    user_id: str
    failed_problem_ids: List[str]
    num_recommendations: int = 5

class RecommendationResponse(BaseModel):
    recommended_problem_ids: List[str]
    scores: List[float]

def load_simple_embeddings():
    """Load the simple embeddings and node mappings"""
    global embeddings, node_mappings
    
    try:
        # Load node mappings
        mappings_file = os.path.join('/app', 'services', 'gnn', 'node_mappings.json')
        if os.path.exists(mappings_file):
            with open(mappings_file, 'r') as f:
                node_mappings = json.load(f)
            print(f"✅ Loaded node mappings from {mappings_file}")
        else:
            print(f"❌ Node mappings file not found: {mappings_file}")
            return False
        
        # Load simple embeddings
        embeddings_file = os.path.join('/app', 'services', 'gnn', 'simple_embeddings.json')
        if os.path.exists(embeddings_file):
            with open(embeddings_file, 'r') as f:
                embeddings = json.load(f)
            print(f"✅ Loaded simple embeddings from {embeddings_file}")
        else:
            print(f"❌ Embeddings file not found: {embeddings_file}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error loading embeddings: {e}")
        return False

def get_user_solved_problems(user_id: str) -> List[str]:
    """Get list of problems solved by a user"""
    try:
        users_collection = get_collection("users")
        user = users_collection.find_one({"_id": user_id})
        
        if user:
            return user.get("solved_problems", [])
        return []
    except Exception as e:
        print(f"Error getting user solved problems: {e}")
        return []

def get_all_problems() -> List[dict]:
    """Get all code problems from database"""
    try:
        problems_collection = get_collection("questions")
        problems = list(problems_collection.find({"type": "code"}, {"_id": 1, "title": 1, "difficulty": 1}))
        return problems
    except Exception as e:
        print(f"Error getting problems: {e}")
        return []

def calculate_similarity(user_embedding, problem_embedding):
    """Calculate cosine similarity between user and problem embeddings"""
    import math
    
    # Calculate dot product
    dot_product = sum(a * b for a, b in zip(user_embedding, problem_embedding))
    
    # Calculate magnitudes
    user_magnitude = math.sqrt(sum(a * a for a in user_embedding))
    problem_magnitude = math.sqrt(sum(b * b for b in problem_embedding))
    
    # Avoid division by zero
    if user_magnitude == 0 or problem_magnitude == 0:
        return 0.0
    
    # Calculate cosine similarity
    similarity = dot_product / (user_magnitude * problem_magnitude)
    return similarity

@router.post("/recommend", response_model=RecommendationResponse)
async def recommend_problems(request: RecommendationRequest):
    """Get problem recommendations using simple embeddings"""
    
    if embeddings is None or node_mappings is None:
        raise HTTPException(
            status_code=503,
            detail="GNN model not loaded. Please train the model first."
        )
    
    try:
        # Get user's solved problems
        solved_problems = get_user_solved_problems(request.user_id)
        
        # Get all problems
        all_problems = get_all_problems()
        
        if not all_problems:
            raise HTTPException(
                status_code=404,
                detail="No problems found in database"
            )
        
        # Filter out problems user has already solved
        available_problems = [
            p for p in all_problems 
            if str(p["_id"]) not in solved_problems
        ]
        
        if not available_problems:
            raise HTTPException(
                status_code=404,
                detail="No new problems available for recommendation"
            )
        
        # Get user and problem embeddings
        user_map = node_mappings["user_map"]
        problem_map = node_mappings["problem_map"]
        
        if request.user_id not in user_map:
            # User not in training data, return random recommendations
            recommended_problems = random.sample(
                available_problems, 
                min(request.num_recommendations, len(available_problems))
            )
            return RecommendationResponse(
                recommended_problem_ids=[str(p["_id"]) for p in recommended_problems],
                scores=[0.5] * len(recommended_problems)  # Default score
            )
        
        user_idx = user_map[request.user_id]
        user_embedding = embeddings["user_embeddings"][user_idx]
        problem_embeddings = embeddings["problem_embeddings"]
        
        # Calculate similarities
        similarities = []
        
        for problem in available_problems:
            problem_id = str(problem["_id"])
            if problem_id in problem_map:
                problem_idx = problem_map[problem_id]
                similarity = calculate_similarity(user_embedding, problem_embeddings[problem_idx])
                similarities.append((problem_id, similarity))
        
        # Sort by similarity and get top recommendations
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        top_recommendations = similarities[:request.num_recommendations]
        
        recommended_problem_ids = [item[0] for item in top_recommendations]
        scores = [item[1] for item in top_recommendations]
        
        return RecommendationResponse(
            recommended_problem_ids=recommended_problem_ids,
            scores=scores
        )
        
    except Exception as e:
        print(f"Error in recommendation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Recommendation failed: {str(e)}"
        )

@router.get("/status")
async def get_gnn_status():
    """Check if GNN model is loaded and ready"""
    return {
        "model_loaded": embeddings is not None,
        "mappings_loaded": node_mappings is not None,
        "ready": embeddings is not None and node_mappings is not None
    }

@router.post("/reload")
async def reload_gnn_model():
    """Reload the GNN model and mappings"""
    success = load_simple_embeddings()
    return {"success": success, "message": "Model reloaded" if success else "Failed to reload model"}

# Load model on startup
@router.on_event("startup")
async def startup_event():
    """Load GNN model when the API starts"""
    print("🔄 Loading simple embeddings on startup...")
    load_simple_embeddings()
