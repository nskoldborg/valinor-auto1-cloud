from datetime import datetime
from typing import Iterable, Optional

from sqlalchemy.orm import Session
from backend.scr.models.models_changelog import ChangeLog
from backend.scr.models.models_users import User


# ============================================================
# 🔧 Helpers
# ============================================================

def _to_display_string(values: Optional[Iterable[str]]) -> str:
    """Render iterable values into a comma-separated string or ∅."""
    if not values:
        return "∅"
    return ", ".join(sorted(str(v) for v in values))


def _resolve_actor(actor: Optional[User], system_actor: bool = False) -> dict:
    """
    Determine actor_id and display name.
    Returns dict with 'id' and 'name' keys for consistent use.
    """
    if system_actor or not actor:
        return {"id": None, "name": "SYSTEM"}
    return {"id": actor.id, "name": f"{actor.first_name} {actor.last_name}".strip()}


# ============================================================
# 🪵 Scalar Field Logging
# ============================================================

def log_scalar_change(
    db: Session,
    *,
    actor: Optional[User],
    object_type: str,
    object_id: int,
    field: str,
    old_value: str | None,
    new_value: str | None,
    action: str = "update",
    comment: str | None = None,
    system_actor: bool = False,
) -> ChangeLog:
    """
    Log a simple (non-list) field change.
    Supports both human and SYSTEM actors.
    """
    actor_info = _resolve_actor(actor, system_actor)
    log = ChangeLog(
        created_on=datetime.utcnow(),
        created_by=actor_info["id"],
        object_type=object_type,
        object_id=object_id,
        field=field,
        action=action,
        old_value=old_value or "∅",
        new_value=new_value or "∅",
        comment=comment,
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    # Optional: local debug log
    print(f"🧾 [{actor_info['name']}] logged {object_type} change: {field} ({old_value} → {new_value})")

    return log


# ============================================================
# 🧩 List Field Logging (Added/Removed Items)
# ============================================================

def log_list_field_changes(
    db: Session,
    *,
    actor: Optional[User],
    object_type: str,
    object_id: int,
    field: str,
    old_value: Iterable[str] | None,
    new_value: Iterable[str] | None,
    comment: str | None = None,
    system_actor: bool = False,
):
    """
    Create one ChangeLog entry per added / removed list item.
    Supports both human and SYSTEM actors.
    """
    actor_info = _resolve_actor(actor, system_actor)
    old_set = set(old_value or [])
    new_set = set(new_value or [])

    added = new_set - old_set
    removed = old_set - new_set

    all_old_str = _to_display_string(old_set)
    all_new_str = _to_display_string(new_set)

    logs: list[ChangeLog] = []

    # --- Added items ---
    for item in sorted(added):
        logs.append(
            ChangeLog(
                created_on=datetime.utcnow(),
                created_by=actor_info["id"],
                object_type=object_type,
                object_id=object_id,
                field=field,
                action=f'Added item "{item}"',
                old_value=all_old_str,
                new_value=all_new_str,
                comment=comment,
            )
        )

    # --- Removed items ---
    for item in sorted(removed):
        logs.append(
            ChangeLog(
                created_on=datetime.utcnow(),
                created_by=actor_info["id"],
                object_type=object_type,
                object_id=object_id,
                field=field,
                action=f'Removed item "{item}"',
                old_value=all_old_str,
                new_value=all_new_str,
                comment=comment,
            )
        )

    if logs:
        db.add_all(logs)
        db.commit()

        print(
            f"🧾 [{actor_info['name']}] logged {len(logs)} {object_type} list change(s): "
            f"{', '.join([l.action for l in logs])}"
        )

    return logs