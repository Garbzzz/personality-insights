from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, Boolean
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db import Base


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True)
    name = Column(String(160), nullable=False)
    description = Column(Text, nullable=True)

    # NEW: who created it
    organizer_user_id = Column(String(255), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    candidates = relationship("Candidate", back_populates="event", cascade="all, delete-orphan")
    members = relationship("EventMembership", back_populates="event", cascade="all, delete-orphan")
    invites = relationship("EventInvite", back_populates="event", cascade="all, delete-orphan")


class EventMembership(Base):
    __tablename__ = "event_memberships"
    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(255), nullable=False)

    # "organizer" | "editor" | "voter"
    role = Column(String(32), nullable=False, default="voter")

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    event = relationship("Event", back_populates="members")

    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_user"),
    )


class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(Integer, primary_key=True)

    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    photo = Column(Text, nullable=True)  # base64 data URL
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    event = relationship("Event", back_populates="candidates")
    submissions = relationship("Submission", back_populates="candidate", cascade="all, delete-orphan")


class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)

    # NEW: who voted (Clerk user id)
    user_id = Column(String(255), nullable=False)

    vote = Column(Integer, nullable=False)  # -1, 0, +1
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # optional but useful for “edited vote”
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    candidate = relationship("Candidate", back_populates="submissions")

    __table_args__ = (
        UniqueConstraint("candidate_id", "user_id", name="uq_candidate_user_vote"),
    )


class EventInvite(Base):
    __tablename__ = "event_invites"
    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(255), nullable=False)
    role = Column(String(32), nullable=False, default="voter")
    token = Column(String(64), nullable=False, unique=True)
    invited_by = Column(String(255), nullable=False)   # Clerk user ID of sender
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    accepted_by = Column(String(255), nullable=True)   # Clerk user ID of acceptor
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    event = relationship("Event", back_populates="invites")