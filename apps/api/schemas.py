from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class CandidateUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)

class CandidateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)

class CandidateOut(BaseModel):
    id: int
    name: str
    created_at: datetime
    class Config:
        from_attributes = True

from typing import Optional

class SubmissionCreate(BaseModel):
    vote: int
    comment: Optional[str] = None

class SubmissionOut(BaseModel):
    id: int
    candidate_id: int
    vote: int
    comment: str
    created_at: datetime
    class Config:
        from_attributes = True
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
