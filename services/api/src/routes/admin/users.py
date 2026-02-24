from typing import List, Optional
from fastapi import Depends, HTTPException, status
from bson import ObjectId
from ...database import get_collection
from ...models.user import User
from ...auth import require_admin_user, get_password_hash
from fastapi import APIRouter

router = APIRouter()
from pydantic import BaseModel, EmailStr, Field


class CreateUserRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: Optional[str] = "student"


@router.get("/users", response_model=List[dict])
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


@router.post("/users", response_model=dict, status_code=201)
async def create_user(payload: CreateUserRequest, _: User = Depends(require_admin_user)):
    users_col = get_collection("users")
    # Check existing email
    if users_col.find_one({"email": payload.email}):
        raise HTTPException(status_code=400, detail="Email already exists")

    user_doc = {
        "name": payload.name,
        "email": payload.email,
        "password_hash": get_password_hash(payload.password),
        "role": payload.role or "student",
        "avatar_url": None,
        "auth_provider": "email",
        "xp": 0,
        "level": 1,
        "enrolled_courses": [],
        "quiz_history": [],
        "badges": [],
        "created_at": __import__("datetime").datetime.utcnow(),
    }
    res = users_col.insert_one(user_doc)
    doc = users_col.find_one({"_id": res.inserted_id})
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    doc.pop("password_hash", None)
    return doc


@router.get("/users/{user_id}", response_model=dict)
async def get_user(user_id: str, _: User = Depends(require_admin_user)):
    users_col = get_collection("users")
    doc = users_col.find_one({"_id": ObjectId(user_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    doc["id"] = str(doc["_id"]) 
    del doc["_id"]
    doc.pop("password_hash", None)
    return doc


@router.put("/users/{user_id}", response_model=dict)
async def update_user(user_id: str, payload: dict, _: User = Depends(require_admin_user)):
    users_col = get_collection("users")
    # Never allow direct password_hash updates via this endpoint
    payload.pop("password_hash", None)
    res = users_col.update_one({"_id": ObjectId(user_id)}, {"$set": payload})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    doc = users_col.find_one({"_id": ObjectId(user_id)})
    doc["id"] = str(doc["_id"]) 
    del doc["_id"]
    doc.pop("password_hash", None)
    return doc


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(user_id: str, _: User = Depends(require_admin_user)):
    users_col = get_collection("users")
    res = users_col.delete_one({"_id": ObjectId(user_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return None


