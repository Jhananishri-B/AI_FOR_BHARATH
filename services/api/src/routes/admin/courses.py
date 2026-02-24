from typing import List, Optional, Dict, Any
from fastapi import Depends, HTTPException, status, UploadFile, File
from bson import ObjectId
from pydantic import BaseModel
from datetime import datetime
import uuid
import re
import json
from ...database import get_collection
from ...models.user import User
from ...auth import require_admin_user
from fastapi import APIRouter

router = APIRouter(tags=["admin-courses"])


def slugify(title: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9\s-]", "", title).strip().lower()
    slug = re.sub(r"[\s-]+", "-", slug)
    return slug


class CardRequest(BaseModel):
    type: str  # "theory", "mcq", "code", "fill-in-blank"
    content: str
    xp_reward: int = 10
    explanation: Optional[str] = None
    
    # MCQ specific fields
    choices: Optional[List[str]] = None
    correct_choice_index: Optional[int] = None
    
    # Code specific fields
    starter_code: Optional[str] = None
    test_cases: Optional[List[Dict[str, Any]]] = None
    is_practice_problem: bool = False  # Whether this code card should appear in Practice Zone
    difficulty: Optional[str] = "Medium"  # Easy, Medium, Hard
    tags: Optional[List[str]] = []  # Tags for filtering
    
    # Fill-in-blank specific fields
    blanks: Optional[List[str]] = None
    correct_answers: Optional[List[str]] = None


class TopicRequest(BaseModel):
    title: str
    content: str = ""
    xp_reward: int = 50
    cards: List[CardRequest] = []


class ModuleRequest(BaseModel):
    title: str
    order: int
    topics: List[TopicRequest] = []


class CreateCourseRequest(BaseModel):
    title: str
    description: str
    xp_reward: int
    modules: List[ModuleRequest] = []


@router.get("/", response_model=List[dict])
async def list_courses(_: User = Depends(require_admin_user)):
    """Get all courses for admin management"""
    courses = get_collection("courses")
    course_list = list(courses.find().sort("title", 1))
    
    # Convert ObjectId to string for JSON serialization
    for course in course_list:
        course["id"] = str(course["_id"])
        del course["_id"]
    
    return course_list


@router.get("/{course_id}/topics", response_model=List[dict])
async def get_topics_for_course(course_id: str, _: User = Depends(require_admin_user)):
    """Get all topics for a specific course"""
    courses = get_collection("courses")
    course = courses.find_one({"_id": ObjectId(course_id)})
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    topics = []
    for module in course.get("modules", []):
        for topic in module.get("topics", []):
            topics.append({
                "topic_id": topic.get("topic_id"),
                "title": topic.get("title"),
                "module_title": module.get("title"),
                "module_id": module.get("module_id")
            })
    
    return topics


