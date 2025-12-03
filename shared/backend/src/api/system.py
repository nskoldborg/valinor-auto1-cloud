from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from backend.scr.utils.auth_service import get_db, get_current_user
from backend.scr.models.models_changelog import ChangeLog
from backend.scr.models.models_users import User, UserGroup, UserPosition
from backend.scr.services.changelog_service import log_scalar_change, log_list_field_changes

router = APIRouter(prefix="/system", tags=["system"])


# ============================================================
# 🔍 GET: Recent Matrix Sync Logs
# ============================================================

@router.get("/matrix-log", response_model=List[dict])
def get_matrix_log(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Return recent position matrix synchronization entries from the changelog.
    Logs are stored with `action='matrix_sync'` and actor='SYSTEM'.
    """
    logs = (
        db.query(ChangeLog)
        .filter(ChangeLog.action == "matrix_sync")
        .order_by(ChangeLog.created_on.desc())
        .limit(100)
        .all()
    )

    result = []
    for l in logs:
        actor_display = "SYSTEM"
        if l.created_by:
            user = db.query(User).filter(User.id == l.created_by).first()
            if user:
                actor_display = f"{user.first_name} {user.last_name}".strip()

        result.append({
            "id": l.id,
            "object_id": l.object_id,
            "object_type": l.object_type,
            "action": l.action,
            "old_value": l.old_value,
            "new_value": l.new_value,
            "comment": l.comment,
            "created_at": l.created_on.strftime("%Y-%m-%d %H:%M:%S") if l.created_on else None,
            "actor": actor_display,
        })

    return result


# ============================================================
# 🧭 POST: Perform Matrix Synchronization (SYSTEM)
# ============================================================

@router.post("/matrix-sync", response_model=dict)
def perform_matrix_sync(
    db: Session = Depends(get_db),
):
    """
    🔁 Synchronize user-group mappings based on their assigned positions.
    For each user:
      - Collect all groups from their positions.
      - Replace user.user_groups with that set.
      - Log any changes via ChangeLog.
    """
    users = db.query(User).all()
    total_updated = 0

    for user in users:
        # Aggregate all groups coming from the user's positions
        position_groups = {
            g.id: g
            for p in (user.user_positions or [])
            for g in (p.groups or [])
        }

        current_groups = {g.id for g in (user.user_groups or [])}
        new_groups = set(position_groups.keys())

        if current_groups != new_groups:
            # Compute old/new names for changelog
            old_names = [
                g.name for g in db.query(UserGroup).filter(UserGroup.id.in_(current_groups)).all()
            ] if current_groups else []
            new_names = [g.name for g in position_groups.values()] if position_groups else []

            # Apply the new mapping
            user.user_groups = list(position_groups.values())
            user.updated_at = datetime.utcnow()
            db.add(user)
            total_updated += 1

            # Log SYSTEM changelog entry
            log_list_field_changes(
                db=db,
                actor=None,  # SYSTEM
                object_type="User",
                object_id=user.id,
                field="Groups (Matrix Sync)",
                old_value=old_names,
                new_value=new_names,
                comment=f"Matrix sync updated groups for {user.first_name} {user.last_name}",
            )

            # Additional summary entry for matrix action
            log_scalar_change(
                db=db,
                actor=None,
                object_type="User",
                object_id=user.id,
                field="Matrix Sync",
                old_value=", ".join(old_names) or "∅",
                new_value=", ".join(new_names) or "∅",
                action="matrix_sync",
                comment=f"SYSTEM auto-synced groups for {user.first_name} {user.last_name}",
            )

    db.commit()

    return {
        "status": "ok",
        "message": f"Matrix synchronization complete. {total_updated} user(s) updated.",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
    }


# ============================================================
# 🧾 POST: Manual Matrix Log Entry (for external systems)
# ============================================================

@router.post("/matrix-sync-log", response_model=dict)
def log_matrix_sync(
    object_type: str,
    object_id: Optional[int] = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    comment: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Allows external systems or scheduled jobs to record a matrix synchronization event
    as a SYSTEM action in the changelog.
    """
    log_scalar_change(
        db=db,
        actor=None,
        object_type=object_type,
        object_id=object_id or 0,
        field="Matrix Sync",
        old_value=old_value,
        new_value=new_value,
        action="matrix_sync",
        comment=comment or "Automated system matrix update",
    )

    return {"status": "ok", "message": "Matrix sync logged as SYSTEM"}


# ============================================================
# 🧾 GET: System Health Info
# ============================================================

@router.get("/status", response_model=dict)
def system_status(
    db: Session = Depends(get_db),
):
    """
    Returns summary info about matrix syncs for monitoring.
    """
    total_syncs = db.query(ChangeLog).filter(ChangeLog.action == "matrix_sync").count()
    last_sync = (
        db.query(ChangeLog)
        .filter(ChangeLog.action == "matrix_sync")
        .order_by(ChangeLog.created_on.desc())
        .first()
    )

    return {
        "status": "ok",
        "total_syncs": total_syncs,
        "last_sync": last_sync.created_on.strftime("%Y-%m-%d %H:%M:%S") if last_sync else None,
    }