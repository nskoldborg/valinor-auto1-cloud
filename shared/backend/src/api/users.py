from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, aliased
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

from backend.scr.models.models_users import (
    User,
    UserGroup,
    UserPosition,
    UserRole,
    UserCountry,
)
from backend.scr.services import auth_service
from backend.scr.services.changelog_service import log_list_field_changes, log_scalar_change

router = APIRouter(prefix="/users", tags=["users"])

# ============================================================
# 🔧 Helpers
# ============================================================

def _serialize_group(g: UserGroup):
    return {
        "id": g.id,
        "name": g.name,
        "roles": [{"id": r.id, "name": r.name} for r in getattr(g, "roles", [])],
    }


def _serialize_role(r: UserRole):
    return {"id": r.id, "name": r.name}


def _resolve_effective_roles(user: User) -> List[dict]:
    """Return unique set of direct + group roles for a user."""
    direct_roles = [_serialize_role(r) for r in (user.user_roles or [])]
    group_roles = [
        {"id": r.id, "name": r.name}
        for g in (user.user_groups or [])
        for r in getattr(g, "roles", [])
    ]
    effective_roles_map = {r["name"]: r for r in direct_roles + group_roles}
    return list(effective_roles_map.values())


def _resolve_assignables(user: User, db: Session, current_user: User):
    """
    Return assignable entities:
    - For the logged-in user (`/me`): Admins see all, others see their explicit assignables
    - For any other user (like new user creation): only show what is already assigned
    """
    roles = auth_service.get_user_roles(current_user)
    is_admin = "admin" in roles

    # When resolving for /me
    if user.id == current_user.id:
        if is_admin:
            return {
                "groups": db.query(UserGroup).all(),
                "positions": db.query(UserPosition).all(),
                "roles": db.query(UserRole).all(),
                "countries": db.query(UserCountry).all(),
            }
        else:
            return {
                "groups": user.assignable_user_groups or [],
                "positions": user.assignable_user_positions or [],
                "roles": user.assignable_user_roles or [],
                "countries": user.assignable_user_countries or [],
            }

    # For any other user (creation, listing, etc.)
    return {
        "groups": user.assignable_user_groups or [],
        "positions": user.assignable_user_positions or [],
        "roles": user.assignable_user_roles or [],
        "countries": user.assignable_user_countries or [],
    }


# ============================================================
# 📦 Schemas
# ============================================================

class GroupOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    class Config:
        from_attributes = True


