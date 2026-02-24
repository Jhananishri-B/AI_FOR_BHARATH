from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path

# Load environment variables from .env file
def load_env_file():
    env_path = Path(__file__).parent.parent.parent.parent / ".env"
    if env_path.exists():
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

# Load .env file
load_env_file()
from .routes.health import router as health_router
from .routes.auth import router as auth_router
from .routes.courses import router as courses_router
from .routes.quizzes import router as quizzes_router
from .routes.users import router as users_router
from .routes.ai import router as ai_router
from .routes.lessons import router as lessons_router
from .routes.problems import router as problems_router
from .routes.certifications import router as certifications_router
from .routes.admin import router as admin_router  # base admin router
from .routes.admin_users import router as admin_users_router
from .routes.simple_gnn import router as gnn_router
from .routes.ai_quiz import router as ai_quiz_router
from .routes.cert_tests_admin import router as cert_tests_admin_router
from .routes.cert_tests_runtime import router as cert_tests_runtime_router
from .routes.proctoring import router as proctoring_router

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up...")
    print("Startup complete")
    yield
    # Shutdown
    print("Shutting down...")

app = FastAPI(
    title="Learn Quest API",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Web frontend
        "http://localhost:5173",  # Web frontend dev server
        "http://localhost:5174",  # Admin frontend
        "http://localhost:8080",  # Alternative admin port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173", 
        "http://127.0.0.1:5174",
        "http://127.0.0.1:8080"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(courses_router)
app.include_router(quizzes_router)
app.include_router(users_router)
app.include_router(ai_router)
app.include_router(lessons_router)
app.include_router(problems_router)
app.include_router(certifications_router)
app.include_router(admin_router, prefix="/api/admin")
app.include_router(admin_users_router)
app.include_router(gnn_router)
app.include_router(ai_quiz_router)
app.include_router(cert_tests_admin_router)
app.include_router(cert_tests_runtime_router)
app.include_router(proctoring_router)

@app.get("/")
async def root():
    return {"message": "Learn Quest API", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
