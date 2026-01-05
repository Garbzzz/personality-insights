from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db import Base

class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    submissions = relationship("Submission", back_populates="candidate", cascade="all, delete-orphan")

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    vote = Column(Integer, nullable=False)  # -1, 0, +1
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    candidate = relationship("Candidate", back_populates="submissions")
