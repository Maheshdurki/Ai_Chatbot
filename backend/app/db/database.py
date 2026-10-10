import os
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.config import DATABASE_URL, DATABASE_PATH
from app.db.models import Base

def get_engine():
    db_url = DATABASE_URL
    # If postgresql URL from old config, override to MySQL
    if "postgresql" in db_url.lower():
        db_url = "mysql+pymysql://root:root@localhost:3306/edumate_ai?charset=utf8mb4"
        
    try:
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_recycle=3600
        )
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("[Database Engine] Connected to MySQL 8.x DB!")
        return engine
    except Exception as e:
        print(f"[Database Engine] MySQL connection notice: {e}. Utilizing SQLite database engine.")
        sqlite_url = f"sqlite:///{DATABASE_PATH}"
        return create_engine(sqlite_url, connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Create all schema tables dynamically."""
    Base.metadata.create_all(bind=engine)
    print("[EduMate AI DB] Schema tables created successfully!")

def get_db():
    """Returns a DB session or raw connection for services."""
    return engine.raw_connection()

def get_db_session() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
