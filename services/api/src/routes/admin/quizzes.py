from typing import List
from fastapi import Depends, HTTPException
from bson import ObjectId
from ...database import get_collection
from ...models.user import User
from ...auth import require_admin_user
from fastapi import APIRouter

router = APIRouter()


@router.post("/quizzes", response_model=dict)
async def create_quiz(payload: dict, _: User = Depends(require_admin_user)):
    quizzes = get_collection("quizzes")
    res = quizzes.insert_one(payload)
    doc = quizzes.find_one({"_id": res.inserted_id})
    doc["id"] = str(doc["_id"]) 
    del doc["_id"]
    return doc


@router.put("/quizzes/{quiz_id}", response_model=dict)
async def update_quiz(quiz_id: str, payload: dict, _: User = Depends(require_admin_user)):
    quizzes = get_collection("quizzes")
    res = quizzes.update_one({"_id": ObjectId(quiz_id)}, {"$set": payload})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Quiz not found")
    doc = quizzes.find_one({"_id": ObjectId(quiz_id)})
    doc["id"] = str(doc["_id"]) 
    del doc["_id"]
    return doc


@router.delete("/quizzes/{quiz_id}", status_code=204)
async def delete_quiz(quiz_id: str, _: User = Depends(require_admin_user)):
    quizzes = get_collection("quizzes")
    res = quizzes.delete_one({"_id": ObjectId(quiz_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return None


