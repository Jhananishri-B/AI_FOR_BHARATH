from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi import status
from typing import List
from datetime import datetime
import json
from bson import ObjectId

# Reuse existing auth and db helpers (relative imports from routes/)
from ..auth import require_admin_user  # type: ignore
from ..database import get_collection  # type: ignore

router = APIRouter(prefix="/api/admin/cert-tests", tags=["admin-cert-tests"])


def _parse_questions(file_bytes: bytes) -> List[dict]:
    try:
        data = json.loads(file_bytes.decode("utf-8"))
        if not isinstance(data, list):
            raise ValueError("JSON root must be a list of questions")
        parsed: List[dict] = []
        for q in data:
            if not isinstance(q, dict):
                continue
            qtype = (q.get("type") or "mcq").lower()
            title = q.get("title") or q.get("problem_statement")
            if not title:
                continue
            if qtype == "mcq":
                options = q.get("options", [])
                if not isinstance(options, list) or len(options) == 0:
                    continue
                # correct_answer must be an index (int)
                if not isinstance(q.get("correct_answer"), int):
                    continue
                parsed.append(q)
            elif qtype == "code":
                # Require test_cases list
                tcs = q.get("test_cases")
                if not isinstance(tcs, list) or len(tcs) == 0:
                    continue
                parsed.append(q)
            else:
                # Unknown type - skip
                continue
        return parsed
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid JSON: {e}")


@router.get("/banks")
async def list_banks(admin_user=Depends(require_admin_user)):
    col = get_collection("cert_test_banks")
    items = list(col.find({}, {"questions": 0}))
    for it in items:
        it["id"] = str(it.pop("_id"))
    return items


@router.post("/banks")
async def upload_banks(files: List[UploadFile] = File(...), admin_user=Depends(require_admin_user)):
    col = get_collection("cert_test_banks")
    saved = []
    for f in files:
        content = await f.read()
        questions = _parse_questions(content)
        doc = {
            "file_name": f.filename,
            "display_name": f.filename,
            "question_count": len(questions),
            "questions": questions,
            "created_at": datetime.utcnow(),
            "created_by": str(admin_user.id),
        }
        inserted = col.insert_one(doc)
        saved.append({"id": str(inserted.inserted_id), "file_name": f.filename, "question_count": len(questions)})
    return {"uploaded": saved}


@router.get("/banks/{bank_id}")
async def get_bank(bank_id: str, admin_user=Depends(require_admin_user)):
    """Get a specific question bank with all questions"""
    from bson import ObjectId
    col = get_collection("cert_test_banks")
    try:
        bank = col.find_one({"_id": ObjectId(bank_id)})
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid bank ID")
    
    if not bank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bank not found")
    
    bank["id"] = str(bank.pop("_id"))
    return bank


@router.delete("/banks/{bank_id}")
async def delete_bank(bank_id: str, admin_user=Depends(require_admin_user)):
    """Delete a question bank"""
    from bson import ObjectId
    col = get_collection("cert_test_banks")
    try:
        result = col.delete_one({"_id": ObjectId(bank_id)})
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid bank ID")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bank not found")
    
    return {"message": "Bank deleted successfully"}


@router.put("/banks/{bank_id}")
async def update_bank(bank_id: str, payload: dict, admin_user=Depends(require_admin_user)):
    """Update a question bank"""
    from bson import ObjectId
    col = get_collection("cert_test_banks")
    
    # Extract updatable fields
    update_fields = {}
    if "display_name" in payload:
        update_fields["display_name"] = payload["display_name"]
    if "questions" in payload:
        update_fields["questions"] = payload["questions"]
        update_fields["question_count"] = len(payload["questions"])
    
    if not update_fields:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    
    update_fields["updated_at"] = datetime.utcnow()
    update_fields["updated_by"] = str(admin_user.id)
    
    try:
        result = col.update_one({"_id": ObjectId(bank_id)}, {"$set": update_fields})
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid bank ID")
    
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bank not found")
    
    return {"message": "Bank updated successfully"}


@router.get("/specs")
async def list_specs(admin_user=Depends(require_admin_user)):
    col = get_collection("cert_test_specs")
    items = list(col.find({}))
    for it in items:
        it["_id"] = str(it["_id"])
    return items


