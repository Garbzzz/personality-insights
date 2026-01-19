from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session

from db import SessionLocal
from models import Candidate, Submission
from schemas import CandidateCreate, CandidateOut, SubmissionCreate, SubmissionOut
from nlp import build_profile
from schemas import CandidateProfileOut, VoteSummary, TraitItem

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def root():
    return {"status": "API running"}

@app.post("/candidates", response_model=CandidateOut)
def create_candidate(payload: CandidateCreate, db: Session = Depends(get_db)):
    c = Candidate(name=payload.name)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

@app.get("/candidates", response_model=list[CandidateOut])
def list_candidates(db: Session = Depends(get_db)):
    return db.query(Candidate).order_by(Candidate.created_at.desc()).all()

@app.post("/candidates/{candidate_id}/submissions", response_model=SubmissionOut)
def add_submission(candidate_id: int, payload: SubmissionCreate, db: Session = Depends(get_db)):
    if payload.vote not in (-1, 0, 1):
        raise HTTPException(status_code=400, detail="vote must be -1, 0, or 1")

    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")

    s = Submission(candidate_id=candidate_id, vote=payload.vote, comment=payload.comment)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

@app.get("/candidates/{candidate_id}/submissions", response_model=list[SubmissionOut])
def list_submissions(candidate_id: int, db: Session = Depends(get_db)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return (
        db.query(Submission)
        .filter(Submission.candidate_id == candidate_id)
        .order_by(Submission.created_at.desc())
        .all()
    )
@app.get("/candidates/{candidate_id}/profile", response_model=CandidateProfileOut)
def candidate_profile(candidate_id: int, db: Session = Depends(get_db)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")

    subs = (
        db.query(Submission)
        .filter(Submission.candidate_id == candidate_id)
        .order_by(Submission.created_at.desc())
        .all()
    )

    yes = sum(1 for s in subs if s.vote == 1)
    neutral = sum(1 for s in subs if s.vote == 0)
    no = sum(1 for s in subs if s.vote == -1)
    score = yes - no

    comments = [s.comment for s in subs]
    prof = build_profile(comments, top_k=8)

    return {
        "candidate_id": candidate_id,
        "vote_summary": {"yes": yes, "neutral": neutral, "no": no, "score": score},
        "positives": prof["positives"],
        "negatives": prof["negatives"],
    }
