#!/usr/bin/env python3
"""
GNN Training Script for LearnQuest Recommendation System
Trains a Graph Neural Network to recommend practice problems based on user behavior
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

def build_graph_data():
    """Build heterogeneous graph data from MongoDB"""
    print("🔗 Building graph data from MongoDB...")
    
    db = get_database()
    
    # Fetch all users with solved problems
    users_collection = db.users
    users = list(users_collection.find({}, {"_id": 1, "solved_problems": 1}))
    print(f"Found {len(users)} users")
    
    # Fetch all code problems with topic information
    problems_collection = db.questions
    problems = list(problems_collection.find({"type": "code"}, {"_id": 1, "course_id": 1, "tags": 1}))
    print(f"Found {len(problems)} code problems")
    
    # Fetch all topics from courses
    courses_collection = db.courses
    courses = list(courses_collection.find({}, {"modules": 1}))
    
    topics = []
    topic_to_course = {}
    
    for course in courses:
        course_id = str(course["_id"])
        for module in course.get("modules", []):
            for topic in module.get("topics", []):
                topic_id = topic.get("topic_id")
                if topic_id:
                    topics.append(topic_id)
                    topic_to_course[topic_id] = course_id
    
    print(f"Found {len(topics)} topics")
    
    # Create node mappings
    user_map = {str(user["_id"]): idx for idx, user in enumerate(users)}
    problem_map = {str(problem["_id"]): idx for idx, problem in enumerate(problems)}
    topic_map = {topic_id: idx for idx, topic_id in enumerate(topics)}
    
    # Save mappings for later use
    mappings = {
        "user_map": user_map,
        "problem_map": problem_map,
        "topic_map": topic_map,
        "reverse_user_map": {v: k for k, v in user_map.items()},
        "reverse_problem_map": {v: k for k, v in problem_map.items()},
        "reverse_topic_map": {v: k for k, v in topic_map.items()}
    }
    
    mappings_file = os.path.join(os.path.dirname(__file__), "node_mappings.json")
    with open(mappings_file, 'w') as f:
        json.dump(mappings, f, indent=2)
    
    print(f"💾 Saved node mappings to {mappings_file}")
    
    # Create HeteroData object
    data = HeteroData()
    
    # Add node features (random initialization for now)
    data['user'].x = torch.randn(len(users), 64)  # 64-dimensional user embeddings
    data['problem'].x = torch.randn(len(problems), 64)  # 64-dimensional problem embeddings
    data['topic'].x = torch.randn(len(topics), 64)  # 64-dimensional topic embeddings
    
    # Create edge indices
    user_problem_edges = []
    problem_topic_edges = []
    
    # User -> Problem edges (solved relationships)
    for user in users:
        user_idx = user_map[str(user["_id"])]
        solved_problems = user.get("solved_problems", [])
        
        for problem_id in solved_problems:
            if problem_id in problem_map:
                problem_idx = problem_map[problem_id]
                user_problem_edges.append([user_idx, problem_idx])
    
    # Problem -> Topic edges (belongs_to relationships)
    for problem in problems:
        problem_idx = problem_map[str(problem["_id"])]
        problem_id = str(problem["_id"])
        
        # Try to find topic through course_id
        course_id = problem.get("course_id")
        if course_id:
            # Find topics that belong to this course
            for topic_id, course in topic_to_course.items():
                if course == course_id:
                    if topic_id in topic_map:
                        topic_idx = topic_map[topic_id]
                        problem_topic_edges.append([problem_idx, topic_idx])
    
    # Convert to tensors
    if user_problem_edges:
        data['user', 'solved', 'problem'].edge_index = torch.tensor(user_problem_edges).t().contiguous()
        # Add reverse edges for bidirectional learning
        data['problem', 'solved_by', 'user'].edge_index = torch.tensor(user_problem_edges).t().contiguous()[[1, 0]]
    else:
        data['user', 'solved', 'problem'].edge_index = torch.empty((2, 0), dtype=torch.long)
        data['problem', 'solved_by', 'user'].edge_index = torch.empty((2, 0), dtype=torch.long)
    
    if problem_topic_edges:
        data['problem', 'belongs_to', 'topic'].edge_index = torch.tensor(problem_topic_edges).t().contiguous()
    else:
        data['problem', 'belongs_to', 'topic'].edge_index = torch.empty((2, 0), dtype=torch.long)
    
    print(f"📊 Graph Statistics:")
    print(f"  - Users: {len(users)}")
    print(f"  - Problems: {len(problems)}")
    print(f"  - Topics: {len(topics)}")
    print(f"  - User-Problem edges: {len(user_problem_edges)}")
    print(f"  - Problem-Topic edges: {len(problem_topic_edges)}")
    
    return data, mappings

class HeteroGNN(torch.nn.Module):
    """Heterogeneous Graph Neural Network for recommendation"""
    
    def __init__(self, hidden_channels=64, out_channels=64):
        super().__init__()
        
        # Define node types
        self.node_types = ['user', 'problem', 'topic']
        
        # Create heterogeneous convolution layers
        self.conv1 = HeteroConv({
            ('user', 'solved', 'problem'): SAGEConv(-1, hidden_channels),
            ('problem', 'belongs_to', 'topic'): SAGEConv(-1, hidden_channels),
            ('problem', 'solved_by', 'user'): SAGEConv(-1, hidden_channels),  # Reverse edge
        }, aggr='mean')
        
        self.conv2 = HeteroConv({
            ('user', 'solved', 'problem'): SAGEConv(hidden_channels, out_channels),
            ('problem', 'belongs_to', 'topic'): SAGEConv(hidden_channels, out_channels),
            ('problem', 'solved_by', 'user'): SAGEConv(hidden_channels, out_channels),  # Reverse edge
        }, aggr='mean')
        
        self.dropout = torch.nn.Dropout(0.2)
    
    def forward(self, x_dict, edge_index_dict):
        """Forward pass through the GNN"""
        # First layer
        x_dict = self.conv1(x_dict, edge_index_dict)
        x_dict = {key: F.relu(x) for key, x in x_dict.items()}
        x_dict = {key: self.dropout(x) for key, x in x_dict.items()}
        
        # Second layer
        x_dict = self.conv2(x_dict, edge_index_dict)
        
        return x_dict

def train_gnn(data, mappings, epochs=100):
    """Train the GNN model"""
    print("🚀 Starting GNN training...")
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    # Move data to device
    data = data.to(device)
    
    # Initialize model
    model = HeteroGNN().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
    
    # Prepare training data (link prediction)
    user_problem_edges = data['user', 'solved', 'problem'].edge_index
    
    if user_problem_edges.size(1) == 0:
        print("❌ No user-problem edges found! Cannot train GNN.")
        print("💡 Make sure you have users with solved_problems in your database.")
        return None
    
    print(f"Training on {user_problem_edges.size(1)} user-problem relationships")
    
    # Training loop
    model.train()
    for epoch in range(epochs):
        optimizer.zero_grad()
        
        # Forward pass
        out = model(data.x_dict, data.edge_index_dict)
        
        # Simple link prediction loss (dot product similarity)
        user_embeddings = out['user']
        problem_embeddings = out['problem']
        
        # Positive samples (existing edges)
        pos_user_idx = user_problem_edges[0]
        pos_problem_idx = user_problem_edges[1]
        pos_scores = (user_embeddings[pos_user_idx] * problem_embeddings[pos_problem_idx]).sum(dim=1)
        
        # Negative samples (random non-edges)
        num_neg_samples = pos_user_idx.size(0)
        neg_user_idx = torch.randint(0, user_embeddings.size(0), (num_neg_samples,), device=device)
        neg_problem_idx = torch.randint(0, problem_embeddings.size(0), (num_neg_samples,), device=device)
        neg_scores = (user_embeddings[neg_user_idx] * problem_embeddings[neg_problem_idx]).sum(dim=1)
        
        # Binary cross-entropy loss
        pos_loss = F.binary_cross_entropy_with_logits(pos_scores, torch.ones_like(pos_scores))
        neg_loss = F.binary_cross_entropy_with_logits(neg_scores, torch.zeros_like(neg_scores))
        loss = pos_loss + neg_loss
        
        loss.backward()
        optimizer.step()
        
        if epoch % 20 == 0:
            print(f"Epoch {epoch:3d}, Loss: {loss.item():.4f}")
    
    print("✅ GNN training completed!")
    return model

def main():
    """Main training function"""
    print("🧠 LearnQuest GNN Training Script")
    print("=" * 50)
    
    try:
        # Build graph data
        data, mappings = build_graph_data()
        
        # Train GNN
        model = train_gnn(data, mappings)
        
        if model is not None:
            # Save model
            model_file = os.path.join(os.path.dirname(__file__), "gnn_model.pt")
            torch.save(model.state_dict(), model_file)
            print(f"💾 Saved trained model to {model_file}")
            
            print("\n🎉 GNN training completed successfully!")
            print("📊 Your recommendation system is ready to use!")
        else:
            print("❌ GNN training failed - insufficient data")
            
    except Exception as e:
        print(f"❌ Error during training: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
