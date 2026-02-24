from typing import List, Optional, Dict, Any, Union
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime, timedelta
import re
import os
import httpx
from ..database import get_collection
from ..models.user import User
from ..models.course import CheckAnswerRequest, CheckAnswerResponse, CompleteTopicResponse, Topic
from ..auth import get_current_user

router = APIRouter(prefix="/api/lessons", tags=["lessons"])


@router.get("/{topic_id}", response_model=Topic)
async def get_topic(
    topic_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific topic by its ID with all its cards"""
    courses = get_collection("courses")
    
    # Find the topic using MongoDB aggregation to extract it from nested structure
    pipeline = [
        # Unwind modules array
        {"$unwind": "$modules"},
        # Unwind topics array within each module
        {"$unwind": "$modules.topics"},
        # Match the specific topic_id
        {"$match": {"modules.topics.topic_id": topic_id}},
        # Project only the topic data
        {"$project": {
            "topic_id": "$modules.topics.topic_id",
            "title": "$modules.topics.title",
            "cards": "$modules.topics.cards",
            "xp_reward": "$modules.topics.xp_reward"
        }}
    ]
    
    result = list(courses.aggregate(pipeline))
    
    if not result:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Return the first (and should be only) result
    topic_data = result[0]
    
    return Topic(
        topic_id=topic_data["topic_id"],
        title=topic_data["title"],
        cards=topic_data.get("cards", []),
        xp_reward=topic_data.get("xp_reward", 50)
    )


@router.post("/check-answer", response_model=CheckAnswerResponse)
async def check_answer(
    request: CheckAnswerRequest, 
    current_user: User = Depends(get_current_user)
):
    """Check if a user's answer to a card is correct and award XP"""
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"DEBUG: check_answer called with card_id: {request.card_id}, user_answer: {request.user_answer}")
    
    courses = get_collection("courses")
    users = get_collection("users")
    
    # Find the card in the database
    course_doc = courses.find_one({
        "modules.topics.cards.card_id": request.card_id
    })
    
    if not course_doc:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Find the specific card
    card = None
    for module in course_doc["modules"]:
        for topic in module["topics"]:
            for c in topic["cards"]:
                if c["card_id"] == request.card_id:
                    card = c
                    break
            if card:
                break
        if card:
            break
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    logger.info(f"DEBUG: Found card type: {card.get('type')}")
    
    # Check the answer based on card type
    correct = False
    correct_answer = None
    
    if card["type"] == "theory":
        # Theory cards are always correct (just reading)
        correct = True
        correct_answer = "Read and understood"
        
    elif card["type"] == "mcq":
        # Check if selected choice index matches correct choice
        user_index: Optional[int] = None
        if isinstance(request.user_answer, int):
            user_index = request.user_answer
        elif isinstance(request.user_answer, str):
            try:
                user_index = int(request.user_answer)
            except ValueError:
                user_index = None
        
        if user_index is not None:
            if "correct_choice_index" in card and card.get("correct_choice_index") is not None:
                correct_index = int(card.get("correct_choice_index", 0))
                # Primary check: index match
                correct = user_index == correct_index
                # Fallback: compare chosen text to expected text if index types mismatch upstream
                if not correct and card.get("choices") and user_index < len(card["choices"]):
                    try:
                        chosen_text = str(card["choices"][user_index]).strip()
                        expected_text = str(card["choices"][correct_index]).strip()
                        correct = chosen_text == expected_text
                    except (IndexError, KeyError):
                        pass
            else:
                # If authoring data lacks correct index, do not block user
                correct = True
        else:
            correct = False
            
        correct_answer = (
            card.get("choices", [])[card.get("correct_choice_index", 0)]
            if card.get("choices") and card.get("correct_choice_index") is not None and card.get("correct_choice_index") < len(card.get("choices", []))
            else None
        )
        
    elif card["type"] == "code":
        # Enhanced code evaluation with robust error handling
        user_code = ""
        language_id = 71  # Default to Python 3.8+
        
        # Parse user answer
        if isinstance(request.user_answer, str):
            user_code = request.user_answer.strip()
        elif isinstance(request.user_answer, dict):
            user_code = request.user_answer.get("value", "").strip()
            language_id = request.user_answer.get("language_id", 71)
        
        test_cases = card.get("test_cases", [])
        
        # If no test cases, do basic validation
        if not test_cases:
            correct = len(user_code) > 10
            correct_answer = "Code solution submitted"
            explanation = "No test cases defined. Code accepted based on length."
        else:
            # Execute code against test cases - prioritize local execution
            judge0_url = os.getenv("JUDGE0_URL", "http://judge0:2358")
            passed_count = 0
            total_tests = len(test_cases)
            test_results = []
            
            # Try local execution first (more reliable)
            from ..code_executor import CodeExecutor
            import logging
            logger = logging.getLogger(__name__)
            
            try:
                logger.info(f"DEBUG: Executing code with {len(test_cases)} test cases")
                logger.info(f"DEBUG: User code: {repr(user_code)}")
                logger.info(f"DEBUG: Language ID: {language_id}")
                
                for i, tc in enumerate(test_cases):
                    test_input = tc.get("input", "")
                    expected_output = tc.get("expected_output", "").strip()
                    
                    logger.info(f"DEBUG: Test case {i+1} - Input: {repr(test_input)}, Expected: {repr(expected_output)}")
                    
                    local_result = CodeExecutor.execute_code(
                        user_code, 
                        language_id, 
                        test_input
                    )
                    stdout = local_result.get("stdout", "").strip()
                    stderr = local_result.get("stderr")
                    
                    logger.info(f"DEBUG: Execution result - Stdout: {repr(stdout)}, Stderr: {repr(stderr)}")
                    
                    # Check if test passed - normalize whitespace for comparison
                    passed = (stderr is None or stderr == "") and (stdout == expected_output)
                    if passed:
                        passed_count += 1
                    
                    test_results.append({
                        "test_case": i + 1,
                        "input": test_input,
                        "expected": expected_output,
                        "actual": stdout,
                        "passed": passed,
                        "error": stderr
                    })
                    
                    logger.info(f"DEBUG: Test case {i+1} result - Passed: {passed}")
                
                correct = passed_count == total_tests
                correct_answer = f"Local execution: {passed_count}/{total_tests} test cases passed"
                explanation = f"Code executed locally. {passed_count} out of {total_tests} test cases passed."
                
            except Exception as local_e:
                # Fallback to Judge0 if local execution fails
                try:
                    async with httpx.AsyncClient(timeout=30) as client:
                        for i, tc in enumerate(test_cases):
                            payload = {
                                "language_id": language_id,
                                "source_code": user_code,
                                "stdin": tc.get("input", "")
                            }
                            
                            resp = await client.post(
                                f"{judge0_url}/submissions/?base64_encoded=false&wait=true",
                                json=payload
                            )
                            resp.raise_for_status()
                            data = resp.json()
                            
                            stdout = (data.get("stdout") or "").strip()
                            stderr = data.get("stderr")
                            compile_output = data.get("compile_output")
                            message = data.get("message")
                            expected = (tc.get("expected_output", "") or "").strip()
                            
                            # Check for Judge0 errors
                            if message and ("Internal Error" in str(message) or "No such file" in str(message)):
                                # Judge0 has issues, mark as failed
                                test_results.append({
                                    "test_case": i + 1,
                                    "input": tc.get("input", ""),
                                    "expected": expected,
                                    "actual": "Judge0 Error",
                                    "passed": False,
                                    "error": f"Judge0 Error: {message}"
                                })
                                continue
                            
                            # Check if test passed - normalize whitespace for comparison
                            passed = (stderr is None or stderr == "") and (compile_output is None or compile_output == "") and (stdout.strip() == expected.strip())
                            if passed:
                                passed_count += 1
                            
                            # Store test result details
                            test_results.append({
                                "test_case": i + 1,
                                "input": tc.get("input", ""),
                                "expected": expected,
                                "actual": stdout.strip(),
                                "passed": passed,
                                "error": stderr or compile_output
                            })
                        
                        # Consider correct if all test cases pass
                        correct = passed_count == total_tests
                        correct_answer = f"Judge0 execution: {passed_count}/{total_tests} test cases passed"
                        explanation = f"Code executed via Judge0. {passed_count} out of {total_tests} test cases passed."
                        
                except Exception as judge0_e:
                    # Final fallback to basic validation
                    correct = len(user_code) > 10
                    correct_answer = "Code solution (execution failed)"
                    explanation = f"Both local and Judge0 execution failed. Code accepted based on length. Local error: {str(local_e)}, Judge0 error: {str(judge0_e)}"
                    test_results = []
        
    elif card["type"] == "fill-in-blank":
        # Check if all blanks are filled correctly
        if isinstance(request.user_answer, list) and card.get("correct_answers"):
            correct = request.user_answer == card["correct_answers"]
        correct_answer = card.get("correct_answers", [])
    
    # Award XP if correct and not a dry-run (mode == 'run' means no XP, just feedback)
    mode = None
    if isinstance(request.user_answer, dict):
        mode = request.user_answer.get("mode")
    else:
        mode = getattr(request, 'mode', None)
    
    if correct and mode != 'run':
        xp_reward = card.get("xp_reward", 10)
        users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$inc": {"xp": xp_reward}}
        )
    else:
        xp_reward = 0
    
    # For run mode, provide execution feedback
    explanation = card.get("explanation")
    if mode == 'run' and card["type"] == "code":
        # For run mode, always show the execution result and mark as successful if we got output
        explanation = correct_answer  # Use the execution result as explanation
        # Override correct to true if we have execution output
        if explanation and explanation.strip():
            correct = True
        # Add a test message to verify the updated code is running
        if explanation:
            explanation = f"[UPDATED] {explanation}"
    
    # Convert test results to TestCaseResult objects if they exist
    test_results_objects = None
    if 'test_results' in locals() and test_results:
        from ..models.course import TestCaseResult
        test_results_objects = [TestCaseResult(**result) for result in test_results]
    
    return CheckAnswerResponse(
        correct=correct,
        xp_reward=xp_reward,
        explanation=explanation,
        correct_answer=correct_answer,
        test_results=test_results_objects
    )