@router.get("/specs/{cert_id}/{difficulty}")
async def get_spec(cert_id: str, difficulty: str, admin_user=Depends(require_admin_user)):
    col = get_collection("cert_test_specs")
    spec = col.find_one({"cert_id": cert_id, "difficulty": difficulty})
    if not spec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spec not found")
    spec["_id"] = str(spec["_id"])
    return spec


@router.post("/specs")
async def create_spec(payload: dict, admin_user=Depends(require_admin_user)):
    required = ["cert_id", "difficulty", "question_count", "duration_minutes", "pass_percentage"]
    for key in required:
        if key not in payload:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Missing field: {key}")

    # Support both bank_ids (MCQ) and problem_ids (coding problems)
    if "bank_ids" not in payload:
        payload["bank_ids"] = []
    
    # Map problem_ids to question_ids for consistency
    if "problem_ids" in payload:
        payload["question_ids"] = payload["problem_ids"]
    elif "question_ids" not in payload:
        payload["question_ids"] = []

    col = get_collection("cert_test_specs")
    payload["created_at"] = datetime.utcnow()
    payload["created_by"] = str(admin_user.id)

    col.update_one({"cert_id": payload["cert_id"], "difficulty": payload["difficulty"]}, {"$set": payload}, upsert=True)
    return {"message": "Spec saved"}


@router.delete("/specs/{cert_id}/{difficulty}")
async def delete_spec(cert_id: str, difficulty: str, admin_user=Depends(require_admin_user)):
    col = get_collection("cert_test_specs")
    res = col.delete_one({"cert_id": cert_id, "difficulty": difficulty})
    if res.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spec not found")
    return {"message": "Spec deleted"}


@router.patch("/specs/{cert_id}/{difficulty}/status")
async def update_spec_status(cert_id: str, difficulty: str, payload: dict, admin_user=Depends(require_admin_user)):
    """Toggle active status or update status fields for a spec.
    Expected payload: { "active": bool }
    """
    col = get_collection("cert_test_specs")
    update_fields = {}
    if "active" in payload:
        update_fields["active"] = bool(payload["active"])  # normalize
    if not update_fields:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No updatable fields provided")
    res = col.update_one({"cert_id": cert_id, "difficulty": difficulty}, {"$set": update_fields})
    if res.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spec not found")
    return {"message": "Spec updated", "updated": update_fields}


@router.post("/specs/{cert_id}/{difficulty}/delete")
async def delete_spec_fallback(cert_id: str, difficulty: str, admin_user=Depends(require_admin_user)):
    """Fallback deletion for environments that block DELETE method."""
    col = get_collection("cert_test_specs")
    res = col.delete_one({"cert_id": cert_id, "difficulty": difficulty})
    if res.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spec not found")
    return {"message": "Spec deleted"}


