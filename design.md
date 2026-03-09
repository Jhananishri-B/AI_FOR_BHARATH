# LearnQuest - System Design Document

## 1. Executive Summary

LearnQuest is a comprehensive AI-powered learning platform built on a modern microservices architecture. This document outlines the system architecture, technology stack, component design, data models, and deployment strategy for the platform.

### 1.1 Design Goals

- **Scalability**: Support 10,000+ concurrent users with horizontal scaling
- **Modularity**: Microservices architecture for independent service deployment
- **Security**: Multi-layered security with encryption, authentication, and sandboxing
- **Performance**: Sub-500ms API response times with optimized caching
- **Reliability**: 99.5% uptime with fault tolerance and automated recovery
- **Maintainability**: Clean code architecture with comprehensive documentation

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Web Frontend (React)  │  Admin Frontend (React)  │  Mobile*    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway / Load Balancer                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  FastAPI Backend  │  AI Services  │  Worker Services            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Integration Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  Judge0  │  Ollama (Llama 3)  │  ChromaDB  │  Proctoring AI    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
├─────────────────────────────────────────────────────────────────┤
│  MongoDB  │  PostgreSQL  │  Redis  │  File Storage              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Microservices Architecture


#### Service Breakdown

1. **API Service** (FastAPI - Python)
   - Core business logic and REST API endpoints
   - Authentication and authorization
   - Request routing and validation
   - Port: 8000

2. **Web Frontend** (React + Vite)
   - Student-facing user interface
   - Course browsing and learning interface
   - Quiz and coding practice UI
   - Port: 3000

3. **Admin Frontend** (React + Vite)
   - Administrative dashboard
   - User and content management
   - Analytics and reporting
   - Port: 5174

4. **Judge0 Service** (Docker)
   - Code compilation and execution
   - Multi-language support (70+ languages)
   - Sandboxed execution environment
   - Port: 2358

5. **Judge0 Worker** (Docker)
   - Background job processing for code execution
   - Queue management via Redis
   - Resource isolation

6. **Ollama Service** (External/Host)
   - Llama 3 model inference
   - AI tutoring and content generation
   - Port: 11434

7. **ChromaDB Service** (Docker)
   - Vector embeddings storage
   - Semantic search for RAG
   - Port: 8001

8. **Worker Service** (Python)
   - Background task processing
   - Email notifications
   - Certificate generation
   - Scheduled jobs

9. **GNN Service** (Python)
   - Graph Neural Network for recommendations
   - Learning path optimization
   - Skill graph analysis

10. **Embeddings Index Service** (Python)
    - Document embedding generation
    - Content indexing for RAG
    - Batch processing

---

## 3. Technology Stack

### 3.1 Frontend Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | React | 19.1.1 | UI component library |
| Build Tool | Vite | 7.1.7 | Fast build and dev server |
| Routing | React Router | 7.9.4 | Client-side routing |
| HTTP Client | Axios | 1.12.2 | API communication |
| Code Editor | Monaco Editor | 4.6.0 | In-browser code editing |
| Styling | Tailwind CSS | 3.4.15 | Utility-first CSS |
| Charts | Chart.js | 4.5.1 | Data visualization |
| Animations | Framer Motion | 12.23.24 | UI animations |
| Icons | Lucide React | 0.546.0 | Icon library |
| Webcam | React Webcam | 7.2.0 | Camera access |
| Notifications | Sonner | 1.4.3 | Toast notifications |

### 3.2 Backend Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | FastAPI | Latest | High-performance API framework |
| Language | Python | 3.10+ | Primary backend language |
| Authentication | Python-JOSE | Latest | JWT token management |
| Password Hashing | Passlib (bcrypt) | Latest | Secure password storage |
| AI Framework | PyTorch | Latest | Deep learning models |
| Computer Vision | MediaPipe | Latest | Face detection |
| Object Detection | Ultralytics (YOLO) | Latest | Phone detection |
| LLM Integration | Ollama | Latest | Llama 3 inference |

### 3.3 Database & Storage

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Primary DB | MongoDB | 7.0 | Document storage |
| Judge0 DB | PostgreSQL | 13 | Relational data for Judge0 |
| Cache/Queue | Redis | 7 | Caching and job queue |
| Vector DB | ChromaDB | Latest | Embeddings storage |

### 3.4 Infrastructure & DevOps

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Containerization | Docker | Service isolation |
| Orchestration | Docker Compose | Multi-container management |
| Web Server | Nginx | Reverse proxy and static files |
| Code Execution | Judge0 | Sandboxed code runner |

---

## 4. Component Design

### 4.1 Frontend Architecture

#### 4.1.1 Web Frontend Structure

```
src/
├── components/
│   ├── certification/       # Certification test components
│   ├── quiz/               # Quiz and assessment components
│   ├── ui/                 # Reusable UI components
│   ├── Layout.jsx          # Main layout wrapper
│   ├── Navigation.jsx      # Navigation bar
│   ├── Sidebar.jsx         # Sidebar navigation
│   ├── ProtectedRoute.jsx  # Route authentication
│   └── WebcamProctoring.jsx # Proctoring component
├── pages/
│   ├── Dashboard.jsx       # Student dashboard
│   ├── Courses.jsx         # Course listing
│   ├── CourseDetail.jsx    # Course content view
│   ├── Lesson.jsx          # Lesson viewer
│   ├── Quiz.jsx            # Quiz interface
│   ├── PracticePage.jsx    # Coding practice
│   ├── Tutor.jsx           # AI tutor chat
│   └── Login.jsx           # Authentication
├── contexts/
│   └── AuthContext.jsx     # Global auth state
├── services/
│   └── api.js              # API client
└── lib/
    └── utils.js            # Utility functions
```

#### 4.1.2 Admin Frontend Structure

```
src/
├── components/
│   ├── Layout.jsx          # Admin layout
│   ├── Modal.jsx           # Modal dialogs
│   ├── ProblemEditor.jsx   # Code problem editor
│   └── CreateUserModal.jsx # User creation
├── pages/
│   ├── Dashboard.jsx       # Admin overview
│   ├── Users.jsx           # User management
│   ├── Courses.jsx         # Course management
│   ├── Problems.jsx        # Problem management
│   ├── TestManagement.jsx  # Test configuration
│   ├── ProctoringReview.jsx # Violation review
│   ├── ResultsAnalytics.jsx # Performance analytics
│   └── CertificationTestManager.jsx # Cert management
└── services/
    └── api.js              # API client
```

### 4.2 Backend Architecture

#### 4.2.1 API Service Structure

```
src/
├── routes/
│   ├── auth.py             # Authentication endpoints
│   ├── courses.py          # Course CRUD
│   ├── lessons.py          # Lesson management
│   ├── quizzes.py          # Quiz endpoints
│   ├── problems.py         # Coding problems
│   ├── ai_routes.py        # AI tutor endpoints
│   ├── ai_quiz.py          # AI quiz generation
│   ├── certifications.py   # Certification tests
│   ├── proctoring.py       # Proctoring endpoints
│   ├── users.py            # User management
│   ├── gnn.py              # Recommendation engine
│   └── admin/              # Admin-specific routes
├── models/
│   ├── user.py             # User data model
│   ├── course.py           # Course data model
│   ├── quiz.py             # Quiz data model
│   ├── question.py         # Question data model
│   └── certification.py    # Certification model
├── controllers/
│   ├── authController.py   # Auth business logic
│   └── courseController.py # Course business logic
├── services/
│   ├── authService.py      # Auth utilities
│   ├── courseService.py    # Course utilities
│   ├── proctoring_service.py # Proctoring logic
│   └── google_auth.py      # OAuth integration
├── ai/
│   ├── core.py             # AI core functionality
│   ├── prompts.py          # LLM prompt templates
│   ├── embeddings.py       # Embedding generation
│   ├── rag.py              # RAG implementation
│   └── recommend.py        # GNN recommendations
├── main.py                 # FastAPI application
├── database.py             # Database connection
├── auth.py                 # JWT utilities
├── code_executor.py        # Judge0 integration
├── proctoring_detector.py  # YOLO/MediaPipe
└── certificate_generator.py # PDF generation
```

