# server/model/schemas/position_requests.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PositionUpdateRequestCreate(BaseModel):
    position_id: int
    description: Optional[str] = None
    exclude_from_matrix: Optional[bool] = False
    change_comment: Optional[str] = None
    groups_to_add: Optional[List[int]] = []  # ✅ NEW

    class Config:
        orm_mode = True


class PositionUpdateRequestUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[int] = None
    exclude_from_matrix: Optional[bool] = None
    change_comment: Optional[str] = None


class PositionUpdateRequestApproval(BaseModel):
    approval_status: str
    approval_comment: Optional[str] = None


class PositionUpdateRequestRead(BaseModel):
    id: int
    request_id: str
    position_id: int
    description: Optional[str]
    requested_by: Optional[int]
    assigned_to: Optional[int]
    approval_status: Optional[str]
    approval_comment: Optional[str]
    exclude_from_matrix: Optional[bool]
    change_comment: Optional[str]
    status: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    approved_by: Optional[int]
    approved_at: Optional[datetime]

    class Config:
        orm_mode = True