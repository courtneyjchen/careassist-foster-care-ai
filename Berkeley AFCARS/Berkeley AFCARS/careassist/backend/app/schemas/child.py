from pydantic import BaseModel
from typing import Optional


class ChildResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    date_of_birth: str
    gender: Optional[str] = None
    ethnicity: Optional[str] = None
    has_medical_needs: bool = False
    has_behavioral_needs: bool = False
    has_disability: bool = False
    prior_placements: int = 0
    prior_adoptions: int = 0

    class Config:
        from_attributes = True
