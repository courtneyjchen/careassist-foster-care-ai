from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class RiskScoreHistory(Base):
    __tablename__ = "risk_score_history"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    score = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="risk_history")
