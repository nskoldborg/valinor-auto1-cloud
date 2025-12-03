import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

"""
Central DB wiring:
- Loads the correct environment file (backend/database/{APP_ENV}.env)
- Exposes DATABASE_URL, engine, SessionLocal, get_db()
- Ensures required schemas exist and sets the search_path
- Imports Base *after* .env is loaded so Base picks up DATABASE_SCHEMA
"""

# ============================================================
# Resolve environment and load .env FIRST
# ============================================================

APP_ENV = os.getenv("APP_ENV", "dev")

# This file lives at: backend/server/model/database.py
# We want:            backend/database/{APP_ENV}.env
BACKEND_DIR = Path(__file__).resolve().parents[2]  # -> backend
ENV_FILE = BACKEND_DIR / "database" / f"{APP_ENV}.env"

if ENV_FILE.exists():
    load_dotenv(ENV_FILE)
    print(f"✅ Loaded environment: {ENV_FILE}")
else:
    print(f"⚠️  Environment file not found: {ENV_FILE}")

# Now it's safe to import Base; it will see DATABASE_SCHEMA from env
from backend.server.model.base import Base, DB_SCHEMA  # noqa: E402

# ============================================================
# Database configuration
# ============================================================

DB_USER = os.getenv("POSTGRES_USER")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB")
# DB_SCHEMA already imported as DB_SCHEMA from base.py

if not DB_USER or not DB_NAME:
    print("❌ Missing required database environment variables.")
    print("   POSTGRES_USER or POSTGRES_DB may be undefined.")
    print("   Check your .env file at:", ENV_FILE)

# Build connection string (supports passwordless local setups)
if DB_PASS:
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
else:
    DATABASE_URL = f"postgresql://{DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# ============================================================
# Engine, Session, schema bootstrap
# ============================================================

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Optional: create additional project schemas on startup
# You can adjust this list as your project evolves.
REQUIRED_SCHEMAS = list({
    DB_SCHEMA,          # primary app schema (e.g., valinor_prod or valinor_dev)
    "api_load",
    "dwh_load",
    "ba_load",
    "valinor_meta",
    "valinor_qa",
})

try:
    with engine.connect() as conn:
        # Ensure schemas exist
        for s in REQUIRED_SCHEMAS:
            conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{s}"'))

        # Set default search_path (your primary schema first, then public)
        conn.execute(text(f'SET search_path TO "{DB_SCHEMA}", public'))
        conn.commit()

    print(f"✅ Connected to PostgreSQL — DB: {DB_NAME}, schema: {DB_SCHEMA}")
except Exception as e:
    print("❌ Failed to connect to PostgreSQL database:")
    print("   ", e)

# ============================================================
# FastAPI dependency
# ============================================================

def get_db():
    """FastAPI dependency that yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

__all__ = [
    "DATABASE_URL",
    "engine",
    "SessionLocal",
    "get_db",
    "DB_SCHEMA",
    "APP_ENV",
]