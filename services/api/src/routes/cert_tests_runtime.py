from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import Dict, Any, List
from datetime import datetime
import random

from ..auth import get_current_user
from ..database import get_collection
from ..code_executor import CodeExecutor  # type: ignore
import os
import httpx

router = APIRouter(prefix="/api/cert-tests", tags=["cert-tests-runtime"])


@router.get("/specs")
async def list_public_specs(current_user=Depends(get_current_user)):
    """Return grouped certification specs for the candidate UI.
    Output: [{ cert_id, difficulties: [{ name, question_count, duration_minutes, pass_percentage }], prerequisite_course_id? }]
    """
    specs = get_collection("cert_test_specs")
    items = list(specs.find({}))
    grouped: dict[str, dict] = {}
    for it in items:
        cert_id = it.get("cert_id")
        if not cert_id:
            continue
        diff = it.get("difficulty")
        if cert_id not in grouped:
            grouped[cert_id] = {
                "cert_id": cert_id,
                "difficulties": [],
                "prerequisite_course_id": it.get("prerequisite_course_id", "") or "",
            }
        grouped[cert_id]["difficulties"].append({
            "name": diff,
            "question_count": int(it.get("question_count", 10)),
            "duration_minutes": int(it.get("duration_minutes", 30)),
            "pass_percentage": int(it.get("pass_percentage", 70)),
        })
    return list(grouped.values())

