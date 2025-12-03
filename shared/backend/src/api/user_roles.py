from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, aliased
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from backend.server.model.models_users import User, UserRole
from backend.server.utils import auth_utils
from backend.server.utils.change_logger import log_scalar_change

router = APIRouter(prefix="/roles", tags=["roles"])


# ============================================================
# 📦 Schemas
# ============================================================

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None


class RoleOut(RoleBase):
    id: int
    created_at: Optional[str] = None
    created_by: Optional[str] = None
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None

    class Config:
        from_attributes = True


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

@router.get("/", response_model=List[RoleOut])
def list_roles(
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """
    Return roles visible to the current user:
    - Admins and users with `route:roles` see all roles.
    - Others see only their assignable roles.
    """
    creator = aliased(User)
    updater = aliased(User)
    effective_roles = auth_utils.get_user_roles(current_user)

    query = (
        db.query(
            UserRole.id,
            UserRole.name,
            UserRole.description,
            UserRole.created_at,
            creator.first_name.label("created_by_first"),
            creator.last_name.label("created_by_last"),
            UserRole.updated_at,
            updater.first_name.label("updated_by_first"),
            updater.last_name.label("updated_by_last"),
        )
        .outerjoin(creator, UserRole.created_by == creator.id)
        .outerjoin(updater, UserRole.updated_by == updater.id)
    )

    # 🔒 Limit to assignable roles for non-admin users
    if "admin" in effective_roles or "route:roles" in effective_roles:
        roles = query.all()
    else:
        assignable_ids = [r.id for r in (current_user.assignable_user_roles or [])]
        if not assignable_ids:
            return []
        roles = query.filter(UserRole.id.in_(assignable_ids)).all()

    result = []
    for r in roles:
        created_by_name = (
            f"{r.created_by_first} {r.created_by_last}".strip()
            if r.created_by_first else None
        )
        updated_by_name = (
            f"{r.updated_by_first} {r.updated_by_last}".strip()
            if r.updated_by_first else None
        )
        created_at_str = r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else None
        updated_at_str = r.updated_at.strftime("%Y-%m-%d %H:%M:%S") if r.updated_at else None

        result.append({
            "id": r.id,
            "name": r.name,
            "description": r.description or "",
            "created_at": created_at_str,
            "created_by": created_by_name,
            "updated_at": updated_at_str,
            "updated_by": updated_by_name,
        })

    return result


# ============================================================
# 🧭 Create Role
# ============================================================

@router.post("/create", response_model=RoleOut)
def create_role(
    role: RoleBase,
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Create a new user role."""
    _require_role(current_user, ["route:roles#create"])

    # 🔒 Prevent duplicates
    if db.query(UserRole).filter(UserRole.name == role.name).first():
        raise HTTPException(status_code=400, detail="Role already exists")

    now = datetime.utcnow()
    new_role = UserRole(
        name=role.name,
        description=role.description or "",
        created_at=now,
        created_by=current_user.id,
    )
    db.add(new_role)
    db.commit()
    db.refresh(new_role)

    # ✅ Log creation with new changelog util
    log_scalar_change(
        db=db,
        actor=current_user,
        object_type="Role",
        object_id=new_role.id,
        field="Role",
        old_value=None,
        new_value=role.name,
        action="create",
        comment=None,
    )

    return {
        "id": new_role.id,
        "name": new_role.name,
        "description": new_role.description,
        "created_at": now.strftime("%Y-%m-%d %H:%M"),
        "created_by": f"{current_user.first_name} {current_user.last_name}",
        "updated_at": None,
        "updated_by": None,
    }


# ============================================================
# 🧭 Get Role by ID
# ============================================================

@router.get("/{role_id}", response_model=RoleOut)
def get_role(
    role_id: int,
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Return details for a specific role."""
    _require_role(current_user, ["route:roles", "route:groups#create", "route:groups#edit"])

    creator = aliased(User)
    updater = aliased(User)

    r, creator_obj, updater_obj = (
        db.query(UserRole, creator, updater)
        .outerjoin(creator, UserRole.created_by == creator.id)
        .outerjoin(updater, UserRole.updated_by == updater.id)
        .filter(UserRole.id == role_id)
        .first()
    ) or (None, None, None)

    if not r:
        raise HTTPException(status_code=404, detail="Role not found")

    created_by_name = (
        f"{creator_obj.first_name} {creator_obj.last_name}".strip()
        if creator_obj else None
    )
    updated_by_name = (
        f"{updater_obj.first_name} {updater_obj.last_name}".strip()
        if updater_obj else None
    )

    return {
        "id": r.id,
        "name": r.name,
        "description": r.description or "",
        "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else None,
        "created_by": created_by_name,
        "updated_at": r.updated_at.strftime("%Y-%m-%d %H:%M") if r.updated_at else None,
        "updated_by": updated_by_name,
    }


# ============================================================
# 🧭 Edit Role
# ============================================================

@router.put("/{role_id}/edit", response_model=RoleOut)
def edit_role(
    role_id: int,
    role_update: RoleBase,
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Edit an existing role."""
    _require_role(current_user, ["route:roles#edit"])

    db_role = db.query(UserRole).filter(UserRole.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")

    old_name = db_role.name
    old_description = db_role.description

    db_role.name = role_update.name
    db_role.description = role_update.description or ""
    db_role.updated_at = datetime.utcnow()
    db_role.updated_by = current_user.id

    db.commit()
    db.refresh(db_role)

    # ✅ Log individual field changes
    if old_name != db_role.name:
        log_scalar_change(
            db=db,
            actor=current_user,
            object_type="Role",
            object_id=db_role.id,
            field="Name",
            old_value=old_name,
            new_value=db_role.name,
            action="update",
            comment=None,
        )

    if old_description != db_role.description:
        log_scalar_change(
            db=db,
            actor=current_user,
            object_type="Role",
            object_id=db_role.id,
            field="Description",
            old_value=old_description,
            new_value=db_role.description,
            action="update",
            comment=None,
        )

    creator = db.query(User).filter(User.id == db_role.created_by).first()
    updater = db.query(User).filter(User.id == db_role.updated_by).first()

    return {
        "id": db_role.id,
        "name": db_role.name,
        "description": db_role.description,
        "created_at": db_role.created_at.strftime("%Y-%m-%d %H:%M") if db_role.created_at else None,
        "created_by": f"{creator.first_name} {creator.last_name}" if creator else None,
        "updated_at": db_role.updated_at.strftime("%Y-%m-%d %H:%M") if db_role.updated_at else None,
        "updated_by": f"{updater.first_name} {updater.last_name}" if updater else None,
    }