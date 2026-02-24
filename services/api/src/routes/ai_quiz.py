"""
AI Quiz Generation API using Llama
Generates dynamic quizzes for any course based on topics and user progress
"""

import requests
import json
import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from ..auth import get_current_user
from ..models.user import User
from ..database import get_collection
from bson import ObjectId
import uuid
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/ai-quiz", tags=["ai-quiz"])

# Ollama configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

class QuizGenerationRequest(BaseModel):
    course_id: str
    difficulty: str = "medium"  # easy, medium, hard
    num_questions: int = 5
    topics: Optional[List[str]] = None  # Specific topics to focus on

class QuizGenerationResponse(BaseModel):
    quiz_id: str
    session_id: str
    questions: List[Dict[str, Any]]
    duration_seconds: int
    xp_reward: int

class TopicRecommendationRequest(BaseModel):
    user_id: str
    course_id: Optional[str] = None

class TopicRecommendationResponse(BaseModel):
    recommended_topics: List[Dict[str, Any]]
    reasoning: str

@router.post("/generate", response_model=QuizGenerationResponse)
async def generate_ai_quiz(
    request: QuizGenerationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate an AI-powered quiz for any course using Llama
    """
    try:
        # Get course information
        courses_collection = get_collection("courses")
        course = courses_collection.find_one({"_id": ObjectId(request.course_id)})
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Get user's learning progress and weak areas
        users_collection = get_collection("users")
        user_data = users_collection.find_one({"_id": ObjectId(current_user.id)})
        
        # Analyze user's weak topics from quiz history
        weak_topics = []
        if user_data and user_data.get('quiz_history'):
            for quiz_result in user_data['quiz_history'][-3:]:  # Last 3 quizzes
                for wrong_q in quiz_result.get('wrong_questions', []):
                    # Get question details to find topic
                    questions_collection = get_collection("questions")
                    question = questions_collection.find_one({"_id": ObjectId(wrong_q)})
                    if question and question.get('topic_id'):
                        weak_topics.append(question['topic_id'])
        
        # Create AI prompt for quiz generation
        system_prompt = f"""You are an expert quiz generator for the course "{course['title']}".

Course Description: {course.get('description', '')}

Generate {request.num_questions} quiz questions with the following specifications:
- Difficulty: {request.difficulty}
- Focus on topics: {request.topics or 'all course topics'}
- User's weak areas: {weak_topics[:3] if weak_topics else 'none identified'}

For each question, provide:
1. question_text: The question content
2. question_type: "mcq" or "code"
3. choices: Array of 4 options (for MCQ)
4. correct_answer: The correct answer index (0-3) or code solution
5. explanation: Why this answer is correct
6. topic: The topic this question covers
7. difficulty: "easy", "medium", or "hard"

Return ONLY a JSON array of questions in this exact format:
[
  {{
    "question_text": "What is the output of print('Hello' + 'World')?",
    "question_type": "mcq",
    "choices": ["HelloWorld", "Hello World", "Hello+World", "Error"],
    "correct_answer": 0,
    "explanation": "String concatenation in Python combines strings without spaces",
    "topic": "Python Basics",
    "difficulty": "easy"
  }}
]

Make questions relevant to the course content and user's learning needs."""

        # Call Llama to generate quiz
        payload = {
            "model": "llama3",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate a {request.difficulty} quiz for {course['title']} with {request.num_questions} questions."}
            ],
            "stream": False
        }
        
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json=payload,
            timeout=60
        )
        response.raise_for_status()
        result = response.json()
        
        # Parse AI response
        ai_content = result.get("message", {}).get("content", "[]")
        
        # Extract JSON from AI response
        try:
            # Find JSON array in the response
            start_idx = ai_content.find('[')
            end_idx = ai_content.rfind(']') + 1
            if start_idx != -1 and end_idx != -1:
                json_str = ai_content[start_idx:end_idx]
                questions = json.loads(json_str)
            else:
                raise ValueError("No valid JSON found in AI response")
        except (json.JSONDecodeError, ValueError) as e:
            # Fallback: create sample questions
            questions = [
                {
                    "question_text": f"What is a key concept in {course['title']}?",
                    "question_type": "mcq",
                    "choices": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": 0,
                    "explanation": "This is the correct answer because...",
                    "topic": "General",
                    "difficulty": request.difficulty
                }
            ]
        
        # Create quiz in database
        quiz_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())
        
        # Calculate duration based on number of questions
        duration_seconds = request.num_questions * 60  # 1 minute per question
        
        # Create quiz document
        quiz_doc = {
            "course_id": request.course_id,
            "title": f"AI Generated Quiz - {course['title']}",
            "duration_seconds": duration_seconds,
            "question_ids": [],
            "xp_reward": request.num_questions * 10,
            "created_at": datetime.utcnow(),
            "is_ai_generated": True
        }
        
        # Create questions in database
        questions_collection = get_collection("questions")
        question_ids = []
        
        for i, q in enumerate(questions):
            question_doc = {
                "quiz_id": quiz_id,
                "type": "quiz",
                "question_text": q["question_text"],
                "question_type": q["question_type"],
                "choices": q.get("choices", []),
                "correct_answer": q["correct_answer"],
                "explanation": q["explanation"],
                "topic": q["topic"],
                "difficulty": q["difficulty"],
                "order": i + 1,
                "created_at": datetime.utcnow()
            }
            
            result = questions_collection.insert_one(question_doc)
            question_ids.append(str(result.inserted_id))
        
        # Update quiz with question IDs
        quiz_doc["question_ids"] = question_ids
        quizzes_collection = get_collection("quizzes")
        quizzes_collection.insert_one(quiz_doc)
        
        return QuizGenerationResponse(
            quiz_id=quiz_id,
            session_id=session_id,
            questions=questions,
            duration_seconds=duration_seconds,
            xp_reward=quiz_doc["xp_reward"]
        )
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI service unavailable: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Quiz generation failed: {str(e)}"
        )