---

## 5. Data Models

### 5.1 User Model

```python
{
  "_id": ObjectId,
  "email": String (unique, indexed),
  "password_hash": String,
  "full_name": String,
  "role": Enum["student", "teacher", "admin"],
  "profile": {
    "avatar_url": String,
    "bio": String,
    "preferences": Object
  },
  "progress": {
    "courses_enrolled": [ObjectId],
    "courses_completed": [ObjectId],
    "total_points": Integer,
    "streak_days": Integer,
    "last_active": DateTime
  },
  "created_at": DateTime,
  "updated_at": DateTime,
  "is_active": Boolean
}
```

### 5.2 Course Model

```python
{
  "_id": ObjectId,
  "title": String (indexed),
  "description": String,
  "instructor_id": ObjectId (ref: User),
  "category": String (indexed),
  "difficulty": Enum["beginner", "intermediate", "advanced"],
  "tags": [String],
  "modules": [{
    "module_id": String,
    "title": String,
    "order": Integer,
    "lessons": [ObjectId] (ref: Lesson)
  }],
  "prerequisites": [ObjectId] (ref: Course),
  "enrollment_count": Integer,
  "rating": Float,
  "is_published": Boolean,
  "created_at": DateTime,
  "updated_at": DateTime
}
```

### 5.3 Lesson Model

```python
{
  "_id": ObjectId,
  "course_id": ObjectId (ref: Course),
  "title": String,
  "content": String (rich text/markdown),
  "content_type": Enum["text", "video", "interactive"],
  "order": Integer,
  "duration_minutes": Integer,
  "resources": [{
    "title": String,
    "url": String,
    "type": String
  }],
  "quiz_id": ObjectId (ref: Quiz, optional),
  "created_at": DateTime,
  "updated_at": DateTime
}
```

### 5.4 Quiz Model

```python
{
  "_id": ObjectId,
  "title": String,
  "course_id": ObjectId (ref: Course, optional),
  "lesson_id": ObjectId (ref: Lesson, optional),
  "questions": [{
    "question_id": ObjectId (ref: Question),
    "order": Integer,
    "points": Integer
  }],
  "time_limit_minutes": Integer (optional),
  "passing_score": Integer,
  "is_randomized": Boolean,
  "attempts_allowed": Integer,
  "created_by": ObjectId (ref: User),
  "created_at": DateTime
}
```

### 5.5 Question Model

```python
{
  "_id": ObjectId,
  "question_text": String,
  "question_type": Enum["mcq", "true_false", "coding", "descriptive"],
  "difficulty": Enum["easy", "medium", "hard"],
  "topic": String (indexed),
  "options": [{
    "option_text": String,
    "is_correct": Boolean
  }] (for MCQ),
  "correct_answer": String (for true_false),
  "test_cases": [{
    "input": String,
    "expected_output": String,
    "is_hidden": Boolean
  }] (for coding),
  "explanation": String,
  "points": Integer,
  "created_by": ObjectId (ref: User),
  "created_at": DateTime
}
```

### 5.6 Problem Model (Coding)

```python
{
  "_id": ObjectId,
  "title": String (indexed),
  "description": String (markdown),
  "difficulty": Enum["easy", "medium", "hard"],
  "topics": [String] (indexed),
  "constraints": String,
  "examples": [{
    "input": String,
    "output": String,
    "explanation": String
  }],
  "test_cases": [{
    "input": String,
    "expected_output": String,
    "is_sample": Boolean,
    "points": Integer
  }],
  "starter_code": {
    "python": String,
    "javascript": String,
    "java": String,
    "cpp": String
  },
  "time_limit_ms": Integer,
  "memory_limit_mb": Integer,
  "success_rate": Float,
  "total_submissions": Integer,
  "created_by": ObjectId (ref: User),
  "created_at": DateTime
}
```

### 5.7 Submission Model

```python
{
  "_id": ObjectId,
  "user_id": ObjectId (ref: User),
  "problem_id": ObjectId (ref: Problem),
  "code": String,
  "language": String,
  "status": Enum["pending", "accepted", "wrong_answer", "runtime_error", "time_limit", "compilation_error"],
  "test_results": [{
    "test_case_id": String,
    "passed": Boolean,
    "execution_time_ms": Integer,
    "memory_used_kb": Integer,
    "output": String,
    "error": String
  }],
  "total_score": Integer,
  "submitted_at": DateTime
}
```

### 5.8 Certification Model

```python
{
  "_id": ObjectId,
  "user_id": ObjectId (ref: User),
  "course_id": ObjectId (ref: Course),
  "test_id": ObjectId (ref: Quiz),
  "score": Integer,
  "passing_score": Integer,
  "status": Enum["passed", "failed"],
  "certificate_url": String,
  "verification_code": String (unique, indexed),
  "issued_at": DateTime,
  "expires_at": DateTime (optional),
  "proctoring_report": {
    "violations": [{
      "type": String,
      "timestamp": DateTime,
      "severity": String,
      "snapshot_url": String
    }],
    "total_violations": Integer,
    "flagged_for_review": Boolean
  }
}
```

### 5.9 Proctoring Session Model

```python
{
  "_id": ObjectId,
  "user_id": ObjectId (ref: User),
  "test_id": ObjectId (ref: Quiz),
  "session_start": DateTime,
  "session_end": DateTime,
  "violations": [{
    "timestamp": DateTime,
    "type": Enum["no_face", "multiple_faces", "phone_detected", "tab_switch", "suspicious_movement"],
    "severity": Enum["low", "medium", "high"],
    "snapshot_url": String,
    "details": Object
  }],
  "snapshots": [String] (URLs),
  "video_url": String (optional),
  "flagged": Boolean,
  "reviewed_by": ObjectId (ref: User, optional),
  "review_notes": String,
  "created_at": DateTime
}
```

### 5.10 User Progress Model

```python
{
  "_id": ObjectId,
  "user_id": ObjectId (ref: User, indexed),
  "course_id": ObjectId (ref: Course, indexed),
  "lessons_completed": [ObjectId],
  "quizzes_completed": [{
    "quiz_id": ObjectId,
    "score": Integer,
    "attempts": Integer,
    "last_attempt": DateTime
  }],
  "problems_solved": [ObjectId],
  "current_lesson": ObjectId,
  "progress_percentage": Float,
  "time_spent_minutes": Integer,
  "last_accessed": DateTime,
  "started_at": DateTime,
  "completed_at": DateTime (optional)
}
```

---

## 6. API Design

### 6.1 Authentication Endpoints


