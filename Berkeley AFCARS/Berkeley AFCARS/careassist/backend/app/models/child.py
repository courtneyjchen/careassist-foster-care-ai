from sqlalchemy import Column, Integer, String, Boolean, Date
from sqlalchemy.orm import relationship
from ..database import Base


class Child(Base):
    __tablename__ = "children"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String)
    ethnicity = Column(String)
    has_medical_needs = Column(Boolean, default=False)
    has_behavioral_needs = Column(Boolean, default=False)
    has_disability = Column(Boolean, default=False)
    prior_placements = Column(Integer, default=0)
    prior_adoptions = Column(Integer, default=0)

    cases = relationship("Case", back_populates="child")
