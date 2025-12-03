# backend/server/routers/api_keys.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import secrets

from backend.scr.models.models_users import User
from backend.scr.models.models_changelog import ChangeLog
from backend.scr.services import auth_service
from backend.scr.models.base import Base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


# ============================================================
# 🧩 Model Definition (migrated from legacy)
# ============================================================

class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", backref="api_keys")

    created_date = Column(DateTime, default=datetime.utcnow)
    active = Column(Boolean, default=True)
    expires = Column(DateTime, nullable=True)


# ============================================================
# 📦 Schemas
# ============================================================

class APIKeyBase(BaseModel):
    name: str
    expires: datetime | None = None
    active: bool = True


class APIKeyOut(BaseModel):
    id: int
    name: str
    user_id: int
    created_date: str | None = None
    active: bool
    expires: str | None = None
    status: str

    class Config:
        from_attributes = True


# ============================================================
# 🔧 Helpers
# ============================================================

def _require_role(user: User, allowed: list[str]):
    roles = auth_service.get_user_roles(user)
    if "admin" in roles:
        return
    if not any(role in roles for role in allowed):
        raise HTTPException(status_code=403, detail="Not authorized")


def _get_status(api_key: APIKey) -> str:
    if api_key.expires and api_key.expires < datetime.utcnow():
        return "expired"
    return "active" if api_key.active else "inactive"


