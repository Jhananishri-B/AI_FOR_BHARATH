"""
AI Tutor endpoints for Learn Quest.
Provides RAG-based AI tutoring with multimodal support (text and images).
"""

import os
import base64
import time
import requests
import httpx
# Temporarily disable proctoring imports to fix startup
# import cv2
# import numpy as np
# import mediapipe as mp
# from ultralytics import YOLO
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from ..auth import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/ai", tags=["ai"])

# Configuration
CHROMA_HOST = os.getenv("CHROMA_HOST", "chroma")
CHROMA_PORT = os.getenv("CHROMA_PORT", "8000")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")

# Initialize models (lazy loading to avoid startup issues)
embedding_model = None

def get_embedding_model():
    """Get or initialize the embedding model"""
    global embedding_model
    if embedding_model is None:
        print("Loading AI models...")
        # Check if CUDA is available
        import torch
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Using device: {device}")
        
        embedding_model = SentenceTransformer('all-MiniLM-L6-v2', device=device)
    return embedding_model

def get_chroma_client():
    """Get ChromaDB client"""
    return chromadb.HttpClient(
        host=CHROMA_HOST,
        port=int(CHROMA_PORT)
    )

def wait_for_chroma(max_retries=10, delay=1):
    """Wait for ChromaDB to be ready"""
    for attempt in range(max_retries):
        try:
            client = get_chroma_client()
            # Try to get server version to test connection (v2 API)
            client.get_version()
            return client
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(delay)
            else:
                raise Exception(f"Failed to connect to ChromaDB: {e}")

class ExplainRequest(BaseModel):
    question: str
    course_id: str

class ExplainResponse(BaseModel):
    response: str
    image_url: Optional[str] = None
    sources: List[Dict[str, Any]] = []

@router.post("/explain", response_model=ExplainResponse)
async def explain_concept(
    request: ExplainRequest, 
    current_user: User = Depends(get_current_user)
):
    """
    AI Tutor endpoint that provides explanations using RAG with multimodal support.
    Can handle both text-based and image-based queries.
    """
    try:
        # Get ChromaDB collection
        chroma_client = wait_for_chroma()
        collection = chroma_client.get_or_create_collection("learnquest_content")
        
        # Generate embedding for user's question
        embedding_model = get_embedding_model()
        question_embedding = embedding_model.encode(request.question).tolist()
        
        # Query ChromaDB for relevant content
        results = collection.query(
            query_embeddings=[question_embedding],
            n_results=3,
            where={"course_id": request.course_id}
        )
        
        if not results['documents'] or not results['documents'][0]:
            # If no course-specific content, use general knowledge
            print("No course content found, using general knowledge")
            return await handle_general_knowledge_query(request.question)
        
        # Get the top result
        top_result = results['metadatas'][0][0]
        top_document = results['documents'][0][0]
        top_distance = results['distances'][0][0]
        
        # Prepare sources for response
        sources = []
        for i, (doc, metadata, distance) in enumerate(zip(
            results['documents'][0], 
            results['metadatas'][0], 
            results['distances'][0]
        )):
            sources.append({
                "content": doc[:200] + "..." if len(doc) > 200 else doc,
                "title": metadata.get("title", "Unknown"),
                "type": metadata.get("type", "unknown"),
                "relevance_score": 1 - distance  # Convert distance to similarity
            })
        
        # Check if the top result is image-based
        if top_result.get("type") == "image":
            return await handle_image_query(request.question, top_result, top_document, sources)
        else:
            return await handle_text_query(request.question, top_document, sources)
            
    except Exception as e:
        print(f"AI explanation error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI explanation failed: {str(e)}"
        )

async def handle_general_knowledge_query(question: str) -> ExplainResponse:
    """Handle general knowledge queries when no course content is available"""
    try:
        # Use Ollama directly for general knowledge
        ollama_url = f"{OLLAMA_BASE_URL}/api/generate"
        
        prompt = f"""You are an AI tutor. Please provide a clear, educational explanation for the following question:

Question: {question}

Please provide:
1. A clear explanation
2. Key concepts
3. Examples if applicable
4. Related topics

Keep your response educational and helpful."""

        async with httpx.AsyncClient() as client:
            response = await client.post(ollama_url, json={
                "model": "llama3:latest",
                "prompt": prompt,
                "stream": False
            })
            
            if response.status_code == 200:
                result = response.json()
                explanation = result.get("response", "I'm sorry, I couldn't generate an explanation.")
                
                return ExplainResponse(
                    explanation=explanation,
                    sources=[],
                    confidence=0.8
                )
            else:
                raise Exception(f"Ollama API error: {response.status_code}")
                
    except Exception as e:
        print(f"General knowledge query error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate explanation: {str(e)}"
        )