@router.post("/attempts")
async def start_attempt(payload: Dict[str, Any], current_user=Depends(get_current_user)):
    topic_id = payload.get("topic_id")
    difficulty = payload.get("difficulty")
    user_name = payload.get("user_name")
    print(f"DEBUG: Received start_attempt request - topic_id: {topic_id}, difficulty: {difficulty}")
    
    if not topic_id or not difficulty:
        raise HTTPException(status_code=400, detail="topic_id and difficulty are required")

    specs = get_collection("cert_test_specs")
    # Case-insensitive search for difficulty
    spec = specs.find_one({
        "cert_id": topic_id, 
        "difficulty": {"$regex": f"^{difficulty}$", "$options": "i"}
    })
    print(f"DEBUG: Query result - spec found: {spec is not None}")
    if not spec:
        # Try to list available specs for debugging
        available_specs = list(specs.find({}, {"cert_id": 1, "difficulty": 1}))
        print(f"DEBUG: Available specs: {available_specs}")
        raise HTTPException(status_code=404, detail=f"Test spec not found for topic_id='{topic_id}', difficulty='{difficulty}'")

    # Enforce prerequisite course completion if configured
    prereq_course_id = (spec.get("prerequisite_course_id") or "").strip()
    if prereq_course_id:
        users = get_collection("users")
        courses = get_collection("courses")
        from bson import ObjectId
        user_doc = users.find_one({"_id": ObjectId(str(current_user.id))})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        # Ensure baseline progress fields exist
        init_update = {}
        if "completed_topics" not in user_doc:
            init_update["completed_topics"] = []
        if "completed_modules" not in user_doc:
            init_update["completed_modules"] = []
        if init_update:
            users.update_one({"_id": user_doc["_id"]}, {"$set": init_update})
            user_doc.update(init_update)

        course = None
        try:
            course = courses.find_one({"_id": ObjectId(prereq_course_id)})
        except Exception:
            course = courses.find_one({"id": prereq_course_id})
        if not course:
            raise HTTPException(status_code=400, detail="Prerequisite course not found")

        # Collect all topic_ids in the course
        required_topic_ids: list[str] = []
        for m in course.get("modules", []):
            for t in m.get("topics", []):
                tid = t.get("topic_id") or t.get("id")
                if isinstance(tid, str):
                    required_topic_ids.append(tid)

        user_completed = set(user_doc.get("completed_topics", []) or [])
        remaining = [tid for tid in required_topic_ids if tid not in user_completed]
        if remaining:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "PREREQUISITE_NOT_COMPLETED",
                    "message": "Complete the prerequisite course before attempting this test",
                    "remaining_topics": remaining,
                    "prerequisite_course_id": prereq_course_id,
                },
            )
    settings = {
        "question_count": spec.get("question_count") if spec else 10,
        "duration_minutes": spec.get("duration_minutes") if spec else 30,
        "pass_percentage": spec.get("pass_percentage") if spec else 70,
        "randomize": spec.get("randomize", True) if spec else True,
        "restrict_copy_paste": spec.get("restrict_copy_paste", False) if spec else False,
        "bank_ids": spec.get("bank_ids", []) if spec else [],
        "prerequisite_course_id": prereq_course_id,
    }

    # Fetch questions from question_ids (coding problems) or banks
    questions = []
    question_ids = spec.get("question_ids", []) if spec else []
    bank_ids = spec.get("bank_ids", []) if spec else []
    
    # Load from problems collection if question_ids exist
    if question_ids:
        problems_collection = get_collection("problems")
        from bson import ObjectId
        # Fetch all problems for these IDs
        for qid in question_ids:
            try:
                problem = problems_collection.find_one({"_id": ObjectId(qid)})
                if problem:
                    # Convert ObjectId to string and clean up the problem data
                    problem["_id"] = str(problem["_id"])
                    problem["id"] = str(problem["_id"])
                    questions.append(problem)
            except Exception as e:
                print(f"Error fetching problem {qid}: {e}")
                continue
    
    # Load from question banks if bank_ids exist
    elif bank_ids:
        banks_collection = get_collection("cert_test_banks")
        from bson import ObjectId
        mcq_pool = []
        code_pool = []
        
        for bid in bank_ids:
            try:
                bank = banks_collection.find_one({"_id": ObjectId(bid)})
            except Exception:
                bank = banks_collection.find_one({"file_name": bid})
            
            if bank and isinstance(bank.get("questions"), list):
                print(f"DEBUG: Bank {bid} has {len(bank.get('questions', []))} questions")
                for q in bank["questions"]:
                    q_type = q.get("type", "mcq").lower()
                    if q_type == "code":
                        code_pool.append(q)
                    else:
                        # Default to MCQ if type is not specified or is "mcq"
                        mcq_pool.append(q)
        
        print(f"DEBUG: MCQ pool size: {len(mcq_pool)}, Code pool size: {len(code_pool)}")
        
        # Get counts from spec (with defaults)
        mcq_count = spec.get("mcq_count")
        code_count = spec.get("code_count")
        
        # Fallback: if counts not specified, use question_count or distribute evenly
        if mcq_count is None and code_count is None:
            total_requested = spec.get("question_count", 10)
            # If both pools have questions, distribute evenly
            if mcq_pool and code_pool:
                mcq_count = total_requested // 2
                code_count = total_requested - mcq_count
            elif mcq_pool:
                mcq_count = total_requested
                code_count = 0
            elif code_pool:
                mcq_count = 0
                code_count = total_requested
            else:
                mcq_count = 0
                code_count = 0
        else:
            # Use specified counts or default to 0
            mcq_count = mcq_count if mcq_count is not None else 0
            code_count = code_count if code_count is not None else 0
        
        print(f"DEBUG: Requested MCQ: {mcq_count}, Code: {code_count}")
        
        # Randomize pools if enabled
        if settings.get("randomize", True):
            random.shuffle(mcq_pool)
            random.shuffle(code_pool)
        
        # Select questions from each pool (handle if pool is smaller than requested)
        selected_mcq = mcq_pool[:mcq_count] if mcq_pool else []
        selected_code = code_pool[:code_count] if code_pool else []
        
        # Combine and optionally shuffle the final mix
        questions = selected_mcq + selected_code
        if settings.get("randomize", True):
            random.shuffle(questions)
        
        # Process coding questions: separate public and hidden test cases
        for q in questions:
            if q.get("type", "").lower() == "code" and "test_cases" in q:
                all_tests = q.get("test_cases", [])
                public_tests = [tc for tc in all_tests if not tc.get("is_hidden", False)]
                hidden_tests = [tc for tc in all_tests if tc.get("is_hidden", False)]
                
                q["public_test_cases"] = public_tests
                q["hidden_test_cases"] = hidden_tests
                q["all_test_cases"] = all_tests
        
        print(f"DEBUG: Loaded {len(selected_mcq)} MCQ + {len(selected_code)} coding questions from {len(bank_ids)} banks")

    attempts = get_collection("cert_attempts")
    doc = {
        "user_id": str(current_user.id),
        "user_name": user_name,
        "topic_id": topic_id,
        "difficulty": difficulty,
        "settings": settings,
        "questions": questions,  # IMPORTANT: Save questions in the attempt
        "created_at": datetime.utcnow(),
        "status": "active",
    }
    ins = attempts.insert_one(doc)
    
    # Include restrictions from spec
    restrictions = {
        "copy_paste": spec.get("restrict_copy_paste", False) if spec else False,
        "tab_switching": spec.get("restrict_tab_switching", False) if spec else False,
        "right_click": spec.get("restrict_right_click", False) if spec else False,
        "enable_fullscreen": spec.get("enable_fullscreen", False) if spec else False,
        "enable_proctoring": spec.get("enable_proctoring", False) if spec else False,
        "allowed_languages": spec.get("allowed_languages", ["python", "javascript", "cpp", "c", "java"]) if spec else ["python", "javascript", "cpp", "c", "java"],
    }
    
    return {
        "attempt_id": str(ins.inserted_id), 
        "settings": settings,
        "questions": questions,
        "duration_minutes": settings["duration_minutes"],
        "restrictions": restrictions
    }


