"""File management router (S3 placeholder)."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_files():
    return {"files": [], "message": "S3 integration not configured yet."}