#### POST /api/auth/register
**Description**: Register a new user  
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "role": "student"
}
```
**Response**: `201 Created`
```json
{
  "message": "User registered successfully",
  "user_id": "507f1f77bcf86cd799439011"
}
```

#### POST /api/auth/login
**Description**: Authenticate user and receive JWT token  
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```
**Response**: `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "student"
  }
}
```

#### POST /api/auth/google
**Description**: Google OAuth authentication  
**Request Body**:
```json
{
  "token": "google_oauth_token"
}
```
**Response**: `200 OK` (same as login)

#### POST /api/auth/refresh
**Description**: Refresh JWT token  
**Headers**: `Authorization: Bearer <token>`  
**Response**: `200 OK`
```json
{
  "access_token": "new_token_here",
  "token_type": "bearer"
}
```

#### POST /api/auth/forgot-password
**Description**: Request password reset  
**Request Body**:
```json
{
  "email": "user@example.com"
}
```
**Response**: `200 OK`
```json
{
  "message": "Password reset email sent"
}
```

### 6.2 Course Endpoints

#### GET /api/courses
**Description**: Get all courses (with filters)  
**Query Parameters**: `category`, `difficulty`, `search`, `page`, `limit`  
**Response**: `200 OK`
```json
{
  "courses": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "Python for Beginners",
      "description": "Learn Python from scratch",
      "instructor": "Jane Smith",
      "difficulty": "beginner",
      "enrollment_count": 1250,
      "rating": 4.7
    }
  ],
  "total": 45,
  "page": 1,
  "pages": 5
}
```

#### GET /api/courses/{course_id}
**Description**: Get course details with modules and lessons  
**Response**: `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Python for Beginners",
  "description": "Complete Python course",
  "modules": [
    {
      "module_id": "mod_1",
      "title": "Introduction to Python",
      "lessons": [
        {
          "id": "lesson_1",
          "title": "Getting Started",
          "duration_minutes": 15,
          "completed": false
        }
      ]
    }
  ]
}
```

#### POST /api/courses
**Description**: Create a new course (Teacher/Admin only)  
**Headers**: `Authorization: Bearer <token>`  
**Request Body**:
```json
{
  "title": "Advanced JavaScript",
  "description": "Master modern JavaScript",
  "category": "Programming",
  "difficulty": "advanced",
  "tags": ["javascript", "es6", "async"]
}
```
**Response**: `201 Created`

#### PUT /api/courses/{course_id}
**Description**: Update course details  
**Headers**: `Authorization: Bearer <token>`  
**Response**: `200 OK`

#### DELETE /api/courses/{course_id}
**Description**: Delete a course  
**Headers**: `Authorization: Bearer <token>`  
**Response**: `204 No Content`

#### POST /api/courses/{course_id}/enroll
**Description**: Enroll in a course  
**Headers**: `Authorization: Bearer <token>`  
**Response**: `200 OK`

### 6.3 Lesson Endpoints

#### GET /api/lessons/{lesson_id}
**Description**: Get lesson content  
**Headers**: `Authorization: Bearer <token>`  
**Response**: `200 OK`
```json
{
  "id": "lesson_1",
  "title": "Variables and Data Types",
  "content": "# Variables in Python\n\nVariables are...",
  "duration_minutes": 20,
  "resources": [
    {
      "title": "Python Docs",
      "url": "https://docs.python.org",
      "type": "documentation"
    }
  ],
  "quiz_id": "quiz_1"
}
```

#### POST /api/lessons/{lesson_id}/complete
**Description**: Mark lesson as completed  
**Headers**: `Authorization: Bearer <token>`  
**Response**: `200 OK`
```json
{
  "message": "Lesson marked as complete",
  "progress_percentage": 35.5
}
```

### 6.4 Quiz Endpoints

#### GET /api/quizzes/{quiz_id}
**Description**: Get quiz questions  
**Headers**: `Authorization: Bearer <token>`  
**Response**: `200 OK`
```json
{
  "id": "quiz_1",
  "title": "Python Basics Quiz",
  "time_limit_minutes": 30,
  "questions": [
    {
      "id": "q1",
      "question_text": "What is a variable?",
      "question_type": "mcq",
      "options": [
        {"id": "a", "text": "A container for data"},
        {"id": "b", "text": "A function"},
        {"id": "c", "text": "A loop"},
        {"id": "d", "text": "A class"}
      ],
      "points": 5
    }
  ]
}
```

#### POST /api/quizzes/{quiz_id}/submit
**Description**: Submit quiz answers  
**Headers**: `Authorization: Bearer <token>`  
**Request Body**:
```json
{
  "answers": [
    {"question_id": "q1", "selected_option": "a"},
    {"question_id": "q2", "answer_text": "Python is interpreted"}
  ]
}
```
**Response**: `200 OK`
```json
{
  "score": 85,
  "total_points": 100,
  "passed": true,
  "correct_answers": 17,
  "total_questions": 20,
  "feedback": [
    {
      "question_id": "q1",
      "correct": true,
      "explanation": "Variables store data values"
    }
  ]
}
```

#### POST /api/quizzes/generate
**Description**: AI-generated quiz from lesson content  
**Headers**: `Authorization: Bearer <token>`  
**Request Body**:
```json
{
  "lesson_id": "lesson_1",
  "num_questions": 10,
  "difficulty": "medium"
}
```
**Response**: `201 Created`

### 6.5 Coding Problem Endpoints

#### GET /api/problems
**Description**: Get list of coding problems  
**Query Parameters**: `difficulty`, `topic`, `search`, `page`, `limit`  
**Response**: `200 OK`
```json
{
  "problems": [
    {
      "id": "prob_1",
      "title": "Two Sum",
      "difficulty": "easy",
      "topics": ["arrays", "hash-table"],
      "success_rate": 0.68,
      "total_submissions": 15420
    }
  ]
}
```

#### GET /api/problems/{problem_id}
**Description**: Get problem details  
**Response**: `200 OK`
```json
{
  "id": "prob_1",
  "title": "Two Sum",
  "description": "Given an array of integers...",
  "difficulty": "easy",
  "examples": [
    {
      "input": "[2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "nums[0] + nums[1] = 9"
    }
  ],
  "constraints": "2 <= nums.length <= 10^4",
  "starter_code": {
    "python": "def twoSum(nums, target):\n    pass"
  },
  "test_cases": [
    {
      "input": "[2,7,11,15]\n9",
      "expected_output": "[0,1]",
      "is_sample": true
    }
  ]
}
```

#### POST /api/problems/{problem_id}/submit
**Description**: Submit code solution  
**Headers**: `Authorization: Bearer <token>`  
**Request Body**:
```json
{
  "code": "def twoSum(nums, target):\n    ...",
  "language": "python"
}
```
**Response**: `200 OK`
```json
{
  "submission_id": "sub_123",
  "status": "accepted",
  "test_results": [
    {
      "test_case": 1,
      "passed": true,
      "execution_time_ms": 45,
      "memory_used_kb": 1024
    }
  ],
  "total_score": 100
}
```

#### POST /api/problems/{problem_id}/run
**Description**: Run code with custom input (no submission)  
**Request Body**:
```json
{
  "code": "def solution():\n    ...",
  "language": "python",
  "input": "test input"
}
```
**Response**: `200 OK`
```json
{
  "output": "test output",
  "execution_time_ms": 120,
  "memory_used_kb": 2048,
  "status": "success"
}
```

### 6.6 AI Tutor Endpoints

