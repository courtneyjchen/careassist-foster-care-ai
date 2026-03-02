"""Supervisor router — team overview & worker stats."""
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload

from ..database import get_db
from ..models.user import User
from ..models.case import Case
from ..models.case_flag import CaseFlag
from ..models.child import Child

router = APIRouter()


# ── Response Schemas ──

class WorkerCaseSummary(BaseModel):
    case_id: int
    case_number: str
    child_name: str
    priority_score: float
    status: str
    placement_type: Optional[str]
    months_in_care: int
    flag_count: int

    class Config:
        orm_mode = True


class WorkerOverview(BaseModel):
    worker_id: int
    first_name: str
    last_name: str
    email: str
    total_cases: int
    flagged_cases: int
    avg_priority: float
    high_risk_count: int
    cases: List[WorkerCaseSummary]

    class Config:
        orm_mode = True


class TeamStats(BaseModel):
    total_workers: int
    total_cases: int
    total_flagged: int
    avg_cases_per_worker: float
    highest_risk_score: float
    avg_priority: float


@router.get("/team", response_model=List[WorkerOverview])
async def get_team_overview(db: AsyncSession = Depends(get_db)):
    """Get all social workers with their caseload summaries."""
    # Fetch all social_worker users
    workers_result = await db.execute(
        select(User).where(User.role == "social_worker")
    )
    workers = workers_result.scalars().all()

    overviews = []
    for w in workers:
        # Fetch cases for this worker with child + flags
        cases_result = await db.execute(
            select(Case)
            .options(joinedload(Case.child), joinedload(Case.flags))
            .where(Case.assigned_worker_id == w.id)
            .order_by(Case.priority_score.desc())
        )
        cases = cases_result.unique().scalars().all()

        case_summaries = []
        flagged_count = 0
        high_risk_count = 0
        scores = []

        for c in cases:
            flag_count = len(c.flags) if c.flags else 0
            if flag_count > 0:
                flagged_count += 1
            if c.priority_score >= 0.7:
                high_risk_count += 1
            scores.append(c.priority_score)
            case_summaries.append(WorkerCaseSummary(
                case_id=c.id,
                case_number=c.case_number,
                child_name="{} {}".format(c.child.first_name, c.child.last_name),
                priority_score=c.priority_score,
                status=c.status,
                placement_type=c.placement_type,
                months_in_care=c.months_in_care,
                flag_count=flag_count,
            ))

        avg_p = round(sum(scores) / len(scores), 4) if scores else 0.0

        overviews.append(WorkerOverview(
            worker_id=w.id,
            first_name=w.first_name,
            last_name=w.last_name,
            email=w.email,
            total_cases=len(cases),
            flagged_cases=flagged_count,
            avg_priority=avg_p,
            high_risk_count=high_risk_count,
            cases=case_summaries,
        ))

    # Sort by total cases descending
    overviews.sort(key=lambda o: o.total_cases, reverse=True)
    return overviews


@router.get("/team/stats", response_model=TeamStats)
async def get_team_stats(db: AsyncSession = Depends(get_db)):
    """Aggregate team-level stats for the supervisor."""
    worker_count = (await db.execute(
        select(func.count(User.id)).where(User.role == "social_worker")
    )).scalar() or 0

    total_cases = (await db.execute(
        select(func.count(Case.id))
    )).scalar() or 0

    total_flagged = (await db.execute(
        select(func.count(func.distinct(CaseFlag.case_id)))
    )).scalar() or 0

    highest = (await db.execute(
        select(func.max(Case.priority_score))
    )).scalar() or 0.0

    avg_p = (await db.execute(
        select(func.avg(Case.priority_score))
    )).scalar() or 0.0

    avg_per_worker = round(total_cases / worker_count, 1) if worker_count else 0.0

    return TeamStats(
        total_workers=worker_count,
        total_cases=total_cases,
        total_flagged=total_flagged,
        avg_cases_per_worker=avg_per_worker,
        highest_risk_score=round(highest, 4),
        avg_priority=round(avg_p, 4),
    )
