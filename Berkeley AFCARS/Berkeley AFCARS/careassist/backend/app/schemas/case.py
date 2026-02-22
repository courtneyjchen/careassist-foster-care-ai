from pydantic import BaseModel
from typing import Optional, List
from .child import ChildResponse
from .case_flag import CaseFlagResponse
from .note import NoteResponse


class CaseSummaryResponse(BaseModel):
    id: int
    case_number: str
    child_name: str
    priority_score: float
    status: str
    flag_count: int
    placement_type: Optional[str] = None
    months_in_care: int = 0


class CaseDetailResponse(BaseModel):
    id: int
    case_number: str
    child: ChildResponse
    priority_score: float
    status: str
    removal_reason: Optional[str] = None
    placement_type: Optional[str] = None
    has_parental_rights_terminated: bool = False
    permanency_goal: Optional[str] = None
    months_in_care: int = 0
    assigned_worker: Optional[str] = None
    flags: List[CaseFlagResponse] = []
    notes: List[NoteResponse] = []
