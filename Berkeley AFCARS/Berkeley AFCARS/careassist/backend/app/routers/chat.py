"""AI chat router."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..schemas.chat import ChatRequest, ChatResponse
from ..services.ollama_service import ask_ollama
from ..services.chat_context import build_full_caseload_context

router = APIRouter(redirect_slashes=False)


@router.post("", response_model=ChatResponse)
@router.post("/", response_model=ChatResponse)
async def chat(payload: ChatRequest, db: AsyncSession = Depends(get_db)):
    # Always inject the full caseload data so the AI knows about real cases
    caseload_context = await build_full_caseload_context(db)

    # Merge any extra context the frontend may pass with the caseload data
    combined_context = caseload_context
    if payload.context:
        combined_context += "\n\nADDITIONAL CONTEXT:\n" + payload.context

    reply = await ask_ollama(payload.message, combined_context)
    return {"reply": reply}
