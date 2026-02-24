from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from bson import ObjectId
import httpx
import os
from ..code_executor import CodeExecutor
from ..database import get_collection
from ..auth import get_current_user
from ..models.user import User
from ..models.course import (
    ProblemSummary, 
    ProblemDetail, 
    CodeSubmission, 
    SubmissionResult, 
    TestResult,
    TestCase
)

router = APIRouter(prefix="/api/problems", tags=["problems"])


@router.get("/", response_model=List[ProblemSummary])
async def get_all_problems(
    difficulty: Optional[str] = None,
    tag: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Fetch all code problems for the Practice Zone."""
    questions = get_collection("questions")
    problems = []
    
    # Find all code questions marked as practice problems
    query = {"type": "code", "is_practice_problem": True}
    if difficulty:
        query["difficulty"] = difficulty
    
    for question in questions.find(query):
        # Extract problem details
        problem_id = str(question["_id"])
        title = question.get("prompt", "Untitled Problem")
        difficulty = question.get("difficulty", "medium")
        tags = question.get("tags", [])
        xp_reward = question.get("xp_reward", 10)
        
        # Apply tag filter
        if tag and tag not in tags:
            continue
            
        problems.append(ProblemSummary(
            problem_id=problem_id,
            title=title,
            difficulty=difficulty,
            tags=tags,
            xp_reward=xp_reward
        ))
    
    return problems


@router.get("/{problem_id}", response_model=ProblemDetail)
async def get_problem_detail(
    problem_id: str, 
    current_user: User = Depends(get_current_user)
):
    """Fetch full details for a single code problem."""
    questions = get_collection("questions")
    
    # Find the problem question
    question = questions.find_one({
        "_id": ObjectId(problem_id),
        "type": "code",
        "is_practice_problem": True
    })
    
    if not question:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Extract public test cases (non-hidden ones)
    test_cases = question.get("test_cases", [])
    public_test_cases = [
        TestCase(
            input=tc.get("input", ""),
            expected_output=tc.get("expected_output", ""),
            is_hidden=tc.get("is_hidden", False)
        )
        for tc in test_cases if not tc.get("is_hidden", False)
    ]
    
    return ProblemDetail(
        problem_id=str(question["_id"]),
        title=question.get("prompt", "Untitled Problem"),
        content=question.get("prompt", ""),
        starter_code=question.get("code_starter", ""),
        difficulty=question.get("difficulty", "medium"),
        tags=question.get("tags", []),
        xp_reward=question.get("xp_reward", 10),
        public_test_cases=public_test_cases
    )


@router.post("/submit/{problem_id}", response_model=SubmissionResult)
async def submit_code_problem(
    problem_id: str,
    submission: CodeSubmission,
    current_user: User = Depends(get_current_user)
):
    """Submit user's code for a problem and run against all test cases."""
    questions = get_collection("questions")
    users = get_collection("users")
    
    # Find the problem question
    question = questions.find_one({
        "_id": ObjectId(problem_id),
        "type": "code",
        "is_practice_problem": True
    })
    
    if not question:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    test_cases = question.get("test_cases", [])
    if not test_cases:
        raise HTTPException(status_code=400, detail="No test cases defined for this problem")
    
    # Judge0 configuration
    judge0_url = os.getenv("JUDGE0_URL", "http://judge0:2358")
    language_id = submission.language_id
    
    results: List[TestResult] = []
    overall_passed = True
    xp_reward = 0
    
    try:
        # Use local execution directly (more reliable than Judge0)
        for i, tc in enumerate(test_cases):
            expected = (tc.get("expected_output", "") or "").strip()
            
            try:
                local_result = CodeExecutor.execute_code(
                    submission.user_code, 
                    language_id, 
                    tc.get("input", "")
                )
                stdout = local_result.get("stdout", "")
                stderr = local_result.get("stderr")
                compile_output = local_result.get("compile_output")
            except Exception as local_error:
                stdout = ""
                stderr = f"Execution failed: {str(local_error)}"
                compile_output = None
            
            error_msg = stderr or compile_output
            
            # Check if test passed
            passed = (stderr is None) and (compile_output is None) and (stdout == expected)
            if not passed:
                overall_passed = False
            
            results.append(TestResult(
                test_case_number=i + 1,
                passed=passed,
                output=stdout,
                expected_output=expected,
                error=error_msg,
                input=tc.get("input", ""),
                is_hidden=tc.get("is_hidden", False)
            ))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code execution failed: {str(e)}")
    
    # Award XP if all tests pass
    if overall_passed:
        xp_reward = question.get("xp_reward", 10)
        users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$inc": {"xp": xp_reward}}
        )
    
    return SubmissionResult(
        overall_passed=overall_passed,
        results=results,
        xp_reward=xp_reward
    )


@router.post("/run/{problem_id}", response_model=SubmissionResult)
async def run_code_problem(
    problem_id: str,
    submission: CodeSubmission,
    current_user: User = Depends(get_current_user)
):
    """Run user's code against public test cases only (no XP awarded)."""
    questions = get_collection("questions")
    
    # Find the problem question
    question = questions.find_one({
        "_id": ObjectId(problem_id),
        "type": "code",
        "is_practice_problem": True
    })
    
    if not question:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Only run against public test cases
    test_cases = [
        tc for tc in question.get("test_cases", []) 
        if not tc.get("is_hidden", False)
    ]
    
    if not test_cases:
        raise HTTPException(status_code=400, detail="No public test cases available")
    
    # Judge0 configuration
    judge0_url = os.getenv("JUDGE0_URL", "http://judge0:2358")
    language_id = submission.language_id
    
    results: List[TestResult] = []
    overall_passed = True
    
    try:
        # Use local execution directly (more reliable than Judge0)
        for i, tc in enumerate(test_cases):
            expected = (tc.get("expected_output", "") or "").strip()
            
            try:
                local_result = CodeExecutor.execute_code(
                    submission.user_code, 
                    language_id, 
                    tc.get("input", "")
                )
                stdout = local_result.get("stdout", "")
                stderr = local_result.get("stderr")
                compile_output = local_result.get("compile_output")
            except Exception as local_error:
                stdout = ""
                stderr = f"Execution failed: {str(local_error)}"
                compile_output = None
            
            error_msg = stderr or compile_output
            
            # Check if test passed
            passed = (stderr is None) and (compile_output is None) and (stdout == expected)
            if not passed:
                overall_passed = False
            
            results.append(TestResult(
                test_case_number=i + 1,
                passed=passed,
                output=stdout,
                expected_output=expected,
                error=error_msg,
                input=tc.get("input", ""),
                is_hidden=False  # All are public in run mode
            ))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code execution failed: {str(e)}")
    
    return SubmissionResult(
        overall_passed=overall_passed,
        results=results,
        xp_reward=0  # No XP for run mode
    )