# Milestone 2: NLP Baseline Profile Endpoint

## What shipped
- Added `/candidates/{id}/profile` endpoint that aggregates:
  - vote summary (yes/neutral/no + score)
  - ranked positive/negative traits derived from free-text submissions
- Implemented an explainable NLP baseline:
  - sentence splitting (spaCy)
  - sentiment scoring per clause (VADER)
  - trait extraction (noun chunks + adjectives + fallback)
  - contrast splitting on markers like "but/sometimes" to separate pros/cons
  - controlled canonicalization + synonym map to merge near-duplicates

## Why this approach
- Start with deterministic + explainable heuristics to validate the full data pipeline end-to-end.
- Provides a strong baseline and clean API contract for future upgrades:
  - embeddings + vector clustering (Qdrant)
  - evidence selection improvements
  - model-based aspect sentiment

## How to run locally
1. Start infra: `docker compose -f infra/docker-compose.yml up -d`
2. Backend: `cd apps/api && .\.venv\Scripts\Activate.ps1 && uvicorn main:app --reload`
3. Frontend: `cd apps/web && npm run dev`
4. Open: `http://localhost:3000/candidates`
