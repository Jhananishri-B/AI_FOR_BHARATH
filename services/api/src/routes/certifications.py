"""
User-facing API for taking certification tests
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime

from ..auth import get_current_user
from ..database import get_collection
from ..models.certification import CertificationSpec, CertificationAttempt

router = APIRouter(prefix="/api/certifications", tags=["certifications"])


class StartTestRequest(BaseModel):
    spec_id: str


class SubmitTestRequest(BaseModel):
    attempt_id: str
    answers: Dict[str, Any]


class ProctoringEventRequest(BaseModel):
    attempt_id: str
    event: Dict[str, Any]


@router.get("/")
async def get_certifications():
    """Get all available certifications for users - returns grouped specs"""
    try:
        specs_collection = get_collection("cert_test_specs")
        items = list(specs_collection.find({}))
        
        # Group by cert_id
        grouped = {}
        for item in items:
            cert_id = item.get("cert_id")
            if not cert_id:
                continue
            diff = item.get("difficulty")
            if cert_id not in grouped:
                grouped[cert_id] = {
                    "cert_id": cert_id,
                    "difficulties": [],
                    "prerequisite_course_id": item.get("prerequisite_course_id", "") or "",
                }
            grouped[cert_id]["difficulties"].append({
                "name": diff,
                "question_count": int(item.get("question_count", 10)),
                "duration_minutes": int(item.get("duration_minutes", 30)),
                "pass_percentage": int(item.get("pass_percentage", 70)),
            })
        
        return list(grouped.values())
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch certifications: {str(e)}"
        )


@router.post("/start")
async def start_test(
    request: StartTestRequest,
    current_user=Depends(get_current_user)
):
    """Start a certification test"""
    try:
        certifications_collection = get_collection("certifications")
        attempts_collection = get_collection("certification_attempts")
        questions_collection = get_collection("questions")
        
        # Get certification spec
        cert_doc = certifications_collection.find_one({"_id": ObjectId(request.spec_id)})
        if not cert_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Certification not found"
            )
        
        cert_spec = CertificationSpec(**{**cert_doc, "_id": str(cert_doc["_id"])})
        
        # Check prerequisites (resolve slug or _id)
        prerequisite_course_id = cert_doc.get("prerequisite_course_id")
        if prerequisite_course_id:
            users_collection = get_collection("users")
            user_doc = users_collection.find_one({"_id": ObjectId(current_user.id)})
            completed_courses = user_doc.get("completed_courses", [])

            # Normalize: direct match on string _id
            prereq_id_str = str(prerequisite_course_id)

            # If direct match fails, try to resolve as a slug to _id
            if prereq_id_str not in completed_courses:
                courses_collection = get_collection("courses")
                # Try slug lookup first
                course_doc = courses_collection.find_one({"slug": prereq_id_str})
                if not course_doc:
                    # Try ObjectId if prereq provided is an _id-like string
                    try:
                        course_doc = courses_collection.find_one({"_id": ObjectId(prereq_id_str)})
                    except Exception:
                        course_doc = None

                if course_doc:
                    normalized_prereq_id = str(course_doc.get("_id"))
                else:
                    normalized_prereq_id = prereq_id_str

                if normalized_prereq_id not in completed_courses:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You have not completed the prerequisite course for this certification."
                    )
        
        # Check if user already has an active attempt
        existing_attempt = attempts_collection.find_one({
            "user_id": current_user.id,
            "spec_id": request.spec_id,
            "status": {"$in": ["started", "in_progress"]}
        })
        
        if existing_attempt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have an active attempt for this certification"
            )
        
        # Get questions for the certification
        if not cert_spec.question_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No questions available for this certification"
            )
        
        question_docs = list(questions_collection.find({
            "_id": {"$in": [ObjectId(qid) for qid in cert_spec.question_ids]}
        }))
        
        if len(question_docs) != len(cert_spec.question_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Some questions are missing"
            )
        
        # Prepare questions for frontend (remove correct answers)
        questions_for_frontend = []
        for qdoc in question_docs:
            question_data = {
                "_id": str(qdoc["_id"]),
                "title": qdoc.get("title", ""),
                "problem_statement": qdoc.get("problem_statement", ""),
                "type": qdoc.get("type", "multiple_choice"),
                "difficulty": qdoc.get("difficulty", "Easy"),
                "topic_name": qdoc.get("topic_name", ""),
                "options": qdoc.get("options", []),
                # Don't include correct_answer or solution
            }
            questions_for_frontend.append(question_data)
        
        # Create new attempt
        attempt_doc = {
            "user_id": current_user.id,
            "spec_id": request.spec_id,
            "status": "started",
            "start_time": datetime.utcnow(),
            "proctoring_logs": [],
            "behavior_score": 100,
            "test_score": None,
            "final_score": None,
            "answers": []
        }
        
        result = attempts_collection.insert_one(attempt_doc)
        attempt_id = str(result.inserted_id)
        
        return {
            "attempt_id": attempt_id,
            "certification": cert_spec,
            "questions": questions_for_frontend,
            "start_time": attempt_doc["start_time"].isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start test: {str(e)}"
        )


@router.post("/submit")
async def submit_test(
    request: SubmitTestRequest,
    current_user=Depends(get_current_user)
):
    """Submit a certification test"""
    try:
        attempts_collection = get_collection("certification_attempts")
        questions_collection = get_collection("questions")
        
        # Get attempt
        attempt_doc = attempts_collection.find_one({
            "_id": ObjectId(request.attempt_id),
            "user_id": current_user.id
        })
        
        if not attempt_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test attempt not found"
            )
        
        if attempt_doc["status"] == "submitted":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Test has already been submitted"
            )
        
        # Calculate test score
        correct_answers = 0
        total_questions = len(request.answers)
        
        for question_id, user_answer in request.answers.items():
            # Get the correct answer from the database
            question_doc = questions_collection.find_one({"_id": ObjectId(question_id)})
            if question_doc:
                correct_answer = question_doc.get("correct_answer")
                if user_answer == correct_answer:
                    correct_answers += 1
        
        test_score = int((correct_answers / total_questions) * 100) if total_questions > 0 else 0
        
        # Calculate final score (70% test score + 30% behavior score)
        behavior_score = attempt_doc.get("behavior_score", 100)
        final_score = int((test_score * 0.7) + (behavior_score * 0.3))
        
        # Update attempt
        update_data = {
            "status": "submitted",
            "end_time": datetime.utcnow(),
            "test_score": test_score,
            "final_score": final_score,
            "answers": [
                {"question_id": qid, "answer": ans} 
                for qid, ans in request.answers.items()
            ]
        }
        
        attempts_collection.update_one(
            {"_id": ObjectId(request.attempt_id)},
            {"$set": update_data}
        )
        
        return {
            "attempt_id": request.attempt_id,
            "test_score": test_score,
            "behavior_score": behavior_score,
            "final_score": final_score,
            "passed": final_score >= 85,  # Assuming 85% is passing
            "submitted_at": update_data["end_time"].isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit test: {str(e)}"
        )


@router.post("/event")
async def log_proctoring_event(
    request: ProctoringEventRequest,
    current_user=Depends(get_current_user)
):
    """Log a proctoring event during the test"""
    try:
        attempts_collection = get_collection("certification_attempts")
        
        # Get attempt
        attempt_doc = attempts_collection.find_one({
            "_id": ObjectId(request.attempt_id),
            "user_id": current_user.id
        })
        
        if not attempt_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test attempt not found"
            )
        
        if attempt_doc["status"] not in ["started", "in_progress"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot log events for completed tests"
            )
        
        # Add timestamp to event
        event_with_timestamp = {
            **request.event,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Update behavior score based on event type
        behavior_score = attempt_doc.get("behavior_score", 100)
        
        if request.event.get("type") == "tab_switch":
            behavior_score = max(0, behavior_score - 10)  # Deduct 10 points for tab switch
        elif request.event.get("type") == "face_not_detected":
            behavior_score = max(0, behavior_score - 5)   # Deduct 5 points for face not detected
        elif request.event.get("type") == "multiple_people":
            behavior_score = max(0, behavior_score - 15)  # Deduct 15 points for multiple people
        elif request.event.get("type") == "phone_detected":
            behavior_score = max(0, behavior_score - 20)  # Deduct 20 points for phone detected
        elif request.event.get("type") == "violation_detected":
            behavior_score = max(0, behavior_score - 10)  # Deduct 10 points for general violations
        elif request.event.get("type") == "excessive_noise":
            behavior_score = max(0, behavior_score - 5)   # Deduct 5 points for excessive noise
        
        # Update attempt
        attempts_collection.update_one(
            {"_id": ObjectId(request.attempt_id)},
            {
                "$push": {"proctoring_logs": event_with_timestamp},
                "$set": {
                    "behavior_score": behavior_score,
                    "status": "in_progress"
                }
            }
        )
        
        return {"status": "ok", "behavior_score": behavior_score}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to log event: {str(e)}"
        )


@router.get("/attempts", response_model=List[CertificationAttempt])
async def get_user_attempts(current_user=Depends(get_current_user)):
    """Get user's certification attempts"""
    try:
        attempts_collection = get_collection("certification_attempts")
        
        cursor = attempts_collection.find({"user_id": current_user.id}).sort("start_time", -1)
        attempts = []
        
        for doc in cursor:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            attempts.append(CertificationAttempt(**doc))
        
        return attempts
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch attempts: {str(e)}"
        )


@router.get("/attempts/{attempt_id}", response_model=CertificationAttempt)
async def get_attempt_details(
    attempt_id: str,
    current_user=Depends(get_current_user)
):
    """Get details of a specific attempt"""
    try:
        attempts_collection = get_collection("certification_attempts")
        
        attempt_doc = attempts_collection.find_one({
            "_id": ObjectId(attempt_id),
            "user_id": current_user.id
        })
        
        if not attempt_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attempt not found"
            )
        
        attempt_doc["id"] = str(attempt_doc["_id"])
        del attempt_doc["_id"]
        return CertificationAttempt(**attempt_doc)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch attempt: {str(e)}"
        )
