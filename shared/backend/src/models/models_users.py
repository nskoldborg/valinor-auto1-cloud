from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Table,
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.associationproxy import association_proxy

from backend.scr.models.base import Base
from backend.scr.models.models_analytics import query_favorites_table

# ============================================================
# Association Tables
# ============================================================

user_groups_to_user_roles = Table(
    "user_groups_to_user_roles",
    Base.metadata,
    Column("group_id", Integer, ForeignKey("user_groups.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("user_roles.id", ondelete="CASCADE"), primary_key=True),
)

# ✅ NEW: association between positions and groups
user_positions_to_user_groups = Table(
    "user_positions_to_user_groups",
    Base.metadata,
    Column("position_id", Integer, ForeignKey("user_positions.id", ondelete="CASCADE"), primary_key=True),
    Column("group_id", Integer, ForeignKey("user_groups.id", ondelete="CASCADE"), primary_key=True),
)

users_to_user_groups = Table(
    "users_to_user_groups",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("group_id", Integer, ForeignKey("user_groups.id", ondelete="CASCADE"), primary_key=True),
)

users_to_user_positions = Table(
    "users_to_user_positions",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("position_id", Integer, ForeignKey("user_positions.id", ondelete="CASCADE"), primary_key=True),
)

users_to_user_roles = Table(
    "users_to_user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("user_roles.id", ondelete="CASCADE"), primary_key=True),
)

users_to_assignable_positions = Table(
    "users_to_assignable_positions",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("position_id", Integer, ForeignKey("user_positions.id", ondelete="CASCADE"), primary_key=True),
)

users_to_assignable_roles = Table(
    "users_to_assignable_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("user_roles.id", ondelete="CASCADE"), primary_key=True),
)

users_to_assignable_groups = Table(
    "users_to_assignable_groups",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("group_id", Integer, ForeignKey("user_groups.id", ondelete="CASCADE"), primary_key=True),
)

users_to_user_countries = Table(
    "users_to_user_countries",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("country_id", Integer, ForeignKey("user_countries.id", ondelete="CASCADE"), primary_key=True),
)

users_to_assignable_countries = Table(
    "users_to_assignable_countries",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("country_id", Integer, ForeignKey("user_countries.id", ondelete="CASCADE"), primary_key=True),
)

# ============================================================
# Core Models
# ============================================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    status = Column(Boolean, default=True)
    country = Column(String)
    locale = Column(String)
    last_login_datetime = Column(DateTime, nullable=True, default=None)

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    updated_by = Column(Integer, ForeignKey("users.id"))

    # --- Relationships ---
    user_groups = relationship("UserGroup", secondary=users_to_user_groups, back_populates="users")
    user_positions = relationship("UserPosition", secondary=users_to_user_positions, back_populates="users")
    user_roles = relationship("UserRole", secondary=users_to_user_roles, back_populates="users")
    user_countries = relationship("UserCountry", secondary=users_to_user_countries, back_populates="users")
    favorite_queries = relationship("Query", secondary=query_favorites_table, back_populates="favorites")
    queries = relationship("Query", back_populates="created_by")
    data_sources = relationship("DataSource", back_populates="created_by")

    # --- Association proxies ---
    groups = association_proxy("user_groups", "name")
    positions = association_proxy("user_positions", "name")
    roles = association_proxy("user_roles", "name")
    countries = association_proxy("user_countries", "code")

    # --- Assignable rights ---
    assignable_user_groups = relationship("UserGroup", secondary=users_to_assignable_groups)
    assignable_user_positions = relationship("UserPosition", secondary=users_to_assignable_positions)
    assignable_user_roles = relationship("UserRole", secondary=users_to_assignable_roles)
    assignable_user_countries = relationship("UserCountry", secondary=users_to_assignable_countries)

    # --- Assignable proxies ---
    assignable_groups = association_proxy("assignable_user_groups", "name")
    assignable_positions = association_proxy("assignable_user_positions", "name")
    assignable_roles = association_proxy("assignable_user_roles", "name")
    assignable_countries = association_proxy("assignable_user_countries", "code")


class UserGroup(Base):
    __tablename__ = "user_groups"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String)
    enabled = Column(Boolean, default=True)
    exclude_from_matrix = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    updated_by = Column(Integer, ForeignKey("users.id"))

    users = relationship("User", secondary=users_to_user_groups, back_populates="user_groups")
    roles = relationship("UserRole", secondary=user_groups_to_user_roles, back_populates="groups")
    positions = relationship("UserPosition", secondary=user_positions_to_user_groups, back_populates="groups")


class UserPosition(Base):
    __tablename__ = "user_positions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String)
    enabled = Column(Boolean, default=True)
    exclude_from_matrix = Column(Boolean, default=False)
    risk_level = Column(String, default="low")

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    updated_by = Column(Integer, ForeignKey("users.id"))

    users = relationship("User", secondary=users_to_user_positions, back_populates="user_positions")
    groups = relationship("UserGroup", secondary=user_positions_to_user_groups, back_populates="positions")


class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    updated_by = Column(Integer, ForeignKey("users.id"))

    users = relationship("User", secondary=users_to_user_roles, back_populates="user_roles")
    groups = relationship("UserGroup", secondary=user_groups_to_user_roles, back_populates="roles")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    description = Column(String)
    enabled = Column(Boolean, default=True)
    exclude_from_updates = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    updated_by = Column(Integer, ForeignKey("users.id"))


class UserCountry(Base):
    __tablename__ = "user_countries"

    id = Column(Integer, primary_key=True)
    code = Column(String(5), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    enabled = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    updated_by = Column(Integer, ForeignKey("users.id"))

    users = relationship("User", secondary=users_to_user_countries, back_populates="user_countries")