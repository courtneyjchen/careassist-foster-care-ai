"""CareAssist — FastAPI Application Entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .database import init_db
from .routers import auth, dashboard, cases, chat, files, foster_parent, supervisor

app = FastAPI(
    title="CareAssist",
    description="AI-Driven Case Prioritization Tool for Foster Care Social Workers. "
    "Helps social workers identify which cases require immediate attention, "
    "understand why they are being surfaced, and plan their weekly priorities.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(cases.router, prefix="/api/cases", tags=["Cases"])
app.include_router(chat.router, prefix="/api/chat", tags=["AI Assistant"])
app.include_router(files.router, prefix="/api/files", tags=["Files / S3"])
app.include_router(foster_parent.router, prefix="/api/foster", tags=["Foster Parent"])
app.include_router(supervisor.router, prefix="/api/supervisor", tags=["Supervisor"])


@app.on_event("startup")
async def startup():
    await init_db()
    # Seed demo data
    from seed.seed_data import seed_if_empty
    await seed_if_empty()


@app.get("/api/health", tags=["Health"])
async def health():
    return {"status": "ok"}
