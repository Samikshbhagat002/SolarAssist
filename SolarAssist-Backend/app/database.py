from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

raw_url = os.getenv("DATABASE_URL", "")

if not raw_url or "YOUR_PASSWORD" in raw_url:
    DATABASE_URL = "sqlite:///./solarassist.db"
    print("[INFO] Using local SQLite database (solarassist.db). Set DATABASE_URL in .env for MySQL.")
else:
    DATABASE_URL = raw_url

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
