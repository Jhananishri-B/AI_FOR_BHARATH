from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import List, Dict, Any
import os
import httpx
from datetime import datetime, timedelta
import random
import uuid
from ..models.user import User
from ..auth import get_current_user
from ..database import get_collection

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])

class QuizAnswer(BaseModel):
    question_id: str
    answer: str

class SubmitQuizRequest(BaseModel):
    answers: List[QuizAnswer]

class StartQuizResponse(BaseModel):
    session_id: str
    question_order: List[str]
    end_time: str

class QuizSession(BaseModel):
    session_id: str
    user_id: str
    quiz_id: str
    question_order: List[str]
    start_time: datetime
    end_time: datetime
    answers: Dict[str, str] = {}
    submitted: bool = False

# In-memory storage for quiz sessions (in production, use Redis)
quiz_sessions: Dict[str, QuizSession] = {}

@router.post("/{quiz_id}/start", response_model=StartQuizResponse)
async def start_quiz(quiz_id: str, current_user: User = Depends(get_current_user)):
    """Start a quiz session and return randomized question order"""
    try:
        # Get quiz from database
        quizzes_collection = get_collection("quizzes")
        from bson import ObjectId
        quiz = quizzes_collection.find_one({"_id": ObjectId(quiz_id)})
        
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found"
            )
        
        # Get questions for the quiz
        questions_collection = get_collection("questions")
        questions = list(questions_collection.find({"quiz_id": str(quiz["_id"])}))
        
        if not questions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No questions found for this quiz"
            )
        
        # Randomize question order
        question_ids = [str(q["_id"]) for q in questions]
        random.shuffle(question_ids)
        
        # Create quiz session
        session_id = str(uuid.uuid4())
        start_time = datetime.utcnow()
        end_time = start_time + timedelta(seconds=quiz["duration_seconds"])
        
        session = QuizSession(
            session_id=session_id,
            user_id=current_user.id,
            quiz_id=quiz_id,
            question_order=question_ids,
            start_time=start_time,
            end_time=end_time
        )
        
        quiz_sessions[session_id] = session
        
        return {
            "session_id": session_id,
            "question_order": question_ids,
            "end_time": end_time.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error starting quiz: {str(e)}"
        )

@router.get("/{quiz_id}/questions")
async def get_quiz_questions_by_id(quiz_id: str, current_user: User = Depends(get_current_user)):
    """Get questions for a quiz directly by quiz ID (for frontend compatibility)"""
    try:
        # Get quiz from database
        quizzes_collection = get_collection("quizzes")
        from bson import ObjectId
        
        # Try to find quiz by ObjectId first, then by string ID (for AI-generated quizzes)
        quiz = None
        try:
            # Try as ObjectId first
            quiz = quizzes_collection.find_one({"_id": ObjectId(quiz_id)})
        except:
            # If ObjectId conversion fails, try as string ID (for AI-generated quizzes)
            quiz = quizzes_collection.find_one({"_id": quiz_id})
        
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found"
            )
        
        # Get questions for the quiz
        questions_collection = get_collection("questions")
        # Handle both ObjectId and string quiz IDs
        quiz_id_for_query = str(quiz["_id"]) if isinstance(quiz["_id"], ObjectId) else quiz["_id"]
        questions = list(questions_collection.find({"quiz_id": quiz_id_for_query}))
        
        if not questions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No questions found for this quiz"
            )
        
        # Format questions for frontend
        formatted_questions = []
        for question in questions:
            question_data = {
                "id": str(question["_id"]),
                "type": question["type"],
                "prompt": question["prompt"],
                "choices": question.get("choices", []),
                "difficulty": question.get("difficulty", "easy"),
                "tags": question.get("tags", [])
            }
            if question["type"] == "code":
                question_data["code_starter"] = question.get("code_starter", "")
                public_examples = []
                for tc in question.get("test_cases", []) or []:
                    if not tc.get("is_hidden", False):
                        public_examples.append({
                            "input": tc.get("input", ""),
                            "expected_output": tc.get("expected_output", "")
                        })
                question_data["public_test_cases"] = public_examples
            formatted_questions.append(question_data)
        
        return {
            "quiz_id": quiz_id,
            "questions": formatted_questions,
            "title": quiz.get("title", "Quiz"),
            "duration_seconds": quiz.get("duration_seconds", 1800)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching questions: {str(e)}"
        )

@router.get("/{session_id}/questions")
async def get_quiz_questions(session_id: str, current_user: User = Depends(get_current_user)):
    """Get questions for a quiz session (without correct answers)"""
    try:
        # Check if session exists
        if session_id not in quiz_sessions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz session not found"
            )
        
        session = quiz_sessions[session_id]
        
        # Verify user owns this session
        if session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Check if session has expired
        if datetime.utcnow() > session.end_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quiz session has expired"
            )
        
        # Get questions from database
        questions_collection = get_collection("questions")
        questions = []
        
        for question_id in session.question_order:
            from bson import ObjectId
            question = questions_collection.find_one({"_id": ObjectId(question_id)})
            if question:
                # Remove correct answer for security
                question_data = {
                    "id": str(question["_id"]),
                    "type": question["type"],
                    "prompt": question["prompt"],
                    "choices": question.get("choices", []),
                    "difficulty": question.get("difficulty", "easy"),
                    "tags": question.get("tags", [])
                }
                if question["type"] == "code":
                    # Include starter code and only public test cases for preview/examples
                    question_data["code_starter"] = question.get("code_starter", "")
                    public_examples = []
                    for tc in question.get("test_cases", []) or []:
                        if not tc.get("is_hidden", False):
                            public_examples.append({
                                "input": tc.get("input", ""),
                                "expected_output": tc.get("expected_output", "")
                            })
                    question_data["public_test_cases"] = public_examples
                questions.append(question_data)
        
        return {
            "session_id": session_id,
            "questions": questions,
            "end_time": session.end_time.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching questions: {str(e)}"
        )

