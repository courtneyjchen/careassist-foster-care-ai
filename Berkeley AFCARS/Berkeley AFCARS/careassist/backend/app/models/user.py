from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    role = Column(String, default="social_worker")  # social_worker, supervisor, foster_parent, aged_out_youth, admin
    created_at = Column(DateTime, default=datetime.utcnow)

    cases = relationship("Case", foreign_keys="[Case.assigned_worker_id]", back_populates="assigned_worker")
    foster_cases = relationship("Case", foreign_keys="[Case.foster_parent_id]", back_populates="foster_parent")
