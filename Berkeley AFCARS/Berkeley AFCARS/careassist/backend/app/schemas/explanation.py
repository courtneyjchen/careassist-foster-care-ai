"""Pydantic schemas for the SHAP explanation endpoint."""
from pydantic import BaseModel
from typing import List


class FeatureContribution(BaseModel):
    feature: str
    label: str
    value: str
    contribution: float
    direction: str  # "risk" or "protective"


class CaseExplanationResponse(BaseModel):
    case_id: int
    base_score: float
    predicted_score: float
    risk_tier: str
    disruption_flag: bool = False
    features: List[FeatureContribution]
