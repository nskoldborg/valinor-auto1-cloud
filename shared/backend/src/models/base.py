import os
from sqlalchemy.orm import declarative_base
from sqlalchemy import MetaData

"""
This module defines the shared SQLAlchemy Base and metadata.

IMPORTANT:
- The default schema comes from the env var DATABASE_SCHEMA (defaults to "public").
- Make sure your application loads the .env before importing models,
  e.g. by importing `server.model.database` early in your app startup.
"""

# Read target schema from environment (fallback to "public")
DB_SCHEMA = os.getenv("DATABASE_SCHEMA", "public")

# All models share this metadata so they land in the same schema
metadata = MetaData(schema=DB_SCHEMA)
Base = declarative_base(metadata=metadata)

__all__ = ["Base", "metadata", "DB_SCHEMA"]