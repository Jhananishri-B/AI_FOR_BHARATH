"""
Personalized Recommendation System
ML-based logic for recommending courses to users.
"""
from typing import List, Dict, Optional
import numpy as np
from .embeddings import create_embedding, cosine_similarity

async def get_personalized_recommendations(
    user_id: str,
    num_recommendations: int = 5
) -> List[Dict]:
    """
    Generate personalized course recommendations for a user.
    
    Uses collaborative filtering and content-based approaches:
    1. Analyze user's learning history and preferences
    2. Find similar users and their successful paths
    3. Recommend courses based on skills gaps and interests
    
    Args:
        user_id: User identifier
        num_recommendations: Number of courses to recommend
    
    Returns:
        List of recommended courses with scores
    """
    # TODO: Implement actual recommendation logic
    
    # Step 1: Get user profile and learning history
    user_profile = await get_user_profile(user_id)
    learning_history = await get_learning_history(user_id)
    
    # Step 2: Calculate user's skill vector
    user_vector = await create_user_skill_vector(user_profile, learning_history)
    
    # Step 3: Find suitable courses
    candidate_courses = await get_candidate_courses(user_profile)
    
    # Step 4: Score and rank courses
    scored_courses = []
    for course in candidate_courses:
        score = await calculate_course_score(user_vector, course, user_profile)
        scored_courses.append({
            "course": course,
            "score": score,
            "reason": generate_recommendation_reason(course, user_profile)
        })
    
    # Step 5: Sort by score and return top N
    scored_courses.sort(key=lambda x: x["score"], reverse=True)
    
    return scored_courses[:num_recommendations]


async def get_user_profile(user_id: str) -> Dict:
    """
    Fetch user's profile including interests, level, and preferences.
    
    Args:
        user_id: User identifier
    
    Returns:
        User profile dictionary
    """
    # TODO: Fetch from database
    return {
        "id": user_id,
        "level": "intermediate",
        "interests": ["python", "machine-learning", "web-development"],
        "learning_style": "visual",
        "preferred_difficulty": "medium",
        "goals": ["become a full-stack developer"]
    }


async def get_learning_history(user_id: str) -> List[Dict]:
    """
    Get user's learning history (completed courses, quiz scores, etc.).
    
    Args:
        user_id: User identifier
    
    Returns:
        List of learning activities
    """
    # TODO: Fetch from database
    return [
        {
            "course_id": "python-basics",
            "completed": True,
            "score": 85,
            "completion_date": "2025-09-01"
        }
    ]


async def create_user_skill_vector(
    profile: Dict,
    history: List[Dict]
) -> np.ndarray:
    """
    Create a vector representation of user's skills and knowledge.
    
    Args:
        profile: User profile
        history: Learning history
    
    Returns:
        Skill vector as numpy array
    """
    # TODO: Implement actual vector creation
    # This could use embeddings of completed course content
    
    # Placeholder: create a simple vector based on interests
    interests_text = " ".join(profile.get("interests", []))
    embedding = await create_embedding(interests_text)
    
    return np.array(embedding)


async def get_candidate_courses(profile: Dict) -> List[Dict]:
    """
    Get candidate courses that match user's level and aren't completed.
    
    Args:
        profile: User profile
    
    Returns:
        List of candidate courses
    """
    # TODO: Fetch from database with proper filtering
    return [
        {
            "id": "advanced-python",
            "title": "Advanced Python Programming",
            "level": "intermediate",
            "topics": ["python", "oop", "design-patterns"],
            "prerequisites": ["python-basics"]
        },
        {
            "id": "react-fundamentals",
            "title": "React Fundamentals",
            "level": "intermediate",
            "topics": ["react", "javascript", "web-development"],
            "prerequisites": ["javascript-basics"]
        }
    ]


async def calculate_course_score(
    user_vector: np.ndarray,
    course: Dict,
    profile: Dict
) -> float:
    """
    Calculate recommendation score for a course.
    
    Factors:
    - Skill alignment (similarity between user skills and course topics)
    - Difficulty match
    - Interest alignment
    - Prerequisite completion
    - Popularity among similar users
    
    Args:
        user_vector: User's skill vector
        course: Course information
        profile: User profile
    
    Returns:
        Score between 0 and 1
    """
    scores = []
    
    # 1. Topic alignment (40% weight)
    course_topics = " ".join(course.get("topics", []))
    course_embedding = await create_embedding(course_topics)
    topic_similarity = cosine_similarity(user_vector.tolist(), course_embedding)
    scores.append(("topic_alignment", topic_similarity, 0.4))
    
    # 2. Difficulty match (20% weight)
    level_score = calculate_level_match(profile.get("level"), course.get("level"))
    scores.append(("difficulty_match", level_score, 0.2))
    
    # 3. Interest alignment (20% weight)
    interest_score = calculate_interest_match(profile.get("interests", []), course.get("topics", []))
    scores.append(("interest_match", interest_score, 0.2))
    
    # 4. Prerequisite readiness (20% weight)
    prereq_score = 1.0  # Simplified - assume prerequisites met
    scores.append(("prerequisite_ready", prereq_score, 0.2))
    
    # Calculate weighted score
    total_score = sum(score * weight for _, score, weight in scores)
    
    return min(total_score, 1.0)


def calculate_level_match(user_level: str, course_level: str) -> float:
    """
    Calculate how well course difficulty matches user's level.
    
    Args:
        user_level: User's current level
        course_level: Course difficulty level
    
    Returns:
        Match score between 0 and 1
    """
    levels = {"beginner": 1, "intermediate": 2, "advanced": 3, "expert": 4}
    
    user_level_num = levels.get(user_level, 1)
    course_level_num = levels.get(course_level, 1)
    
    # Perfect match or one level up is ideal
    diff = abs(user_level_num - course_level_num)
    
    if diff == 0:
        return 1.0
    elif diff == 1:
        return 0.8
    elif diff == 2:
        return 0.5
    else:
        return 0.2


def calculate_interest_match(user_interests: List[str], course_topics: List[str]) -> float:
    """
    Calculate overlap between user interests and course topics.
    
    Args:
        user_interests: User's stated interests
        course_topics: Course topics
    
    Returns:
        Interest match score between 0 and 1
    """
    if not user_interests or not course_topics:
        return 0.5  # Neutral score if no data
    
    # Calculate Jaccard similarity
    interests_set = set(i.lower() for i in user_interests)
    topics_set = set(t.lower() for t in course_topics)
    
    intersection = len(interests_set & topics_set)
    union = len(interests_set | topics_set)
    
    if union == 0:
        return 0.0
    
    return intersection / union


def generate_recommendation_reason(course: Dict, profile: Dict) -> str:
    """
    Generate human-readable reason for why this course is recommended.
    
    Args:
        course: Course information
        profile: User profile
    
    Returns:
        Recommendation reason text
    """
    reasons = []
    
    # Check topic match
    user_interests = set(i.lower() for i in profile.get("interests", []))
    course_topics = set(t.lower() for t in course.get("topics", []))
    matching_topics = user_interests & course_topics
    
    if matching_topics:
        reasons.append(f"Matches your interest in {', '.join(matching_topics)}")
    
    # Check level appropriateness
    if profile.get("level") == course.get("level"):
        reasons.append("Perfect for your current skill level")
    
    # Check goals alignment
    if "goals" in profile:
        reasons.append("Aligns with your learning goals")
    
    if not reasons:
        reasons.append("Popular among learners like you")
    
    return " • ".join(reasons)
