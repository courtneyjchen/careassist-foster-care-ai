from sqlalchemy import Column, Integer, String, ForeignKey, Date
from sqlalchemy.orm import relationship
from ..database import Base


class Placement(Base):
    __tablename__ = "placements"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    placement_type = Column(String)  # foster_home, group_home, kinship, residential
    start_date = Column(Date)
    end_date = Column(Date, nullable=True)
    provider_name = Column(String)

    case = relationship("Case", back_populates="placements")
