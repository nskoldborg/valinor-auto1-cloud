"""
server.model package initializer

This module ensures that all SQLAlchemy models across the application
are imported and registered on the shared Base.metadata object.

Having all model modules imported here guarantees that
Base.metadata.create_all(bind=engine) will create every table,
regardless of which file the model is defined in.
"""

# Shared declarative Base and metadata
from backend.scr.models.base import Base

# Import all model modules so SQLAlchemy registers them
from backend.scr.models.models_analytics import *
from backend.scr.models.models_users import *
from backend.scr.models.models_tasks import *
from backend.scr.models.models_feature_requests import *
from backend.scr.models.models_batch_uploader import EmployeeBase, BatchUploadLog
from backend.scr.models.models_release import *
from backend.scr.models.models_position_requests import *
from backend.scr.models.models_changelog import ChangeLog  # ✅ ensure ChangeLog model is imported

# Explicitly define what should be accessible when importing `server.model`
__all__ = [
    "Base",
    # User domain
    "User",
    "UserGroup",
    "UserPosition",
    "UserRole",
    "Role",
    # Analytics domain
    "DataSource",
    "Query",
    "Tag", 
    "QueryTag",
    "QueryFavorite",
]