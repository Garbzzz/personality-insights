from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Literal

Role = Literal["organizer", "editor", "voter"]

# -------------------------
# Events
# -------------------------

class EventCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    description: Optional[str] = None

class EventOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    organizer_user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class EventMeOut(BaseModel):
    event_id: int
    role: Role

class MemberAdd(BaseModel):
    user_id: str
    role: Role = "voter"

class MemberOut(BaseModel):
    user_id: str
    role: Role

class MemberDetailOut(BaseModel):
    id: int
    user_id: str
    role: Role
    created_at: datetime

    class Config:
        from_attributes = True

class InviteCreate(BaseModel):
    email: str
    role: Role = "voter"

class InviteOut(BaseModel):
    id: int
    event_id: int
    email: str
    role: str
    token: str
    invited_by: str
    accepted_at: Optional[datetime]
    accepted_by: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class InvitePublicOut(BaseModel):
    id: int
    event_id: int
    event_name: str
    email: str
    role: str
    invited_by: str
    accepted_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# -------------------------
# Candidates
# -------------------------

class CandidateUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = None
    photo: Optional[str] = None        # base64 data URL, or "" to clear

class CandidateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    event_id: Optional[int] = None
    description: Optional[str] = None
    photo: Optional[str] = None  # base64 data URL

class CandidateOut(BaseModel):
    id: int
    name: str
    event_id: Optional[int] = None
    description: Optional[str] = None
    photo: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# -------------------------
# Submissions
# -------------------------

class SubmissionCreate(BaseModel):
    vote: int
    comment: Optional[str] = None

class SubmissionOut(BaseModel):
    id: int
    candidate_id: int
    user_id: str
    vote: int
    comment: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# -------------------------
# Profile output
# -------------------------

class VoteSummary(BaseModel):
    yes: int
    neutral: int
    no: int
    score: int

class TraitItem(BaseModel):
    label: str
    count: int
    examples: list[str]

class CandidateProfileOut(BaseModel):
    candidate_id: int
    vote_summary: VoteSummary
    positives: list[TraitItem]
    negatives: list[TraitItem]