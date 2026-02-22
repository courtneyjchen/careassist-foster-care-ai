from pydantic import BaseModel
from typing import Optional


class DashboardStatsResponse(BaseModel):
    active_cases: int
    flagged_cases: int
    pending_reviews: int
    avg_permanency_months: float


class FlaggedCaseSummaryResponse(BaseModel):
    case_id: int
    case_number: str
    child_name: str
    priority_score: float
    status: str
    top_flag_type: Optional[str] = None
    top_flag_severity: Optional[str] = None
    flag_count: int
