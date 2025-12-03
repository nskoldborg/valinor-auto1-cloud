from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    ForeignKey,
    Text,
    DateTime,
    Table,
    JSON,
    Float
)
from sqlalchemy.orm import relationship
from backend.scr.models.base import Base


# ============================================================
# Association Tables
# ============================================================

query_tags_table = Table(
    "query_tags",
    Base.metadata,
    Column("query_id", Integer, ForeignKey("queries.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

query_favorites_table = Table(
    "query_favorites",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("query_id", Integer, ForeignKey("queries.id", ondelete="CASCADE"), primary_key=True),
)


# ============================================================
# Core Analytics Models
# ============================================================

class DataSource(Base):
    """
    Represents a database or API connection resource for analytics queries.
    Similar to Redash-style data source configuration.
    """

    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(Text)
    type = Column(String(100), nullable=False, default="PostgreSQL")  # e.g. PostgreSQL, MySQL, MSSQL, Snowflake

    # Connection info
    host = Column(String(255), nullable=False)
    port = Column(Integer, nullable=False, default=5432)
    database = Column(String(255), nullable=False)

    # Authentication
    username = Column(String(255), nullable=True)
    password_encrypted = Column(Text, nullable=True)  # stored encrypted using utils.crypto

    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))

    # Relationships
    created_by = relationship("User", back_populates="data_sources")
    queries = relationship("Query", back_populates="datasource", cascade="all, delete")

    def __repr__(self):
        return f"<DataSource(id={self.id}, name='{self.name}', type='{self.type}', host='{self.host}')>"


class Query(Base):
    """
    Represents a saved or published analytics query.
    Each query belongs to a DataSource and can be tagged or favorited.
    """

    __tablename__ = "queries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    sql_text = Column(Text)
    datasource_id = Column(Integer, ForeignKey("data_sources.id", ondelete="SET NULL"))
    is_published = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    last_executed_by_id = Column(Integer, nullable=True)
    last_executed_at = Column(DateTime)

    last_execution_duration = Column(Float, nullable=True)
    last_row_count = Column(Integer, nullable=True)
    last_row_scanned = Column(Integer, nullable=True)
    cached_result = Column(JSON, nullable=True)
    refresh_schedule = Column(String(50), default="Never")
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    datasource = relationship("DataSource", back_populates="queries")
    created_by = relationship("User", back_populates="queries")

    tags = relationship(
        "Tag",
        secondary=query_tags_table,
        back_populates="queries",
        cascade="all, delete",
    )

    favorites = relationship(
        "User",
        secondary=query_favorites_table,
        back_populates="favorite_queries",
        cascade="all, delete",
    )

    def __repr__(self):
        return f"<Query(id={self.id}, name='{self.name}', datasource_id={self.datasource_id})>"


class Tag(Base):
    """
    Simple tagging system for queries.
    """

    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    queries = relationship(
        "Query",
        secondary=query_tags_table,
        back_populates="tags",
        cascade="all, delete",
    )

    def __repr__(self):
        return f"<Tag(id={self.id}, name='{self.name}')>"