# API Specification

## Base URL
```
http://localhost:8000/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt-token"
}
```

#### POST /auth/login
Login user

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt-token"
}
```

### Courses

#### GET /courses
Get all courses

**Response:**
```json
{
  "courses": [
    {
      "id": "course-id",
      "title": "Introduction to Python",
      "description": "Learn Python basics",
      "level": "beginner",
      "duration": "4 weeks"
    }
  ]
}
```

#### GET /courses/:id
Get course by ID

**Response:**
```json
{
  "course": {
    "id": "course-id",
    "title": "Introduction to Python",
    "description": "Learn Python basics",
    "level": "beginner",
    "duration": "4 weeks",
    "modules": []
  }
}
```

#### POST /courses/:id/enroll
Enroll in a course

**Response:**
```json
{
  "enrollment": {
    "userId": "user-id",
    "courseId": "course-id",
    "enrolledAt": "2025-10-16T00:00:00Z"
  }
}
```

### Quizzes

#### GET /quizzes/:id
Get quiz by ID

**Response:**
```json
{
  "quiz": {
    "id": "quiz-id",
    "title": "Python Basics Quiz",
    "questions": []
  }
}
```

#### POST /quizzes/:id/submit
Submit quiz answers

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "q1",
      "answer": "option-a"
    }
  ]
}
```

**Response:**
```json
{
  "score": 85,
  "passed": true,
  "feedback": []
}
```

### AI/RAG

#### POST /ai/chat
Chat with AI assistant

**Request Body:**
```json
{
  "message": "Explain Python decorators",
  "context": "course-context"
}
```

**Response:**
```json
{
  "response": "AI response",
  "sources": []
}
```

### Code Runner

#### POST /runner/execute
Execute code

**Request Body:**
```json
{
  "language": "python",
  "code": "print('Hello, World!')",
  "input": ""
}
```

**Response:**
```json
{
  "output": "Hello, World!\n",
  "status": "success",
  "executionTime": 0.05
}
```

## Error Responses

All errors follow this format:
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Common Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