async def handle_text_query(question: str, context: str, sources: List[Dict]) -> ExplainResponse:
    """Handle text-based queries using Llama3"""
    try:
        # Prepare prompt for Llama3
        prompt = f"""You are an expert AI tutor for Learn Quest. Answer the student's question based on the provided course content.

Student's Question: {question}

Relevant Course Content:
{context}

Instructions:
- Provide a clear, educational explanation
- Use examples when helpful
- Be encouraging and supportive
- If the content doesn't fully answer the question, acknowledge this and provide what you can
- Keep your response concise but comprehensive

Your Response:"""

        # Call Ollama Llama3 API
        payload = {
            "model": "llama3",
            "prompt": prompt,
            "stream": False
        }
        
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json=payload,
            timeout=60
        )
        response.raise_for_status()
        
        result = response.json()
        ai_response = result.get("response", "I'm sorry, I couldn't generate a response.")
        
        return ExplainResponse(
            response=ai_response,
            sources=sources
        )
        
    except Exception as e:
        print(f"Text query processing error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text query processing failed: {str(e)}"
        )

async def handle_image_query(question: str, metadata: Dict, context: str, sources: List[Dict]) -> ExplainResponse:
    """Handle image-based queries using LLaVA"""
    try:
        image_url = metadata.get("image_url")
        if not image_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image URL not found in metadata"
            )
        
        # Download and encode image
        image_response = requests.get(image_url, timeout=30)
        image_response.raise_for_status()
        
        image_base64 = base64.b64encode(image_response.content).decode('utf-8')
        
        # Prepare prompt for LLaVA
        prompt = f"""You are an expert AI tutor. The student is asking: "{question}"

Based on the image provided and the context: "{context}", please provide a helpful educational explanation.

Instructions:
- Analyze the image carefully
- Connect the image content to the student's question
- Provide educational insights about what's shown
- Be encouraging and clear
- If the image doesn't directly relate to the question, explain what you see and how it might be relevant

Your Response:"""

        # Call Ollama LLaVA API
        payload = {
            "model": "llava",
            "prompt": prompt,
            "images": [image_base64],
            "stream": False
        }
        
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json=payload,
            timeout=90
        )
        response.raise_for_status()
        
        result = response.json()
        ai_response = result.get("response", "I'm sorry, I couldn't analyze the image.")
        
        return ExplainResponse(
            response=ai_response,
            image_url=image_url,
            sources=sources
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image query processing failed: {str(e)}"
        )

@router.post("/test-explain", response_model=ExplainResponse)
async def test_explain_concept(request: ExplainRequest):
    """
    Public test endpoint for AI Tutor (no authentication required)
    """
    try:
        # Use general knowledge query for testing
        return await handle_general_knowledge_query(request.question)
    except Exception as e:
        print(f"Test AI explanation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI explanation failed: {str(e)}"
        )

