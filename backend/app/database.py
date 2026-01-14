from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=5,          # Maintain 5 connections in pool
    max_overflow=10,      # Allow 10 additional connections
    pool_timeout=30,      # Timeout waiting for connection
    echo=settings.DEBUG  # Log SQL queries in debug mode
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()