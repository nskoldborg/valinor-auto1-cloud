# backend/server/model/models_changelog.py

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from backend.server.model.base import Base


class ChangeLog(Base):
    """
    Tracks create/update/delete actions across system entities.
    Used by user, role, group, position, etc. routers for audit trails.
    """

    __tablename__ = "changelog"

    id = Column(Integer, primary_key=True, index=True)

    # --- Target Object Metadata ---
    object_id = Column(Integer, nullable=False)          # e.g., user_id, role_id
    object_type = Column(String, nullable=False)         # e.g., "User", "Role", "Group", "Country"
    parent_type = Column(String, nullable=True)          # e.g., "User" when editing a child entity

    # --- Action Info ---
    action = Column(String, nullable=False)              # "create", "update", "delete"
    field = Column(String, nullable=True)                # field name, e.g. "email", "roles"

    # --- Change Values ---
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)

    # --- Context / Comments ---
    comment = Column(Text, nullable=True)

    # --- Audit ---
    created_on = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))

    # --- Relationships ---
    actor = relationship("User", foreign_keys=[created_by], backref="change_logs")

    def __repr__(self):
        return f"<ChangeLog(id={self.id}, object={self.object_type}:{self.object_id}, field={self.field})>"