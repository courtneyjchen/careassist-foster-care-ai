"""Dashboard router."""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..database import get_db
from ..models.case import Case
from ..models.case_flag import CaseFlag
from ..models.child import Child
from ..schemas.dashboard import DashboardStatsResponse, FlaggedCaseSummaryResponse

router = APIRouter()


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    total = (await db.execute(select(func.count(Case.id)))).scalar() or 0
    flagged = (await db.execute(
        select(func.count(func.distinct(CaseFlag.case_id)))
    )).scalar() or 0
    pending = (await db.execute(
        select(func.count(Case.id)).where(Case.status == "open")
    )).scalar() or 0
    avg_months = (await db.execute(
        select(func.avg(Case.months_in_care))
    )).scalar() or 0

    return {
        "active_cases": total,
        "flagged_cases": flagged,
        "pending_reviews": pending,
        "avg_permanency_months": round(avg_months, 1),
    }


@router.get("/flagged", response_model=List[FlaggedCaseSummaryResponse])
async def get_flagged_cases(db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import joinedload

    result = await db.execute(
        select(Case)
        .options(joinedload(Case.child), joinedload(Case.flags))
        .where(Case.id.in_(select(CaseFlag.case_id)))
        .order_by(Case.priority_score.desc())
    )
    cases = result.unique().scalars().all()

    summaries = []
    for c in cases:
        top_flag = max(c.flags, key=lambda f: f.confidence, default=None)
        summaries.append({
            "case_id": c.id,
            "case_number": c.case_number,
            "child_name": f"{c.child.first_name} {c.child.last_name}",
            "priority_score": c.priority_score,
            "status": c.status,
            "top_flag_type": top_flag.flag_type if top_flag else None,
            "top_flag_severity": top_flag.severity if top_flag else None,
            "flag_count": len(c.flags),
        })
    return summaries
