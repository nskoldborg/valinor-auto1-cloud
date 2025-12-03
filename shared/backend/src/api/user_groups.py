from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, aliased
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from backend.scr.models.models_users import User, UserRole, UserGroup
from backend.scr.services import auth_service
from backend.scr.services.changelog_service import log_scalar_change, log_list_field_changes

router = APIRouter(prefix="/groups", tags=["groups"])


# ============================================================
# 📦 Schemas
# ============================================================

class RoleOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class GroupOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    enabled: bool = True
    exclude_from_matrix: Optional[bool] = False
    roles: List[RoleOut] = []
    created_at: Optional[str] = None
    created_by: Optional[str] = None
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None

    class Config:
        from_attributes = True
        orm_mode = True


class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    enabled: bool = True
    roles: List[int] = []


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    enabled: Optional[bool] = None
    roles: Optional[List[int]] = []


# ============================================================
# 🔧 Helpers
# ============================================================

def _require_role(user: User, allowed: list[str]):
    """Ensure the user has at least one of the allowed roles, or is admin."""
    roles = auth_service.get_user_roles(user)
    if "admin" in roles:
        return
    if not any(role in roles for role in allowed):
        raise HTTPException(status_code=403, detail="Not authorized")


# ============================================================
# 🧭 Routes
# ============================================================

