"""
Admin routes for proctoring review
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime

from ...auth import require_admin_user
from ...database import get_collection

router = APIRouter(tags=["admin-proctoring"])


class ProctoringLogsResponse(BaseModel):
    attempt_id: str
    user_id: str
    certification_title: str
    proctoring_logs: List[dict]
    behavior_score: int
    final_score: Optional[int]
    test_score: Optional[int]
    status: str
    start_time: datetime
    end_time: Optional[datetime]


class ProctoringReviewUpdate(BaseModel):
    behavior_score_override: Optional[int] = None
    admin_notes: Optional[str] = None
    reviewed_by: str


@router.get("/attempts/{attempt_id}/proctoring-logs")
async def get_proctoring_logs(
    attempt_id: str,
    current_user=Depends(require_admin_user)
):
    """Get proctoring logs for a specific attempt (admin only)"""
    try:
        attempts_collection = get_collection("cert_attempts")  # Fixed: changed from certification_attempts
        certifications_collection = get_collection("certifications")
        users_collection = get_collection("users")
        
        # Get attempt
        attempt_doc = attempts_collection.find_one({"_id": ObjectId(attempt_id)})
        
        if not attempt_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attempt not found"
            )
        
        # Get certification info
        cert_doc = certifications_collection.find_one({"_id": ObjectId(attempt_doc["spec_id"])})
        certification_title = cert_doc.get("title", "Unknown Certification") if cert_doc else "Unknown"
        
        # Get user info
        user_doc = users_collection.find_one({"_id": ObjectId(attempt_doc["user_id"])})
        user_name = user_doc.get("name", "Unknown User") if user_doc else "Unknown"
        
        return {
            "attempt_id": str(attempt_doc["_id"]),
            "user_id": attempt_doc["user_id"],
            "user_name": user_name,
            "certification_title": certification_title,
            "proctoring_logs": attempt_doc.get("proctoring_logs", []),
            "behavior_score": attempt_doc.get("behavior_score", 100),
            "final_score": attempt_doc.get("final_score"),
            "test_score": attempt_doc.get("test_score"),
            "status": attempt_doc.get("status", "unknown"),
            "start_time": attempt_doc.get("start_time"),
            "end_time": attempt_doc.get("end_time")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch proctoring logs: {str(e)}"
        )


@router.get("/attempts")
async def get_all_attempts(
    status_filter: Optional[str] = None,
    current_user=Depends(require_admin_user)
):
    """Get all certification attempts with filtering (admin only)"""
    try:
        attempts_collection = get_collection("cert_attempts")  # Fixed: changed from certification_attempts
        certifications_collection = get_collection("certifications")
        users_collection = get_collection("users")
        
        # Build query
        query = {}
        if status_filter:
            query["status"] = status_filter
        
        # Get attempts
        cursor = attempts_collection.find(query).sort("start_time", -1).limit(100)
        attempts = []
        
        for doc in cursor:
            # Get certification info
            cert_doc = certifications_collection.find_one({"_id": ObjectId(doc["spec_id"])})
            certification_title = cert_doc.get("title", "Unknown") if cert_doc else "Unknown"
            
            # Get user info
            user_doc = users_collection.find_one({"_id": ObjectId(doc["user_id"])})
            user_name = user_doc.get("name", "Unknown") if user_doc else "Unknown"
            
            # Count violations
            violation_count = len([log for log in doc.get("proctoring_logs", []) if log.get("type") == "violation_detected"])
            
            attempts.append({
                "attempt_id": str(doc["_id"]),
                "user_id": doc["user_id"],
                "user_name": user_name,
                "certification_title": certification_title,
                "status": doc.get("status", "unknown"),
                "behavior_score": doc.get("behavior_score", 100),
                "final_score": doc.get("final_score"),
                "test_score": doc.get("test_score"),
                "violation_count": violation_count,
                "start_time": doc.get("start_time"),
                "end_time": doc.get("end_time")
            })
        
        return {"attempts": attempts}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch attempts: {str(e)}"
        )


@router.put("/attempts/{attempt_id}/review")
async def update_proctoring_review(
    attempt_id: str,
    update: ProctoringReviewUpdate,
    current_user=Depends(require_admin_user)
):
    """Update proctoring review with admin override"""
    try:
        attempts_collection = get_collection("cert_attempts")  # Fixed: changed from certification_attempts
        
        # Get attempt
        attempt_doc = attempts_collection.find_one({"_id": ObjectId(attempt_id)})
        
        if not attempt_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attempt not found"
            )
        
        # Prepare update
        update_data = {
            "admin_reviewed": True,
            "admin_reviewed_at": datetime.utcnow(),
            "reviewed_by": update.reviewed_by
        }
        
        if update.behavior_score_override is not None:
            update_data["behavior_score"] = update.behavior_score_override
            update_data["behavior_score_override"] = update.behavior_score_override
        
        if update.admin_notes:
            update_data["admin_notes"] = update.admin_notes
        
        # Log review action
        review_log = {
            "type": "admin_review",
            "timestamp": datetime.utcnow().isoformat(),
            "admin_user": update.reviewed_by,
            "behavior_score_override": update.behavior_score_override,
            "notes": update.admin_notes
        }
        
        attempts_collection.update_one(
            {"_id": ObjectId(attempt_id)},
            {
                "$set": update_data,
                "$push": {"proctoring_logs": review_log}
            }
        )
        
        return {"status": "updated", "attempt_id": attempt_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update review: {str(e)}"
        )


@router.get("/attempts/{attempt_id}/violations")
async def get_violations_summary(
    attempt_id: str,
    current_user=Depends(require_admin_user)
):
    """Get summary of violations for an attempt"""
    try:
        attempts_collection = get_collection("cert_attempts")  # Fixed: changed from certification_attempts
        
        attempt_doc = attempts_collection.find_one({"_id": ObjectId(attempt_id)})
        
        if not attempt_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attempt not found"
            )
        
        logs = attempt_doc.get("proctoring_logs", [])
        
        # Summarize violations
        violation_counts = {}
        for log in logs:
            if log.get("type") == "violation_detected":
                violations = log.get("violations", [])
                for v in violations:
                    violation_counts[v] = violation_counts.get(v, 0) + 1
        
        return {
            "attempt_id": str(attempt_doc["_id"]),
            "violation_counts": violation_counts,
            "total_violations": sum(violation_counts.values()),
            "behavior_score": attempt_doc.get("behavior_score", 100)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch violations: {str(e)}"
        )


@router.get("/statistics")
async def get_proctoring_statistics(
    current_user=Depends(require_admin_user)
):
    """Get aggregate proctoring statistics"""
    try:
        attempts_collection = get_collection("cert_attempts")  # Fixed: changed from certification_attempts
        
        # Get all attempts
        all_attempts = list(attempts_collection.find({}))
        
        total_attempts = len(all_attempts)
        safe_count = 0
        warning_count = 0
        violation_count = 0
        total_noise_events = 0
        total_camera_events = 0
        
        for attempt in all_attempts:
            behavior_score = attempt.get("behavior_score", 100)
            score_diff = 100 - behavior_score
            
            if score_diff < 5:
                safe_count += 1
            elif score_diff < 10:
                warning_count += 1
            else:
                violation_count += 1
            
            # Count specific violation types
            logs = attempt.get("proctoring_logs", [])
            for log in logs:
                if log.get("type") == "violation_detected":
                    violations = log.get("violations", [])
                    for v in violations:
                        if v == "noise_detected":
                            total_noise_events += 1
                        elif v in ["looking_away", "multiple_faces", "no_face"]:
                            total_camera_events += 1
        
        return {
            "total_candidates": total_attempts,
            "safe_users": safe_count,
            "warnings": warning_count,
            "violations": violation_count,
            "noise_events": total_noise_events,
            "camera_events": total_camera_events
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch statistics: {str(e)}"
        )
