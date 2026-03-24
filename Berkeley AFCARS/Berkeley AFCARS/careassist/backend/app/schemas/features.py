from pydantic import BaseModel
from typing import Optional, List


class FamilyMemberCreate(BaseModel):
    first_name: str
    last_name: str
    relationship_type: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    safe_contact: bool = True
    notes: Optional[str] = None


class FamilyMemberResponse(BaseModel):
    id: int
    child_id: int
    first_name: str
    last_name: str
    relationship_type: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    safe_contact: bool
    notes: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class SiblingLinkResponse(BaseModel):
    id: int
    child_id: int
    child_name: str
    case_number: Optional[str] = None
    relationship_type: str
    placement_type: Optional[str] = None

    class Config:
        from_attributes = True


class RiskScoreHistoryResponse(BaseModel):
    score: float
    recorded_at: str

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    related_case_id: Optional[int] = None
    created_at: str

    class Config:
        from_attributes = True


class SharedNoteCreate(BaseModel):
    content: str
    author_id: int


class SharedNoteResponse(BaseModel):
    id: int
    case_id: int
    author_name: str
    author_role: str
    content: str
    is_pinned: bool
    created_at: str

    class Config:
        from_attributes = True


class TimelineEvent(BaseModel):
    date: str
    title: str
    description: str
    event_type: str  # placement, flag, note, court, medical
    severity: Optional[str] = None