#### POST /api/ai/chat
**Description**: Send message to AI tutor  
**Headers**: `Authorization: Bearer <token>`  
**Request Body**:
```json
{
  "message": "Explain recursion in Python",
  "context": {
    "course_id": "course_1",
    "lesson_id": "lesson_5"
  }
}
```
**Response**: `200 OK`
```json
{
  "response": "Recursion is a programming technique where...",
  "conversation_id": "conv_123",
  "sources": [
    {
      "title": "Python Recursion",
      "url": "lesson_5"
    }
  ]
}
```

#### GET /api/ai/conversations/{conversation_id}
**Description**: Get conversation history  
**Headers**: `Authorization: Bearer <token>`  
**Response**: `200 OK`
```json
{
  "conversation_id": "conv_123",
  "messages": [
    {
      "role": "user",
      "content": "Explain recursion",
      "timestamp": "2026-02-15T10:30:00Z"
    },
    {
      "role": "assistant",
      "content": "Recursion is...",
      "timestamp": "2026-02-15T10:30:03Z"
    }
  ]
}
```

### 6.7 Certification Endpoints

#### GET /api/certifications/tests
**Description**: Get available certification tests  
**Query Parameters**: `course_id`, `difficulty`  
**Response**: `200 OK`
```json
{
  "tests": [
    {
      "id": "cert_test_1",
      "title": "Python Developer Certification",
      "course_id": "course_1",
      "difficulty": "intermediate",
      "duration_minutes": 120,
      "passing_score": 70,
      "proctored": true
    }
  ]
}
```

#### POST /api/certifications/tests/{test_id}/start
**Description**: Start a certification test  
**Headers**: `Authorization: Bearer <token>`  
**Response**: `200 OK`
```json
{
  "session_id": "session_123",
  "test": {
    "questions": [...],
    "time_limit_minutes": 120
  },
  "proctoring_enabled": true
}
```

#### POST /api/certifications/tests/{test_id}/submit
**Description**: Submit certification test  
**Headers**: `Authorization: Bearer <token>`  
**Request Body**:
```json
{
  "session_id": "session_123",
  "answers": [...]
}
```
**Response**: `200 OK`
```json
{
  "score": 85,
  "passed": true,
  "certificate_id": "cert_456",
  "certificate_url": "/certificates/cert_456.pdf",
  "verification_code": "CERT-2026-ABC123"
}
```

#### GET /api/certifications/{certificate_id}
**Description**: Get certificate details  
**Response**: `200 OK`

#### GET /api/certifications/verify/{verification_code}
**Description**: Verify certificate authenticity  
**Response**: `200 OK`
```json
{
  "valid": true,
  "user_name": "John Doe",
  "course_title": "Python Developer",
  "issued_date": "2026-02-15",
  "score": 85
}
```

### 6.8 Proctoring Endpoints

#### POST /api/proctoring/sessions
**Description**: Create proctoring session  
**Headers**: `Authorization: Bearer <token>`  
**Request Body**:
```json
{
  "test_id": "cert_test_1"
}
```
**Response**: `201 Created`
```json
{
  "session_id": "proc_session_123",
  "websocket_url": "ws://api.learnquest.com/proctoring/ws/proc_session_123"
}
```

#### POST /api/proctoring/sessions/{session_id}/frame
**Description**: Submit webcam frame for analysis  
**Headers**: `Authorization: Bearer <token>`  
**Request Body**: `multipart/form-data` with image file  
**Response**: `200 OK`
```json
{
  "violations": [
    {
      "type": "phone_detected",
      "confidence": 0.92,
      "timestamp": "2026-02-15T10:45:23Z"
    }
  ],
  "face_detected": true,
  "face_count": 1
}
```

#### GET /api/proctoring/sessions/{session_id}/violations
**Description**: Get violations for a session  
**Headers**: `Authorization: Bearer <token>`  
**Response**: `200 OK`
```json
{
  "session_id": "proc_session_123",
  "total_violations": 3,
  "violations": [
    {
      "type": "multiple_faces",
      "timestamp": "2026-02-15T10:30:15Z",
      "severity": "high",
      "snapshot_url": "/snapshots/snap_123.jpg"
    }
  ]
}
```

#### POST /api/proctoring/sessions/{session_id}/end
**Description**: End proctoring session  
**Headers**: `Authorization: Bearer <token>`  
**Response**: `200 OK`
```json
{
  "message": "Session ended",
  "total_violations": 3,
  "flagged_for_review": true
}
```

### 6.9 User Progress & Analytics Endpoints

#### GET /api/users/me/progress
**Description**: Get current user's progress  
**Headers**: `Authorization: Bearer <token>`  
**Response**: `200 OK`
```json
{
  "courses_enrolled": 5,
  "courses_completed": 2,
  "total_points": 3450,
  "streak_days": 12,
  "courses": [
    {
      "course_id": "course_1",
      "title": "Python Basics",
      "progress_percentage": 75,
      "lessons_completed": 15,
      "total_lessons": 20
    }
  ]
}
```

#### GET /api/users/me/achievements
**Description**: Get user achievements and badges  
**Headers**: `Authorization: Bearer <token>`  
**Response**: `200 OK`

#### GET /api/recommendations
**Description**: Get personalized course recommendations (GNN-based)  
**Headers**: `Authorization: Bearer <token>`  
**Response**: `200 OK`
```json
{
  "recommendations": [
    {
      "course_id": "course_5",
      "title": "Advanced Python",
      "reason": "Based on your progress in Python Basics",
      "confidence": 0.87
    }
  ]
}
```

### 6.10 Admin Endpoints

#### GET /api/admin/users
**Description**: Get all users (Admin only)  
**Headers**: `Authorization: Bearer <token>`  
**Query Parameters**: `role`, `search`, `page`, `limit`  
**Response**: `200 OK`

#### PUT /api/admin/users/{user_id}
**Description**: Update user details  
**Headers**: `Authorization: Bearer <token>`  
**Response**: `200 OK`

#### DELETE /api/admin/users/{user_id}
**Description**: Delete user  
**Headers**: `Authorization: Bearer <token>`  
**Response**: `204 No Content`

#### GET /api/admin/analytics/dashboard
**Description**: Get platform analytics  
**Headers**: `Authorization: Bearer <token>`  
**Response**: `200 OK`
```json
{
  "total_users": 15420,
  "active_users_today": 3240,
  "total_courses": 156,
  "total_submissions": 45230,
  "certification_issued": 1250
}
```

#### GET /api/admin/proctoring/violations
**Description**: Get all proctoring violations  
**Headers**: `Authorization: Bearer <token>`  
**Query Parameters**: `severity`, `reviewed`, `page`, `limit`  
**Response**: `200 OK`

#### PUT /api/admin/proctoring/violations/{violation_id}/review
**Description**: Mark violation as reviewed  
**Headers**: `Authorization: Bearer <token>`  
**Request Body**:
```json
{
  "action": "approved",
  "notes": "False positive - lighting issue"
}
```
**Response**: `200 OK`

### 6.11 Leaderboard Endpoints

#### GET /api/leaderboard
**Description**: Get global leaderboard  
**Query Parameters**: `course_id`, `timeframe` (daily/weekly/all-time), `limit`  
**Response**: `200 OK`
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user_id": "user_123",
      "username": "CodeMaster",
      "points": 8750,
      "problems_solved": 145
    }
  ]
}
```

---

## 7. Security Design

### 7.1 Authentication & Authorization

#### 7.1.1 JWT Token Structure
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "student",
  "exp": 1708012800,
  "iat": 1707926400
}
```

