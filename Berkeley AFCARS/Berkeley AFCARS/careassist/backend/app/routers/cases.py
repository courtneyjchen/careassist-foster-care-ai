"""Cases router."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from ..database import get_db
from ..models.case import Case
from ..models.case_flag import CaseFlag
from ..models.note import Note
from ..schemas.case import CaseSummaryResponse, CaseDetailResponse
from ..schemas.note import NoteCreate, NoteResponse
from ..schemas.explanation import CaseExplanationResponse
from ..services.risk_engine import explain_case, calculate_priority_score
from ..ml.xgb_scorer import get_model_metadata

router = APIRouter()


@router.get("/model/info")
async def model_info():
    """Return metadata about the trained XGBoost model."""
    return get_model_metadata()


@router.get("/", response_model=List[CaseSummaryResponse])
async def get_cases(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Case)
        .options(joinedload(Case.child), joinedload(Case.flags))
        .order_by(Case.priority_score.desc())
    )
    cases = result.unique().scalars().all()

    return [
        {
            "id": c.id,
            "case_number": c.case_number,
            "child_name": f"{c.child.first_name} {c.child.last_name}",
            "priority_score": c.priority_score,
            "status": c.status,
            "flag_count": len(c.flags),
            "placement_type": c.placement_type,
            "months_in_care": c.months_in_care,
        }
        for c in cases
    ]


@router.get("/{case_id}", response_model=CaseDetailResponse)
async def get_case_detail(case_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Case)
        .options(
            joinedload(Case.child),
            joinedload(Case.flags),
            joinedload(Case.notes),
            joinedload(Case.assigned_worker),
        )
        .where(Case.id == case_id)
    )
    case = result.unique().scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return {
        "id": case.id,
        "case_number": case.case_number,
        "child": {
            "id": case.child.id,
            "first_name": case.child.first_name,
            "last_name": case.child.last_name,
            "date_of_birth": str(case.child.date_of_birth),
            "gender": case.child.gender,
            "ethnicity": case.child.ethnicity,
            "has_medical_needs": case.child.has_medical_needs,
            "has_behavioral_needs": case.child.has_behavioral_needs,
            "has_disability": case.child.has_disability,
            "prior_placements": case.child.prior_placements,
            "prior_adoptions": case.child.prior_adoptions,
        },
        "priority_score": case.priority_score,
        "status": case.status,
        "removal_reason": case.removal_reason,
        "placement_type": case.placement_type,
        "has_parental_rights_terminated": case.has_parental_rights_terminated,
        "permanency_goal": case.permanency_goal,
        "months_in_care": case.months_in_care,
        "assigned_worker": (
            f"{case.assigned_worker.first_name} {case.assigned_worker.last_name}"
            if case.assigned_worker
            else None
        ),
        "flags": [
            {
                "id": f.id,
                "flag_type": f.flag_type,
                "severity": f.severity,
                "confidence": f.confidence,
                "description": f.description,
                "recommendation": f.recommendation,
            }
            for f in case.flags
        ],
        "notes": [
            {
                "id": n.id,
                "note_type": n.note_type,
                "content": n.content,
                "created_at": str(n.created_at),
            }
            for n in sorted(case.notes, key=lambda x: x.created_at, reverse=True)
        ],
    }


@router.post("/{case_id}/notes", response_model=NoteResponse)
async def add_note(case_id: int, payload: NoteCreate, db: AsyncSession = Depends(get_db)):
    # Verify case exists
    result = await db.execute(select(Case).where(Case.id == case_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Case not found")

    note = Note(
        case_id=case_id,
        note_type=payload.note_type,
        content=payload.content,
        author_id=payload.author_id,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return {
        "id": note.id,
        "note_type": note.note_type,
        "content": note.content,
        "created_at": str(note.created_at),
    }


@router.get("/{case_id}/explanation", response_model=CaseExplanationResponse)
async def get_case_explanation(case_id: int, db: AsyncSession = Depends(get_db)):
    """Return SHAP-style feature contributions explaining why a case
    received its risk score.  Uses the XGBoost model scorer."""
    result = await db.execute(
        select(Case)
        .options(joinedload(Case.child))
        .where(Case.id == case_id)
    )
    case = result.unique().scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return explain_case(case.child, case)


@router.post("/{case_id}/score")
async def rescore_case(case_id: int, db: AsyncSession = Depends(get_db)):
    """Re-score a case using the XGBoost model and persist the result."""
    result = await db.execute(
        select(Case)
        .options(joinedload(Case.child))
        .where(Case.id == case_id)
    )
    case = result.unique().scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    new_score = calculate_priority_score(case.child, case)
    case.priority_score = round(new_score, 4)
    await db.commit()
    return {"case_id": case_id, "new_score": case.priority_score}
