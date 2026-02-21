from pydantic import BaseModel
from typing import Optional


class CaseFlagResponse(BaseModel):
    id: int
    flag_type: str
    severity: str
    confidence: float
    description: Optional[str] = None
    recommendation: Optional[str] = None

    class Config:
        from_attributes = True