#### 7.1.2 Token Management
- **Access Token Expiry**: 24 hours
- **Refresh Token**: Not implemented in v1.0 (future enhancement)
- **Token Storage**: Client-side in localStorage (with XSS protection)
- **Token Validation**: Middleware validates on every protected route

#### 7.1.3 Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| Student | View courses, submit assignments, take quizzes, access AI tutor |
| Teacher | All student permissions + Create/edit courses, view student progress |
| Admin | All permissions + User management, system configuration, analytics |

### 7.2 Code Execution Security

#### 7.2.1 Sandbox Isolation
- **Container-based**: Each execution runs in isolated Docker container
- **Resource Limits**: 
  - CPU: 1 core max
  - Memory: 512MB max
  - Time: 10 seconds max
  - Disk: 10MB max
- **Network Isolation**: No internet access from execution environment
- **File System**: Read-only except for /tmp directory

#### 7.2.2 Input Validation
- Code size limit: 64KB
- Language whitelist: Only supported languages allowed
- Malicious pattern detection: Block system calls, file operations

### 7.3 Proctoring Security & Privacy

#### 7.3.1 Data Protection
- **Consent**: Explicit user consent before webcam access
- **Encryption**: All proctoring data encrypted at rest (AES-256)
- **Access Control**: Only authorized admins can view proctoring data
- **Retention**: Proctoring data deleted after 90 days
- **Anonymization**: Personal data anonymized in analytics

#### 7.3.2 Webcam Data Handling
- **Client-side Processing**: Face detection runs in browser when possible
- **Frame Sampling**: 1 frame per second to minimize data transfer
- **Compression**: Images compressed before transmission
- **No Recording**: Video not recorded by default (snapshots only)

### 7.4 API Security

#### 7.4.1 Rate Limiting
```python
# Per-user rate limits
/api/auth/login: 5 requests/minute
/api/problems/*/submit: 10 requests/minute
/api/ai/chat: 20 requests/minute
Default: 100 requests/minute
```

#### 7.4.2 CORS Configuration
```python
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5174",
    "https://learnquest.com",
    "https://admin.learnquest.com"
]
```

#### 7.4.3 Input Sanitization
- SQL Injection: MongoDB parameterized queries
- XSS: HTML escaping on all user inputs
- CSRF: Token validation for state-changing operations
- Path Traversal: Whitelist-based file access

### 7.5 Database Security

#### 7.5.1 MongoDB Security
- **Authentication**: Username/password required
- **Authorization**: Role-based database access
- **Encryption**: TLS for connections, encryption at rest
- **Backup**: Daily automated backups with encryption

#### 7.5.2 Sensitive Data Handling
- **Passwords**: bcrypt hashing (12 rounds)
- **Tokens**: Stored hashed in database
- **PII**: Encrypted fields for sensitive data
- **Audit Logs**: All data access logged

---

## 8. Deployment Architecture

### 8.1 Docker Compose Architecture

```yaml
services:
  # Frontend Services
  web-frontend:
    build: ./apps/web-frontend
    ports: ["3000:80"]
    depends_on: [api]
    
  admin-frontend:
    build: ./apps/admin-frontend
    ports: ["5174:80"]
    depends_on: [api]
  
  # Backend Services
  api:
    build: ./apps/api
    ports: ["8000:8000"]
    depends_on: [mongodb, redis, ollama, chromadb]
    environment:
      - MONGODB_URL=mongodb://mongodb:27017
      - REDIS_URL=redis://redis:6379
      - OLLAMA_URL=http://host.docker.internal:11434
      - CHROMADB_URL=http://chromadb:8001
      - JWT_SECRET=${JWT_SECRET}
  
  # AI Services
  chromadb:
    image: chromadb/chroma:latest
    ports: ["8001:8000"]
    volumes: ["chromadb_data:/chroma/chroma"]
  
  # Code Execution
  judge0-server:
    image: judge0/judge0:1.13.0
    ports: ["2358:2358"]
    depends_on: [judge0-db, redis]
    environment:
      - REDIS_HOST=redis
      - POSTGRES_HOST=judge0-db
  
  judge0-worker:
    image: judge0/judge0:1.13.0
    command: ["./scripts/workers"]
    depends_on: [judge0-db, redis]
  
  # Databases
  mongodb:
    image: mongo:7.0
    ports: ["27017:27017"]
    volumes: ["mongodb_data:/data/db"]
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USER}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
  
  judge0-db:
    image: postgres:13
    volumes: ["postgres_data:/var/lib/postgresql/data"]
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
  
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: ["redis_data:/data"]

volumes:
  mongodb_data:
  postgres_data:
  redis_data:
  chromadb_data:
```

### 8.2 Production Deployment

#### 8.2.1 Infrastructure Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 8 cores | 16 cores |
| RAM | 16 GB | 32 GB |
| Storage | 100 GB SSD | 500 GB SSD |
| GPU | Optional | NVIDIA T4 (for proctoring) |
| Network | 100 Mbps | 1 Gbps |

#### 8.2.2 Scaling Strategy

**Horizontal Scaling**:
- API Service: 3+ instances behind load balancer
- Worker Service: 2+ instances for background jobs
- Judge0 Workers: 5+ instances for code execution

**Vertical Scaling**:
- MongoDB: Increase RAM for larger datasets
- Redis: Increase memory for caching
- Ollama: GPU acceleration for faster inference

**Load Balancing**:
```nginx
upstream api_backend {
    least_conn;
    server api1:8000;
    server api2:8000;
    server api3:8000;
}

server {
    listen 80;
    server_name api.learnquest.com;
    
    location / {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 8.2.3 High Availability

- **Database Replication**: MongoDB replica set (3 nodes)
- **Redis Sentinel**: Automatic failover
- **Health Checks**: Kubernetes liveness/readiness probes
- **Backup Strategy**: 
  - Daily full backups
  - Hourly incremental backups
  - 30-day retention
  - Off-site backup storage

### 8.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy LearnQuest

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          cd apps/api
          pytest tests/
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker images
        run: docker-compose build
      
      - name: Push to registry
        run: docker-compose push
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          ssh production "cd /app && docker-compose pull && docker-compose up -d"
```

### 8.4 Monitoring & Logging

#### 8.4.1 Logging Strategy
- **Application Logs**: Structured JSON logging
- **Access Logs**: Nginx access logs
- **Error Tracking**: Sentry integration
- **Log Aggregation**: ELK Stack (Elasticsearch, Logstash, Kibana)

#### 8.4.2 Monitoring Metrics
- **System Metrics**: CPU, memory, disk, network
- **Application Metrics**: Request rate, response time, error rate
- **Business Metrics**: User registrations, course enrollments, submissions
- **Database Metrics**: Query performance, connection pool

#### 8.4.3 Alerting
- API response time > 1s for 5 minutes
- Error rate > 5% for 2 minutes
- Database connection failures
- Disk usage > 85%
- Memory usage > 90%

---

## 9. AI/ML Architecture

### 9.1 AI Tutor System (Llama 3 + RAG)

#### 9.1.1 Architecture Flow
```
User Question
    ↓
Query Embedding (sentence-transformers)
    ↓
Vector Search (ChromaDB)
    ↓
Retrieve Relevant Context
    ↓
Prompt Construction
    ↓
Llama 3 Inference (Ollama)
    ↓
Response Generation
    ↓
User Response
```

