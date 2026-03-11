from dotenv import load_dotenv
load_dotenv()

import os, secrets
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from db import SessionLocal
from models import Candidate, Submission, Event, EventMembership, EventInvite
from schemas import (
    CandidateCreate, CandidateOut, CandidateUpdate,
    SubmissionCreate, SubmissionOut,
    CandidateProfileOut, VoteSummary, TraitItem,
    EventCreate, EventOut, EventMeOut,
    MemberAdd, MemberOut, MemberDetailOut,
    InviteCreate, InviteOut, InvitePublicOut,
)
from nlp import build_profile

app = FastAPI()

_default_origins = "http://localhost:3000,http://localhost:3001"
_allowed_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", _default_origins).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
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

def require_user_id(x_user_id: str | None = Header(default=None)):
    return x_user_id or "dev-user"

def get_membership(db: Session, event_id: int, user_id: str) -> EventMembership | None:
    return (
        db.query(EventMembership)
        .filter(EventMembership.event_id == event_id, EventMembership.user_id == user_id)
        .first()
    )

def require_member(db: Session, event_id: int, user_id: str) -> EventMembership:
    m = get_membership(db, event_id, user_id)
    if not m:
        raise HTTPException(status_code=403, detail="Not a member of this event")
    return m

def require_can_edit(m: EventMembership):
    if m.role not in ("organizer", "editor"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

def require_organizer(m: EventMembership):
    if m.role != "organizer":
        raise HTTPException(status_code=403, detail="Organizer only")


@app.get("/")
def root():
    return {"status": "API running"}


# -------------------------
# EVENTS + MEMBERSHIPS
# -------------------------

@app.post("/events", response_model=EventOut)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user_id),
):
    name = (payload.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")

    e = Event(
        name=name,
        description=(payload.description or "").strip() or None,
        organizer_user_id=user_id,
    )
    db.add(e)
    db.commit()
    db.refresh(e)

    # creator becomes organizer member
    m = EventMembership(event_id=e.id, user_id=user_id, role="organizer")
    db.add(m)
    db.commit()

    return e

@app.get("/events", response_model=list[EventOut])
def list_events(
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user_id),
):
    # only events you belong to
    return (
        db.query(Event)
        .join(EventMembership, EventMembership.event_id == Event.id)
        .filter(EventMembership.user_id == user_id)
        .order_by(Event.created_at.desc())
        .all()
    )

@app.get("/events/{event_id}", response_model=EventOut)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user_id),
):
    require_member(db, event_id, user_id)
    e = db.query(Event).filter(Event.id == event_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    return e

@app.get("/events/{event_id}/me", response_model=EventMeOut)
def my_role(
    event_id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user_id),
):
    m = require_member(db, event_id, user_id)
    return {"event_id": event_id, "role": m.role}

@app.post("/events/{event_id}/members", response_model=MemberOut)
def add_member(
    event_id: int,
    payload: MemberAdd,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user_id),
):
    # only organizer can add members / assign roles
    caller = require_member(db, event_id, user_id)
    require_organizer(caller)

    target_user = payload.user_id.strip()
    if not target_user:
        raise HTTPException(status_code=400, detail="user_id required")

    existing = get_membership(db, event_id, target_user)
    if existing:
        existing.role = payload.role
        db.commit()
        return {"user_id": existing.user_id, "role": existing.role}

    m = EventMembership(event_id=event_id, user_id=target_user, role=payload.role)
    db.add(m)
    db.commit()
    return {"user_id": m.user_id, "role": m.role}

@app.patch("/events/{event_id}/members/{target_user_id}", response_model=MemberOut)
def update_member_role(
    event_id: int,
    target_user_id: str,
    payload: MemberAdd,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user_id),
):
    caller = require_member(db, event_id, user_id)
    require_organizer(caller)

    m = get_membership(db, event_id, target_user_id)
    if not m:
        raise HTTPException(status_code=404, detail="Member not found")

    # don't allow organizer to demote themselves accidentally
    if m.user_id == caller.user_id and payload.role != "organizer":
        raise HTTPException(status_code=400, detail="Organizer cannot demote self")

    m.role = payload.role
    db.commit()
    return {"user_id": m.user_id, "role": m.role}

@app.get("/events/{event_id}/members", response_model=list[MemberDetailOut])
def list_members(
    event_id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user_id),
):
    caller = require_member(db, event_id, user_id)
    require_organizer(caller)
    return db.query(EventMembership).filter(EventMembership.event_id == event_id).all()

@app.delete("/events/{event_id}/members/{target_user_id}", status_code=204)
def remove_member(
    event_id: int,
    target_user_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user_id),
):
    caller = require_member(db, event_id, user_id)
    require_organizer(caller)
    if target_user_id == caller.user_id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")
    m = get_membership(db, event_id, target_user_id)
    if not m:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(m)
    db.commit()


# -------------------------
# INVITES
# -------------------------

@app.post("/events/{event_id}/invites", response_model=InviteOut)
def create_invite(
    event_id: int,
    payload: InviteCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user_id),
):
    caller = require_member(db, event_id, user_id)
    require_organizer(caller)

    email = payload.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    token = secrets.token_urlsafe(32)
    invite = EventInvite(
        event_id=event_id,
        email=email,
        role=payload.role,
        token=token,
        invited_by=user_id,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite

@app.get("/events/{event_id}/invites", response_model=list[InviteOut])
def list_invites(
    event_id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user_id),
):
    caller = require_member(db, event_id, user_id)
    require_organizer(caller)
    return (
        db.query(EventInvite)
        .filter(EventInvite.event_id == event_id)
        .order_by(EventInvite.created_at.desc())
        .all()
    )

