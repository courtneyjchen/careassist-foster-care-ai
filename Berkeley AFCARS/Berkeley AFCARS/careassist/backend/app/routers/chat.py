"""AI chat router."""
from fastapi import APIRouter
from ..schemas.chat import ChatRequest, ChatResponse
from ..services.ollama_service import ask_ollama

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    reply = await ask_ollama(payload.message, payload.context)
    return {"reply": reply}
