from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from ..database import get_collection
from ..models.user import User
from ..auth import require_admin_user, get_password_hash
from pydantic import BaseModel, EmailStr, Field

router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])

class CreateUserRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: str = "student"

@router.get("/", response_model=List[dict])
async def list_users(_: User = Depends(require_admin_user)):
    users_col = get_collection("users")
    users = []
    for u in users_col.find().sort("created_at", -1):
        u["id"] = str(u["_id"]) 
        del u["_id"]
        # Do not expose password hash
        u.pop("password_hash", None)
        users.append(u)
    return users

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_user(payload: CreateUserRequest, _: User = Depends(require_admin_user)):
    users_col = get_collection("users")
    # Check existing email
    if users_col.find_one({"email": payload.email}):
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Hash password
    try:
        password_hash = get_password_hash(payload.password)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Password hashing error: {str(e)}")
    
    # Create user document
    user_doc = {
        "name": payload.name,
        "email": payload.email,
        "password": password_hash,  # Store in password field
        "role": payload.role,
        "xp": 0,
        "level": 1,
        "badges": [],
        "enrolled_courses": [],
        "quiz_history": [],
        "created_at": __import__('datetime').datetime.utcnow()
    }
    
    # Insert user
    result = users_col.insert_one(user_doc)
    user_doc["id"] = str(result.inserted_id)
    del user_doc["_id"]
    user_doc.pop("password", None)  # Don't return password
    return user_doc

@router.get("/{user_id}", response_model=dict)
async def get_user(user_id: str, _: User = Depends(require_admin_user)):
    users_col = get_collection("users")
    doc = users_col.find_one({"_id": ObjectId(user_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    doc["id"] = str(doc["_id"]) 
    del doc["_id"]
    doc.pop("password", None)  # Don't return password
    return doc

@router.put("/{user_id}", response_model=dict)
async def update_user(user_id: str, payload: dict, _: User = Depends(require_admin_user)):
    users_col = get_collection("users")
    # Never allow direct password updates via this endpoint
    payload.pop("password", None)
    res = users_col.update_one({"_id": ObjectId(user_id)}, {"$set": payload})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    doc = users_col.find_one({"_id": ObjectId(user_id)})
    doc["id"] = str(doc["_id"]) 
    del doc["_id"]
    doc.pop("password", None)  # Don't return password
    return doc

@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: str, _: User = Depends(require_admin_user)):
    users_col = get_collection("users")
    res = users_col.delete_one({"_id": ObjectId(user_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return None
