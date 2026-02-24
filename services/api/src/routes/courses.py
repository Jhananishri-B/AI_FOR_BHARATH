from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from ..models.course import Course
from ..models.user import User
from ..auth import get_current_user_optional
from ..database import get_collection

router = APIRouter(prefix="/api/courses", tags=["courses"])

@router.get("/", response_model=List[dict])
async def get_courses(current_user: Optional[User] = Depends(get_current_user_optional)):
    """Get all courses"""
    try:
        courses_collection = get_collection("courses")
        quizzes_collection = get_collection("quizzes")
        courses = list(courses_collection.find().sort("title", 1))
        
        # Convert ObjectId to string for JSON serialization and add quiz info
        for course in courses:
            course["id"] = str(course["_id"])
            del course["_id"]
            
            # Find quiz for this course
            quiz = quizzes_collection.find_one({"course_id": course["id"]})
            if quiz:
                course["quiz_id"] = str(quiz["_id"])
            else:
                course["quiz_id"] = None
        
        return courses
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching courses: {str(e)}"
        )

@router.get("/{slug}", response_model=dict)
async def get_course_by_slug(slug: str, current_user: Optional[User] = Depends(get_current_user_optional)):
    """Get course details by slug"""
    try:
        courses_collection = get_collection("courses")
        quizzes_collection = get_collection("quizzes")
        course = courses_collection.find_one({"slug": slug})
        
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        # Convert ObjectId to string for JSON serialization
        course["id"] = str(course["_id"])
        del course["_id"]
        
        # Find quiz for this course
        quiz = quizzes_collection.find_one({"course_id": course["id"]})
        if quiz:
            course["quiz_id"] = str(quiz["_id"])
        else:
            course["quiz_id"] = None
        
        return course
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching course: {str(e)}"
        )
