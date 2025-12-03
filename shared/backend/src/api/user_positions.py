from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from datetime import datetime

from backend.server.model.models_users import User, UserPosition, UserGroup
from backend.server.utils import auth_utils
from backend.server.utils.change_logger import log_scalar_change, log_list_field_changes

router = APIRouter(prefix="/positions", tags=["positions"])


# ============================================================
# 🔧 Helpers
# ============================================================

def _require_role(user: User, allowed: List[str]):
    """Ensure the user has at least one of the allowed roles, or is admin."""
    roles = auth_utils.get_user_roles(user)
    if "admin" in roles:
        return
    if not any(role in roles for role in allowed):
        raise HTTPException(status_code=403, detail="Not authorized")


# ============================================================
# 🧭 Routes
# ============================================================

@router.get("/", response_model=List[dict])
def list_positions(
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Return all positions with their associated groups."""

    positions = (
        db.query(UserPosition)
        .options(joinedload(UserPosition.groups))
        .order_by(UserPosition.id.asc())
        .all()
    )

    result = []
    for p in positions:
        result.append(
            {
                "id": p.id,
                "name": p.name,
                "description": p.description or "",
                "enabled": p.enabled,
                "exclude_from_matrix": p.exclude_from_matrix,
                "risk_level": p.risk_level,
                "created_at": p.created_at.strftime("%Y-%m-%d %H:%M")
                if p.created_at
                else None,
                "created_by": p.created_by,
                "updated_at": p.updated_at.strftime("%Y-%m-%d %H:%M")
                if p.updated_at
                else None,
                "updated_by": p.updated_by,
                "groups": [
                    {"id": g.id, "name": g.name}
                    for g in getattr(p, "groups", [])
                ],
            }
        )

    return result


@router.get("/{position_id}", response_model=dict)
def get_position(
    position_id: int,
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Return a single position with its assigned groups."""
    _require_role(current_user, ["route:positions#view"])

    position = (
        db.query(UserPosition)
        .options(joinedload(UserPosition.groups))
        .filter(UserPosition.id == position_id)
        .first()
    )

    if not position:
        raise HTTPException(status_code=404, detail="Position not found")

    return {
        "id": position.id,
        "name": position.name,
        "description": position.description or "",
        "enabled": position.enabled,
        "exclude_from_matrix": position.exclude_from_matrix,
        "risk_level": position.risk_level,
        "created_at": position.created_at.strftime("%Y-%m-%d %H:%M")
        if position.created_at
        else None,
        "created_by": position.created_by,
        "updated_at": position.updated_at.strftime("%Y-%m-%d %H:%M")
        if position.updated_at
        else None,
        "updated_by": position.updated_by,
        "groups": [{"id": g.id, "name": g.name} for g in getattr(position, "groups", [])],
    }


@router.post("/", response_model=dict)
def create_position(
    payload: dict,
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Create a new position."""
    _require_role(current_user, ["route:positions#create"])

    name = payload.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Position name is required")

    existing = db.query(UserPosition).filter(UserPosition.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Position already exists")

    now = datetime.utcnow()
    position = UserPosition(
        name=name,
        description=payload.get("description"),
        enabled=payload.get("enabled", True),
        exclude_from_matrix=payload.get("exclude_from_matrix", False),
        risk_level=payload.get("risk_level", "Low"),
        created_at=now,
        created_by=current_user.id,
    )

    # ✅ Only assign groups if explicitly provided — no auto-leak
    group_ids = payload.get("groups") or []
    if group_ids:
        position.groups = db.query(UserGroup).filter(UserGroup.id.in_(group_ids)).all()

    db.add(position)
    db.commit()
    db.refresh(position)

    # ✅ Log creation
    log_scalar_change(
        db=db,
        actor=current_user,
        object_type="UserPosition",
        object_id=position.id,
        field="Name",
        old_value=None,
        new_value=position.name,
        action="create",
        comment=f"Position '{position.name}' created",
    )

    # ✅ Log assigned groups (if any)
    if group_ids:
        log_list_field_changes(
            db=db,
            actor=current_user,
            object_type="UserPosition",
            object_id=position.id,
            field="Groups",
            old_value=[],
            new_value=[g.name for g in position.groups],
            comment="Initial group assignment",
        )

    return {"id": position.id, "message": "Position created successfully"}


@router.put("/{position_id}", response_model=dict)
def edit_position(
    position_id: int,
    payload: dict,
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Edit an existing position."""
    _require_role(current_user, ["route:positions#edit"])

    position = (
        db.query(UserPosition)
        .options(joinedload(UserPosition.groups))
        .filter(UserPosition.id == position_id)
        .first()
    )
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")

    # Track original data
    old_values = {
        "name": position.name,
        "description": position.description,
        "enabled": position.enabled,
        "exclude_from_matrix": position.exclude_from_matrix,
        "risk_level": position.risk_level,
    }

    # Update scalar fields
    for field in old_values.keys():
        if field in payload:
            new_val = payload[field]
            old_val = getattr(position, field)
            if new_val != old_val:
                setattr(position, field, new_val)
                log_scalar_change(
                    db=db,
                    actor=current_user,
                    object_type="UserPosition",
                    object_id=position.id,
                    field=field.replace("_", " ").title(),
                    old_value=str(old_val),
                    new_value=str(new_val),
                    action="update",
                    comment=payload.get("comment"),
                )

    # Update group relationships
    if "groups" in payload:
        new_group_ids = payload.get("groups") or []
        new_groups = db.query(UserGroup).filter(UserGroup.id.in_(new_group_ids)).all()
        old_names = [g.name for g in position.groups]
        new_names = [g.name for g in new_groups]

        if set(old_names) != set(new_names):
            log_list_field_changes(
                db=db,
                actor=current_user,
                object_type="UserPosition",
                object_id=position.id,
                field="Groups",
                old_value=old_names,
                new_value=new_names,
                comment=payload.get("comment"),
            )
            position.groups = new_groups

    position.updated_at = datetime.utcnow()
    position.updated_by = current_user.id
    db.commit()
    db.refresh(position)

    return {"message": "Position updated successfully"}


@router.delete("/{position_id}", response_model=dict)
def delete_position(
    position_id: int,
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Delete a position."""
    _require_role(current_user, ["route:admin-actions#delete-position"])

    position = db.query(UserPosition).filter(UserPosition.id == position_id).first()
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")

    name = position.name
    db.delete(position)
    db.commit()

    # ✅ Log deletion
    log_scalar_change(
        db=db,
        actor=current_user,
        object_type="UserPosition",
        object_id=position_id,
        field="Name",
        old_value=name,
        new_value=None,
        action="delete",
        comment=f"Position '{name}' deleted",
    )

    return {"message": "Position deleted successfully"}


@router.get("/{position_id}/groups", response_model=List[dict])
def get_position_groups(
    position_id: int,
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Return all groups currently linked to a specific position."""
    _require_role(current_user, ["route:positions#view"])

    position = (
        db.query(UserPosition)
        .options(joinedload(UserPosition.groups))
        .filter(UserPosition.id == position_id)
        .first()
    )
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")

    groups = getattr(position, "groups", []) or []
    return [
        {
            "id": g.id,
            "name": g.name,
            "description": getattr(g, "description", None),
        }
        for g in groups
    ]