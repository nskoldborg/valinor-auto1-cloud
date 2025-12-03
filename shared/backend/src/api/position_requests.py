from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from backend.server.utils import auth_utils
from backend.server.model.models_position_requests import PositionUpdateRequest
from backend.server.model.schemas.position_requests import (
    PositionUpdateRequestCreate,
    PositionUpdateRequestUpdate,
    PositionUpdateRequestApproval,
    PositionUpdateRequestRead,
)

router = APIRouter(prefix="/position-requests", tags=["Position Update Requests"])


# ------------------------------------------------------------
# Helper: Generate readable request IDs (PUR-0001)
# ------------------------------------------------------------
def generate_request_id(db: Session) -> str:
    count = db.query(PositionUpdateRequest).count() + 1
    return f"PUR-{count:04d}"


# ------------------------------------------------------------
# GET: List all position update requests
# ------------------------------------------------------------
@router.get("/", response_model=List[PositionUpdateRequestRead])
def list_position_requests(
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    return (
        db.query(PositionUpdateRequest)
        .order_by(PositionUpdateRequest.created_at.desc())
        .all()
    )


# ------------------------------------------------------------
# GET: Single position update request by ID
# ------------------------------------------------------------
@router.get("/{request_id}", response_model=PositionUpdateRequestRead)
def get_position_request(
    request_id: str,
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    request = db.query(PositionUpdateRequest).filter_by(request_id=request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Position update request not found")
    return request


# ------------------------------------------------------------
# POST: Create a new position update request
# ------------------------------------------------------------
@router.post("/", response_model=PositionUpdateRequestRead)
def create_position_request(
    payload: PositionUpdateRequestCreate,
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    new_request = PositionUpdateRequest(
        request_id=generate_request_id(db),
        position_id=payload.position_id,
        description=payload.description,
        exclude_from_matrix=payload.exclude_from_matrix,
        change_comment=payload.change_comment,
        requested_by=current_user.id,
        status="Pending Approval",
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request


# ------------------------------------------------------------
# PUT: Work / update an existing position request
# ------------------------------------------------------------
@router.put("/{request_id}/work", response_model=PositionUpdateRequestRead)
def update_position_request(
    request_id: str,
    payload: PositionUpdateRequestUpdate,
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    request = db.query(PositionUpdateRequest).filter_by(request_id=request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Position update request not found")

    if request.status not in ["Approved", "In Progress"]:
        raise HTTPException(
            status_code=400,
            detail="Request must be approved before making configuration changes.",
        )

    request.status = payload.status or request.status
    request.assigned_to = payload.assigned_to or request.assigned_to
    request.change_comment = payload.change_comment or request.change_comment
    request.exclude_from_matrix = (
        payload.exclude_from_matrix
        if payload.exclude_from_matrix is not None
        else request.exclude_from_matrix
    )
    request.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(request)
    return request


# ------------------------------------------------------------
# PUT: Approve or reject a position request
# ------------------------------------------------------------
@router.put("/{request_id}/approve", response_model=PositionUpdateRequestRead)
def approve_position_request(
    request_id: str,
    payload: PositionUpdateRequestApproval,
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    request = db.query(PositionUpdateRequest).filter_by(request_id=request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Position update request not found")

    if payload.approval_status not in ["Approved", "Rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Approval status must be either 'Approved' or 'Rejected'.",
        )

    request.approval_status = payload.approval_status
    request.approval_comment = payload.approval_comment
    request.approved_by = current_user.id
    request.approved_at = datetime.utcnow()
    request.status = "Approved" if payload.approval_status == "Approved" else "Rejected"

    db.commit()
    db.refresh(request)
    return request