@router.get("/attempts/{attempt_id}/questions")
async def get_attempt_questions(attempt_id: str, current_user=Depends(get_current_user)):
    attempts = get_collection("cert_attempts")
    banks = get_collection("cert_test_banks")
    att = attempts.find_one({"_id": attempts._Database__collection.database.client.get_default_database().client.get_default_database().codec_options.document_class()._id.__class__(attempt_id)})
    # Fallback: find by string _id if above fails in some envs
    if not att:
        from bson import ObjectId
        try:
            att = attempts.find_one({"_id": ObjectId(attempt_id)})
        except Exception:
            att = None
    if not att:
        raise HTTPException(status_code=404, detail="Attempt not found")

    if str(att.get("user_id")) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")

    settings = att.get("settings", {})
    question_count = int(settings.get("question_count", 10))
    randomize = bool(settings.get("randomize", True))
    bank_ids = settings.get("bank_ids", [])

    # Load questions from selected banks (coding questions only)
    pool = []
    from bson import ObjectId
    if bank_ids:
        for bid in bank_ids:
            try:
                b = banks.find_one({"_id": ObjectId(bid)})
            except Exception:
                b = banks.find_one({"file_name": bid})
            if b and isinstance(b.get("questions"), list):
                # Filter for coding questions only
                coding_questions = [
                    q for q in b["questions"] 
                    if q.get("type", "").lower() == "code"
                ]
                pool.extend(coding_questions)
    else:
        # If no banks specified, take all coding questions
        for b in banks.find({}):
            if isinstance(b.get("questions"), list):
                coding_questions = [
                    q for q in b["questions"] 
                    if q.get("type", "").lower() == "code"
                ]
                pool.extend(coding_questions)

    if not pool:
        return {"questions": []}

    if randomize:
        random.shuffle(pool)

    selected = pool[:question_count]
    # Strip heavy fields if any
    return {"questions": selected}


@router.post("/submit")
async def submit_attempt(payload: Dict[str, Any], current_user=Depends(get_current_user)):
    attempt_id = payload.get("attempt_id")
    answers = payload.get("answers", {})
    if not attempt_id:
        raise HTTPException(status_code=400, detail="attempt_id is required")

    attempts = get_collection("cert_attempts")
    banks = get_collection("cert_test_banks")
    from bson import ObjectId
    try:
        att = attempts.find_one({"_id": ObjectId(attempt_id)})
    except Exception:
        att = None
    if not att:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if str(att.get("user_id")) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")

    settings = att.get("settings", {})
    bank_ids = settings.get("bank_ids", [])
    pool = []
    if bank_ids:
        for bid in bank_ids:
            try:
                b = banks.find_one({"_id": ObjectId(bid)})
            except Exception:
                b = banks.find_one({"file_name": bid})
            if b and isinstance(b.get("questions"), list):
                pool.extend(b["questions"]) 
    else:
        for b in banks.find({}):
            if isinstance(b.get("questions"), list):
                pool.extend(b["questions"]) 

    # Simple grading for MCQ only; code problems expect external judge (not implemented here)
    total_mcq = 0
    correct_mcq = 0
    for q in pool:
        if (q.get("type") or "mcq").lower() == "mcq":
            total_mcq += 1
            qid = str(q.get("_id") or q.get("title"))
            if isinstance(answers.get(qid), int) and answers.get(qid) == q.get("correct_answer"):
                correct_mcq += 1

    test_score = int((correct_mcq / total_mcq) * 100) if total_mcq else 0
    pass_percentage = int(settings.get("pass_percentage", 70))
    final_score = test_score
    passed = final_score >= pass_percentage

    attempts.update_one({"_id": att["_id"]}, {"$set": {
        "status": "completed",
        "completed_at": datetime.utcnow(),
        "result": {
            "test_score": test_score,
            "final_score": final_score,
            "passed": passed,
        }
    }})

    return {"test_score": test_score, "final_score": final_score, "passed": passed}


