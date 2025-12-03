from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from backend.scr.services import auth_service
from backend.scr.models.models_feature_requests import (
    FeatureRequest,
    FeatureComment,
    FeatureRequestStatus,
    FeatureType,
    UpdateLevel,
)
from backend.scr.models.models_release import ReleaseTrack, ReleaseHistory
from backend.scr.services.semver_utils import bump_version
from backend.scr.services.email_service import send_email, build_release_email_html
from backend.scr.services.changelog_serivce import log_scalar_change

router = APIRouter(prefix="/feature-requests", tags=["feature-requests"])


# ============================================================
# Helper: Generate prefixed feature ID
# ============================================================

def _generate_feature_id(db: Session, feature_type: FeatureType):
    prefix_map = {
        FeatureType.FRONTEND: "FRC",
        FeatureType.BACKEND: "APC",
        FeatureType.SERVER: "SRC",
        FeatureType.DATABASE: "DBC",
        FeatureType.BUGFIX: "BFX",
    }

    prefix = prefix_map.get(feature_type, "GEN")
    latest = (
        db.query(FeatureRequest)
        .filter(FeatureRequest.type == feature_type)
        .order_by(FeatureRequest.id.desc())
        .first()
    )

    next_number = 1
    if latest and latest.feature_id:
        try:
            next_number = int(latest.feature_id.split("-")[1]) + 1
        except Exception:
            pass

    return f"{prefix}-{next_number:04d}"


# ============================================================
# ROUTES
# ============================================================

