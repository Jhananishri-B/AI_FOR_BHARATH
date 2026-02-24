"""
LLM Prompts and Templates
Stores all system prompts and templates for the AI system.
"""
from typing import List, Dict, Optional

def get_system_prompt() -> str:
    """
    Get the main system prompt for the AI assistant.
    Defines the assistant's personality, capabilities, and constraints.
    """
    return """You are an expert AI teaching assistant for Learn Quest, an online learning platform.

Your role is to:
- Help students understand programming concepts clearly and concisely
- Provide relevant examples and explanations
- Guide students to discover answers rather than just giving them away
- Encourage best practices and good coding habits
- Be patient, encouraging, and supportive

Guidelines:
- Always use the retrieved course content as your primary source
- If you're unsure, acknowledge it and suggest resources
- Adapt your explanations to the student's level
- Use code examples when helpful
- Break down complex topics into simpler parts

Remember: Your goal is to facilitate learning, not just provide answers."""


def get_chat_prompt(
    query: str,
    retrieved_context: List[Dict],
    additional_context: Optional[str] = None
) -> str:
    """
    Build the user prompt with retrieved context for RAG.
    
    Args:
        query: User's question
        retrieved_context: List of retrieved documents from vector store
        additional_context: Optional additional context
    
    Returns:
        Formatted prompt with context
    """
    # Build context section from retrieved documents
    context_parts = []
    for i, doc in enumerate(retrieved_context, 1):
        context_parts.append(f"[Source {i}]\n{doc.get('content', '')}\n")
    
    context_text = "\n".join(context_parts)
    
    prompt = f"""Based on the following course materials, please answer the student's question.

## Course Materials:
{context_text}

## Student's Question:
{query}
"""
    
    if additional_context:
        prompt += f"\n## Additional Context:\n{additional_context}\n"
    
    prompt += """
## Your Response:
Please provide a clear, helpful answer based on the course materials above."""
    
    return prompt


def get_recommendation_prompt(
    user_profile: Dict,
    completed_courses: List[str],
    learning_preferences: Dict
) -> str:
    """
    Prompt template for generating personalized course recommendations.
    
    Args:
        user_profile: User's learning profile
        completed_courses: List of completed course IDs
        learning_preferences: User's preferences (difficulty, topics, etc.)
    
    Returns:
        Formatted prompt for recommendation generation
    """
    completed = ", ".join(completed_courses) if completed_courses else "None"
    
    return f"""Based on the following user profile, recommend the most suitable courses.

## User Profile:
- Level: {user_profile.get('level', 'beginner')}
- Interests: {', '.join(user_profile.get('interests', []))}
- Completed Courses: {completed}
- Learning Style: {learning_preferences.get('style', 'mixed')}
- Preferred Difficulty: {learning_preferences.get('difficulty', 'medium')}

## Task:
Recommend 5 courses that would best help this user progress in their learning journey.
Consider their current level, interests, and what they've already completed.
Explain why each course is recommended."""


def get_quiz_generation_prompt(
    topic: str,
    difficulty: str,
    num_questions: int,
    content_summary: str
) -> str:
    """
    Prompt template for AI-generated quiz questions.
    
    Args:
        topic: Quiz topic
        difficulty: Difficulty level (easy, medium, hard)
        num_questions: Number of questions to generate
        content_summary: Summary of the content to test
    
    Returns:
        Formatted prompt for quiz generation
    """
    return f"""Generate a {difficulty} level quiz on the topic: {topic}

## Content to Test:
{content_summary}

## Requirements:
- Generate exactly {num_questions} multiple-choice questions
- Each question should have 4 options (A, B, C, D)
- Include the correct answer
- Add a brief explanation for the correct answer
- Questions should test understanding, not just memorization
- Difficulty level: {difficulty}

## Format:
Return questions in JSON format:
{{
    "questions": [
        {{
            "text": "Question text here?",
            "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
            "correct": "A",
            "explanation": "Why this is correct..."
        }}
    ]
}}"""


def get_code_review_prompt(
    code: str,
    language: str,
    context: str
) -> str:
    """
    Prompt template for AI code review and feedback.
    
    Args:
        code: Student's code submission
        language: Programming language
        context: Problem description or assignment context
    
    Returns:
        Formatted prompt for code review
    """
    return f"""Review the following {language} code and provide constructive feedback.

## Assignment Context:
{context}

## Student's Code:
```{language}
{code}
```

## Review Guidelines:
1. Does the code solve the problem correctly?
2. Are there any bugs or logical errors?
3. Is the code readable and well-structured?
4. Are best practices followed?
5. What improvements could be made?

## Provide:
- Overall assessment (Good, Needs Improvement, Excellent)
- Specific strengths
- Areas for improvement with suggestions
- Code quality score (1-10)

Be encouraging and educational in your feedback."""


def get_explanation_prompt(
    concept: str,
    level: str,
    context: Optional[str] = None
) -> str:
    """
    Prompt template for explaining programming concepts.
    
    Args:
        concept: Concept to explain
        level: Student's level (beginner, intermediate, advanced)
        context: Optional additional context
    
    Returns:
        Formatted prompt for concept explanation
    """
    level_guidance = {
        "beginner": "Use simple terms, avoid jargon, provide basic examples",
        "intermediate": "Assume basic knowledge, explain deeper concepts, show practical uses",
        "advanced": "Discuss nuances, edge cases, and advanced patterns"
    }
    
    guidance = level_guidance.get(level, level_guidance["beginner"])
    
    prompt = f"""Explain the concept: {concept}

## Target Audience: {level.capitalize()} level
## Approach: {guidance}
"""
    
    if context:
        prompt += f"\n## Context:\n{context}\n"
    
    prompt += """
## Your Explanation:
Provide a clear, concise explanation with:
1. Simple definition
2. Why it's important
3. Practical example
4. Common use cases
5. Tips for understanding"""
    
    return prompt
