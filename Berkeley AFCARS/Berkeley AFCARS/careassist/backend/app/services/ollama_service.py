"""Ollama LLM service for AI chat."""
from typing import Optional
import logging
import httpx
from ..config import OLLAMA_BASE_URL, OLLAMA_MODEL

logger = logging.getLogger(__name__)


async def ask_ollama(message: str, context: Optional[str] = None) -> str:
    system_prompt = (
        "You are CareAssist AI, an intelligent assistant embedded in the CareAssist "
        "foster care case management platform. You have REAL-TIME ACCESS to the full "
        "caseload database. The case data provided below is live data from the system — "
        "use it to give specific, data-driven answers.\n\n"
        "When the user asks about cases, risk scores, children, flags, placements, or "
        "anything related to the caseload, ALWAYS reference the actual data provided. "
        "Cite specific case numbers, child names, risk scores, and flags.\n\n"
        "You also help with child welfare policy (AFCARS, ICWA, Multiethnic Placement Act), "
        "suggest evidence-based interventions, and provide case management guidance.\n\n"
        "Be compassionate, professional, precise, and always ground your answers in the "
        "real case data when available. Use bullet points and clear formatting."
    )
    if context:
        system_prompt += f"\n\nCase context:\n{context}"

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            logger.info("Sending request to Ollama at %s", OLLAMA_BASE_URL)
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": message,
                    "system": system_prompt,
                    "stream": False,
                    "options": {
                        "num_ctx": 4096,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()
            logger.info("Ollama response received successfully")
            return data.get("response", "No response generated.")
    except httpx.ConnectError:
        logger.error("Cannot connect to Ollama at %s", OLLAMA_BASE_URL)
        return (
            "AI Assistant is not available right now. "
            "Please ensure Ollama is running locally (ollama serve) "
            "with the llama3.2 model pulled (ollama pull llama3.2)."
        )
    except httpx.ReadTimeout:
        logger.error("Ollama request timed out after 300s")
        return (
            "The AI took too long to respond. This can happen with complex questions. "
            "Please try a shorter or more specific question."
        )
    except Exception as e:
        logger.error("Ollama error: %s: %s", type(e).__name__, str(e))
        return f"Error communicating with AI: {type(e).__name__}: {str(e)}"
