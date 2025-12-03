from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


# ============================================================
# --- Base Schemas
# ============================================================

class DataSourceBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: Optional[str] = "PostgreSQL"  # e.g. PostgreSQL, MySQL, MSSQL, Snowflake
    host: Optional[str] = None
    port: Optional[int] = None
    database: Optional[str] = None
    username: Optional[str] = None
    enabled: Optional[bool] = True


class QueryBase(BaseModel):
    name: str
    sql_text: Optional[str] = None
    datasource_id: Optional[int] = None
    is_published: bool = False
    is_archived: bool = False
    refresh_schedule: Optional[str] = "Never"


class TagBase(BaseModel):
    name: str


# ============================================================
# --- Create / Update Schemas
# ============================================================

class DataSourceCreate(DataSourceBase):
    password: Optional[str] = None


class DataSourceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    database: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    enabled: Optional[bool] = None


class QueryCreate(QueryBase):
    tags: Optional[List[int]] = []


class QueryUpdate(BaseModel):
    name: Optional[str] = None
    sql_text: Optional[str] = None
    datasource_id: Optional[int] = None
    is_published: Optional[bool] = None
    is_archived: Optional[bool] = None
    refresh_schedule: Optional[str] = None
    tags: Optional[List[int]] = []


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = None


# ============================================================
# --- Output (Read) Schemas
# ============================================================

class TagOut(TagBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class DataSourceOut(DataSourceBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None
    password_set: Optional[bool] = None  # ✅ true if password exists in DB

    class Config:
        orm_mode = True


class QueryOut(QueryBase):
    id: int
    datasource: Optional[DataSourceOut]
    created_at: datetime
    last_executed_at: Optional[datetime] = None
    tags: List[TagOut] = []

    class Config:
        orm_mode = True