@router.get("/health")
async def ai_health_check():
    """Health check for AI services"""
    try:
        # Check ChromaDB connection
        chroma_status = {"connected": False, "embeddings_count": 0}
        try:
            chroma_client = wait_for_chroma()
            collection = chroma_client.get_or_create_collection("learnquest_content")
            count = collection.count()
            chroma_status = {"connected": True, "embeddings_count": count}
        except Exception as e:
            chroma_status["error"] = str(e)
        
        # Check Ollama connection
        ollama_status = {"connected": False, "available_models": []}
        try:
            ollama_response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
            ollama_models = ollama_response.json().get("models", [])
            ollama_status = {
                "connected": True, 
                "available_models": [model.get("name") for model in ollama_models]
            }
        except Exception as e:
            ollama_status["error"] = str(e)
        
        return {
            "status": "healthy" if chroma_status["connected"] else "degraded",
            "chromadb": chroma_status,
            "ollama": ollama_status
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# AI Coach Models
class CoachMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class CoachRequest(BaseModel):
    messages: List[CoachMessage]

class CoachResponse(BaseModel):
    response: str
    recommendations: Optional[Dict[str, Any]] = None

@router.post("/coach", response_model=CoachResponse)
async def ai_coach(
    request: CoachRequest, 
    current_user: User = Depends(get_current_user)
):
    """
    AI Coach endpoint for personalized learning guidance and motivation.
    This is Questie, a friendly AI learning coach focused on personalization and motivation.
    """
    try:
        # Get complete user profile from database
        from ..database import get_collection
        from bson import ObjectId
        
        users_collection = get_collection("users")
        user_data = users_collection.find_one({"_id": ObjectId(current_user.id)})
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        # Query recent performance by topic
        questions_collection = get_collection("questions")
        recent_wrong_ids = []
        for item in user_data.get('quiz_history', [])[-3:]:
            for w in item.get('wrong_questions', []) or []:
                qid = w.get('q_id') if isinstance(w, dict) else w
                if qid:
                    recent_wrong_ids.append(qid)

        # Aggregate per-topic stats (simple heuristic)
        topic_counts: Dict[str, int] = {}
        topic_names: Dict[str, str] = {}
        from bson import ObjectId
        for qid in recent_wrong_ids:
            try:
                qdoc = questions_collection.find_one({"_id": ObjectId(qid)})
                if qdoc:
                    topic_id = qdoc.get('topic_id') or qdoc.get('tags', [None])[0]
                    if topic_id:
                        topic_counts[topic_id] = topic_counts.get(topic_id, 0) + 1
                        topic_names[topic_id] = qdoc.get('topic_name', topic_id)
            except Exception:
                continue

        # Pull GNN recommendations (best-effort)
        gnn_recs = {"recommended_problem_ids": [], "scores": []}
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                gnn_resp = await client.post(
                    "http://api:8000/api/gnn/recommend",
                    json={
                        "user_id": current_user.id,
                        "failed_problem_ids": recent_wrong_ids,
                        "num_recommendations": 5
                    }
                )
                if gnn_resp.status_code == 200:
                    gnn_recs = gnn_resp.json()
        except Exception:
            pass

        # Create Questie's system prompt with user and analytics
        system_prompt = f"""You are 'Questie,' a friendly and encouraging AI learning coach for the Learn Quest platform. You are like a personal friend and mentor.

Your goal is to motivate the user by asking them questions about their progress, celebrating their achievements (like leveling up or high quiz scores), and helping them decide what to learn next based on their history. Do not answer deep technical questions; instead, gently guide them to the 'AI Tutor' within a specific course for that.

Here is the user's current status:
- Name: {user_data.get('name', 'Student')}
- Level: {user_data.get('level', 1)}
- XP: {user_data.get('xp', 0)}
- Recent quiz history (last 3): {user_data.get('quiz_history', [])[-3:]}
- Enrolled courses: {user_data.get('enrolled_courses', [])}

Here are the user's weaker topics inferred from recent quiz mistakes (topic_id -> mistakes): {topic_counts}.
Use these topics to guide recommendations and encouragement.

GNN has recommended these problem ids (if any) to help improve: {gnn_recs.get('recommended_problem_ids', [])}.

Use this information to have a personalized and motivational conversation. Be encouraging, ask about their learning goals, celebrate their progress, and suggest next steps. Keep responses conversational and friendly."""

        # Prepare messages for Ollama
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add chat history
        for msg in request.messages:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Call Ollama with llama3
        payload = {
            "model": "llama3",
            "messages": messages,
            "stream": False
        }
        
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json=payload,
            timeout=60
        )
        response.raise_for_status()
        result = response.json()
        
        ai_response = result.get("message", {}).get("content", "I'm here to help you on your learning journey!")
        
        return CoachResponse(response=ai_response, recommendations={
            "weaker_topics": [{"topic_id": k, "mistakes": v, "name": topic_names.get(k, k)} for k, v in sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)],
            "gnn_problem_ids": gnn_recs.get('recommended_problem_ids', [])
        })
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Coach service unavailable: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Coach processing failed: {str(e)}"
        )

# Adaptive Practice Models
class AdaptivePracticeRequest(BaseModel):
    failed_problem_ids: List[str]

class AdaptivePracticeResponse(BaseModel):
    message: str
    problems: List[Dict[str, Any]]