class PositionOut(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True


class RoleOut(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True


class CountryOut(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    status: bool = True
    groups: Optional[List[int]] = []
    user_positions: Optional[List[int]] = []
    roles: Optional[List[int]] = []
    countries: Optional[List[int]] = []
    country: Optional[str] = None
    assignable_groups: Optional[List[int]] = []
    assignable_positions: Optional[List[int]] = []
    assignable_roles: Optional[List[int]] = []
    assignable_countries: Optional[List[int]] = []


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    status: Optional[bool] = None
    groups: Optional[List[int]] = None
    user_positions: Optional[List[int]] = None
    roles: Optional[List[int]] = None
    countries: Optional[List[int]] = None
    country: Optional[str] = None
    assignable_groups: Optional[List[int]] = None
    assignable_positions: Optional[List[int]] = None
    assignable_roles: Optional[List[int]] = None
    assignable_countries: Optional[List[int]] = None
    comment: Optional[str] = None


class UserOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    status: bool
    locale: Optional[str] = "en"
    groups: List[GroupOut] = []
    user_positions: List[PositionOut] = []
    roles: List[RoleOut] = []
    countries: List[CountryOut] = []
    country: Optional[str]
    last_login_datetime: Optional[str] = None
    assignable_groups: List[GroupOut] = []
    assignable_positions: List[PositionOut] = []
    assignable_roles: List[RoleOut] = []
    assignable_countries: List[CountryOut] = []
    created_at: Optional[str]
    created_by: Optional[str]
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None
    class Config:
        from_attributes = True


# ============================================================
# 🧭 Routes
# ============================================================

@router.get("/me", response_model=UserOut)
def get_current_user_info(
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    creator = aliased(User)
    u, creator_obj = (
        db.query(User, creator)
        .outerjoin(creator, User.created_by == creator.id)
        .filter(User.id == current_user.id)
        .first()
    ) or (None, None)

    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    assignables = _resolve_assignables(current_user, db, current_user)
    created_by_name = (
        f"{creator_obj.first_name} {creator_obj.last_name}".strip()
        if creator_obj else None
    )
    created_at_str = u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else None

    return {
        "id": u.id,
        "first_name": u.first_name,
        "last_name": u.last_name,
        "email": u.email,
        "status": u.status,
        "groups": u.user_groups,
        "user_positions": u.user_positions,
        "roles": _resolve_effective_roles(u),
        "countries": u.user_countries,
        "country": u.country,
        "assignable_groups": assignables["groups"],
        "assignable_positions": assignables["positions"],
        "assignable_roles": assignables["roles"],
        "assignable_countries": assignables["countries"],
        "created_at": created_at_str,
        "created_by": created_by_name,
    }


@router.get("/", response_model=List[UserOut])
def list_users(
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    creator = aliased(User)
    users = (
        db.query(User, creator)
        .outerjoin(creator, User.created_by == creator.id)
        .all()
    )

    result = []
    for u, creator_obj in users:
        assignables = _resolve_assignables(u, db, current_user)
        created_by_name = (
            f"{creator_obj.first_name} {creator_obj.last_name}".strip()
            if creator_obj else None
        )
        created_at_str = (
            u.created_at.strftime("%Y-%m-%d %H:%M:%S") if u.created_at else None
        )
        result.append({
            "id": u.id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "email": u.email,
            "status": u.status,
            "groups": u.user_groups,
            "user_positions": u.user_positions,
            "roles": _resolve_effective_roles(u),
            "countries": u.user_countries,
            "country": u.country,
            "assignable_groups": assignables["groups"],
            "assignable_positions": assignables["positions"],
            "assignable_roles": assignables["roles"],
            "assignable_countries": assignables["countries"],
            "created_at": created_at_str,
            "created_by": created_by_name,
        })
    return result


# ============================================================
# 🧾 CREATE USER
# ============================================================
@router.post("/create", response_model=UserOut)
def create_user(
    user: UserCreate,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """Create new user with granular changelog."""
    roles = auth_service.get_user_roles(current_user)
    if "admin" not in roles and "route:users#create" not in roles:
        raise HTTPException(status_code=403, detail="Not authorized")

    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    now = datetime.utcnow()
    new_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        password_hash=auth_service.get_password_hash(user.password),
        status=user.status,
        created_at=now,
        created_by=current_user.id,
        country=user.country,
    )

    # relationships
    def assign(model, ids):
        return db.query(model).filter(model.id.in_(ids)).all() if ids else []

    new_user.user_groups = assign(UserGroup, user.groups)
    new_user.user_positions = assign(UserPosition, user.user_positions)
    new_user.user_roles = assign(UserRole, user.roles)
    new_user.user_countries = assign(UserCountry, user.countries)
    new_user.assignable_user_groups = assign(UserGroup, user.assignable_groups)
    new_user.assignable_user_positions = assign(UserPosition, user.assignable_positions)
    new_user.assignable_user_roles = assign(UserRole, user.assignable_roles)
    new_user.assignable_user_countries = assign(UserCountry, user.assignable_countries)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # changelog entries
    log_scalar_change(
        db=db,
        actor=current_user,
        object_type="User",
        object_id=new_user.id,
        field="User",
        old_value=None,
        new_value=new_user.email,
        action="create",
        comment=f"User {new_user.first_name} {new_user.last_name} created",
    )

    for label, items in {
        "User Groups": new_user.user_groups,
        "User Roles": new_user.user_roles,
        "User Positions": new_user.user_positions,
        "User Countries": new_user.user_countries,
        "Assignable User Groups": new_user.assignable_user_groups,
        "Assignable User Roles": new_user.assignable_user_roles,
        "Assignable User Positions": new_user.assignable_user_positions,
        "Assignable User Countries": new_user.assignable_user_countries,
    }.items():
        if items:
            log_list_field_changes(
                db=db,
                actor=current_user,
                object_type="User",
                object_id=new_user.id,
                field=label,
                old_value=[],
                new_value=[getattr(i, "name", "?") for i in items],
                comment=f"Initial {label} assignment",
            )

    assignables = _resolve_assignables(new_user, db, current_user)
    return {
        "id": new_user.id,
        "first_name": new_user.first_name,
        "last_name": new_user.last_name,
        "email": new_user.email,
        "status": new_user.status,
        "groups": new_user.user_groups,
        "user_positions": new_user.user_positions,
        "roles": new_user.user_roles,
        "countries": new_user.user_countries,
        "country": new_user.country,
        "assignable_groups": new_user.assignable_user_groups,
        "assignable_positions": new_user.assignable_user_positions,
        "assignable_roles": new_user.assignable_user_roles,
        "assignable_countries": new_user.assignable_user_countries,
        "created_at": now.strftime("%Y-%m-%d %H:%M:%S"),
        "created_by": f"{current_user.first_name} {current_user.last_name}",
    }

# ============================================================
# 🛠️ UPDATE USER
# ============================================================
@router.put("/{user_id}/edit", response_model=UserOut)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    roles = auth_service.get_user_roles(current_user)
    if "admin" not in roles and "route:users#edit" not in roles:
        raise HTTPException(status_code=403, detail="Not authorized")

    scalar_fields = ["first_name", "last_name", "email", "status", "country"]
    for field in scalar_fields:
        new_val = getattr(user_update, field, None)
        old_val = getattr(db_user, field, None)
        if new_val is not None and new_val != old_val:
            log_scalar_change(
                db=db,
                actor=current_user,
                object_type="User",
                object_id=db_user.id,
                field=field.replace("_", " ").title(),
                old_value=str(old_val) if old_val else None,
                new_value=str(new_val),
                comment=user_update.comment,
            )
            setattr(db_user, field, new_val)

    if user_update.password:
        db_user.password_hash = auth_service.get_password_hash(user_update.password)
        log_scalar_change(
            db=db,
            actor=current_user,
            object_type="User",
            object_id=db_user.id,
            field="Password",
            old_value=None,
            new_value="********",
            comment=user_update.comment,
        )

    def update_rel(field_name, model, current_list, new_ids):
        if new_ids is not None:
            new_objs = db.query(model).filter(model.id.in_(new_ids)).all()
            old_names = [x.name for x in current_list]
            new_names = [x.name for x in new_objs]
            if set(old_names) != set(new_names):
                log_list_field_changes(
                    db=db,
                    actor=current_user,
                    object_type="User",
                    object_id=db_user.id,
                    field=field_name.replace("_user_", " ").replace("_", " ").title(),
                    old_value=old_names,
                    new_value=new_names,
                    comment=user_update.comment,
                )
            setattr(db_user, field_name, new_objs)

    update_rel("user_groups", UserGroup, db_user.user_groups, user_update.groups)
    update_rel("user_roles", UserRole, db_user.user_roles, user_update.roles)
    update_rel("user_positions", UserPosition, db_user.user_positions, user_update.user_positions)
    update_rel("user_countries", UserCountry, db_user.user_countries, user_update.countries)
    update_rel("assignable_user_groups", UserGroup, db_user.assignable_user_groups, user_update.assignable_groups)
    update_rel("assignable_user_roles", UserRole, db_user.assignable_user_roles, user_update.assignable_roles)
    update_rel("assignable_user_positions", UserPosition, db_user.assignable_user_positions, user_update.assignable_positions)
    update_rel("assignable_user_countries", UserCountry, db_user.assignable_user_countries, user_update.assignable_countries)

    db_user.updated_at = datetime.utcnow()
    db_user.updated_by = current_user.id
    db.commit()
    db.refresh(db_user)

    creator = db.query(User).filter(User.id == db_user.created_by).first()
    updater = db.query(User).filter(User.id == db_user.updated_by).first()
    assignables = _resolve_assignables(db_user, db, current_user)

    return {
        "id": db_user.id,
        "first_name": db_user.first_name,
        "last_name": db_user.last_name,
        "email": db_user.email,
        "status": db_user.status,
        "groups": db_user.user_groups,
        "user_positions": db_user.user_positions,
        "roles": db_user.user_roles,
        "countries": db_user.user_countries,
        "country": db_user.country,
        "assignable_groups": assignables["groups"],
        "assignable_positions": assignables["positions"],
        "assignable_roles": assignables["roles"],
        "assignable_countries": assignables["countries"],
        "created_at": db_user.created_at.strftime("%Y-%m-%d %H:%M:%S") if db_user.created_at else None,
        "created_by": f"{creator.first_name} {creator.last_name}" if creator else None,
        "updated_at": db_user.updated_at.strftime("%Y-%m-%d %H:%M:%S") if db_user.updated_at else None,
        "updated_by": f"{updater.first_name} {updater.last_name}" if updater else None,
    }


# ============================================================
# 🧾 GET USER BY ID
# ============================================================
@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """Return full user details by ID with effective roles."""
    creator = aliased(User)
    u, creator_obj = (
        db.query(User, creator)
        .outerjoin(creator, User.created_by == creator.id)
        .filter(User.id == user_id)
        .first()
    ) or (None, None)

    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    assignables = _resolve_assignables(u, db, current_user)
    created_by_name = (
        f"{creator_obj.first_name} {creator_obj.last_name}".strip()
        if creator_obj else None
    )
    created_at_str = u.created_at.strftime("%Y-%m-%d %H:%M:%S") if u.created_at else None

    direct_roles = [_serialize_role(r) for r in (u.user_roles or [])]
    group_objs = u.user_groups or []
    groups_serialized = [_serialize_group(g) for g in group_objs]
    group_roles = [{"id": r.id, "name": r.name} for g in group_objs for r in getattr(g, "roles", [])]
    effective_roles_map = {r["name"]: r for r in direct_roles + group_roles}
    effective_roles = list(effective_roles_map.values())

    return {
        "id": u.id,
        "first_name": u.first_name,
        "last_name": u.last_name,
        "email": u.email,
        "status": u.status,
        "country": u.country,
        "groups": groups_serialized,
        "user_positions": [{"id": p.id, "name": p.name} for p in (u.user_positions or [])],
        "roles": effective_roles,
        "countries": [{"id": c.id, "name": c.name} for c in (u.user_countries or [])],
        "assignable_groups": assignables["groups"],
        "assignable_positions": assignables["positions"],
        "assignable_roles": assignables["roles"],
        "assignable_countries": assignables["countries"],
        "created_at": created_at_str,
        "created_by": created_by_name,
    }