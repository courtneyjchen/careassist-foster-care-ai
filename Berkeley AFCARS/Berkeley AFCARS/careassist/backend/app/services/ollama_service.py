"""Ollama LLM service for AI chat."""
import httpx
from ..config import OLLAMA_BASE_URL, OLLAMA_MODEL


async def ask_ollama(message: str, context: str | None = None) -> str:
    system_prompt = (
        "You are CareAssist AI, a helpful assistant for foster care social workers. "
        "You help analyze cases, suggest interventions, answer questions about child welfare "
        "policy, and provide guidance on case management best practices. "
        "Be compassionate, professional, and precise."
    )
    if context:
        system_prompt += f"\n\nCase context:\n{context}"

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": message,
                    "system": system_prompt,
                    "stream": False,
                },
            )
            response.raise_for_status()
            return response.json().get("response", "No response generated.")
    except httpx.ConnectError:
        return (
            "AI Assistant is not available right now. "
            "Please ensure Ollama is running locally (ollama serve) "
            "with the llama3.2 model pulled (ollama pull llama3.2)."
        )
    except Exception as e:
        return f"Error communicating with AI: {str(e)}"