@router.post("/generate-practice", response_model=AdaptivePracticeResponse)
async def generate_adaptive_practice(
    request: AdaptivePracticeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate adaptive practice plan using GNN recommendations and AI coaching.
    Combines Graph Neural Network recommendations with personalized AI messages.
    """
    try:
        # Step 1: Get GNN recommendations
        gnn_request = {
            "user_id": current_user.id,
            "failed_problem_ids": request.failed_problem_ids,
            "num_recommendations": 5
        }
        
        async with httpx.AsyncClient() as client:
            gnn_response = await client.post(
                "http://api:8000/api/gnn/recommend",
                json=gnn_request,
                timeout=30
            )
            
            if gnn_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="GNN recommendation service unavailable"
                )
            
            gnn_data = gnn_response.json()
            recommended_problem_ids = gnn_data.get("recommended_problem_ids", [])
        
        # Step 2: Fetch full problem objects from database
        from ..database import get_collection
        from bson import ObjectId
        
        problems_collection = get_collection("questions")
        
        # Get failed problems
        failed_problems = []
        for problem_id in request.failed_problem_ids:
            try:
                problem = problems_collection.find_one({"_id": ObjectId(problem_id)})
                if problem:
                    failed_problems.append({
                        "problem_id": str(problem["_id"]),
                        "title": problem.get("title", "Unknown Problem"),
                        "difficulty": problem.get("difficulty", "medium"),
                        "type": problem.get("type", "code")
                    })
            except Exception:
                continue
        
        # Get recommended problems
        recommended_problems = []
        for problem_id in recommended_problem_ids:
            try:
                problem = problems_collection.find_one({"_id": ObjectId(problem_id)})
                if problem:
                    recommended_problems.append({
                        "problem_id": str(problem["_id"]),
                        "title": problem.get("title", "Unknown Problem"),
                        "difficulty": problem.get("difficulty", "medium"),
                        "type": problem.get("type", "code")
                    })
            except Exception:
                continue
        
        # Step 3: Generate AI coaching message
        failed_titles = [p["title"] for p in failed_problems]
        recommended_titles = [p["title"] for p in recommended_problems]
        
        prompt = f"""You are Questie, a friendly AI learning coach for Learn Quest. The student just completed a quiz and struggled with some problems.

Failed Problems: {', '.join(failed_titles)}

Based on their performance, I've recommended these practice problems: {', '.join(recommended_titles)}

Generate an encouraging and personalized message that:
1. Acknowledges their effort (don't focus on failure)
2. Explains why these specific problems will help them improve
3. Motivates them to continue learning
4. Keeps the tone positive and supportive

Return ONLY a JSON object with this exact format:
{{"message": "Your encouraging message here"}}

Do not include any other text or formatting."""

        # Call Ollama for AI message
        payload = {
            "model": "llama3",
            "prompt": prompt,
            "stream": False
        }
        
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        
        result = response.json()
        ai_response = result.get("response", "Great job on completing the quiz! Let's practice some problems to strengthen your skills.")
        
        # Try to parse JSON from AI response
        try:
            import json
            # Extract JSON from response (in case there's extra text)
            start_idx = ai_response.find('{')
            end_idx = ai_response.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                json_str = ai_response[start_idx:end_idx]
                parsed_response = json.loads(json_str)
                ai_message = parsed_response.get("message", ai_response)
            else:
                ai_message = ai_response
        except:
            ai_message = ai_response
        
        return AdaptivePracticeResponse(
            message=ai_message,
            problems=recommended_problems
        )
        
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"GNN service unavailable: {str(e)}"
        )
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service unavailable: {str(e)}"
        )


# Proctoring Models
class ProctoringRequest(BaseModel):
    attempt_id: str
    image_base64: str


# Initialize proctoring models (lazy loading)
yolo_model = None
face_mesh = None

def get_proctoring_models():
    """Get or initialize proctoring models"""
    # Temporarily disabled proctoring models
    return None, None


@router.post("/proctor")
async def proctor_image(
    request: ProctoringRequest,
    current_user=Depends(get_current_user)
):
    """Proctor an image for violations during certification test"""
    # Temporarily disabled proctoring functionality
    return {"status": "ok", "violations": [], "message": "Proctoring temporarily disabled"}