@router.post("/recommend-topics", response_model=TopicRecommendationResponse)
async def recommend_topics(
    request: TopicRecommendationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Get AI-powered topic recommendations for the user
    """
    try:
        # Get user data and progress
        users_collection = get_collection("users")
        user_data = users_collection.find_one({"_id": ObjectId(request.user_id)})
        
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Analyze user's performance patterns
        weak_topics = []
        strong_topics = []
        
        if user_data.get('quiz_history'):
            for quiz_result in user_data['quiz_history'][-5:]:  # Last 5 quizzes
                for wrong_q in quiz_result.get('wrong_questions', []):
                    questions_collection = get_collection("questions")
                    question = questions_collection.find_one({"_id": ObjectId(wrong_q)})
                    if question and question.get('topic_id'):
                        weak_topics.append(question['topic_id'])
        
        # Get course information if specified
        course_info = ""
        if request.course_id:
            courses_collection = get_collection("courses")
            course = courses_collection.find_one({"_id": ObjectId(request.course_id)})
            if course:
                course_info = f"Course: {course['title']} - {course.get('description', '')}"
        
        # Create AI prompt for topic recommendations
        system_prompt = f"""You are Questie, an AI learning coach. Analyze this user's learning data and recommend topics for improvement.

User Data:
- Name: {user_data.get('name', 'Student')}
- Level: {user_data.get('level', 1)}
- XP: {user_data.get('xp', 0)}
- Weak Topics: {list(set(weak_topics))[:5]}
- Recent Quiz Performance: {user_data.get('quiz_history', [])[-3:]}
- {course_info}

Recommend 3-5 topics the user should focus on to improve their learning. For each topic, provide:
1. topic_name: Clear topic name
2. reason: Why this topic is important for the user
3. difficulty: "beginner", "intermediate", or "advanced"
4. estimated_time: "15-30 minutes" or similar
5. priority: "high", "medium", or "low"

Return ONLY a JSON array in this format:
[
  {{
    "topic_name": "Python Functions",
    "reason": "You've struggled with function concepts in recent quizzes",
    "difficulty": "intermediate",
    "estimated_time": "20-30 minutes",
    "priority": "high"
  }}
]

Focus on topics that will help the user learn from their mistakes and improve their understanding."""

        # Call Llama for recommendations
        payload = {
            "model": "llama3",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Please recommend topics for this user to focus on."}
            ],
            "stream": False
        }
        
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json=payload,
            timeout=60
        )
        response.raise_for_status()
        result = response.json()
        
        # Parse AI response
        ai_content = result.get("message", {}).get("content", "[]")
        
        try:
            start_idx = ai_content.find('[')
            end_idx = ai_content.rfind(']') + 1
            if start_idx != -1 and end_idx != -1:
                json_str = ai_content[start_idx:end_idx]
                recommended_topics = json.loads(json_str)
            else:
                raise ValueError("No valid JSON found in AI response")
        except (json.JSONDecodeError, ValueError):
            # Fallback recommendations
            recommended_topics = [
                {
                    "topic_name": "Review Recent Mistakes",
                    "reason": "Focus on topics you've struggled with recently",
                    "difficulty": "intermediate",
                    "estimated_time": "20-30 minutes",
                    "priority": "high"
                }
            ]
        
        return TopicRecommendationResponse(
            recommended_topics=recommended_topics,
            reasoning="Based on your recent quiz performance and learning patterns"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Topic recommendation failed: {str(e)}"
        )

@router.post("/test-generate", response_model=QuizGenerationResponse)
async def test_generate_quiz(request: QuizGenerationRequest):
    """
    Public test endpoint for Quiz Generation (no authentication required)
    """
    try:
        # Generate quiz using Ollama
        ollama_url = f"{OLLAMA_BASE_URL}/api/generate"
        
        prompt = f"""Generate a {request.difficulty} level quiz about {request.course_id} with {request.num_questions} questions.

Format the response as JSON with this structure:
{{
    "questions": [
        {{
            "question": "Question text",
            "options": ["A", "B", "C", "D"],
            "correct_answer": "A",
            "explanation": "Why this answer is correct"
        }}
    ]
}}

Make the questions educational and relevant to {request.course_id}."""

        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.post(ollama_url, json={
                "model": "llama3:latest",
                "prompt": prompt,
                "stream": False
            })
            
            if response.status_code == 200:
                result = response.json()
                quiz_data = json.loads(result.get("response", "{}"))
                
                return QuizGenerationResponse(
                    quiz_id=str(uuid.uuid4()),
                    questions=quiz_data.get("questions", []),
                    difficulty=request.difficulty,
                    course_id=request.course_id
                )
            else:
                raise Exception(f"Ollama API error: {response.status_code}")
                
    except Exception as e:
        print(f"Test quiz generation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quiz generation failed: {str(e)}"
        )

@router.get("/health")
async def ai_quiz_health():
    """Check if AI quiz service is available"""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        return {"status": "healthy", "ollama_available": response.status_code == 200}
    except:
        return {"status": "unhealthy", "ollama_available": False}