def _log_change(
    db: Session,
    actor_id: int,
    object_id: int,
    action: str,
    field: str | None = None,
    old_value: str | None = None,
    new_value: str | None = None,
    comment: str | None = None,
):
    """Log API Key create/update/delete/suspend actions."""
    try:
        entry = ChangeLog(
            object_id=object_id,
            object_type="APIKey",
            action=action,
            field=field,
            old_value=old_value,
            new_value=new_value,
            comment=comment,
            created_by=actor_id,
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        print("⚠️ ChangeLog failed to record:", e)
        db.rollback()


# ============================================================
# 🧭 Routes
# ============================================================

@router.get("/", response_model=list[APIKeyOut])
def list_api_keys(
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """Admins see all keys; others see only their own."""
    roles = auth_service.get_user_roles(current_user)

    query = db.query(APIKey)
    if "admin" not in roles:
        query = query.filter(APIKey.user_id == current_user.id)

    keys = query.order_by(APIKey.created_date.desc()).all()

    return [
        APIKeyOut(
            id=k.id,
            name=k.name,
            user_id=k.user_id,
            created_date=k.created_date.strftime("%Y-%m-%d %H:%M:%S") if k.created_date else None,
            active=k.active,
            expires=k.expires.strftime("%Y-%m-%d %H:%M:%S") if k.expires else None,
            status=_get_status(k),
        )
        for k in keys
    ]


@router.get("/user/{user_id}", response_model=list[APIKeyOut])
def list_api_keys_by_user(
    user_id: int,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """
    Return API keys for a specific user.
    - Users can view their own.
    - Admins or users with `route:users#admin-view-users-api-keys` can view others.
    """
    roles = auth_service.get_user_roles(current_user)

    if (
        current_user.id != user_id
        and "admin" not in roles
        and "route:users#admin-view-users-api-keys" not in roles
    ):
        raise HTTPException(status_code=403, detail="Not authorized to view API keys for this user")

    keys = (
        db.query(APIKey)
        .filter(APIKey.user_id == user_id)
        .order_by(APIKey.created_date.desc())
        .all()
    )

    return [
        APIKeyOut(
            id=k.id,
            name=k.name,
            user_id=k.user_id,
            created_date=k.created_date.strftime("%Y-%m-%d %H:%M:%S") if k.created_date else None,
            active=k.active,
            expires=k.expires.strftime("%Y-%m-%d %H:%M:%S") if k.expires else None,
            status=_get_status(k),
        )
        for k in keys
    ]


@router.post("/create")
def create_api_key(
    key_in: APIKeyBase,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """Create a new API key for the current user."""
    _require_role(current_user, ["route:api-keys#create"])

    clear_key = secrets.token_hex(32)
    now = datetime.utcnow()

    new_key = APIKey(
        key=clear_key,
        name=key_in.name,
        user_id=current_user.id,
        active=key_in.active,
        expires=key_in.expires,
        created_date=now,
    )

    db.add(new_key)
    db.commit()
    db.refresh(new_key)

    _log_change(
        db,
        actor_id=current_user.id,
        object_id=new_key.id,
        action="create",
        field="key",
        new_value=key_in.name,
        comment="API key created",
    )

    return {
        "id": new_key.id,
        "name": new_key.name,
        "user_id": new_key.user_id,
        "created_date": now.strftime("%Y-%m-%d %H:%M:%S"),
        "active": new_key.active,
        "expires": new_key.expires.strftime("%Y-%m-%d %H:%M:%S") if new_key.expires else None,
        "status": _get_status(new_key),
        "key": clear_key,  # return once
    }


@router.put("/{key_id}/enable", response_model=APIKeyOut)
def enable_api_key(
    key_id: int,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """Enable (reactivate) a disabled API key."""
    _require_role(current_user, ["route:api-keys#suspend"])

    query = db.query(APIKey)
    if "admin" not in auth_service.get_user_roles(current_user):
        query = query.filter(APIKey.user_id == current_user.id)

    api_key = query.filter(APIKey.id == key_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API Key not found")

    api_key.active = True
    db.commit()
    db.refresh(api_key)

    _log_change(
        db,
        actor_id=current_user.id,
        object_id=api_key.id,
        action="update",
        field="active",
        old_value="False",
        new_value="True",
        comment="API key enabled",
    )

    return APIKeyOut(
        id=api_key.id,
        name=api_key.name,
        user_id=api_key.user_id,
        created_date=api_key.created_date.strftime("%Y-%m-%d %H:%M:%S"),
        active=api_key.active,
        expires=api_key.expires.strftime("%Y-%m-%d %H:%M:%S") if api_key.expires else None,
        status=_get_status(api_key),
    )


@router.put("/{key_id}/disable", response_model=APIKeyOut)
def disable_api_key(
    key_id: int,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """Suspend (deactivate) an API key."""
    _require_role(current_user, ["route:api-keys#suspend"])

    query = db.query(APIKey)
    if "admin" not in auth_service.get_user_roles(current_user):
        query = query.filter(APIKey.user_id == current_user.id)

    api_key = query.filter(APIKey.id == key_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API Key not found")

    api_key.active = False
    db.commit()
    db.refresh(api_key)

    _log_change(
        db,
        actor_id=current_user.id,
        object_id=api_key.id,
        action="update",
        field="active",
        old_value="True",
        new_value="False",
        comment="API key disabled",
    )

    return APIKeyOut(
        id=api_key.id,
        name=api_key.name,
        user_id=api_key.user_id,
        created_date=api_key.created_date.strftime("%Y-%m-%d %H:%M:%S"),
        active=api_key.active,
        expires=api_key.expires.strftime("%Y-%m-%d %H:%M:%S") if api_key.expires else None,
        status=_get_status(api_key),
    )


@router.delete("/{key_id}")
def delete_api_key(
    key_id: int,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """Delete an API key."""
    _require_role(current_user, ["route:api-keys#delete"])

    query = db.query(APIKey)
    if "admin" not in auth_service.get_user_roles(current_user):
        query = query.filter(APIKey.user_id == current_user.id)

    api_key = query.filter(APIKey.id == key_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API Key not found")

    _log_change(
        db,
        actor_id=current_user.id,
        object_id=api_key.id,
        action="delete",
        field="key",
        old_value=api_key.name,
        comment="API key deleted",
    )

    db.delete(api_key)
    db.commit()
    return {"detail": f"API Key '{api_key.name}' deleted"}