#### 9.1.2 RAG Implementation
```python
# Embedding Model
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# ChromaDB Collection
collection = chromadb.get_or_create_collection(
    name="course_content",
    metadata={"hnsw:space": "cosine"}
)

# Retrieval
def retrieve_context(query: str, k: int = 5):
    query_embedding = embed_text(query)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=k
    )
    return results['documents']

# Prompt Template
PROMPT_TEMPLATE = """
You are an expert programming tutor. Use the following context to answer the question.

Context:
{context}

Question: {question}

Answer:
"""
```

#### 9.1.3 Llama 3 Configuration
- **Model**: llama3:8b (8 billion parameters)
- **Temperature**: 0.7 (balanced creativity)
- **Max Tokens**: 1024
- **Context Window**: 8192 tokens
- **Inference Time**: ~3-5 seconds on CPU, ~1-2 seconds on GPU

### 9.2 AI Quiz Generation

#### 9.2.1 Question Generation Pipeline
```python
def generate_quiz(lesson_content: str, num_questions: int, difficulty: str):
    prompt = f"""
    Generate {num_questions} {difficulty} multiple-choice questions 
    based on the following content:
    
    {lesson_content}
    
    Format each question as JSON with:
    - question_text
    - options (4 choices)
    - correct_answer
    - explanation
    """
    
    response = ollama.generate(model="llama3", prompt=prompt)
    questions = parse_questions(response)
    return questions
```

#### 9.2.2 Difficulty Calibration
- **Easy**: Basic recall, definitions
- **Medium**: Application, problem-solving
- **Hard**: Analysis, synthesis, edge cases

### 9.3 Proctoring AI System

#### 9.3.1 Face Detection (MediaPipe)
```python
import mediapipe as mp

mp_face_detection = mp.solutions.face_detection

def detect_faces(image):
    with mp_face_detection.FaceDetection(
        model_selection=1,
        min_detection_confidence=0.5
    ) as face_detection:
        results = face_detection.process(image)
        
        if not results.detections:
            return {"face_count": 0, "violation": "no_face"}
        
        face_count = len(results.detections)
        if face_count > 1:
            return {"face_count": face_count, "violation": "multiple_faces"}
        
        return {"face_count": 1, "violation": None}
```

#### 9.3.2 Phone Detection (YOLO)
```python
from ultralytics import YOLO

model = YOLO('yolov8n.pt')  # Nano model for speed

def detect_phone(image):
    results = model(image, classes=[67])  # Class 67 = cell phone
    
    detections = []
    for result in results:
        for box in result.boxes:
            if box.conf > 0.6:  # 60% confidence threshold
                detections.append({
                    "class": "phone",
                    "confidence": float(box.conf),
                    "bbox": box.xyxy.tolist()
                })
    
    return {
        "phone_detected": len(detections) > 0,
        "detections": detections
    }
```

#### 9.3.3 Violation Scoring System
```python
VIOLATION_WEIGHTS = {
    "no_face": 10,
    "multiple_faces": 15,
    "phone_detected": 20,
    "tab_switch": 5,
    "suspicious_movement": 3
}

def calculate_violation_score(violations):
    total_score = sum(VIOLATION_WEIGHTS[v['type']] for v in violations)
    
    if total_score > 50:
        return "high_risk"
    elif total_score > 20:
        return "medium_risk"
    else:
        return "low_risk"
```

### 9.4 GNN Recommendation System

#### 9.4.1 Graph Structure
```
Nodes:
- Users (features: skill level, interests, progress)
- Courses (features: difficulty, topics, prerequisites)
- Topics (features: category, complexity)

Edges:
- User → Course (enrolled, completed, rating)
- Course → Topic (covers)
- Course → Course (prerequisite)
- User → Topic (mastery level)
```

#### 9.4.2 GNN Model Architecture
```python
import torch
import torch.nn as nn
from torch_geometric.nn import GCNConv

class CourseRecommenderGNN(nn.Module):
    def __init__(self, num_features, hidden_dim=64):
        super().__init__()
        self.conv1 = GCNConv(num_features, hidden_dim)
        self.conv2 = GCNConv(hidden_dim, hidden_dim)
        self.fc = nn.Linear(hidden_dim * 2, 1)
    
    def forward(self, x, edge_index, user_idx, course_idx):
        x = self.conv1(x, edge_index).relu()
        x = self.conv2(x, edge_index).relu()
        
        user_emb = x[user_idx]
        course_emb = x[course_idx]
        
        combined = torch.cat([user_emb, course_emb], dim=-1)
        score = self.fc(combined).sigmoid()
        
        return score
```

#### 9.4.3 Recommendation Algorithm
```python
def get_recommendations(user_id: str, top_k: int = 5):
    # Get user node and features
    user_node = get_user_node(user_id)
    
    # Get all courses user hasn't taken
    candidate_courses = get_unenrolled_courses(user_id)
    
    # Score each course
    scores = []
    for course in candidate_courses:
        score = model(
            graph.x, 
            graph.edge_index,
            user_node,
            course.node_id
        )
        scores.append((course, score))
    
    # Sort by score and return top-k
    recommendations = sorted(scores, key=lambda x: x[1], reverse=True)[:top_k]
    
    return recommendations
```

---

## 10. Performance Optimization

### 10.1 Caching Strategy

#### 10.1.1 Redis Caching Layers
```python
# Cache Configuration
CACHE_TTL = {
    "course_list": 300,      # 5 minutes
    "course_detail": 600,    # 10 minutes
    "user_profile": 180,     # 3 minutes
    "leaderboard": 60,       # 1 minute
    "problem_list": 900      # 15 minutes
}

# Cache Implementation
async def get_course(course_id: str):
    cache_key = f"course:{course_id}"
    
    # Try cache first
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Fetch from database
    course = await db.courses.find_one({"_id": course_id})
    
    # Store in cache
    await redis.setex(
        cache_key,
        CACHE_TTL["course_detail"],
        json.dumps(course)
    )
    
    return course
```

#### 10.1.2 Browser Caching
```nginx
# Static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# API responses
location /api/ {
    add_header Cache-Control "no-cache, must-revalidate";
}
```

### 10.2 Database Optimization

#### 10.2.1 MongoDB Indexes
```javascript
// User collection
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "role": 1 })

// Course collection
db.courses.createIndex({ "title": "text", "description": "text" })
db.courses.createIndex({ "category": 1, "difficulty": 1 })
db.courses.createIndex({ "instructor_id": 1 })

// Problem collection
db.problems.createIndex({ "difficulty": 1, "topics": 1 })
db.problems.createIndex({ "title": "text" })

// Submission collection
db.submissions.createIndex({ "user_id": 1, "problem_id": 1 })
db.submissions.createIndex({ "submitted_at": -1 })

// Progress collection
db.progress.createIndex({ "user_id": 1, "course_id": 1 }, { unique: true })
```

#### 10.2.2 Query Optimization
```python
# Bad: N+1 query problem
courses = await db.courses.find({}).to_list(100)
for course in courses:
    instructor = await db.users.find_one({"_id": course["instructor_id"]})

# Good: Aggregation pipeline
courses = await db.courses.aggregate([
    {
        "$lookup": {
            "from": "users",
            "localField": "instructor_id",
            "foreignField": "_id",
            "as": "instructor"
        }
    },
    {"$unwind": "$instructor"}
]).to_list(100)
```

### 10.3 Code Execution Optimization