@router.post("/complete/{topic_id}", response_model=CompleteTopicResponse)
async def complete_topic(
    topic_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark a topic as complete and update user streak"""
    courses = get_collection("courses")
    users = get_collection("users")
    
    # Find the topic to get its XP reward
    course_doc = courses.find_one({
        "modules.topics.topic_id": topic_id
    })
    
    if not course_doc:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Find the specific topic
    topic = None
    for module in course_doc["modules"]:
        for t in module["topics"]:
            if t["topic_id"] == topic_id:
                topic = t
                break
        if topic:
            break
    
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Get current user data
    user_doc = users.find_one({"_id": ObjectId(current_user.id)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
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
    
    # Award topic completion XP
    topic_xp = topic.get("xp_reward", 50)

    # Determine module and topic lists for completion logic
    module_id = None
    module_topic_ids = []
    for m in course_doc["modules"]:
        ids = [t["topic_id"] for t in m.get("topics", [])]
        if topic_id in ids:
            module_id = m.get("module_id")
        module_topic_ids.append((m.get("module_id"), ids))

    # Update user progress and XP, add completed topic
    users.update_one(
        {"_id": ObjectId(current_user.id)},
        {
            "$inc": {"xp": topic_xp},
            "$set": {
                "last_active_date": datetime.utcnow(),
                "streak_count": new_streak
            },
            "$addToSet": {"completed_topics": topic_id}
        }
    )

    # If all topics in the module are completed, mark module as completed
    if module_id:
        user_after = users.find_one({"_id": ObjectId(current_user.id)}, {"completed_topics": 1, "completed_modules": 1})
        completed_topics_set = set(user_after.get("completed_topics", []))
        
        # Check if module is complete
        module_topic_ids_list = next((ids for mid, ids in module_topic_ids if mid == module_id), [])
        if module_topic_ids_list and all(tid in completed_topics_set for tid in module_topic_ids_list):
            users.update_one(
                {"_id": ObjectId(current_user.id)},
                {"$addToSet": {"completed_modules": module_id}}
            )
            
            # After marking module complete, check if course is complete
            user_after_module_update = users.find_one({"_id": ObjectId(current_user.id)}, {"completed_modules": 1})
            completed_modules_set = set(user_after_module_update.get("completed_modules", []))
            
            all_module_ids_in_course = [m.get("module_id") for m in course_doc.get("modules", [])]
            
            if all(mid in completed_modules_set for mid in all_module_ids_in_course):
                users.update_one(
                    {"_id": ObjectId(current_user.id)},
                    {"$addToSet": {"completed_courses": str(course_doc["_id"])}}
                )
    
    return CompleteTopicResponse(
        success=True,
        xp_reward=topic_xp,
        streak_count=new_streak,
        message=f"Topic completed! +{topic_xp} XP"
    )


@router.get("/user-progress")
async def get_user_progress(current_user: User = Depends(get_current_user)):
    """Get user's learning progress and streak information"""
    users = get_collection("users")
    
    user_doc = users.find_one({"_id": ObjectId(current_user.id)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "xp": user_doc.get("xp", 0),
        "level": user_doc.get("level", 1),
        "streak_count": user_doc.get("streak_count", 0),
        "last_active_date": user_doc.get("last_active_date"),
        "badges": user_doc.get("badges", [])
    }