@router.get("/")
def list_feature_requests(
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    auth_service.require_role(current_user, ["route:product#features"])
    features = db.query(FeatureRequest).order_by(FeatureRequest.created_at.desc()).all()

    return [
        {
            "id": f.id,
            "feature_id": f.feature_id,
            "title": f.title,
            "type": f.type.value,
            "status": f.status.value,
            "update_level": f.update_level.value,
            "main_feature": f.main_feature,
            "impact": f.impact,
            "confidence": f.confidence,
            "ease": f.ease,
            "ice_score": f.ice_score,
            "version_target": f.version_target,
            "assigned_to": f.assigned_to,
            "created_by": f.created_by,
            "updated_by": f.updated_by,
            "created_at": f.created_at,
            "updated_at": f.updated_at,
        }
        for f in features
    ]


# ============================================================
# Create new feature request
# ============================================================

@router.post("/")
def create_feature_request(
    data: dict,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    auth_service.require_role(current_user, ["route:product#features-create"])

    try:
        feature_type = FeatureType(data["type"])
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid feature type")

    feature_id = _generate_feature_id(db, feature_type)

    new_request = FeatureRequest(
        feature_id=feature_id,
        title=data.get("title"),
        description=data.get("description"),
        type=feature_type,
        update_level=data.get("update_level", UpdateLevel.PATCH),
        main_feature=data.get("main_feature"),
        version_target=data.get("version_target"),
        created_by=current_user.id,
        updated_by=current_user.id,
        assigned_to=data.get("assigned_to"),
        impact=data.get("impact", 0),
        confidence=data.get("confidence", 0),
        ease=data.get("ease", 0),
        status=FeatureRequestStatus.NEW,
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    # ✅ Log creation
    log_scalar_change(
        db=db,
        actor=current_user,
        object_type="FeatureRequest",
        object_id=new_request.id,
        field="FeatureRequest",
        old_value=None,
        new_value=new_request.feature_id,
        action="create",
        comment=f"Feature request {new_request.feature_id} created",
    )

    return {
        "message": "Feature request created successfully.",
        "feature_id": new_request.feature_id,
        "ice_score": new_request.ice_score,
    }


# ============================================================
# Add comment to a feature request
# ============================================================

@router.post("/{feature_id}/comments")
def add_comment(
    feature_id: str,
    data: dict,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    auth_service.require_role(current_user, ["route:product#features-comment"])
    req = db.query(FeatureRequest).filter(FeatureRequest.feature_id == feature_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Feature request not found")

    comment_text = data.get("comment_text", "").strip()
    if not comment_text:
        raise HTTPException(status_code=400, detail="Comment text cannot be empty.")

    author_name = (
        f"{getattr(current_user, 'first_name', '')} {getattr(current_user, 'last_name', '')}".strip()
        or getattr(current_user, "email", "Unknown")
    )

    new_comment = FeatureComment(
        feature_request_id=req.id,
        author_id=current_user.id,
        author_name=author_name,
        comment_text=comment_text,
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    # ✅ Log comment
    log_scalar_change(
        db=db,
        actor=current_user,
        object_type="FeatureRequest",
        object_id=req.id,
        field="Comment",
        old_value=None,
        new_value=comment_text,
        action="create",
        comment=None,
    )

    return {
        "message": "Comment added successfully.",
        "comment": {
            "id": new_comment.id,
            "author": new_comment.author_name,
            "comment_text": new_comment.comment_text,
            "created_at": new_comment.created_at.strftime("%Y-%m-%d %H:%M"),
        },
    }


# ============================================================
# Get detailed feature request (with comments)
# ============================================================

@router.get("/{feature_id}")
def get_feature_request(
    feature_id: str,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    auth_service.require_role(current_user, ["route:product#features"])
    req = db.query(FeatureRequest).filter(FeatureRequest.feature_id == feature_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Feature request not found")

    comments = (
        db.query(FeatureComment)
        .filter(FeatureComment.feature_request_id == req.id)
        .order_by(FeatureComment.created_at.asc())
        .all()
    )

    return {
        "id": req.id,
        "feature_id": req.feature_id,
        "title": req.title,
        "description": req.description,
        "type": req.type.value,
        "status": req.status.value,
        "update_level": req.update_level.value,
        "main_feature": req.main_feature,
        "version_target": req.version_target,
        "assigned_to": req.assigned_to,
        "impact": req.impact,
        "confidence": req.confidence,
        "ease": req.ease,
        "ice_score": req.ice_score,
        "created_by": req.created_by,
        "updated_by": req.updated_by,
        "created_at": req.created_at,
        "updated_at": req.updated_at,
        "comments": [
            {
                "id": c.id,
                "author": c.author_name,
                "comment_text": c.comment_text,
                "created_at": c.created_at.strftime("%Y-%m-%d %H:%M"),
            }
            for c in comments
        ],
    }


# ============================================================
# Update feature request (logs all key changes)
# ============================================================

@router.put("/{feature_id}/work")
def update_feature_work(
    feature_id: str,
    data: dict,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    auth_service.require_role(current_user, ["route:product#features-edit"])
    req = db.query(FeatureRequest).filter(FeatureRequest.feature_id == feature_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Feature request not found")

    changes = []

    def track_change(field, old, new, comment=None):
        if old != new:
            log_scalar_change(
                db=db,
                actor=current_user,
                object_type="FeatureRequest",
                object_id=req.id,
                field=field.title(),
                old_value=str(old),
                new_value=str(new),
                action="update",
                comment=comment,
            )
            changes.append(field)

    # --- Track changes ---
    old_status = req.status.value
    old_update_level = req.update_level.value
    old_assigned = req.assigned_to

    # Apply updates
    if "status" in data:
        try:
            req.status = FeatureRequestStatus(data["status"])
            track_change("Status", old_status, req.status.value)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {data['status']}")

    if "update_level" in data:
        try:
            req.update_level = UpdateLevel(data["update_level"])
            track_change("Update Level", old_update_level, req.update_level.value)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid update level: {data['update_level']}")

    for field in ["main_feature", "version_target", "assigned_to"]:
        if field in data:
            old = getattr(req, field)
            new = data[field]
            setattr(req, field, new)
            track_change(field, old, new)

    for score_field in ["impact", "confidence", "ease"]:
        if score_field in data:
            old_val = getattr(req, score_field)
            new_val = data[score_field]
            if not isinstance(new_val, (int, float)) or not 0 <= new_val <= 10:
                raise HTTPException(status_code=400, detail=f"{score_field} must be between 0 and 10")
            setattr(req, score_field, new_val)
            track_change(score_field, old_val, new_val)

    req.updated_by = current_user.id
    req.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(req)

    return {
        "message": f"Feature request {feature_id} updated successfully.",
        "changes_logged": changes,
        "status": req.status.value,
        "update_level": req.update_level.value,
        "main_feature": req.main_feature,
        "version_target": req.version_target,
        "ice_score": req.ice_score,
    }


# ============================================================
# Release Feature Endpoint (🎉 now with HTML email & changelog)
# ============================================================

@router.put("/{feature_id}/release")
def release_feature(
    feature_id: str,
    data: dict,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    auth_service.require_role(current_user, ["route:product#features-release"])

    req = db.query(FeatureRequest).filter(FeatureRequest.feature_id == feature_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Feature request not found")

    if req.status != FeatureRequestStatus.PENDING_RELEASE:
        raise HTTPException(status_code=400, detail="Feature must be Pending Release")

    track = db.query(ReleaseTrack).filter(ReleaseTrack.key == req.main_feature).first()
    if not track:
        track = ReleaseTrack(key=req.main_feature, current_version="0.0.0", updated_by=current_user.id)
        db.add(track)
        db.commit()
        db.refresh(track)

    new_version = req.version_target or bump_version(track.current_version, req.update_level.value)
    old_version = track.current_version

    track.current_version = new_version
    track.updated_by = current_user.id
    req.status = FeatureRequestStatus.RELEASED
    req.updated_by = current_user.id
    req.updated_at = datetime.utcnow()

    history = ReleaseHistory(
        key=req.main_feature,
        version=new_version,
        feature_request_id=req.id,
        notes=data.get("release_notes", ""),
        created_by=current_user.id,
    )
    db.add(history)
    db.commit()
    db.refresh(req)

    # ✅ Log release + bump
    log_scalar_change(
        db=db,
        actor=current_user,
        object_type="FeatureRequest",
        object_id=req.id,
        field="Release",
        old_value=old_version,
        new_value=new_version,
        action="update",
        comment=f"Feature {req.feature_id} released, bumped {req.main_feature} from {old_version} → {new_version}",
    )

    log_scalar_change(
        db=db,
        actor=current_user,
        object_type="ReleaseTrack",
        object_id=track.id,
        field="Version",
        old_value=old_version,
        new_value=new_version,
        action="update",
        comment=f"Release track '{req.main_feature}' bumped due to feature {req.feature_id}",
    )

    # --- Send HTML email ---
    email = data.get("email")
    if email:
        try:
            html_body = build_release_email_html(
                {
                    "feature_id": req.feature_id,
                    "title": req.title,
                    "main_feature": req.main_feature,
                    "version": new_version,
                    "ice_score": req.ice_score,
                    "type": req.type.value,
                    "created_at": req.created_at,
                },
                release_notes=data.get("release_notes", "")
            )
            send_email(
                to=email.get("to"),
                cc=email.get("cc"),
                bcc=email.get("bcc"),
                subject=f"🚀 {req.main_feature} v{new_version} Released",
                body=html_body,
            )
        except Exception as e:
            print(f"⚠️ Failed to send release email: {e}")

    return {
        "message": f"Feature {feature_id} released successfully.",
        "main_feature": req.main_feature,
        "new_version": new_version,
    }


# ============================================================
# Delete comment (with changelog)
# ============================================================

@router.delete("/{feature_id}/comments/{comment_id}")
def delete_comment(
    feature_id: str,
    comment_id: int,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    auth_service.require_role(current_user, ["route:product#features-comment-delete"])

    feature = db.query(FeatureRequest).filter(FeatureRequest.feature_id == feature_id).first()
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")

    comment = (
        db.query(FeatureComment)
        .filter(FeatureComment.id == comment_id, FeatureComment.feature_request_id == feature.id)
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    db.delete(comment)
    db.commit()

    # ✅ Log deletion
    log_scalar_change(
        db=db,
        actor=current_user,
        object_type="FeatureRequest",
        object_id=feature.id,
        field="Comment",
        old_value=comment.comment_text,
        new_value=None,
        action="delete",
        comment=None,
    )

    return {"message": f"Comment {comment_id} deleted successfully.", "deleted_comment_id": comment_id}

# ============================================================
# Reopen a previously released or rejected feature request
# ============================================================

@router.put("/{feature_id}/reopen")
def reopen_feature_request(
    feature_id: str,
    data: dict | None = None,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """
    Reopens a feature request that was previously released or rejected.
    Optionally accepts a comment or reason field for context.
    """
    auth_service.require_role(current_user, ["route:product#features-edit"])

    req = db.query(FeatureRequest).filter(FeatureRequest.feature_id == feature_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Feature request not found")

    if req.status not in [FeatureRequestStatus.RELEASED, FeatureRequestStatus.REJECTED]:
        raise HTTPException(status_code=400, detail="Feature can only be reopened if it is Released or Rejected")

    old_status = req.status.value
    req.status = FeatureRequestStatus.IN_DEVELOPMENT
    req.updated_at = datetime.utcnow()
    req.updated_by = current_user.id

    db.commit()
    db.refresh(req)

    reason = (data or {}).get("reason", "No reason provided")

    # ✅ Log reopen action
    log_scalar_change(
        db=db,
        actor=current_user,
        object_type="FeatureRequest",
        object_id=req.id,
        field="Status",
        old_value=old_status,
        new_value=req.status.value,
        action="update",
        comment=f"Feature {req.feature_id} reopened by {current_user.first_name} {current_user.last_name} — Reason: {reason}",
    )

    return {
        "message": f"Feature request {feature_id} reopened successfully.",
        "old_status": old_status,
        "new_status": req.status.value,
        "reason": reason,
    }