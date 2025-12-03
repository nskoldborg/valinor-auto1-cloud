# backend/server/model/schemas/users.py

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr


# ============================================================
# --- Base Schemas (shared attributes)
# ============================================================

class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    enabled: bool = True
    exclude_from_matrix: Optional[bool] = False
    roles: Optional[List[int]] = []


class PositionBase(BaseModel):
    name: str


class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None


# ============================================================
# --- Create / Update Schemas
# ============================================================

class GroupCreate(GroupBase):
    exclude_from_matrix: Optional[bool] = False


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    enabled: Optional[bool] = None
    exclude_from_matrix: Optional[bool] = None
    roles: Optional[List[int]] = []


class PositionCreate(PositionBase):
    pass


class PositionUpdate(BaseModel):
    name: Optional[str] = None


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    country: Optional[str] = None
    status: bool = True
    group_ids: List[int] = []
    position_ids: List[int] = []


class UserUpdate(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]
    email: Optional[EmailStr]
    password: Optional[str]
    country: Optional[str]
    status: Optional[bool]
    group_ids: Optional[List[int]]
    position_ids: Optional[List[int]]


# ============================================================
# --- Output (Read) Schemas
# ============================================================

class GroupOut(GroupBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class PositionOut(PositionBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class RoleOut(RoleBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class UserOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    status: bool
    country: Optional[str] = None
    created_at: datetime

    groups: List[GroupOut] = []
    positions: List[PositionOut] = []
    roles: List[RoleOut] = []

    class Config:
        orm_mode = True