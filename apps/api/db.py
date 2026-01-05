import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL or "://" not in DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is missing or invalid. "
        "Create apps/api/.env with DATABASE_URL=postgresql+psycopg://app:app@localhost:5432/personality"
    )

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass
