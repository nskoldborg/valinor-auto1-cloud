from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from backend.scr.models.base import Base
import enum


class TaskSource(enum.Enum):
    MANUAL = "manual"
    ONBOARDING = "onboarding"
    OFFBOARDING = "offboarding"


class UserTask(Base):
    __tablename__ = "user_tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    priority = Column(String(50), default="normal")
    completed = Column(Boolean, default=False)
    start_at = Column(DateTime)
    end_at = Column(DateTime)
    source = Column(Enum(TaskSource), default=TaskSource.MANUAL)
    reference_id = Column(Integer, nullable=True)  # link to onboarding/offboarding table later
    assigned_to = Column(Integer, ForeignKey("users.id"))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    assignee = relationship("User", foreign_keys=[assigned_to])
    creator = relationship("User", foreign_keys=[created_by])