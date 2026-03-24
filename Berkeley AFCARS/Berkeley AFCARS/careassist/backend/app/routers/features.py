"""Router for new features: risk trends, family tree, siblings, timeline,
notifications, and shared notes."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import joinedload

from ..database import get_db
from ..models.case import Case
from ..models.child import Child
from ..models.risk_score_history import RiskScoreHistory
from ..models.family_member import FamilyMember
from ..models.sibling_link import SiblingLink
from ..models.notification import Notification
from ..models.shared_note import SharedNote
from ..models.user import User
from ..schemas.features import (
    FamilyMemberCreate,
    FamilyMemberResponse,
    SiblingLinkResponse,
    RiskScoreHistoryResponse,
    NotificationResponse,
    SharedNoteCreate,
    SharedNoteResponse,
    TimelineEvent,
)

router = APIRouter()


# ─── Risk Score Trend ───────────────────────────────────────────────

@router.get("/cases/{case_id}/risk-history", response_model=List[RiskScoreHistoryResponse])
async def get_risk_history(case_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RiskScoreHistory)
        .where(RiskScoreHistory.case_id == case_id)
        .order_by(RiskScoreHistory.recorded_at.asc())
    )
    rows = result.scalars().all()
    return [{"score": r.score, "recorded_at": str(r.recorded_at)} for r in rows]


# ─── Family Members ─────────────────────────────────────────────────

@router.get("/cases/{case_id}/family", response_model=List[FamilyMemberResponse])
async def get_family_members(case_id: int, db: AsyncSession = Depends(get_db)):
    case = await _get_case(case_id, db)
    result = await db.execute(
        select(FamilyMember)
        .where(FamilyMember.child_id == case.child_id)
        .order_by(FamilyMember.relationship_type)
    )
    members = result.scalars().all()
    return [
        {
            "id": m.id, "child_id": m.child_id,
            "first_name": m.first_name, "last_name": m.last_name,
            "relationship_type": m.relationship_type,
            "phone": m.phone, "email": m.email, "address": m.address,
            "safe_contact": m.safe_contact, "notes": m.notes,
            "created_at": str(m.created_at),
        }
        for m in members
    ]


@router.post("/cases/{case_id}/family", response_model=FamilyMemberResponse)
async def add_family_member(case_id: int, payload: FamilyMemberCreate, db: AsyncSession = Depends(get_db)):
    case = await _get_case(case_id, db)
    member = FamilyMember(
        child_id=case.child_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        relationship_type=payload.relationship_type,
        phone=payload.phone, email=payload.email,
        address=payload.address, safe_contact=payload.safe_contact,
        notes=payload.notes,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return {
        "id": member.id, "child_id": member.child_id,
        "first_name": member.first_name, "last_name": member.last_name,
        "relationship_type": member.relationship_type,
        "phone": member.phone, "email": member.email, "address": member.address,
        "safe_contact": member.safe_contact, "notes": member.notes,
        "created_at": str(member.created_at),
    }


# ─── Siblings ───────────────────────────────────────────────────────

@router.get("/cases/{case_id}/siblings", response_model=List[SiblingLinkResponse])
async def get_siblings(case_id: int, db: AsyncSession = Depends(get_db)):
    case = await _get_case(case_id, db)
    child_id = case.child_id

    result = await db.execute(
        select(SiblingLink).where(
            or_(SiblingLink.child_id_1 == child_id, SiblingLink.child_id_2 == child_id)
        )
    )
    links = result.scalars().all()

    siblings = []
    for link in links:
        other_id = link.child_id_2 if link.child_id_1 == child_id else link.child_id_1
        # Fetch sibling child + case info
        child_res = await db.execute(
            select(Child).options(joinedload(Child.cases)).where(Child.id == other_id)
        )
        other_child = child_res.unique().scalar_one_or_none()
        if other_child:
            case_info = other_child.cases[0] if other_child.cases else None
            siblings.append({
                "id": link.id,
                "child_id": other_child.id,
                "child_name": f"{other_child.first_name} {other_child.last_name}",
                "case_number": case_info.case_number if case_info else None,
                "relationship_type": link.relationship_type,
                "placement_type": case_info.placement_type if case_info else None,
            })

    return siblings


# ─── Timeline ───────────────────────────────────────────────────────

@router.get("/cases/{case_id}/timeline", response_model=List[TimelineEvent])
async def get_case_timeline(case_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Case)
        .options(
            joinedload(Case.placements),
            joinedload(Case.flags),
            joinedload(Case.notes),
        )
        .where(Case.id == case_id)
    )
    case = result.unique().scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    events: list[dict] = []

    # Case created
    events.append({
        "date": str(case.created_at),
        "title": "Case Opened",
        "description": f"Case {case.case_number} opened. Removal reason: {case.removal_reason or 'N/A'}",
        "event_type": "system",
    })

    # Placements
    for p in case.placements:
        events.append({
            "date": str(p.start_date),
            "title": f"Placement: {p.placement_type}",
            "description": f"Placed with {p.provider_name or 'provider'}",
            "event_type": "placement",
        })
        if p.end_date:
            events.append({
                "date": str(p.end_date),
                "title": f"Placement Ended: {p.placement_type}",
                "description": f"Left {p.provider_name or 'provider'}",
                "event_type": "placement",
            })

    # Flags
    for f in case.flags:
        events.append({
            "date": str(f.created_at),
            "title": f"Flag: {f.flag_type}",
            "description": f.description or f.flag_type,
            "event_type": "flag",
            "severity": f.severity,
        })

    # Notes
    for n in case.notes:
        events.append({
            "date": str(n.created_at),
            "title": f"Note: {n.note_type.title()}",
            "description": n.content[:120] + ("..." if len(n.content) > 120 else ""),
            "event_type": n.note_type,
        })

    events.sort(key=lambda e: e["date"], reverse=True)
    return events


# ─── Notifications ──────────────────────────────────────────────────

@router.get("/notifications/{user_id}", response_model=List[NotificationResponse])
async def get_notifications(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
    )
    notifs = result.scalars().all()
    return [
        {
            "id": n.id, "title": n.title, "message": n.message,
            "notification_type": n.notification_type, "is_read": n.is_read,
            "related_case_id": n.related_case_id, "created_at": str(n.created_at),
        }
        for n in notifs
    ]


@router.get("/notifications/{user_id}/unread-count")
async def get_unread_count(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)
    )
    return {"count": len(result.scalars().all())}


@router.post("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Notification).where(Notification.id == notif_id))
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    await db.commit()
    return {"status": "ok"}


@router.post("/notifications/{user_id}/read-all")
async def mark_all_read(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)
    )
    for n in result.scalars().all():
        n.is_read = True
    await db.commit()
    return {"status": "ok"}


# ─── Shared Notes ───────────────────────────────────────────────────

@router.get("/cases/{case_id}/shared-notes", response_model=List[SharedNoteResponse])
async def get_shared_notes(case_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SharedNote)
        .options(joinedload(SharedNote.author))
        .where(SharedNote.case_id == case_id)
        .order_by(SharedNote.is_pinned.desc(), SharedNote.created_at.desc())
    )
    notes = result.unique().scalars().all()
    return [
        {
            "id": n.id, "case_id": n.case_id,
            "author_name": f"{n.author.first_name} {n.author.last_name}",
            "author_role": n.author.role,
            "content": n.content, "is_pinned": n.is_pinned,
            "created_at": str(n.created_at),
        }
        for n in notes
    ]


@router.post("/cases/{case_id}/shared-notes", response_model=SharedNoteResponse)
async def add_shared_note(case_id: int, payload: SharedNoteCreate, db: AsyncSession = Depends(get_db)):
    # Verify case exists
    case = await _get_case(case_id, db)
    # Verify author exists
    author_res = await db.execute(select(User).where(User.id == payload.author_id))
    author = author_res.scalar_one_or_none()
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")

    note = SharedNote(
        case_id=case_id,
        author_id=payload.author_id,
        content=payload.content,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return {
        "id": note.id, "case_id": note.case_id,
        "author_name": f"{author.first_name} {author.last_name}",
        "author_role": author.role,
        "content": note.content, "is_pinned": note.is_pinned,
        "created_at": str(note.created_at),
    }


# ─── Helpers ────────────────────────────────────────────────────────

async def _get_case(case_id: int, db: AsyncSession) -> Case:
    result = await db.execute(
        select(Case).options(joinedload(Case.child)).where(Case.id == case_id)
    )
    case = result.unique().scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case
