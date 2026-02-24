from fastapi import APIRouter

router = APIRouter(prefix="/api")


@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.get("/test")
def test_endpoint():
    return {"message": "Test endpoint working"}


