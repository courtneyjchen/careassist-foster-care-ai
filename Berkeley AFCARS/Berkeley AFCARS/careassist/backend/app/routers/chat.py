"""AI chat router."""
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..schemas.chat import ChatRequest, ChatResponse
from ..services.ollama_service import ask_ollama
from ..services.chat_context import build_full_caseload_context

router = APIRouter(redirect_slashes=False)

# Cache caseload context — demo data doesn't change at runtime
_cached_context: Optional[str] = None


@router.post("", response_model=ChatResponse)
@router.post("/", response_model=ChatResponse)
async def chat(payload: ChatRequest, db: AsyncSession = Depends(get_db)):
    global _cached_context
    if _cached_context is None:
        _cached_context = await build_full_caseload_context(db)

    combined_context = _cached_context
    if payload.context:
        combined_context += "\n\nADDITIONAL CONTEXT:\n" + payload.context

    reply = await ask_ollama(payload.message, combined_context)
    return {"reply": reply}
