from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from backend.scr.services import auth_service
from backend.scr.models.models_release import ReleaseTrack
from backend.scr.services.semver_utils import bump_version
from backend.scr.services.changelog_service import log_scalar_change

router = APIRouter(prefix="/releases", tags=["releases"])


# ============================================================
# 🧭 GET: Retrieve or Initialize Release Track
# ============================================================

@router.get("/{key}")
def get_release_track(
    key: str,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """
    Retrieve or initialize a release track for a specific feature/product.
    If not found, initializes it at version 0.0.0.
    """
    auth_service.require_role(current_user, ["route:product#features"])

    rt = db.query(ReleaseTrack).filter(ReleaseTrack.key == key).first()
    if not rt:
        # Initialize first-time release track
        rt = ReleaseTrack(
            key=key,
            current_version="0.0.0",
            updated_by=current_user.id,
            updated_at=datetime.utcnow(),
        )
        db.add(rt)
        db.commit()
        db.refresh(rt)

        # ✅ Log initialization
        log_scalar_change(
            db=db,
            actor=current_user,
            object_type="ReleaseTrack",
            object_id=rt.id,
            field="Version",
            old_value=None,
            new_value="0.0.0",
            action="create",
            comment=f"Initialized new release track '{key}' at version 0.0.0",
        )

    return {
        "key": rt.key,
        "current_version": rt.current_version,
        "updated_at": rt.updated_at.strftime("%Y-%m-%d %H:%M:%S") if rt.updated_at else None,
    }


# ============================================================
# 🧭 POST: Compute or Apply Version Bump
# ============================================================

@router.post("/{key}/bump")
def bump_release_track(
    key: str,
    data: dict,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """
    Apply and log a new version bump for a release track.
    Example payload:
    {
        "update_level": "major|minor|patch"
    }
    """
    auth_service.require_role(current_user, ["route:product#features"])

    update_level = (data.get("update_level") or "patch").lower()

    # --- Fetch or initialize release track
    rt = db.query(ReleaseTrack).filter(ReleaseTrack.key == key).first()
    if not rt:
        rt = ReleaseTrack(
            key=key,
            current_version="0.0.0",
            updated_by=current_user.id,
            updated_at=datetime.utcnow(),
        )
        db.add(rt)
        db.commit()
        db.refresh(rt)

        # ✅ Log initialization
        log_scalar_change(
            db=db,
            actor=current_user,
            object_type="ReleaseTrack",
            object_id=rt.id,
            field="Version",
            old_value=None,
            new_value="0.0.0",
            action="create",
            comment=f"Initialized new release track '{key}' at version 0.0.0",
        )

    # --- Compute next version
    old_version = rt.current_version
    next_version = bump_version(rt.current_version, update_level)

    # --- Apply bump
    rt.current_version = next_version
    rt.updated_at = datetime.utcnow()
    rt.updated_by = current_user.id
    db.commit()
    db.refresh(rt)

    # ✅ Log version bump
    log_scalar_change(
        db=db,
        actor=current_user,
        object_type="ReleaseTrack",
        object_id=rt.id,
        field="Version",
        old_value=old_version,
        new_value=next_version,
        action="update",
        comment=f"Release track '{key}' bumped from {old_version} to {next_version} ({update_level})",
    )

    return {
        "key": rt.key,
        "previous_version": old_version,
        "current_version": next_version,
        "update_level": update_level,
        "updated_at": rt.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
        "actor": f"{current_user.first_name} {current_user.last_name}",
        "applied": True,
    }


# ============================================================
# 🧭 POST: System-triggered bump (CI/CD)
# ============================================================

@router.post("/{key}/system-bump")
def system_bump_release_track(
    key: str,
    update_level: str = "patch",
    db: Session = Depends(auth_service.get_db),
):
    """
    Used by automated CI/CD or cron jobs to bump release versions.
    Actor is always SYSTEM.
    """
    rt = db.query(ReleaseTrack).filter(ReleaseTrack.key == key).first()
    if not rt:
        rt = ReleaseTrack(
            key=key,
            current_version="0.0.0",
            updated_by=None,
            updated_at=datetime.utcnow(),
        )
        db.add(rt)
        db.commit()
        db.refresh(rt)

        log_scalar_change(
            db=db,
            actor=None,
            object_type="ReleaseTrack",
            object_id=rt.id,
            field="Version",
            old_value=None,
            new_value="0.0.0",
            action="create",
            comment=f"SYSTEM initialized release track '{key}' at 0.0.0",
            system_actor=True,
        )

    # --- Compute bump
    next_version = bump_version(rt.current_version, update_level)
    old_version = rt.current_version
    rt.current_version = next_version
    rt.updated_at = datetime.utcnow()
    rt.updated_by = None
    db.commit()

    # ✅ Log SYSTEM bump
    log_scalar_change(
        db=db,
        actor=None,
        object_type="ReleaseTrack",
        object_id=rt.id,
        field="Version",
        old_value=old_version,
        new_value=next_version,
        action="update",
        comment=f"SYSTEM auto-bumped release track '{key}' from {old_version} to {next_version} ({update_level})",
        system_actor=True,
    )

    return {
        "key": key,
        "current_version": rt.current_version,
        "updated_at": rt.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
        "update_level": update_level,
        "applied": True,
        "actor": "SYSTEM",
    }