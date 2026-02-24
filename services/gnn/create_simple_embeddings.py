#!/usr/bin/env python3
"""
Create simple embeddings from the trained GNN model for the simple GNN API
"""

import torch
import json
import sys
import os

# Add the services/api/src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'api', 'src'))

try:
    from train import HeteroGNN
except ImportError as e:
    print(f"❌ Could not import GNN model: {e}")
    sys.exit(1)

def create_simple_embeddings():
    """Create simple embeddings from the trained GNN model"""
    
    # Load node mappings
    mappings_file = os.path.join(os.path.dirname(__file__), 'node_mappings.json')
    if not os.path.exists(mappings_file):
        print(f"❌ Node mappings file not found: {mappings_file}")
        return False
    
    with open(mappings_file, 'r') as f:
        node_mappings = json.load(f)
    
    print(f"✅ Loaded node mappings from {mappings_file}")
    
    # Load trained model
    model_file = os.path.join(os.path.dirname(__file__), 'gnn_model.pt')
    if not os.path.exists(model_file):
        print(f"❌ GNN model file not found: {model_file}")
        return False
    
    # Create model and load weights
    model = HeteroGNN()
    model.load_state_dict(torch.load(model_file, map_location='cpu'))
    model.eval()
    
    print(f"✅ Loaded GNN model from {model_file}")
    
    # Create dummy data for inference
    from torch_geometric.data import HeteroData
    
    data = HeteroData()
    data['user'].x = torch.randn(len(node_mappings["user_map"]), 64)
    data['problem'].x = torch.randn(len(node_mappings["problem_map"]), 64)
    data['topic'].x = torch.randn(len(node_mappings["topic_map"]), 64)
    
    # Empty edge indices for inference
    data['user', 'solved', 'problem'].edge_index = torch.empty((2, 0), dtype=torch.long)
    data['problem', 'belongs_to', 'topic'].edge_index = torch.empty((2, 0), dtype=torch.long)
    data['problem', 'solved_by', 'user'].edge_index = torch.empty((2, 0), dtype=torch.long)
    
    # Get embeddings
    with torch.no_grad():
        embeddings = model(data.x_dict, data.edge_index_dict)
    
    # Convert to simple format
    user_embeddings = embeddings['user'].tolist()
    problem_embeddings = embeddings['problem'].tolist()
    
    # Create simple embeddings structure
    simple_embeddings = {
        "user_embeddings": user_embeddings,
        "problem_embeddings": problem_embeddings
    }
    
    # Save simple embeddings
    embeddings_file = os.path.join(os.path.dirname(__file__), 'simple_embeddings.json')
    with open(embeddings_file, 'w') as f:
        json.dump(simple_embeddings, f, indent=2)
    
    print(f"✅ Created simple embeddings: {embeddings_file}")
    print(f"📊 Embeddings stats:")
    print(f"  - User embeddings: {len(user_embeddings)}")
    print(f"  - Problem embeddings: {len(problem_embeddings)}")
    print(f"  - Embedding dimension: {len(user_embeddings[0]) if user_embeddings else 0}")
    
    return True

if __name__ == "__main__":
    print("🧠 Creating simple embeddings from GNN model...")
    success = create_simple_embeddings()
    if success:
        print("🎉 Simple embeddings created successfully!")
    else:
        print("❌ Failed to create simple embeddings")
        sys.exit(1)