@router.post("/{session_id}/submit")
async def submit_quiz(session_id: str, request: SubmitQuizRequest, current_user: User = Depends(get_current_user)):
    """Submit quiz answers and calculate score"""
    try:
        # Check if session exists
        if session_id not in quiz_sessions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz session not found"
            )
        
        session = quiz_sessions[session_id]
        
        # Verify user owns this session
        if session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Check if already submitted
        if session.submitted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quiz already submitted"
            )
        
        # Get questions and calculate score
        questions_collection = get_collection("questions")
        correct_answers = 0
        total_questions = len(session.question_order)
        wrong_questions = []
        detailed_results: List[Dict[str, Any]] = []
        judge0_url = os.getenv("JUDGE0_URL", "http://judge0:2358")
        
        for answer in request.answers:
            from bson import ObjectId
            question = questions_collection.find_one({"_id": ObjectId(answer.question_id)})
            if question:
                # Check if answer is correct
                if question["type"] == "mcq":
                    correct_choice = question.get("correct_choice")
                    user_choice = int(answer.answer) if answer.answer.isdigit() else None
                    
                    if user_choice == correct_choice:
                        correct_answers += 1
                        detailed_results.append({
                            "question_id": answer.question_id,
                            "type": "mcq",
                            "result": "correct"
                        })
                    else:
                        wrong_questions.append({
                            "q_id": answer.question_id,
                            "user_answer": answer.answer,
                            "correct_answer": str(correct_choice)
                        })
                        detailed_results.append({
                            "question_id": answer.question_id,
                            "type": "mcq",
                            "result": "incorrect"
                        })
                elif question["type"] == "code":
                    # Execute user's code against all test cases via Judge0
                    user_code = answer.answer
                    test_cases = question.get("test_cases", []) or []
                    test_results: List[Dict[str, Any]] = []
                    passed_count = 0
                    # Language mapping: Python (3.8+) is 71 in Judge0 CE
                    language_id = 71
                    # Run sequentially to respect Judge0 rate limits; could be parallelized if needed
                    async with httpx.AsyncClient(timeout=30) as client:
                        for idx, tc in enumerate(test_cases):
                            payload = {
                                "language_id": language_id,
                                "source_code": user_code,
                                "stdin": tc.get("input", "")
                            }
                            try:
                                resp = await client.post(
                                    f"{judge0_url}/submissions/?base64_encoded=false&wait=true",
                                    json=payload
                                )
                                resp.raise_for_status()
                                data = resp.json()
                                stdout = (data.get("stdout") or "").rstrip("\n")
                                stderr = data.get("stderr")
                                compile_output = data.get("compile_output")
                                status = (data.get("status") or {}).get("description", "")
                                expected = (tc.get("expected_output", "") or "").rstrip("\n")
                                passed = (stderr is None) and (compile_output is None) and (stdout == expected)
                                if passed:
                                    passed_count += 1
                                test_results.append({
                                    "index": idx,
                                    "is_hidden": bool(tc.get("is_hidden", False)),
                                    "input": tc.get("input", ""),
                                    "expected_output": expected,
                                    "stdout": stdout,
                                    "stderr": stderr,
                                    "status": status,
                                    "passed": passed
                                })
                            except Exception as exec_err:
                                status = "Execution Error"
                                test_results.append({
                                    "index": idx,
                                    "is_hidden": bool(tc.get("is_hidden", False)),
                                    "input": tc.get("input", ""),
                                    "expected_output": tc.get("expected_output", ""),
                                    "stdout": "",
                                    "stderr": str(exec_err),
                                    "status": status,
                                    "passed": False
                                })
                    # For scoring, consider a code question correct only if all public and hidden tests pass
                    if passed_count == len(test_cases) and len(test_cases) > 0:
                        correct_answers += 1
                    else:
                        wrong_questions.append({
                            "q_id": answer.question_id,
                            "user_answer": "<code submission>",
                            "correct_answer": None
                        })
                    detailed_results.append({
                        "question_id": answer.question_id,
                        "type": "code",
                        "passed": passed_count,
                        "total": len(test_cases),
                        "tests": test_results
                    })
        
        # Calculate score and XP
        score = int((correct_answers / total_questions) * 100) if total_questions > 0 else 0
        
        # Get quiz XP reward
        quizzes_collection = get_collection("quizzes")
        from bson import ObjectId
        quiz = quizzes_collection.find_one({"_id": ObjectId(session.quiz_id)})
        xp_earned = quiz.get("xp_reward", 0) if quiz else 0
        
        # Update user's XP and quiz history
        users_collection = get_collection("users")
        new_xp = current_user.xp + xp_earned
        new_level = (new_xp // 100) + 1  # Simple level calculation
        
        quiz_history_item = {
            "quiz_id": session.quiz_id,
            "score": score,
            "date": datetime.utcnow(),
            "wrong_questions": wrong_questions
        }
        
        from bson import ObjectId
        users_collection.update_one(
            {"_id": ObjectId(current_user.id)},
            {
                "$set": {"xp": new_xp, "level": new_level},
                "$push": {"quiz_history": quiz_history_item}
            }
        )
        
        # Mark session as submitted
        session.submitted = True
        session.answers = {answer.question_id: answer.answer for answer in request.answers}
        
        return {
            "score": score,
            "correct_answers": correct_answers,
            "total_questions": total_questions,
            "xp_earned": xp_earned,
            "new_total_xp": new_xp,
            "new_level": new_level,
            "wrong_questions": wrong_questions,
            "question_results": detailed_results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting quiz: {str(e)}"
        )
