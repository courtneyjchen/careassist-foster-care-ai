"""Foster-parent–specific API endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from pydantic import BaseModel

from ..database import get_db
from ..models.case import Case
from ..models.child import Child

router = APIRouter()


# ── Schemas ──

class FosterChildSummary(BaseModel):
    child_id: int
    first_name: str
    last_name: str
    date_of_birth: str
    gender: Optional[str] = None
    ethnicity: Optional[str] = None
    has_medical_needs: bool = False
    has_behavioral_needs: bool = False
    has_disability: bool = False
    case_id: int
    case_number: str
    placement_type: Optional[str] = None
    permanency_goal: Optional[str] = None
    months_in_care: int = 0
    status: str = "open"


class FosterChildDetail(FosterChildSummary):
    prior_placements: int = 0
    removal_reason: Optional[str] = None


# ── Endpoints ──

@router.get("/children/{user_id}", response_model=List[FosterChildSummary])
async def get_foster_children(user_id: int, db: AsyncSession = Depends(get_db)):
    """Get all children placed with a specific foster parent."""
    result = await db.execute(
        select(Case)
        .options(joinedload(Case.child))
        .where(Case.foster_parent_id == user_id)
        .order_by(Case.created_at.desc())
    )
    cases = result.unique().scalars().all()

    children = []
    for c in cases:
        child = c.child
        children.append(FosterChildSummary(
            child_id=child.id,
            first_name=child.first_name,
            last_name=child.last_name,
            date_of_birth=str(child.date_of_birth),
            gender=child.gender,
            ethnicity=child.ethnicity,
            has_medical_needs=child.has_medical_needs,
            has_behavioral_needs=child.has_behavioral_needs,
            has_disability=child.has_disability,
            case_id=c.id,
            case_number=c.case_number,
            placement_type=c.placement_type,
            permanency_goal=c.permanency_goal,
            months_in_care=c.months_in_care,
            status=c.status,
        ))
    return children


@router.get("/child/{case_id}", response_model=FosterChildDetail)
async def get_foster_child_detail(case_id: int, db: AsyncSession = Depends(get_db)):
    """Get detailed info for a single foster child by case ID."""
    result = await db.execute(
        select(Case)
        .options(joinedload(Case.child))
        .where(Case.id == case_id)
    )
    c = result.unique().scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    child = c.child
    return FosterChildDetail(
        child_id=child.id,
        first_name=child.first_name,
        last_name=child.last_name,
        date_of_birth=str(child.date_of_birth),
        gender=child.gender,
        ethnicity=child.ethnicity,
        has_medical_needs=child.has_medical_needs,
        has_behavioral_needs=child.has_behavioral_needs,
        has_disability=child.has_disability,
        prior_placements=child.prior_placements,
        case_id=c.id,
        case_number=c.case_number,
        placement_type=c.placement_type,
        permanency_goal=c.permanency_goal,
        months_in_care=c.months_in_care,
        status=c.status,
        removal_reason=c.removal_reason,
    )