# ============================================================================
# CERTIFICATE MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/certificates/send-bulk")
async def send_bulk_certificates(
    payload: dict,
    admin_user=Depends(require_admin_user)
):
    """
    Send certificates to multiple users via email
    
    Request body:
    {
        "attempt_ids": ["attempt_1", "attempt_2"],
        "template_id": "optional_template_id"
    }
    
    Returns:
    {
        "total": 2,
        "success": 2,
        "failed": 0,
        "details": [...]
    }
    """
    from ..email_utils import send_certificate_email
    
    attempt_ids = payload.get("attempt_ids", [])
    
    import sys
    print(f"\n{'='*80}", flush=True)
    print(f"[BULK CERTIFICATE] Starting bulk certificate send for {len(attempt_ids)} attempts", flush=True)
    print(f"[BULK CERTIFICATE] Attempt IDs: {attempt_ids}", flush=True)
    print(f"{'='*80}\n", flush=True)
    sys.stdout.flush()
    
    if not attempt_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No attempt IDs provided"
        )
    
    results = {
        "total": len(attempt_ids),
        "success": 0,
        "failed": 0,
        "details": []
    }
    
    col = get_collection("cert_attempts")
    
    for attempt_id in attempt_ids:
        try:
            print(f"\n[Certificate] === Processing attempt: {attempt_id} ===", flush=True)
            
            # Get attempt data - attempt_id is actually MongoDB's _id
            try:
                attempt = col.find_one({"_id": ObjectId(attempt_id)})
            except:
                # Fallback: try as string field
                attempt = col.find_one({"attempt_id": attempt_id})
            
            print(f"[Certificate] Attempt found: {attempt is not None}", flush=True)
            
            if not attempt:
                results["failed"] += 1
                results["details"].append({
                    "attempt_id": attempt_id,
                    "status": "failed",
                    "error": "Attempt not found"
                })
                continue
            
            # Check if user passed
            score = attempt.get("score", 0)
            pass_percentage = attempt.get("settings", {}).get("pass_percentage", 70)
            user_name = attempt.get("user_name", "Student")
            
            if score < pass_percentage:
                results["failed"] += 1
                results["details"].append({
                    "attempt_id": attempt_id,
                    "user_name": user_name,
                    "status": "failed",
                    "error": f"Score too low ({score}% < {pass_percentage}%)"
                })
                continue
            
            # Get user email from users collection using user_id
            user_id = attempt.get("user_id")
            user_name = attempt.get("user_name", "Student")
            user_email = None
            
            print(f"\n[Certificate] Processing attempt {attempt_id} for user {user_name} (ID: {user_id})")
            
            if user_id:
                users_col = get_collection("users")
                try:
                    user_doc = users_col.find_one({"_id": ObjectId(user_id)})
                    if user_doc:
                        user_email = user_doc.get("email", "")
                        print(f"[Certificate] Found email in users collection: {user_email}")
                    else:
                        print(f"[Certificate] User document not found for ID: {user_id}")
                except Exception as e:
                    print(f"[Certificate] Error fetching user email for user_id {user_id}: {e}")
            
            # Fallback to attempt.user_email if available
            if not user_email:
                user_email = attempt.get("user_email", "")
                if user_email:
                    print(f"[Certificate] Using email from attempt: {user_email}")
            
            if not user_email:
                results["failed"] += 1
                results["details"].append({
                    "attempt_id": attempt_id,
                    "user_name": user_name,
                    "status": "failed",
                    "error": "No email address"
                })
                continue
            
            # Prepare certificate data
            user_name = attempt.get("user_name", "Student")
            cert_name = attempt.get("cert_id", "Certification")
            difficulty = attempt.get("difficulty", "medium").upper()
            
            # Format date
            finished_at = attempt.get("finished_at")
            if finished_at:
                cert_date = finished_at.strftime("%B %d, %Y")
            else:
                cert_date = datetime.utcnow().strftime("%B %d, %Y")
            
            # Generate certificate ID
            cert_id = f"LQ-{cert_name[:3].upper()}-2025-{attempt_id[:6]}"
            
            # Generate certificate PDF (optional - requires WeasyPrint)
            print(f"\n[Certificate] Attempting to send certificate to {user_email} ({user_name})")
            print(f"[Certificate] Details - Cert: {cert_name}, Score: {score}%, Pass: {pass_percentage}%")
            
            certificate_path = None
            try:
                from ..certificate_generator import generate_certificate_pdf
                certificate_path = generate_certificate_pdf(
                    user_name=user_name,
                    cert_name=cert_name,
                    difficulty=difficulty,
                    score=score,
                    pass_percentage=pass_percentage,
                    date=cert_date,
                    cert_id=cert_id
                )
                
                if certificate_path:
                    print(f"[Certificate] PDF generated: {certificate_path}")
                else:
                    print(f"[Certificate] PDF generation skipped")
            except Exception as e:
                print(f"[Certificate] PDF generation not available: {e}")
            
            # Send email (with or without PDF attachment)
            email_sent = send_certificate_email(
                to_email=user_email,
                user_name=user_name,
                cert_name=cert_name,
                difficulty=difficulty,
                score=score,
                pass_percentage=pass_percentage,
                date=cert_date,
                cert_id=cert_id,
                certificate_path=certificate_path
            )
            
            print(f"[Certificate] Email sent result: {email_sent}")
            
            if email_sent:
                results["success"] += 1
                results["details"].append({
                    "attempt_id": attempt_id,
                    "user_email": user_email,
                    "user_name": user_name,
                    "status": "sent"
                })
                
                # Mark certificate as sent in database - use _id, not attempt_id field
                col.update_one(
                    {"_id": ObjectId(attempt_id)},
                    {
                        "$set": {
                            "certificate_sent": True,
                            "certificate_sent_at": datetime.utcnow(),
                            "certificate_sent_by": str(admin_user.id)
                        }
                    }
                )
                print(f"[Certificate] Updated database: certificate_sent=True for {attempt_id}")
            else:
                results["failed"] += 1
                results["details"].append({
                    "attempt_id": attempt_id,
                    "user_email": user_email,
                    "status": "failed",
                    "error": "Email sending failed"
                })
                
        except Exception as e:
            print(f"[Certificate] EXCEPTION occurred for attempt {attempt_id}: {str(e)}", flush=True)
            import traceback
            traceback.print_exc()
            
            # Try to get user_name from attempt if available
            user_name_for_error = "Unknown"
            try:
                attempt_for_error = col.find_one({"attempt_id": attempt_id})
                if attempt_for_error:
                    user_name_for_error = attempt_for_error.get("user_name", "Unknown")
            except:
                pass
            
            results["failed"] += 1
            results["details"].append({
                "attempt_id": attempt_id,
                "user_name": user_name_for_error,
                "status": "failed",
                "error": str(e)
            })
    
    print(f"\n{'='*80}")
    print(f"[BULK CERTIFICATE] Completed - Success: {results['success']}, Failed: {results['failed']}")
    print(f"{'='*80}\n")
    
    return results


