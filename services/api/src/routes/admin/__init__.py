from fastapi import APIRouter
from . import courses, quizzes, problems
from . import users as users_admin
from fastapi import Depends
from ...auth import require_admin_user
from . import problems as problems_admin
from . import certifications
from . import proctoring

router = APIRouter(tags=["admin"])

# Include admin sub-routers
router.include_router(courses.router, prefix="/courses", tags=["admin-courses"])
router.include_router(quizzes.router, prefix="/quizzes", tags=["admin-quizzes"])
router.include_router(problems_admin.router, prefix="/problems", tags=["admin-problems"])
router.include_router(certifications.router, prefix="/certifications", tags=["admin-certifications"])
router.include_router(proctoring.router, prefix="/proctoring", tags=["admin-proctoring"])

@router.get("/metrics", dependencies=[Depends(require_admin_user)])
async def get_admin_metrics():
    from ...database import get_collection
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    since = now - timedelta(days=7)

    users = get_collection("users")
    courses = get_collection("courses")
    questions = get_collection("questions")

    total_users = users.count_documents({})
    total_courses = courses.count_documents({})
    total_problems = questions.count_documents({"type": "code"})

    # Quiz submissions in last 7 days
    recent_quizzes = list(users.aggregate([
        {"$unwind": {"path": "$quiz_history", "preserveNullAndEmptyArrays": False}},
        {"$match": {"quiz_history.date": {"$gte": since}}},
        {"$group": {"_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$quiz_history.date"}}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]))

    # Top weak topics last 7 days (by wrong_questions count)
    from bson import ObjectId
    topic_counts = {}
    for doc in users.find({"quiz_history": {"$exists": True}}):
        for qh in doc.get("quiz_history", []):
            if qh.get("date") and qh["date"] >= since:
                for w in qh.get("wrong_questions", []) or []:
                    qid = w.get("q_id") if isinstance(w, dict) else w
                    if not qid:
                        continue
                    qdoc = questions.find_one({"_id": ObjectId(qid)}, {"topic_id": 1, "topic_name": 1})
                    if qdoc:
                        tid = qdoc.get("topic_id") or qdoc.get("topic_name") or "unknown"
                        topic_counts[tid] = topic_counts.get(tid, 0) + 1

    top_weak_topics = sorted([{"topic_id": k, "mistakes": v} for k, v in topic_counts.items()], key=lambda x: x["mistakes"], reverse=True)[:5]

    return {
        "totals": {
            "users": total_users,
            "courses": total_courses,
            "problems": total_problems
        },
        "recent_quiz_activity": recent_quizzes,
        "top_weak_topics": top_weak_topics
    }

