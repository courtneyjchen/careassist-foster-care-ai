"""Authentication router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models.user import User
from ..schemas.user import UserLogin, UserResponse

router = APIRouter()


@router.post("/login", response_model=UserResponse)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or user.hashed_password != payload.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user