@router.get("/certificates/stats")
async def get_certificate_stats(admin_user=Depends(require_admin_user)):
    """
    Get certificate statistics
    
    Returns total certificates sent, this month, this week
    """
    col = get_collection("cert_attempts")
    
    # Total passed users
    total_passed = col.count_documents({
        "status": "completed",
        "score": {"$exists": True}
    })
    
    # Calculate dynamically passed users
    all_attempts = list(col.find({
        "status": "completed",
        "score": {"$exists": True}
    }))
    
    passed_users = [
        a for a in all_attempts
        if a.get("score", 0) >= a.get("settings", {}).get("pass_percentage", 70)
    ]
    
    # This month
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    
    this_month = len([
        a for a in passed_users
        if a.get("finished_at") and a.get("finished_at") >= month_start
    ])
    
    # This week
    week_ago = now - timedelta(days=7)
    this_week = len([
        a for a in passed_users
        if a.get("finished_at") and a.get("finished_at") >= week_ago
    ])
    
    # Certificates sent
    certificates_sent = col.count_documents({"certificate_sent": True})
    
    return {
        "total_passed": len(passed_users),
        "this_month": this_month,
        "this_week": this_week,
        "certificates_sent": certificates_sent,
        "pending": len(passed_users) - certificates_sent
    }


@router.patch("/certificates/{attempt_id}/status")
async def update_certificate_status(
    attempt_id: str,
    payload: dict,
    admin_user=Depends(require_admin_user)
):
    """
    Update certificate status for an attempt
    
    Request body:
    {
        "certificate_sent": true/false,
        "certificate_sent_at": "2025-11-03T10:30:00",  # optional
        "notes": "Certificate manually marked as sent"  # optional
    }
    """
    col = get_collection("cert_attempts")
    
    try:
        attempt = col.find_one({"_id": ObjectId(attempt_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid attempt ID"
        )
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found"
        )
    
    update_data = {}
    
    if "certificate_sent" in payload:
        update_data["certificate_sent"] = payload["certificate_sent"]
        
        if payload["certificate_sent"]:
            update_data["certificate_sent_at"] = payload.get("certificate_sent_at", datetime.utcnow())
            update_data["certificate_sent_by"] = str(admin_user.id)
        else:
            # Reset fields if unmarking
            update_data["certificate_sent_at"] = None
            update_data["certificate_sent_by"] = None
    
    if "notes" in payload:
        update_data["certificate_notes"] = payload["notes"]
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid update fields provided"
        )
    
    col.update_one(
        {"_id": ObjectId(attempt_id)},
        {"$set": update_data}
    )
    
    return {
        "message": "Certificate status updated",
        "attempt_id": attempt_id,
        "updates": update_data
    }