@router.post("/finish")
async def finish_attempt(payload: Dict[str, Any], current_user=Depends(get_current_user)):
    """Finish a certification test attempt. This endpoint marks the attempt as completed and calculates scores.
    Expects: { attempt_id: str, mcq_answers: {question_index: answer_index} }
    Returns: { message: str, result: {...} }
    """
    attempt_id = payload.get("attempt_id")
    if not attempt_id:
        raise HTTPException(status_code=400, detail="attempt_id is required")

    mcq_answers = payload.get("mcq_answers", {})  # Get MCQ answers from payload
    
    attempts = get_collection("cert_attempts")
    specs = get_collection("cert_test_specs")
    from bson import ObjectId
    
    try:
        att = attempts.find_one({"_id": ObjectId(attempt_id)})
    except Exception:
        att = None
    
    if not att:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if str(att.get("user_id")) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")

    # Check if already completed
    if att.get("status") == "completed":
        return {
            "message": "Test already completed",
            "result": att.get("result", {}),
            "score": att.get("score", 0)
        }

    # Calculate score based on answers
    coding_answers = att.get("answers", [])  # Coding submissions
    questions = att.get("questions", [])  # All questions in the test
    settings = att.get("settings", {})
    pass_percentage = settings.get("pass_percentage", 70)
    
    print(f"DEBUG FINISH: Attempt {attempt_id}")
    print(f"DEBUG: Total questions in test: {len(questions)}")
    print(f"DEBUG: Coding submissions: {len(coding_answers)}")
    print(f"DEBUG: MCQ answers received: {mcq_answers}")
    
    # Calculate score for coding questions
    total_questions = len(questions)
    total_coding = 0
    passed_coding = 0
    
    for answer in coding_answers:
        if answer.get("passed", False):
            passed_coding += 1
        total_coding += 1
    
    print(f"DEBUG: Coding - Total: {total_coding}, Passed: {passed_coding}")
    
    # Calculate score for MCQ questions
    total_mcq = 0
    passed_mcq = 0
    
    for idx, question in enumerate(questions):
        q_type = question.get("type", "mcq").lower()
        if q_type != "code":
            total_mcq += 1
            # Check if MCQ answer is correct
            user_answer = mcq_answers.get(str(idx))
            correct_answer = question.get("correct_answer")
            print(f"DEBUG: MCQ Q{idx}: user_answer={user_answer}, correct={correct_answer}, type={type(user_answer)}, correct_type={type(correct_answer)}")
            if user_answer is not None:
                if user_answer == correct_answer:
                    passed_mcq += 1
                    print(f"DEBUG: MCQ Q{idx} CORRECT!")
    
    print(f"DEBUG: MCQ - Total: {total_mcq}, Passed: {passed_mcq}")
    
    # Calculate total score
    total_passed = passed_coding + passed_mcq
    
    # Calculate percentage score
    score = int((total_passed / total_questions) * 100) if total_questions > 0 else 0
    passed = score >= pass_percentage
    
    # Prepare result
    result = {
        "test_score": score,
        "final_score": score,
        "passed": passed,
        "total_questions": total_questions,
        "passed_questions": total_passed,
        "mcq_correct": passed_mcq,
        "mcq_total": total_mcq,
        "code_correct": passed_coding,
        "code_total": total_coding,
        "pass_percentage": pass_percentage,
        "message": f"Test completed! Score: {score}%"
    }

    # Mark as completed with score
    attempts.update_one(
        {"_id": att["_id"]}, 
        {
            "$set": {
                "status": "completed",
                "completed_at": datetime.utcnow(),
                "score": score,
                "result": result,
                "mcq_answers": mcq_answers  # Store MCQ answers
            }
        }
    )
    
    # Update user's streak and XP
    users = get_collection("users")
    user_doc = users.find_one({"_id": ObjectId(current_user.id)})
    
    if user_doc:
        # Calculate streak
        today = datetime.utcnow().date()
        last_active = user_doc.get("last_active_date")
        
        if last_active:
            last_active_date = last_active.date() if isinstance(last_active, datetime) else last_active
            days_diff = (today - last_active_date).days
            
            if days_diff == 1:
                # Consecutive day - increment streak
                new_streak = user_doc.get("streak_count", 0) + 1
            elif days_diff == 0:
                # Same day - keep current streak
                new_streak = user_doc.get("streak_count", 0)
            else:
                # Gap in days - reset streak
                new_streak = 1
        else:
            # First time - start streak
            new_streak = 1
        
        # Award XP based on performance (10 XP per correct answer)
        xp_earned = total_passed * 10
        
        # Update user's streak, XP, and last active date
        users.update_one(
            {"_id": ObjectId(current_user.id)},
            {
                "$inc": {"xp": xp_earned},
                "$set": {
                    "last_active_date": datetime.utcnow(),
                    "streak_count": new_streak
                }
            }
        )

    return {
        "message": "Test submitted successfully",
        "result": result,
        "score": score,
        "xp_earned": xp_earned if 'xp_earned' in locals() else 0,
        "streak_count": new_streak if 'new_streak' in locals() else 0
    }


