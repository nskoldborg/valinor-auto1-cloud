from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Enum,
    ForeignKey,
    Boolean,
    Float,
)
from sqlalchemy.orm import relationship, validates
from datetime import datetime
import enum

from backend.scr.models.base import Base


# ============================================================
# ENUMS
# ============================================================

class FeatureType(str, enum.Enum):
    FRONTEND = "Frontend"
    BACKEND = "Backend"
    SERVER = "Server"
    DATABASE = "Database"
    BUGFIX = "Bugfix"


class UpdateLevel(str, enum.Enum):
    MAJOR = "major"   # 1.x.x
    MINOR = "minor"   # x.1.x
    PATCH = "patch"   # x.x.1


class FeatureRequestStatus(str, enum.Enum):
    NEW = "New"
    IN_REVIEW = "In Review"
    ON_HOLD = "On Hold"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    BACKLOGG = "Backlogg"
    IN_DEVELOPMENT = "In Development"
    READY_FOR_TEST = "Ready for Test"
    PENDING_RELEASE = "Pending Release"
    RELEASED = "Released"


# ============================================================
# MAIN FEATURE REQUEST MODEL
# ============================================================

class FeatureRequest(Base):
    __tablename__ = "feature_requests"

    id = Column(Integer, primary_key=True, index=True)
    feature_id = Column(String(20), unique=True, index=True)  # e.g. FRC-0001
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(Enum(FeatureType, name="featuretype"), nullable=False)
    update_level = Column(Enum(UpdateLevel, name="updatelevel"), nullable=False, default=UpdateLevel.PATCH)
    version_target = Column(String(20), nullable=True)  # e.g. 1.2.3
    main_feature = Column(String(255), nullable=True)  # e.g. "feature-requests-frontend"

    # Ownership & tracking
    assigned_to = Column(Integer, nullable=True)
    status = Column(Enum(FeatureRequestStatus, name="featurerequeststatus"), default=FeatureRequestStatus.NEW)
    is_major_update = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, nullable=False)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    updated_by = Column(Integer, nullable=True)

    # ICE scoring
    impact = Column(Integer, default=0)        # 0–10
    confidence = Column(Integer, default=0)    # 0–10
    ease = Column(Integer, default=0)          # 0–10
    ice_score = Column(Float, default=0.0)     # Calculated dynamically

    # Relationships
    comments = relationship(
        "FeatureComment",
        back_populates="feature_request",
        cascade="all, delete-orphan"
    )

    # ============================================================
    # Validation & Auto-calculation
    # ============================================================

    @validates("impact", "confidence", "ease")
    def validate_score(self, key, value):
        """Ensure scores are between 0 and 10 and recalc ICE."""
        if value is None:
            value = 0
        if not 0 <= value <= 10:
            raise ValueError(f"{key} must be between 0 and 10")

        # Use current (possibly uncommitted) values for accurate ICE recalculation
        i = value if key == "impact" else (self.impact or 0)
        c = value if key == "confidence" else (self.confidence or 0)
        e = value if key == "ease" else (self.ease or 0)

        self.ice_score = round((i + c + e) / 3, 2)
        return value

    @validates("type")
    def validate_type(self, key, value):
        """Validate that the type is a valid FeatureType enum value."""
        if isinstance(value, str):
            try:
                value = FeatureType(value)
            except ValueError:
                raise ValueError(f"Invalid feature type: {value}")
        return value

    @validates("status")
    def validate_status(self, key, value):
        """Validate that status is a valid FeatureRequestStatus value."""
        if isinstance(value, str):
            try:
                value = FeatureRequestStatus(value)
            except ValueError:
                raise ValueError(f"Invalid feature request status: {value}")
        return value


# ============================================================
# COMMENT MODEL
# ============================================================

class FeatureComment(Base):
    __tablename__ = "feature_comments"

    id = Column(Integer, primary_key=True)
    feature_request_id = Column(
        Integer,
        ForeignKey("feature_requests.id", ondelete="CASCADE"),
        nullable=False,
    )
    author_id = Column(Integer, nullable=False)
    author_name = Column(String(150), nullable=True)  # convenience field
    comment_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    feature_request = relationship("FeatureRequest", back_populates="comments")