from sqlalchemy import Column, Integer, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class SharedNote(Base):
    __tablename__ = "shared_notes"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="shared_notes")
    author = relationship("User")
