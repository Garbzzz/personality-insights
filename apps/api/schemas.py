from pydantic import BaseModel, Field
from datetime import datetime

class CandidateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)

class CandidateOut(BaseModel):
    id: int
    name: str
    created_at: datetime
    class Config:
        from_attributes = True

class SubmissionCreate(BaseModel):
    vote: int
    comment: str = Field(min_length=1)

class SubmissionOut(BaseModel):
    id: int
    candidate_id: int
    vote: int
    comment: str
    created_at: datetime
    class Config:
        from_attributes = True