@router.post("/import-json", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_course_json(file: UploadFile = File(...), _: User = Depends(require_admin_user)):
    """Upload a course from JSON file"""
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="File must be a JSON file")
    
    try:
        # Read and parse JSON file
        content = await file.read()
        course_data = json.loads(content.decode('utf-8'))
        
        # Validate required fields
        required_fields = ['title', 'description', 'xp_reward', 'modules']
        for field in required_fields:
            if field not in course_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Generate slug and check duplicates
        course_slug = slugify(course_data['title'])
        courses = get_collection("courses")
        existing = courses.find_one({"slug": course_slug})
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Course with this title already exists")
        
        # Build course document
        course_doc = {
            "title": course_data['title'],
            "description": course_data['description'],
            "slug": course_slug,
            "xp_reward": course_data['xp_reward'],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "modules": []
        }
        
        # Process modules
        for module_data in course_data.get('modules', []):
            module_id = str(uuid.uuid4())
            topics = []
            
            for topic_data in module_data.get('topics', []):
                topic_id = str(uuid.uuid4())
                cards = []
                
                for card_data in topic_data.get('cards', []):
                    card_id = str(uuid.uuid4())
                    
                    # Handle both string format (legacy) and object format
                    if isinstance(card_data, str):
                        # Legacy format: card is just a string
                        card_doc = {
                            "card_id": card_id,
                            "type": "theory",
                            "content": card_data,
                            "xp_reward": 10,
                            "explanation": "",
                        }
                    else:
                        # Object format: card has properties
                        card_doc = {
                            "card_id": card_id,
                            "type": "fill-in-blank" if card_data.get('type') == "fill_blank" else card_data.get('type', 'theory'),
                            "content": card_data.get('content', ''),
                            "xp_reward": card_data.get('xp_reward', 10),
                            "explanation": card_data.get('explanation', ''),
                        }
                    
                    # Add type-specific fields (only for object format)
                    if not isinstance(card_data, str):
                        if card_data.get('type') == "mcq" and card_data.get('choices'):
                            card_doc["choices"] = card_data['choices']
                            card_doc["correct_choice_index"] = card_data.get('correct_choice_index', 0)
                        elif card_data.get('type') == "code":
                            card_doc["starter_code"] = card_data.get('starter_code', '')
                            card_doc["test_cases"] = card_data.get('test_cases', [])
                            card_doc["is_practice_problem"] = card_data.get('is_practice_problem', False)
                            card_doc["difficulty"] = card_data.get('difficulty', "Medium")
                            card_doc["tags"] = card_data.get('tags', [])
                        elif card_doc["type"] == "fill-in-blank":
                            # Handle both old format (fill_blank with answer) and new format (fill-in-blank with correct_answers)
                            if card_data.get('type') == "fill_blank" and card_data.get('answer'):
                                # Old format: single answer field
                                card_doc["correct_answers"] = [card_data['answer']]
                                card_doc["blanks"] = ["blank"]  # Default blank identifier
                            else:
                                # New format: correct_answers and blanks arrays
                                card_doc["blanks"] = card_data.get('blanks', [])
                                card_doc["correct_answers"] = card_data.get('correct_answers', [])
                    
                    cards.append(card_doc)
                
                topics.append({
                    "topic_id": topic_id,
                    "title": topic_data.get('title', ''),
                    "content": topic_data.get('content', ''),
                    "xp_reward": topic_data.get('xp_reward', 50),
                    "cards": cards
                })
            
            course_doc["modules"].append({
                "module_id": module_id,
                "title": module_data.get('title', ''),
                "order": module_data.get('order', 0),
                "topics": topics
            })
        
        # Insert course into database
        result = courses.insert_one(course_doc)
        course_doc["id"] = str(result.inserted_id)
        del course_doc["_id"]
        
        return course_doc
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error processing file: {str(e)}")
        print(f"Traceback: {error_details}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_course(request: CreateCourseRequest, _: User = Depends(require_admin_user)):
    courses = get_collection("courses")

    # Generate slug and check duplicates
    course_slug = slugify(request.title)
    existing = courses.find_one({"slug": course_slug})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Course with this title already exists")

    # Build nested modules/topics/cards with ids
    modules = []
    for module in request.modules:
        module_id = str(uuid.uuid4())
        topics = []
        for topic in module.topics:
            topic_id = str(uuid.uuid4())
            cards = []
            for card in topic.cards:
                card_id = str(uuid.uuid4())
                card_doc = {
                    "card_id": card_id,
                    "type": card.type,
                    "content": card.content,
                    "xp_reward": card.xp_reward,
                    "explanation": card.explanation,
                }
                
                # Add type-specific fields
                if card.type == "mcq" and card.choices:
                    card_doc["choices"] = card.choices
                    card_doc["correct_choice_index"] = card.correct_choice_index
                elif card.type == "code":
                    card_doc["starter_code"] = card.starter_code
                    card_doc["test_cases"] = card.test_cases or []
                    card_doc["is_practice_problem"] = card.is_practice_problem
                    card_doc["difficulty"] = card.difficulty or "Medium"
                    card_doc["tags"] = card.tags or []
                elif card.type == "fill-in-blank":
                    card_doc["blanks"] = card.blanks or []
                    card_doc["correct_answers"] = card.correct_answers or []
                
                cards.append(card_doc)
            
            topics.append({
                "topic_id": topic_id,
                "title": topic.title,
                "xp_reward": topic.xp_reward,
                "cards": cards,
            })
        
        modules.append({
            "module_id": module_id,
            "title": module.title,
            "order": module.order,
            "topics": topics,
        })

    now = datetime.utcnow()
    course_doc = {
        "title": request.title,
        "slug": course_slug,
        "description": request.description,
        "xp_reward": request.xp_reward,
        "modules": modules,
        "created_at": now,
        "updated_at": now
    }

    res = courses.insert_one(course_doc)
    doc = courses.find_one({"_id": res.inserted_id})
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc


@router.put("/{course_id}", response_model=dict)
async def update_course(course_id: str, request: CreateCourseRequest, _: User = Depends(require_admin_user)):
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"DEBUG: update_course called with course_id: {course_id}")
    logger.info(f"DEBUG: request title: {request.title}")
    logger.info(f"DEBUG: modules count: {len(request.modules)}")
    
    courses = get_collection("courses")
    
    # Check if course exists
    existing = courses.find_one({"_id": ObjectId(course_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Generate new slug if title changed
    new_slug = slugify(request.title)
    if existing.get("title") != request.title:
        # Check if new slug conflicts with other courses
        conflict = courses.find_one({"slug": new_slug, "_id": {"$ne": ObjectId(course_id)}})
        if conflict:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Course with this title already exists")
    
    # Build nested modules/topics/cards with ids (reuse existing IDs where possible)
    modules = []
    for module in request.modules:
        # Try to preserve existing module ID if it exists
        module_id = module.id if hasattr(module, 'id') and module.id else str(uuid.uuid4())
        topics = []
        for topic in module.topics:
            # Try to preserve existing topic ID if it exists
            topic_id = topic.id if hasattr(topic, 'id') and topic.id else str(uuid.uuid4())
            cards = []
            for card in topic.cards:
                # Try to preserve existing card ID if it exists
                card_id = card.card_id if hasattr(card, 'card_id') and card.card_id else str(uuid.uuid4())
                card_doc = {
                    "card_id": card_id,
                    "type": card.type,
                    "content": card.content,
                    "xp_reward": card.xp_reward,
                    "explanation": card.explanation,
                }
                
                # Add type-specific fields
                if card.type == "mcq" and card.choices:
                    card_doc["choices"] = card.choices
                    card_doc["correct_choice_index"] = card.correct_choice_index
                elif card.type == "code":
                    card_doc["starter_code"] = card.starter_code
                    card_doc["test_cases"] = card.test_cases or []
                    card_doc["is_practice_problem"] = getattr(card, 'is_practice_problem', False)
                    card_doc["difficulty"] = getattr(card, 'difficulty', "Medium")
                    card_doc["tags"] = getattr(card, 'tags', [])
                elif card.type == "fill-in-blank":
                    card_doc["blanks"] = card.blanks or []
                    card_doc["correct_answers"] = card.correct_answers or []
                
                cards.append(card_doc)
            
            topics.append({
                "topic_id": topic_id,
                "title": topic.title,
                "content": topic.content,
                "xp_reward": topic.xp_reward,
                "cards": cards
            })
        
        modules.append({
            "module_id": module_id,
            "title": module.title,
            "order": module.order,
            "topics": topics
        })
    
    # Update the course
    update_data = {
        "title": request.title,
        "description": request.description,
        "slug": new_slug,
        "xp_reward": request.xp_reward,
        "modules": modules,
        "updated_at": datetime.utcnow()
    }
    
    courses.update_one({"_id": ObjectId(course_id)}, {"$set": update_data})
    
    # Return updated course
    doc = courses.find_one({"_id": ObjectId(course_id)})
    doc["id"] = str(doc["_id"]) 
    del doc["_id"]
    return doc


@router.get("/{course_id}", response_model=dict)
async def get_course(course_id: str, _: User = Depends(require_admin_user)):
    courses = get_collection("courses")
    doc = courses.find_one({"_id": ObjectId(course_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Course not found")
    doc["id"] = str(doc["_id"]) 
    del doc["_id"]
    return doc


@router.delete("/{course_id}", status_code=204)
async def delete_course(course_id: str, _: User = Depends(require_admin_user)):
    courses = get_collection("courses")
    res = courses.delete_one({"_id": ObjectId(course_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    # Also consider deleting quizzes referencing this course in a real system