#### 10.3.1 Judge0 Worker Pool
- Pre-warmed containers for popular languages
- Connection pooling for database
- Batch processing for multiple submissions

#### 10.3.2 Execution Queue Management
```python
# Priority queue for submissions
PRIORITY = {
    "certification": 1,  # Highest priority
    "quiz": 2,
    "practice": 3        # Lowest priority
}

async def submit_code(code, language, submission_type):
    priority = PRIORITY.get(submission_type, 3)
    
    job_id = await judge0.create_submission(
        code=code,
        language_id=language,
        priority=priority
    )
    
    return job_id
```

### 10.4 Frontend Optimization

#### 10.4.1 Code Splitting
```javascript
// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Courses = lazy(() => import('./pages/Courses'))
const PracticePage = lazy(() => import('./pages/PracticePage'))

// Route configuration
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/courses" element={<Courses />} />
    <Route path="/practice" element={<PracticePage />} />
  </Routes>
</Suspense>
```

#### 10.4.2 Asset Optimization
- Image compression (WebP format)
- Minification (JS, CSS)
- Tree shaking (remove unused code)
- CDN for static assets
- Gzip/Brotli compression

---

## 11. Testing Strategy

### 11.1 Backend Testing

#### 11.1.1 Unit Tests
```python
# tests/test_auth.py
import pytest
from app.services.authService import hash_password, verify_password

def test_password_hashing():
    password = "SecurePass123"
    hashed = hash_password(password)
    
    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("WrongPass", hashed)

def test_jwt_token_generation():
    from app.auth import create_access_token
    
    token = create_access_token({"sub": "user_123"})
    assert token is not None
    assert len(token) > 50
```

#### 11.1.2 Integration Tests
```python
# tests/test_api.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_user_registration(client: AsyncClient):
    response = await client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "TestPass123",
        "full_name": "Test User",
        "role": "student"
    })
    
    assert response.status_code == 201
    assert "user_id" in response.json()

@pytest.mark.asyncio
async def test_course_enrollment(client: AsyncClient, auth_token: str):
    response = await client.post(
        "/api/courses/course_123/enroll",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
```

#### 11.1.3 Test Coverage Goals
- Unit tests: 80% coverage
- Integration tests: 70% coverage
- Critical paths: 100% coverage (auth, payments, proctoring)

### 11.2 Frontend Testing

#### 11.2.1 Component Tests
```javascript
// tests/Login.test.jsx
import { render, screen, fireEvent } from '@testing-library/react'
import Login from '../pages/Login'

test('renders login form', () => {
  render(<Login />)
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
})

test('submits login form', async () => {
  const mockLogin = jest.fn()
  render(<Login onLogin={mockLogin} />)
  
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' }
  })
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'password123' }
  })
  fireEvent.click(screen.getByRole('button', { name: /login/i }))
  
  expect(mockLogin).toHaveBeenCalled()
})
```

#### 11.2.2 E2E Tests
```javascript
// e2e/user-flow.spec.js
import { test, expect } from '@playwright/test'

test('complete course enrollment flow', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('[name="email"]', 'student@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  // Navigate to courses
  await page.click('text=Courses')
  await expect(page).toHaveURL('/courses')
  
  // Enroll in course
  await page.click('text=Python Basics')
  await page.click('button:has-text("Enroll")')
  
  // Verify enrollment
  await expect(page.locator('text=Enrolled')).toBeVisible()
})
```

### 11.3 Performance Testing

#### 11.3.1 Load Testing
```python
# locustfile.py
from locust import HttpUser, task, between

class LearnQuestUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Login
        response = self.client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        self.token = response.json()["access_token"]
    
    @task(3)
    def view_courses(self):
        self.client.get("/api/courses", headers={
            "Authorization": f"Bearer {self.token}"
        })
    
    @task(2)
    def view_problems(self):
        self.client.get("/api/problems")
    
    @task(1)
    def submit_code(self):
        self.client.post("/api/problems/prob_1/submit", json={
            "code": "def solution(): return True",
            "language": "python"
        }, headers={
            "Authorization": f"Bearer {self.token}"
        })
```

#### 11.3.2 Performance Benchmarks
- API response time: < 500ms (p95)
- Page load time: < 3s
- Code execution: < 10s
- AI tutor response: < 5s
- Concurrent users: 10,000+

---

## 12. Error Handling & Resilience

### 12.1 Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    },
    "timestamp": "2026-02-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### 12.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily down |

