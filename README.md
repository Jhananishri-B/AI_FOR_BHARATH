# LearnQuest

<!-- This is a dummy comment for commit purposes -->

LearnQuest is an end-to-end learning and testing platform that blends AI tutoring, adaptive practice, certification delivery, and secure proctoring. It supports both learners and administrators with tooling to create content, monitor progress, and enforce academic integrity across web and mobile devices.

## What Makes LearnQuest Different

- **AI-first learning** – AI Questie, AI Tutor, quiz copilots, and LLM-powered explanations guide learners through every topic.
- **Adaptive practice** – Personalized practice zones, duolingo-style streaks, and XP-based leveling keep students engaged.
- **Enterprise-grade proctoring** – Webcam monitoring, mobile/secondary-device detection, multi-face alerts, and face-pose tracking reduce violations.
- **Unified admin workspace** – Course/catalog management, certification workflows, analytics dashboards, and content moderation live in one console.
- **Full-stack tooling** – Monorepo contains frontend apps, backend services, infra, scripts, and documentation required to deploy on-prem or to the cloud.

## Feature Tour

Each feature below includes a screenshot placeholder that you can replace with the actual asset (recommended location: `docs/screenshots/`). Feel free to update the filenames once your captures are ready.

### AI Questie & Tutor

Generate practice questions, hints, and tutoring sessions using in-house LLM workflows. Learners can summon AI help mid-quiz, inside flashcards, or while coding.

![AI Questie Screenshot](img/quetie.png)

### Courses & Learning Paths

Author multi-module courses with text, video, coding labs, and assessments. Duolingo-style progress indicators and streak reminders keep motivation high.

![Courses Screenshot](img/course.png)

### Practice Zone & Learn Programming

Blend MCQ, programming, and free-form practice modes with AI review of answers. Adaptive feedback highlights weak areas and suggests next lessons.

![Practice Zone Screenshot](img/practice-zone-code.png)

### Certifications & Exams

Publish certification tracks, automate email/PDF issuance, and run secure proctored exams backed by AI monitoring.

![Certifications Screenshot](img/certificate-management.png)

### Admin Content Management

Manage course catalogs, question banks, templates, schedules, and moderation pipelines from a unified admin portal.

![Content Management Screenshot](img/admin-dashboard.png)

### Analytics, Comparisons, and Data Insights

Display trend charts, compare students side-by-side, analyze violation metrics, and export insights for managers.

![Analytics Screenshot](img/restul-analysis.png)

### Leaderboard, XP, and Gamification

Global and cohort leaderboards, XP leveling, badge cabinet, and trophy wall drive engagement across every track.

![Leaderboard Screenshot](img/LB.png)

### Webcam Monitoring & Violation Detection

Live webcam feed with auto-captured violation clips covers mobile phone usage, multiple faces, face-pose drift, and other suspicious activity.

![Webcam Monitoring Screenshot](img/exam-voilation-dashboard.png)

### Mobile & Multi-Device Detection

Detect pocket phones, mirrored displays, or extra devices joining the session. Alerts pipe into the violation timeline.

![Malpractice Detection Screenshot](img/violationalert.png)

### Face Pose & Multi-Face Detection

Real-time pose tracking and face counting ensure the learner stays centered and alone during the attempt.

![Face Pose Screenshot](img/test-code.png)

### Quiz, LLM, and Duolingo-Style Journeys

Mix quick quizzes, step-by-step LLM tutoring, and streak-friendly journeys inspired by Duolingo for language or skill mastery.

![Quiz Journey Screenshot](img/test-mcq.png)

### Practice LLM Copilot

LLM copilot explains answers, rewrites prompts, and provides alternative approaches while respecting guardrails defined per module/exam.

![LLM Copilot Screenshot](img/quetie.png)

## Platform Flow (diagram placeholder)

Insert a high-level system/experience flow diagram here when ready.

![Platform Flow Diagram](img/dashboard.png)

## 🎯 Technical Architecture Overview

### System Summary

This Docker Compose configuration provisions the full-stack architecture for the LearnQuest platform. It establishes a resilient, multi-service environment combining frontends, a Python-based API, specialized microservices for code execution (Judge0), AI vector search (ChromaDB), and an integrated MongoDB database.

![Architecture Diagram](img/userprogress.png)

### Key AI Models

- **LLM/Tutoring**: Llama 3 (used by the api service) powers the AI Questie and Tutor functions.
- **Proctoring/Monitoring**: YOLO (object detection) and MediaPipe (pose/face tracking) are employed for real-time violation detection.

![AI Models Diagram](img/Exam-monitoring-process.png)

### ⚙️ Technical Architecture

The platform operates as a distributed system utilizing 10 distinct containerized services.

| Service Group | Components | Purpose | Technology |
|--------------|------------|---------|------------|
| **User Interface** | `web`, `admin-frontend` | Hosts the student and administrative React interfaces. | React, Node:20-alpine |
| **Core Logic** | `api` | Handles business logic, Llama 3 orchestration, and YOLO/MediaPipe services. | Python, FastAPI/Uvicorn (via custom build) |
| **Code Execution** | `judge0`, `judge0-worker`, `judge0-db`, `judge0-redis` | Provides a secure, dedicated environment for compiling and running code challenges. | Judge0, PostgreSQL, Redis |
| **AI/Vector Search** | `chroma`, `chroma-init` | Stores and retrieves vector embeddings for AI tutoring (Questie) and content similarity. | ChromaDB, Python (for initialization) |
| **Data Storage** | `db` | Primary data persistence for user profiles, courses, and platform data. | MongoDB 7.0 |