@app.delete("/events/{event_id}/invites/{invite_id}", status_code=204)
def revoke_invite(
    event_id: int,
    invite_id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user_id),
):
    caller = require_member(db, event_id, user_id)
    require_organizer(caller)
    inv = db.query(EventInvite).filter(
        EventInvite.id == invite_id,
        EventInvite.event_id == event_id,
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invite not found")
    db.delete(inv)
    db.commit()

@app.get("/invites/{token}", response_model=InvitePublicOut)
def get_invite(token: str, db: Session = Depends(get_db)):
    inv = db.query(EventInvite).filter(EventInvite.token == token).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invite not found or expired")
    return {
        "id": inv.id,
        "event_id": inv.event_id,
        "event_name": inv.event.name,
        "email": inv.email,
        "role": inv.role,
        "invited_by": inv.invited_by,
        "accepted_at": inv.accepted_at,
        "created_at": inv.created_at,
    }

@app.post("/invites/{token}/accept", response_model=MemberOut)
def accept_invite(
    token: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user_id),
):
    inv = db.query(EventInvite).filter(EventInvite.token == token).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invite not found or expired")
    if inv.accepted_at is not None:
        raise HTTPException(status_code=400, detail="Invite already used")

    # Add or update membership
    from datetime import datetime, timezone
    existing = get_membership(db, inv.event_id, user_id)
    if existing:
        existing.role = inv.role
    else:
        m = EventMembership(event_id=inv.event_id, user_id=user_id, role=inv.role)
        db.add(m)

    inv.accepted_at = datetime.now(timezone.utc)
    inv.accepted_by = user_id
    db.commit()
    return {"user_id": user_id, "role": inv.role}


# -------------------------
# EVENT-SCOPED CANDIDATES
# -------------------------

@app.get("/events/{event_id}/candidates", response_model=list[CandidateOut])
def list_event_candidates(
    event_id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user_id),
):
    require_member(db, event_id, user_id)
    return (
        db.query(Candidate)
        .filter(Candidate.event_id == event_id)
        .order_by(Candidate.created_at.desc())
        .all()
    )

@app.post("/events/{event_id}/candidates", response_model=CandidateOut)
def create_event_candidate(
    event_id: int,
    payload: CandidateCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user_id),
):
    m = require_member(db, event_id, user_id)
    require_can_edit(m)

    name = (payload.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")

    c = Candidate(name=name, event_id=event_id, description=payload.description, photo=payload.photo)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


# -------------------------
# EXISTING CANDIDATES ROUTES (keep for now)
# Eventually you’ll remove /candidates global list.
# -------------------------

@app.get("/candidates", response_model=list[CandidateOut])
def list_candidates(db: Session = Depends(get_db)):
    return db.query(Candidate).order_by(Candidate.created_at.desc()).all()

@app.patch("/candidates/{candidate_id}", response_model=CandidateOut)
def update_candidate(
    candidate_id: int,
    payload: CandidateUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user_id),
):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # if candidate is tied to event, require editor/organizer
    if c.event_id is not None:
        m = require_member(db, c.event_id, user_id)
        require_can_edit(m)

    if payload.name is not None:
        c.name = payload.name.strip()
    if payload.description is not None:
        c.description = payload.description.strip() or None
    if payload.photo is not None:
        c.photo = payload.photo or None  # empty string clears the photo

    db.commit()
    db.refresh(c)
    return c

@app.delete("/candidates/{candidate_id}")
def delete_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user_id),
):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if c.event_id is not None:
        m = require_member(db, c.event_id, user_id)
        require_can_edit(m)

    db.delete(c)
    db.commit()
    return {"status": "deleted", "candidate_id": candidate_id}


# -------------------------
# SUBMISSIONS (vote once per user per candidate, editable)
# -------------------------

@app.post("/candidates/{candidate_id}/submissions", response_model=SubmissionOut)
def upsert_submission(
    candidate_id: int,
    payload: SubmissionCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_user_id),
):
    if payload.vote not in (-1, 0, 1):
        raise HTTPException(status_code=400, detail="vote must be -1, 0, or 1")

    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # if candidate belongs to event, must be member to vote
    if c.event_id is not None:
        require_member(db, c.event_id, user_id)

    comment = (payload.comment or "").strip()

    existing = (
        db.query(Submission)
        .filter(Submission.candidate_id == candidate_id, Submission.user_id == user_id)
        .first()
    )

    if existing:
        existing.vote = payload.vote
        existing.comment = comment
        db.commit()
        db.refresh(existing)
        return existing

    s = Submission(candidate_id=candidate_id, user_id=user_id, vote=payload.vote, comment=comment)
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

    pairs = [(s.vote, s.comment) for s in subs]
    prof = build_profile(pairs, top_k=8)

    return {
        "candidate_id": candidate_id,
        "vote_summary": {"yes": yes, "neutral": neutral, "no": no, "score": score},
        "positives": prof["positives"],
        "negatives": prof["negatives"],
    }