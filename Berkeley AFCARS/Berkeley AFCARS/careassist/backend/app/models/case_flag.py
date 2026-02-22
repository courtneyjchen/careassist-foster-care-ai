from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class CaseFlag(Base):
    __tablename__ = "case_flags"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    flag_type = Column(String, nullable=False)
    severity = Column(String, default="medium")  # critical, high, medium, low
    confidence = Column(Float, default=0.0)
    description = Column(String)
    recommendation = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="flags")
