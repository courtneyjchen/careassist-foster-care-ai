from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    relationship_type = Column(String, nullable=False)  # mother, father, grandmother, grandfather, aunt, uncle, sibling, cousin, etc.
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    safe_contact = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    child = relationship("Child", back_populates="family_members")