@router.get("/", response_model=List[GroupOut])
def list_groups(
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """List all groups with assigned roles and audit metadata."""

    creator = aliased(User)
    updater = aliased(User)
    groups = (
        db.query(UserGroup, creator, updater)
        .outerjoin(creator, UserGroup.created_by == creator.id)
        .outerjoin(updater, UserGroup.updated_by == updater.id)
        .all()
    )

    result = []
    for g, creator_obj, updater_obj in groups:
        result.append({
            "id": g.id,
            "name": g.name,
            "description": g.description,
            "enabled": g.enabled,
            "roles": [{"id": r.id, "name": r.name} for r in g.roles],
            "created_at": g.created_at.strftime("%Y-%m-%d %H:%M:%S") if g.created_at else None,
            "created_by": f"{creator_obj.first_name} {creator_obj.last_name}".strip() if creator_obj else None,
            "updated_at": g.updated_at.strftime("%Y-%m-%d %H:%M:%S") if g.updated_at else None,
            "updated_by": f"{updater_obj.first_name} {updater_obj.last_name}".strip() if updater_obj else None,
        })
    return result


@router.get("/{group_id}", response_model=GroupOut)
def get_group(
    group_id: int,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """Fetch details for a single group."""
    _require_role(current_user, ["route:groups", "route:groups#view"])

    creator = aliased(User)
    updater = aliased(User)
    g, creator_obj, updater_obj = (
        db.query(UserGroup, creator, updater)
        .outerjoin(creator, UserGroup.created_by == creator.id)
        .outerjoin(updater, UserGroup.updated_by == updater.id)
        .filter(UserGroup.id == group_id)
        .first()
    ) or (None, None, None)

    if not g:
        raise HTTPException(status_code=404, detail="Group not found")

    return {
        "id": g.id,
        "name": g.name,
        "description": g.description,
        "enabled": g.enabled,
        "roles": [{"id": r.id, "name": r.name} for r in g.roles],
        "created_at": g.created_at.strftime("%Y-%m-%d %H:%M:%S") if g.created_at else None,
        "created_by": f"{creator_obj.first_name} {creator_obj.last_name}".strip() if creator_obj else None,
        "updated_at": g.updated_at.strftime("%Y-%m-%d %H:%M:%S") if g.updated_at else None,
        "updated_by": f"{updater_obj.first_name} {updater_obj.last_name}".strip() if updater_obj else None,
    }


@router.post("/", response_model=GroupOut)
def create_group(
    group: GroupCreate,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """Create a new group."""
    _require_role(current_user, ["route:groups#create"])

    if db.query(UserGroup).filter(UserGroup.name == group.name).first():
        raise HTTPException(status_code=400, detail="Group already exists")

    now = datetime.utcnow()
    new_group = UserGroup(
        name=group.name,
        description=group.description,
        enabled=group.enabled,
        created_at=now,
        created_by=current_user.id,
    )
    db.add(new_group)
    db.commit()
    db.refresh(new_group)

    # ✅ Log creation
    log_scalar_change(
        db=db,
        actor=current_user,
        object_type="UserGroup",
        object_id=new_group.id,
        field="Name",
        old_value=None,
        new_value=new_group.name,
        action="create",
        comment=f"Group '{new_group.name}' created",
    )

    # ✅ Assign roles if explicitly provided
    if group.roles:
        roles = db.query(UserRole).filter(UserRole.id.in_(group.roles)).all()
        new_group.roles.extend(roles)
        db.commit()
        db.refresh(new_group)

        log_list_field_changes(
            db=db,
            actor=current_user,
            object_type="UserGroup",
            object_id=new_group.id,
            field="Roles",
            old_value=[],
            new_value=[r.name for r in new_group.roles],
            comment="Initial role assignment",
        )

    return {
        "id": new_group.id,
        "name": new_group.name,
        "description": new_group.description,
        "enabled": new_group.enabled,
        "roles": [{"id": r.id, "name": r.name} for r in new_group.roles],
        "created_at": now.strftime("%Y-%m-%d %H:%M:%S"),
        "created_by": f"{current_user.first_name} {current_user.last_name}",
    }


@router.put("/{group_id}", response_model=GroupOut)
def update_group(
    group_id: int,
    group_update: GroupUpdate,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """Update group details and assigned roles."""
    _require_role(current_user, ["route:groups#edit"])

    db_group = db.query(UserGroup).filter(UserGroup.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")

    # --- Scalar fields ---
    old_values = {
        "name": db_group.name,
        "description": db_group.description,
        "enabled": db_group.enabled,
    }

    for field, old_val in old_values.items():
        new_val = getattr(group_update, field, None)
        if new_val is not None and new_val != old_val:
            setattr(db_group, field, new_val)
            log_scalar_change(
                db=db,
                actor=current_user,
                object_type="UserGroup",
                object_id=db_group.id,
                field=field.title(),
                old_value=str(old_val),
                new_value=str(new_val),
                action="update",
                comment=None,
            )

    # --- Roles ---
    if group_update.roles is not None:
        new_roles = db.query(UserRole).filter(UserRole.id.in_(group_update.roles)).all()
        old_role_names = [r.name for r in db_group.roles]
        new_role_names = [r.name for r in new_roles]

        if set(old_role_names) != set(new_role_names):
            log_list_field_changes(
                db=db,
                actor=current_user,
                object_type="UserGroup",
                object_id=db_group.id,
                field="Roles",
                old_value=old_role_names,
                new_value=new_role_names,
                comment=None,
            )
            db_group.roles = new_roles

    db_group.updated_at = datetime.utcnow()
    db_group.updated_by = current_user.id
    db.commit()
    db.refresh(db_group)

    creator = db.query(User).filter(User.id == db_group.created_by).first()
    return {
        "id": db_group.id,
        "name": db_group.name,
        "description": db_group.description,
        "enabled": db_group.enabled,
        "roles": [{"id": r.id, "name": r.name} for r in db_group.roles],
        "created_at": db_group.created_at.strftime("%Y-%m-%d %H:%M:%S") if db_group.created_at else None,
        "created_by": f"{creator.first_name} {creator.last_name}".strip() if creator else None,
        "updated_at": db_group.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
        "updated_by": f"{current_user.first_name} {current_user.last_name}",
    }


@router.delete("/{group_id}")
def delete_group(
    group_id: int,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """Delete a group."""
    _require_role(current_user, ["route:admin-actions#delete-groups"])

    db_group = db.query(UserGroup).filter(UserGroup.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")

    name = db_group.name
    db.delete(db_group)
    db.commit()

    log_scalar_change(
        db=db,
        actor=current_user,
        object_type="UserGroup",
        object_id=group_id,
        field="Name",
        old_value=name,
        new_value=None,
        action="delete",
        comment=f"Group '{name}' deleted",
    )

    return {"ok": True, "message": f"Group {group_id} deleted"}