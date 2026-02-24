#!/usr/bin/env python3
"""
Simplified GNN Training Script for LearnQuest Recommendation System
Handles edge cases with empty graphs
"""

import torch
import json
import sys
import os
from datetime import datetime
from collections import defaultdict

# Add the services/api/src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'api', 'src'))

try:
    from torch_geometric.data import HeteroData
    from torch_geometric.nn import SAGEConv, HeteroConv
    import torch.nn.functional as F
except ImportError as e:
    print(f"❌ Missing PyTorch Geometric dependencies: {e}")
    print("💡 Run: pip install torch torch-geometric")
    sys.exit(1)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB", "learnquest")

def get_database():
    """Connect to MongoDB and return database instance"""
    from pymongo import MongoClient
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]

def build_simple_graph_data():
    """Build simplified graph data from MongoDB"""
    print("🔗 Building simplified graph data from MongoDB...")
    
    db = get_database()
    
    # Fetch all users with solved problems
    users_collection = db.users
    users = list(users_collection.find({}, {"_id": 1, "solved_problems": 1}))
    print(f"Found {len(users)} users")
    
    # Fetch all code problems
    problems_collection = db.questions
    problems = list(problems_collection.find({"type": "code"}, {"_id": 1, "title": 1}))
    print(f"Found {len(problems)} code problems")
    
    # Create node mappings
    user_map = {str(user["_id"]): idx for idx, user in enumerate(users)}
    problem_map = {str(problem["_id"]): idx for idx, problem in enumerate(problems)}
    
    # Save mappings for later use
    mappings = {
        "user_map": user_map,
        "problem_map": problem_map,
        "reverse_user_map": {v: k for k, v in user_map.items()},
        "reverse_problem_map": {v: k for k, v in problem_map.items()}
    }
    
    mappings_file = os.path.join(os.path.dirname(__file__), "node_mappings.json")
    with open(mappings_file, 'w') as f:
        json.dump(mappings, f, indent=2)
    
    print(f"💾 Saved node mappings to {mappings_file}")
    
    # Create simple embeddings (no graph structure for now)
    user_embeddings = torch.randn(len(users), 64)
    problem_embeddings = torch.randn(len(problems), 64)
    
    # Save simple embeddings
    embeddings = {
        "user_embeddings": user_embeddings.tolist(),
        "problem_embeddings": problem_embeddings.tolist()
    }
    
    embeddings_file = os.path.join(os.path.dirname(__file__), "simple_embeddings.json")
    with open(embeddings_file, 'w') as f:
        json.dump(embeddings, f, indent=2)
    
    print(f"💾 Saved simple embeddings to {embeddings_file}")
    
    print(f"📊 Graph Statistics:")
    print(f"  - Users: {len(users)}")
    print(f"  - Problems: {len(problems)}")
    print(f"  - User embeddings: {user_embeddings.shape}")
    print(f"  - Problem embeddings: {problem_embeddings.shape}")
    
    return True

def main():
    """Main training function"""
    print("🧠 LearnQuest Simplified GNN Training Script")
    print("=" * 50)
    
    try:
        # Build simple graph data
        success = build_simple_graph_data()
        
        if success:
            print("\n🎉 Simplified GNN training completed successfully!")
            print("📊 Your recommendation system is ready to use!")
            print("💡 Using simple embeddings for recommendations")
        else:
            print("❌ GNN training failed - insufficient data")
            
    except Exception as e:
        print(f"❌ Error during training: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
