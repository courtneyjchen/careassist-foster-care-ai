from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String, unique=True, nullable=False)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    assigned_worker_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    foster_parent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="open")  # open, in_progress, closed, archived
    priority_score = Column(Float, default=0.0)
    removal_reason = Column(String)
    placement_type = Column(String)
    has_parental_rights_terminated = Column(Boolean, default=False)
    permanency_goal = Column(String)
    months_in_care = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    child = relationship("Child", back_populates="cases")
    assigned_worker = relationship("User", foreign_keys=[assigned_worker_id], back_populates="cases")
    foster_parent = relationship("User", foreign_keys=[foster_parent_id], back_populates="foster_cases")
    flags = relationship("CaseFlag", back_populates="case", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="case", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")
    placements = relationship("Placement", back_populates="case", cascade="all, delete-orphan")
    risk_history = relationship("RiskScoreHistory", back_populates="case", cascade="all, delete-orphan")
    shared_notes = relationship("SharedNote", back_populates="case", cascade="all, delete-orphan")
