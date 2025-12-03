# server/model/models_release.py
from sqlalchemy import Column, Integer, String, DateTime, func, UniqueConstraint, ForeignKey
from sqlalchemy.orm import relationship
from backend.scr.models.base import Base  # your declarative base

class ReleaseTrack(Base):
    __tablename__ = "release_tracks"
    id = Column(Integer, primary_key=True)
    # "main feature" key, e.g. "admin-countries-backend"
    key = Column(String(128), unique=True, index=True, nullable=False)
    current_version = Column(String(32), nullable=False, default="0.0.0")
    updated_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

class ReleaseHistory(Base):
    __tablename__ = "release_history"
    id = Column(Integer, primary_key=True)
    key = Column(String(128), index=True, nullable=False)
    version = Column(String(32), nullable=False)
    feature_request_id = Column(Integer, ForeignKey("feature_requests.id"), nullable=True)
    notes = Column(String(1024), nullable=True)
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)