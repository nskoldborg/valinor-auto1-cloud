from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    func,
)
from sqlalchemy.orm import relationship
from backend.scr.models.base import Base


class PositionUpdateRequest(Base):
    __tablename__ = "position_update_requests"

    id = Column(Integer, primary_key=True)
    request_id = Column(String(20), unique=True, index=True, nullable=False)

    # Link to Position
    position_id = Column(Integer, nullable=False)

    # Request Metadata
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    requested_by_user = relationship(
        "User", foreign_keys=[requested_by], backref="requested_position_updates"
    )

    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_user = relationship(
        "User", foreign_keys=[assigned_to], backref="assigned_position_updates"
    )

    # Status & Approval
    status = Column(String(50), nullable=False, default="Pending Approval")
    approval_status = Column(String(50), nullable=True)  # Pending / Approved / Rejected
    approval_comment = Column(Text, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_by_user = relationship(
        "User", foreign_keys=[approved_by], backref="approved_position_updates"
    )
    approved_at = Column(DateTime, nullable=True)

    # Descriptive fields
    description = Column(Text, nullable=True)  # Request reason / context
    change_comment = Column(Text, nullable=True)  # Optional changelog / applied note
    exclude_from_matrix = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self):
        return (
            f"<PositionUpdateRequest(request_id={self.request_id}, "
            f"position_id={self.position_id}, status={self.status})>"
        )