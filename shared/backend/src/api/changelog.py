from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, aliased
from typing import List

from backend.server.model.models_users import User
from backend.server.model.models_changelog import ChangeLog
from backend.server.utils import auth_utils

router = APIRouter(prefix="/changelog", tags=["changelog"])


# ============================================================
# 🔧 Helpers
# ============================================================

def _require_role(user: User, allowed: list[str]):
    """Ensure the user has at least one of the allowed roles, or is admin."""
    roles = auth_utils.get_user_roles(user)
    if "admin" in roles:
        return
    if not any(role in roles for role in allowed):
        raise HTTPException(status_code=403, detail="Not authorized")


def _serialize_log_entry(log: ChangeLog, db: Session | None = None):
    """Return a dictionary representation of a changelog entry."""
    # 👤 Actor (who performed the change)
    actor_name = (
        f"{log.actor.first_name} {log.actor.last_name}".strip()
        if log.actor else "System"
    )

    # 🎯 Affected object display name (User full name, etc.)
    object_name = None
    if db and log.object_type == "User":
        try:
            from server.model.models_users import User
            target = db.query(User).filter(User.id == log.object_id).first()
            if target:
                object_name = f"{target.first_name} {target.last_name}".strip()
        except Exception:
            object_name = None

    return {
        "id": log.id,
        "timestamp": log.created_on.strftime("%Y-%m-%d %H:%M:%S") if log.created_on else None,
        "actor": actor_name,
        "actor_id": log.created_by,
        "object_type": log.object_type,
        "object_id": log.object_id,
        "object_name": object_name,  # ✅ full name of affected user
        "field": log.field,
        "action": log.action,
        "old_value": log.old_value,
        "new_value": log.new_value,
        "comment": log.comment,
    }


# ============================================================
# 🧭 Routes
# ============================================================

@router.get("/user/{user_id}", response_model=List[dict])
def get_user_changelog(
    user_id: int,
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """
    Get all changelog entries that affected a specific user (object_type='User', object_id=user_id).
    """
    _require_role(current_user, ["route:users#view-changelog"])

    logs = (
        db.query(ChangeLog)
        .filter(ChangeLog.object_type == "User", ChangeLog.object_id == user_id)
        .order_by(ChangeLog.created_on.desc())
        .all()
    )

    return [_serialize_log_entry(log, db=db) for log in logs]


@router.get("/actor/{actor_id}", response_model=List[dict])
def get_actor_changelog(
    actor_id: int,
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """
    Get all changelog entries performed by a specific actor (created_by == actor_id).
    Includes target object names for better readability.
    """
    _require_role(current_user, ["route:users#view-changelog"])

    logs = (
        db.query(ChangeLog)
        .filter(ChangeLog.created_by == actor_id)
        .order_by(ChangeLog.created_on.desc())
        .all()
    )

    return [_serialize_log_entry(log, db=db) for log in logs]


@router.get("/", response_model=List[dict])
def list_all_changelog(
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
    object_type: str | None = None,
    limit: int = 100,
):
    """
    List the most recent changelog entries.
    Optionally filter by object_type (e.g., 'User', 'Role', 'Group').
    """
    _require_role(current_user, ["route:users#view-changelog"])

    query = db.query(ChangeLog)
    if object_type:
        query = query.filter(ChangeLog.object_type == object_type)

    logs = query.order_by(ChangeLog.created_on.desc()).limit(limit).all()

    return [_serialize_log_entry(log, db=db) for log in logs]