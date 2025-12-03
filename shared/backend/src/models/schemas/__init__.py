"""
server.model.schemas package initializer

This module imports and exposes all Pydantic schemas used
for API input/output validation across domains.
"""

from backend.server.model.schemas.users import *
from backend.server.model.schemas.analytics import *
from backend.server.model.schemas.position_requests import *

__all__ = [
    # User domain
    "UserCreate",
    "UserUpdate",
    "UserOut",
    "GroupCreate",
    "GroupUpdate",
    "GroupOut",
    "PositionCreate",
    "PositionUpdate",
    "PositionOut",
    "RoleCreate",
    "RoleUpdate",
    "RoleOut",
    # Analytics domain
    "DataSourceCreate",
    "DataSourceUpdate",
    "DataSourceOut",
    "QueryCreate",
    "QueryUpdate",
    "QueryOut",
    "TagCreate",
    "TagUpdate",
    "TagOut",
]