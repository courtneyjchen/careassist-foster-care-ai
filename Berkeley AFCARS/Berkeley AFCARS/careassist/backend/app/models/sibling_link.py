from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class SiblingLink(Base):
    __tablename__ = "sibling_links"

    id = Column(Integer, primary_key=True, index=True)
    child_id_1 = Column(Integer, ForeignKey("children.id"), nullable=False)
    child_id_2 = Column(Integer, ForeignKey("children.id"), nullable=False)
    relationship_type = Column(String, default="full_sibling")  # full_sibling, half_sibling, step_sibling

    child_1 = relationship("Child", foreign_keys=[child_id_1])
    child_2 = relationship("Child", foreign_keys=[child_id_2])
