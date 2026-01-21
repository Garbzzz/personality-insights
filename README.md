# Candidate Critic

Candidate Critic is a full-stack web application for collecting, analyzing, and summarizing structured feedback on candidates. Users can submit positive, neutral, or negative votes with optional comments, and the system aggregates feedback into high-level personality insights using NLP.

The project is designed for use cases like fraternity rush, hiring panels, or structured peer review.


## Tech Stack

**Frontend**
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Client + Server Components

**Backend**
- FastAPI
- PostgreSQL
- SQLAlchemy
- Alembic (migrations)

**NLP / Analytics**
- spaCy
- VADER Sentiment
- Custom phrase extraction + synonym mapping


## Features

- Create, edit, and delete candidates
- Submit votes (positive / neutral / negative) with optional comments
- View all candidates with live vote counts and approval ratings
- Aggregate candidate profiles including:
  - Vote summaries
  - Top positive traits
  - Top concerns
- NLP-based extraction of traits from free-text comments
- Automatic handling of mixed sentiment and contrast phrases



## Application Flow

1. View all candidates and their current ratings
2. Select a candidate to view details
3. Submit a vote with optional written feedback
4. Backend aggregates submissions into a structured profile
5. Frontend displays live analytics and insights

## Roadmap

- User authentication (email-based accounts)
- Event-based grouping (e.g. rush events)
- Per-user submissions
- Improved NLP trait clustering
- UI polish and animations


