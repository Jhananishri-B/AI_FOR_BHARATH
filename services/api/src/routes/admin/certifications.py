"""
Admin API for managing certifications
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime

from ...auth import require_admin_user
from ...database import get_collection
from ...models.certification import CertificationSpec, CertificationAttempt

router = APIRouter(tags=["admin-certifications"])


class CertificationCreateRequest(BaseModel):
    title: str
    description: str
    difficulty: str
    duration_minutes: int
    pass_percentage: int
    question_ids: List[str] = []


class CertificationUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    duration_minutes: Optional[int] = None
    pass_percentage: Optional[int] = None
    question_ids: Optional[List[str]] = None


class QuestionUpdateRequest(BaseModel):
    question_ids: List[str]


@router.post("/", response_model=CertificationSpec)
async def create_certification(
    request: CertificationCreateRequest,
    admin_user=Depends(require_admin_user)
):
    """Create a new certification specification"""
    try:
        certifications_collection = get_collection("certifications")
        
        # Validate difficulty
        valid_difficulties = ['Easy', 'Medium', 'Tough']
        if request.difficulty not in valid_difficulties:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Difficulty must be one of: {', '.join(valid_difficulties)}"
            )
        
        # Validate pass percentage
        if not 0 <= request.pass_percentage <= 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pass percentage must be between 0 and 100"
            )
        
        # Validate duration
        if request.duration_minutes <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Duration must be greater than 0"
            )
        
        # Check if questions exist
        if request.question_ids:
            questions_collection = get_collection("questions")
            existing_questions = questions_collection.count_documents({
                "_id": {"$in": [ObjectId(qid) for qid in request.question_ids]}
            })
            if existing_questions != len(request.question_ids):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Some question IDs do not exist"
                )
        
        # Create certification document
        cert_doc = {
            "title": request.title,
            "description": request.description,
            "difficulty": request.difficulty,
            "duration_minutes": request.duration_minutes,
            "pass_percentage": request.pass_percentage,
            "question_ids": request.question_ids,
            "created_at": datetime.utcnow(),
            "created_by": admin_user.id
        }
        
        result = certifications_collection.insert_one(cert_doc)
        cert_doc["id"] = str(result.inserted_id)
        del cert_doc["_id"]
        
        return CertificationSpec(**cert_doc)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create certification: {str(e)}"
        )


@router.get("/", response_model=List[CertificationSpec])
async def get_certifications(admin_user=Depends(require_admin_user)):
    """Get all certification specifications"""
    try:
        certifications_collection = get_collection("certifications")
        
        cursor = certifications_collection.find().sort("created_at", -1)
        certifications = []
        
        for doc in cursor:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            certifications.append(CertificationSpec(**doc))
        
        return certifications
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch certifications: {str(e)}"
        )


@router.get("/{cert_id}", response_model=CertificationSpec)
async def get_certification(
    cert_id: str,
    admin_user=Depends(require_admin_user)
):
    """Get a single certification specification"""
    try:
        certifications_collection = get_collection("certifications")
        
        cert_doc = certifications_collection.find_one({"_id": ObjectId(cert_id)})
        if not cert_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Certification not found"
            )
        
        cert_doc["id"] = str(cert_doc["_id"])
        del cert_doc["_id"]
        return CertificationSpec(**cert_doc)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch certification: {str(e)}"
        )


@router.put("/{cert_id}", response_model=CertificationSpec)
async def update_certification(
    cert_id: str,
    request: CertificationUpdateRequest,
    admin_user=Depends(require_admin_user)
):
    """Update a certification specification"""
    try:
        certifications_collection = get_collection("certifications")
        
        # Check if certification exists
        existing_cert = certifications_collection.find_one({"_id": ObjectId(cert_id)})
        if not existing_cert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Certification not found"
            )
        
        # Build update document
        update_doc = {}
        
        if request.title is not None:
            update_doc["title"] = request.title
        if request.description is not None:
            update_doc["description"] = request.description
        if request.difficulty is not None:
            valid_difficulties = ['Easy', 'Medium', 'Tough']
            if request.difficulty not in valid_difficulties:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Difficulty must be one of: {', '.join(valid_difficulties)}"
                )
            update_doc["difficulty"] = request.difficulty
        if request.duration_minutes is not None:
            if request.duration_minutes <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Duration must be greater than 0"
                )
            update_doc["duration_minutes"] = request.duration_minutes
        if request.pass_percentage is not None:
            if not 0 <= request.pass_percentage <= 100:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Pass percentage must be between 0 and 100"
                )
            update_doc["pass_percentage"] = request.pass_percentage
        if request.question_ids is not None:
            # Validate questions exist
            if request.question_ids:
                questions_collection = get_collection("questions")
                existing_questions = questions_collection.count_documents({
                    "_id": {"$in": [ObjectId(qid) for qid in request.question_ids]}
                })
                if existing_questions != len(request.question_ids):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Some question IDs do not exist"
                    )
            update_doc["question_ids"] = request.question_ids
        
        if not update_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        update_doc["updated_at"] = datetime.utcnow()
        update_doc["updated_by"] = admin_user.id
        
        # Update the certification
        certifications_collection.update_one(
            {"_id": ObjectId(cert_id)},
            {"$set": update_doc}
        )
        
        # Return updated certification
        updated_cert = certifications_collection.find_one({"_id": ObjectId(cert_id)})
        updated_cert["id"] = str(updated_cert["_id"])
        del updated_cert["_id"]
        
        return CertificationSpec(**updated_cert)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update certification: {str(e)}"
        )


@router.delete("/{cert_id}")
async def delete_certification(
    cert_id: str,
    admin_user=Depends(require_admin_user)
):
    """Delete a certification specification"""
    try:
        certifications_collection = get_collection("certifications")
        
        # Check if certification exists
        existing_cert = certifications_collection.find_one({"_id": ObjectId(cert_id)})
        if not existing_cert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Certification not found"
            )
        
        # Check if there are any attempts for this certification
        attempts_collection = get_collection("certification_attempts")
        attempt_count = attempts_collection.count_documents({"spec_id": cert_id})
        
        if attempt_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete certification with {attempt_count} existing attempts"
            )
        
        # Delete the certification
        result = certifications_collection.delete_one({"_id": ObjectId(cert_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Certification not found"
            )
        
        return {"message": "Certification deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete certification: {str(e)}"
        )


@router.post("/{cert_id}/questions")
async def update_certification_questions(
    cert_id: str,
    request: QuestionUpdateRequest,
    admin_user=Depends(require_admin_user)
):
    """Update questions for a certification"""
    try:
        certifications_collection = get_collection("certifications")
        
        # Check if certification exists
        existing_cert = certifications_collection.find_one({"_id": ObjectId(cert_id)})
        if not existing_cert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Certification not found"
            )
        
        # Validate questions exist
        if request.question_ids:
            questions_collection = get_collection("questions")
            existing_questions = questions_collection.count_documents({
                "_id": {"$in": [ObjectId(qid) for qid in request.question_ids]}
            })
            if existing_questions != len(request.question_ids):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Some question IDs do not exist"
                )
        
        # Update the certification
        certifications_collection.update_one(
            {"_id": ObjectId(cert_id)},
            {
                "$set": {
                    "question_ids": request.question_ids,
                    "updated_at": datetime.utcnow(),
                    "updated_by": admin_user.id
                }
            }
        )
        
        return {"message": "Questions updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update questions: {str(e)}"
        )


@router.get("/{cert_id}/attempts", response_model=List[CertificationAttempt])
async def get_certification_attempts(
    cert_id: str,
    admin_user=Depends(require_admin_user)
):
    """Get all attempts for a certification"""
    try:
        attempts_collection = get_collection("certification_attempts")
        
        cursor = attempts_collection.find({"spec_id": cert_id}).sort("start_time", -1)
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