![Service Architecture](img/Exam-monitoring-process.png)

### 🚀 Key Architectural Features

1. **High-Performance AI Capabilities**
   - The api service includes a deploy section that enables NVIDIA GPU reservation for performance-intensive tasks, essential for running the YOLO/MediaPipe real-time proctoring and fast Llama 3 inference.

2. **Isolated Code Execution**
   - The platform uses the Judge0 microservice stack to isolate code compilation and execution from the main API, enhancing security and preventing resource contention.

3. **Service Networking & Configuration**
   - External LLM Integration: The api service is configured to connect to an external LLM service (like Ollama for Llama 3) using `http://host.docker.internal:11434`.

![Architecture Features](img/violation-card.png)

## Repository Layout

```
learn-quest/
├─ apps/          # React frontends (web, admin, runners)
├─ services/      # API, workers, embeddings, proctoring services
├─ infra/         # Deployment and infrastructure configuration
├─ scripts/       # Local automation & helper scripts
├─ docs/          # Feature and troubleshooting guides
└─ *.md           # Top-level reference manuals per subsystem
```

Key helper scripts:
- `START_LEARNQUEST.bat`, `run_admin.ps1`: one-click launchers for Windows.
- `scripts/team_setup.py`: guided environment setup for new contributors.
- `setup_proctoring.py`, `test_proctoring.py`: camera/proctoring diagnostics.

## Prerequisites

- Node.js 18+
- Python 3.9+ (for backend services)
- Docker Desktop with Docker Compose
- NVIDIA Docker Runtime (required for GPU-accelerated AI features)
- MongoDB (local or managed) for the API
- Google Cloud Project for OAuth credentials (optional but recommended)

## Environment Setup

```powershell
git clone <repo-url>
cd LearnQuest

# Install JS dependencies
npm install

# Copy env template and edit values (OAuth, DB, etc.)
copy env.example .env

# (Optional) Guided setup for teammates
python scripts/team_setup.py
```

Google OAuth instructions live in `docs/GOOGLE_OAUTH_SETUP.md`. Additional subsystem guides exist in the root (`TEAM_SETUP_GUIDE.md`, `PROCTORING_IMPLEMENTATION_GUIDE.md`, `CERTIFICATE_TEMPLATE_GUIDE.md`, etc.).

## Running the Stack

### 🛠️ Quick Deployment Guide (Docker - Recommended)

This configuration assumes the presence of a file named `./services/api/.env` containing sensitive variables like `MONGO_URL` and `JWT_SECRET_KEY`.

#### Prerequisites

- **Docker Desktop** (Required for all services)
- **NVIDIA Docker Runtime** (Required if utilizing the api GPU deployment settings)

#### Setup and Start

```bash
# 1. Ensure your .env file is configured
# Edit ./services/api/.env with your MONGO_URL, JWT_SECRET_KEY, etc.

# 2. Build and launch all services
docker compose up -d --build

# 3. Wait for database initialization

# 4. Access the Frontends:
#    Student Web UI:    http://localhost:3000
#    Admin Frontend:    http://localhost:5174
```

![Deployment Flow](img/test-result.png)

#### Stopping and Cleanup

```bash
# Stop all containers and remove their networks and volumes
docker compose down -v
```

The web container proxies API traffic internally via `VITE_API_URL=http://api:8000`.

### Local (no Docker)

**API**
```powershell
cd services/api
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

**Web Frontend**
```powershell
cd apps/web-frontend
npm install
$env:VITE_API_URL = 'http://localhost:8000'
npm run dev
# open http://localhost:5173
```

## Testing & Tooling

- JS tests: `npm test`
- Frontend dev server: `npm run dev`
- Production build: `npm run build`
- API smoke check: `curl http://localhost:8000/api/health`
- Camera/proctor diagnostics: `test_proctoring.py`, `test_camera.html`

## Documentation Index

All detailed manuals now live in `docs/`. Start with:

- `docs/design-system.md` – shared UI components & guidelines.
- `docs/api-spec.md` – public and internal API contracts.
- `docs/deployment.md` – infra requirements, Docker/CI tips.
- `docs/GOOGLE_OAUTH_SETUP.md` – identity integration steps.
- `docs/TEAM_SETUP_GUIDE.md` – onboarding checklist for new contributors.
- `docs/GPU_SETUP_WINDOWS.md` & `docs/CERTIFICATION_PROCTORING.md` – optional feature enablement guides.

Keep screenshots and feature walk-throughs alongside their respective documents for easier maintenance.

## Contributing

1. Fork and clone the repo.
2. Create a feature branch (`git checkout -b feature/my-change`).
3. Run linting/tests before opening a PR.
4. Provide context and screenshots/logs in pull requests for faster reviews.

## ⭐ Credits

**Project Lead & Core Developer:** GOKUL V  
**Email:** gokul9942786@gmail.com

## 📜 License

MIT License. See `LICENSE` for full terms.