@router.post("/run-code")
async def run_code_for_cert(payload: Dict[str, Any], current_user=Depends(get_current_user)):
    """Run code against provided test cases for certification coding questions.
    Expects: { language_id: int, source_code: str, test_cases: [{input, expected_output, is_hidden?}] }
    Returns: { overall_passed, results: [{ test_case_number, passed, input, output, expected_output, error? }], compile_output?, runtime_error? }
    """
    language_id = payload.get("language_id")
    source_code = payload.get("source_code")
    test_cases: List[Dict[str, Any]] = payload.get("test_cases", [])

    if not isinstance(language_id, int) or not isinstance(source_code, str) or not isinstance(test_cases, list):
        raise HTTPException(status_code=400, detail="language_id, source_code, and test_cases are required")

    public_tests = [tc for tc in test_cases if not tc.get("is_hidden", False)] or test_cases
    if not public_tests:
        raise HTTPException(status_code=400, detail="No test cases provided")

    judge0_url = os.getenv("JUDGE0_URL", "http://judge0:2358")
    results: List[Dict[str, Any]] = []
    overall_passed = True

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            for idx, tc in enumerate(public_tests, start=1):
                payload_req = {
                    "language_id": language_id,
                    "source_code": source_code,
                    "stdin": tc.get("input", "")
                }
                print(f"Running test case {idx}/{len(public_tests)}...")
                try:
                    resp = await client.post(
                        f"{judge0_url}/submissions/?base64_encoded=false&wait=true",
                        json=payload_req
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    stdout = (data.get("stdout") or "").strip()
                    stderr = data.get("stderr")
                    compile_output = data.get("compile_output")
                    message = data.get("message")

                    # Fallback to local executor if Judge0 reports internal error
                    if message and "Internal Error" in str(data.get("status", {}).get("description", "")):
                        local = CodeExecutor.execute_code(source_code, language_id, tc.get("input", ""))
                        stdout = (local.get("stdout") or "").strip()
                        stderr = local.get("stderr")
                        compile_output = local.get("compile_output")

                    expected = (tc.get("expected_output", "") or "").strip()
                    passed = (stderr is None) and (compile_output is None) and (stdout == expected)
                    if not passed:
                        overall_passed = False
                    results.append({
                        "test_case_number": idx,
                        "passed": passed,
                        "input": tc.get("input", ""),
                        "output": stdout,
                        "expected_output": expected,
                        "error": stderr or compile_output or None,
                    })
                except httpx.HTTPError as e:
                    overall_passed = False
                    results.append({
                        "test_case_number": idx,
                        "passed": False,
                        "input": tc.get("input", ""),
                        "output": "",
                        "expected_output": (tc.get("expected_output", "") or "").strip(),
                        "error": str(e),
                    })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution failed: {e}")

    return {
        "overall_passed": overall_passed,
        "results": results,
    }


@router.post("/submit-code")
async def submit_code(payload: Dict[str, Any], current_user=Depends(get_current_user)):
    """Submit code solution for a specific question in the attempt.
    Expects: { attempt_id: str, question_number: int, code: str, language_id: int, passed: bool, test_results: {...} }
    Returns: { message: str }
    """
    print("=== /submit-code endpoint called ===")
    print(f"User: {current_user.email if hasattr(current_user, 'email') else current_user}")
    print(f"Payload keys: {list(payload.keys())}")
    
    attempt_id = payload.get("attempt_id")
    question_number = payload.get("question_number")
    code = payload.get("code")
    language_id = payload.get("language_id")
    passed = payload.get("passed", False)
    test_results = payload.get("test_results", {})
    
    print(f"attempt_id: {attempt_id}")
    print(f"question_number: {question_number}")
    print(f"code_length: {len(code) if code else 0}")
    print(f"language_id: {language_id}")
    print(f"passed: {passed}")
    
    if not attempt_id or question_number is None:
        raise HTTPException(status_code=400, detail="attempt_id and question_number are required")

    attempts = get_collection("cert_attempts")
    from bson import ObjectId
    
    try:
        att = attempts.find_one({"_id": ObjectId(attempt_id)})
    except Exception:
        att = None
    
    if not att:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if str(att.get("user_id")) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")

    # Prepare answer object
    answer = {
        "question_number": question_number,
        "code": code,
        "language_id": language_id,
        "passed": passed,
        "test_results": test_results,
        "submitted_at": datetime.utcnow()
    }

    # Update or insert answer in answers array
    existing_answers = att.get("answers", [])
    
    # Find if this question already has an answer
    answer_exists = False
    for i, ans in enumerate(existing_answers):
        if ans.get("question_number") == question_number:
            existing_answers[i] = answer
            answer_exists = True
            break
    
    if not answer_exists:
        existing_answers.append(answer)

    # Update attempt with new answers
    attempts.update_one(
        {"_id": att["_id"]},
        {
            "$set": {
                "answers": existing_answers,
                "last_updated": datetime.utcnow()
            }
        }
    )

    return {"message": "Code submitted successfully", "passed": passed}


@router.post("/feedback")
async def submit_feedback(payload: Dict[str, Any], current_user=Depends(get_current_user)):
    """Submit feedback for a certification test attempt.
    Expects: { attempt_id: str, feedback: str }
    Returns: { message: str }
    """
    attempt_id = payload.get("attempt_id")
    feedback = payload.get("feedback")
    
    if not attempt_id or not feedback:
        raise HTTPException(status_code=400, detail="attempt_id and feedback are required")

    attempts = get_collection("cert_attempts")
    from bson import ObjectId
    
    try:
        att = attempts.find_one({"_id": ObjectId(attempt_id)})
    except Exception:
        att = None
    
    if not att:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if str(att.get("user_id")) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")

    # Add feedback to attempt
    attempts.update_one(
        {"_id": att["_id"]},
        {
            "$set": {
                "feedback": feedback,
                "feedback_submitted_at": datetime.utcnow()
            }
        }
    )

    return {"message": "Feedback submitted successfully"}


@router.post("/log-violation")
async def log_violation(
    attempt_id: str = Body(...),
    type: str = Body(...),
    severity: str = Body(...),
    message: str = Body(...),
    timestamp: str = Body(...),
    current_user=Depends(get_current_user)
):
    """Log a violation (tab switch, copy/paste, etc.) to the attempt"""
    attempts = get_collection("cert_attempts")
    from bson import ObjectId
    from datetime import datetime
    
    try:
        att_id = ObjectId(attempt_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid attempt ID")
    
    att = attempts.find_one({"_id": att_id})
    if not att:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if str(att.get("user_id")) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Add violation to proctoring_events
    violation_event = {
        "type": "violation",
        "violation_type": type,
        "severity": severity,
        "message": message,
        "timestamp": datetime.fromisoformat(timestamp.replace('Z', '+00:00')) if timestamp else datetime.utcnow(),
    }
    
    attempts.update_one(
        {"_id": att_id},
        {
            "$push": {"proctoring_events": violation_event},
            "$inc": {f"violations.{type}": 1}
        }
    )
    
    return {"message": "Violation logged successfully"}


@router.get("/attempts/{attempt_id}")
async def get_single_attempt(attempt_id: str, current_user=Depends(get_current_user)):
    """Get a single certification test attempt by ID.
    Returns: { attempt_id, user_id, user_name, cert_id, difficulty, score, status, questions, answers, proctoring_events, ... }
    """
    attempts = get_collection("cert_attempts")
    from bson import ObjectId
    
    try:
        att = attempts.find_one({"_id": ObjectId(attempt_id)})
    except Exception:
        att = None
    
    if not att:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    # Calculate detailed statistics
    questions = att.get("questions", [])
    answers = att.get("answers", [])
    settings = att.get("settings", {})
    
    total_questions = len(questions)
    correct_answers = len([a for a in answers if a.get("passed")])
    # Count answered as questions that have been attempted (have code OR have result)
    answered_questions = len([a for a in answers if (a.get("code") or a.get("result"))])
    unanswered = max(0, total_questions - answered_questions)
    wrong_answers = answered_questions - correct_answers
    
    # Calculate duration
    started_at = att.get("started_at") or att.get("created_at")
    finished_at = att.get("finished_at") or att.get("completed_at")
    duration_minutes = 0
    if started_at and finished_at:
        duration_seconds = (finished_at - started_at).total_seconds() if hasattr(started_at, 'total_seconds') else 0
        duration_minutes = int(duration_seconds / 60)
    
    # Return full attempt details
    return {
        "attempt_id": str(att["_id"]),
        "user_id": str(att.get("user_id", "")),
        "user_name": att.get("user_name", "Unknown"),
        "topic_id": att.get("topic_id", ""),
        "difficulty": att.get("difficulty", ""),
        "score": att.get("score", 0),
        "status": att.get("status", "in_progress"),
        "started_at": started_at.isoformat() if started_at else None,
        "finished_at": finished_at.isoformat() if finished_at else None,
        "created_at": att.get("created_at").isoformat() if att.get("created_at") else None,
        "completed_at": att.get("completed_at").isoformat() if att.get("completed_at") else None,
        "questions": questions,
        "answers": answers,
        "proctoring_events": att.get("proctoring_events", []),
        "violations": att.get("violations", {}),
        "feedback": att.get("feedback", ""),
        "eligible_for_review": att.get("score", 0) >= 80,
        "settings": settings,
        "restrictions": att.get("restrictions", {}),
        # Additional statistics
        "total_questions": total_questions,
        "correct_answers": correct_answers,
        "wrong_answers": wrong_answers,
        "unanswered": unanswered,
        "duration_minutes": duration_minutes,
        # Include result object with MCQ/Code breakdown
        "result": att.get("result", {})
    }


@router.get("/attempts")
async def get_all_attempts(current_user=Depends(get_current_user)):
    """Get all certification test attempts (for admin).
    Returns: [{ attempt_id, user_id, user_name, cert_id, difficulty, score, status, created_at, ... }]
    """
    attempts = get_collection("cert_attempts")
    from bson import ObjectId
    
    # Get all attempts
    all_attempts = list(attempts.find({}).sort("created_at", -1))
    
    result = []
    for att in all_attempts:
        result.append({
            "attempt_id": str(att["_id"]),
            "_id": str(att["_id"]),  # Add _id for consistency
            "user_id": str(att.get("user_id", "")),
            "user_name": att.get("user_name", "Unknown"),
            "user_email": att.get("user_email", ""),  # Add email field
            "cert_id": att.get("topic_id", ""),
            "difficulty": att.get("difficulty", ""),
            "score": att.get("score", 0),
            "status": att.get("status", "in_progress"),
            "created_at": att.get("created_at").isoformat() if att.get("created_at") else None,
            "completed_at": att.get("completed_at").isoformat() if att.get("completed_at") else None,
            "finished_at": att.get("finished_at").isoformat() if att.get("finished_at") else None,
            "completed": att.get("completed", False),
            "result": att.get("result", {}),
            "proctoring_events_count": len(att.get("proctoring_events", [])),
            "violations": att.get("violations", {}),
            "feedback": att.get("feedback", ""),
            "eligible_for_review": att.get("score", 0) >= 80,
            "settings": att.get("settings", {}),  # Add settings with pass_percentage
            "certificate_sent": att.get("certificate_sent", False),  # Add certificate status
            "certificate_sent_at": att.get("certificate_sent_at").isoformat() if att.get("certificate_sent_at") else None,
            "certificate_sent_by": att.get("certificate_sent_by", "")
        })
    
    return result