### 12.3 Retry Logic

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
async def call_external_service(url: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.json()
```

### 12.4 Circuit Breaker

```python
from circuitbreaker import circuit

@circuit(failure_threshold=5, recovery_timeout=60)
async def call_judge0(code: str, language: str):
    # If Judge0 fails 5 times, circuit opens for 60 seconds
    response = await judge0_client.submit(code, language)
    return response
```

### 12.5 Graceful Degradation

```python
async def get_ai_response(question: str):
    try:
        # Try primary AI service
        return await ollama.generate(question)
    except Exception as e:
        logger.error(f"Ollama failed: {e}")
        
        # Fallback to cached responses
        cached = await get_cached_response(question)
        if cached:
            return cached
        
        # Final fallback
        return {
            "response": "AI service temporarily unavailable. Please try again later.",
            "fallback": True
        }
```

---

## 13. Development Workflow

### 13.1 Git Branching Strategy

```
main (production)
  ↓
develop (staging)
  ↓
feature/user-authentication
feature/ai-tutor
feature/proctoring
bugfix/login-issue
hotfix/security-patch
```

### 13.2 Commit Convention

```
feat: Add AI quiz generation endpoint
fix: Resolve JWT token expiration issue
docs: Update API documentation
style: Format code with black
refactor: Optimize database queries
test: Add unit tests for auth service
chore: Update dependencies
```

### 13.3 Code Review Checklist

- [ ] Code follows style guide (PEP 8 for Python, ESLint for JS)
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Error handling implemented
- [ ] Logging added for debugging

### 13.4 Development Environment Setup

```bash
# Backend setup
cd apps/api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd apps/web-frontend
npm install

# Start services
docker-compose up -d mongodb redis judge0-server chromadb
python apps/api/main.py
npm run dev --prefix apps/web-frontend
```

---

## 14. Documentation Standards

### 14.1 API Documentation

```python
@router.post("/courses/{course_id}/enroll")
async def enroll_in_course(
    course_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Enroll the current user in a course.
    
    Args:
        course_id: The ID of the course to enroll in
        current_user: The authenticated user (injected)
    
    Returns:
        dict: Enrollment confirmation with progress data
    
    Raises:
        HTTPException: 404 if course not found
        HTTPException: 409 if already enrolled
    
    Example:
        POST /api/courses/course_123/enroll
        Authorization: Bearer <token>
        
        Response:
        {
            "message": "Enrolled successfully",
            "progress": {...}
        }
    """
    # Implementation
```

### 14.2 Code Comments

```python
# Good: Explain WHY, not WHAT
# Use exponential backoff to avoid overwhelming the API during high load
await asyncio.sleep(2 ** attempt)

# Bad: Obvious comment
# Increment counter by 1
counter += 1
```

### 14.3 README Structure

```markdown
# Component Name

## Overview
Brief description of what this component does

## Installation
Step-by-step setup instructions

## Usage
Code examples and common use cases

## Configuration
Environment variables and settings

## API Reference
Link to detailed API docs

## Testing
How to run tests

## Contributing
Guidelines for contributors

## License
License information
```

---

## 15. Migration & Data Management

### 15.1 Database Migrations

```python
# migrations/001_add_certification_fields.py
from pymongo import MongoClient

def upgrade(db):
    """Add certification-related fields to user collection"""
    db.users.update_many(
        {},
        {
            "$set": {
                "certifications": [],
                "certification_points": 0
            }
        }
    )
    
    # Create index
    db.certifications.create_index([("verification_code", 1)], unique=True)

def downgrade(db):
    """Remove certification fields"""
    db.users.update_many(
        {},
        {
            "$unset": {
                "certifications": "",
                "certification_points": ""
            }
        }
    )
    
    db.certifications.drop_index("verification_code_1")
```

### 15.2 Data Seeding

```python
# seeds/initial_data.py
async def seed_database():
    # Create admin user
    admin = {
        "email": "admin@learnquest.com",
        "password_hash": hash_password("admin123"),
        "full_name": "System Admin",
        "role": "admin",
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(admin)
    
    # Create sample courses
    courses = [
        {
            "title": "Python for Beginners",
            "description": "Learn Python from scratch",
            "difficulty": "beginner",
            "category": "Programming",
            "is_published": True
        },
        # More courses...
    ]
    await db.courses.insert_many(courses)
    
    # Create sample problems
    problems = [
        {
            "title": "Two Sum",
            "difficulty": "easy",
            "topics": ["arrays", "hash-table"],
            # Problem details...
        }
    ]
    await db.problems.insert_many(problems)
```

### 15.3 Backup & Restore

```bash
# Backup MongoDB
mongodump --uri="mongodb://localhost:27017/learnquest" --out=/backups/$(date +%Y%m%d)

# Restore MongoDB
mongorestore --uri="mongodb://localhost:27017/learnquest" /backups/20260215

# Backup with compression
mongodump --uri="mongodb://localhost:27017/learnquest" --gzip --archive=/backups/backup.gz

# Automated daily backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --gzip --archive="$BACKUP_DIR/backup_$DATE.gz"

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.gz" -mtime +30 -delete
```

---

## 16. Compliance & Privacy

### 16.1 GDPR Compliance

#### 16.1.1 Data Subject Rights
- **Right to Access**: Users can download their data via `/api/users/me/export`
- **Right to Erasure**: Users can request account deletion
- **Right to Rectification**: Users can update their profile data
- **Right to Portability**: Data export in JSON format

#### 16.1.2 Data Export Format
```json
{
  "user_data": {
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2026-01-15T10:00:00Z"
  },
  "progress": [...],
  "submissions": [...],
  "certifications": [...],
  "proctoring_sessions": [...]
}
```

#### 16.1.3 Consent Management
```python
class UserConsent(BaseModel):
    user_id: str
    webcam_consent: bool
    data_processing_consent: bool
    marketing_consent: bool
    consent_date: datetime
    ip_address: str
```

### 16.2 Data Retention Policy

| Data Type | Retention Period | Deletion Method |
|-----------|------------------|-----------------|
| User accounts | Until deletion request | Hard delete |
| Course progress | 2 years after last activity | Soft delete |
| Proctoring data | 90 days | Automatic deletion |
| Audit logs | 1 year | Automatic deletion |
| Backups | 30 days | Automatic deletion |

### 16.3 Privacy by Design

- **Data Minimization**: Collect only necessary data
- **Encryption**: All sensitive data encrypted at rest and in transit
- **Anonymization**: Analytics use anonymized data
- **Access Control**: Role-based access to personal data
- **Audit Trail**: All data access logged

---

## 17. Future Enhancements

### 17.1 Phase 2 Features (Post-MVP)

#### 17.1.1 Mobile Applications
- Native iOS app (Swift/SwiftUI)
- Native Android app (Kotlin/Jetpack Compose)
- Offline mode for course content
- Push notifications for deadlines

#### 17.1.2 Advanced Analytics
- Predictive analytics for student success
- Learning pattern analysis
- Dropout risk prediction
- Personalized intervention recommendations

#### 17.1.3 Social Learning
- Discussion forums
- Peer code review
- Study groups
- Live Q&A sessions

#### 17.1.4 Enhanced AI Features
- Voice-based AI tutor
- Code explanation and debugging assistant
- Automated code review
- Personalized learning content generation

### 17.2 Technical Improvements

#### 17.2.1 Microservices Decomposition
- Separate authentication service
- Dedicated proctoring service
- Independent AI service
- Event-driven architecture with message queues

#### 17.2.2 Advanced Caching
- CDN integration for global content delivery
- Redis Cluster for distributed caching
- GraphQL with DataLoader for efficient queries

#### 17.2.3 Real-time Features
- WebSocket for live coding collaboration
- Real-time leaderboard updates
- Live proctoring with admin monitoring
- Instant notification system

---

## 18. Glossary

| Term | Definition |
|------|------------|
| **RAG** | Retrieval-Augmented Generation - AI technique combining retrieval and generation |
| **GNN** | Graph Neural Network - Deep learning on graph-structured data |
| **JWT** | JSON Web Token - Secure authentication token |
| **YOLO** | You Only Look Once - Real-time object detection algorithm |
| **MediaPipe** | Google's ML framework for multimodal pipelines |
| **Judge0** | Open-source code execution system |
| **Ollama** | Local LLM inference engine |
| **ChromaDB** | Vector database for embeddings |
| **Proctoring** | Automated exam monitoring and supervision |
| **Sandbox** | Isolated execution environment |

---

## 19. References

### 19.1 Technology Documentation
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [Judge0 API](https://ce.judge0.com/)
- [Ollama Documentation](https://ollama.ai/docs)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [YOLO Documentation](https://docs.ultralytics.com/)
- [MediaPipe Documentation](https://developers.google.com/mediapipe)

### 19.2 Best Practices
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [12-Factor App](https://12factor.net/)
- [REST API Design](https://restfulapi.net/)
- [MongoDB Schema Design](https://www.mongodb.com/docs/manual/data-modeling/)

---

## 20. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | LearnQuest Team | Initial design document |
| 1.1 | 2026-02-15 | LearnQuest Team | Added complete API specs, deployment, security, AI/ML architecture |

---

**Document Status**: Complete  
**Last Updated**: February 15, 2026  
**Next Review**: Post-Implementation Review

---

## Appendix A: Environment Variables

```bash
# Application
APP_NAME=LearnQuest
APP_ENV=production
DEBUG=false
SECRET_KEY=your-secret-key-here

# Database
MONGODB_URL=mongodb://localhost:27017/learnquest
MONGODB_USER=admin
MONGODB_PASSWORD=secure-password

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=redis-password

# Judge0
JUDGE0_URL=http://localhost:2358
JUDGE0_API_KEY=your-judge0-key

# AI Services
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3:8b
CHROMADB_URL=http://localhost:8001

# Authentication
JWT_SECRET=your-jwt-secret
JWT_ALGORITHM=HS256
JWT_EXPIRATION=86400

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@learnquest.com
SMTP_PASSWORD=email-password

# Storage
UPLOAD_DIR=/uploads
MAX_UPLOAD_SIZE=10485760

# Proctoring
PROCTORING_ENABLED=true
YOLO_MODEL_PATH=/models/yolov8n.pt
FACE_DETECTION_CONFIDENCE=0.5
PHONE_DETECTION_CONFIDENCE=0.6

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=INFO
```

---

**End of Design Document**
