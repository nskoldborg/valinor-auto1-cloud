from datetime import datetime
from sqlalchemy.orm import Session
from backend.scr.models.models_users import User, UserGroup, UserPosition
from backend.scr.services.auth_service import get_db
from backend.scr.models.models_changelog import ChangeLog

def log_matrix_change(db: Session, user_id: int, old_group_names: list[str], new_group_names: list[str]):
    """Store a changelog record for auditing."""
    diff_removed = [g for g in old_group_names if g not in new_group_names]
    diff_added = [g for g in new_group_names if g not in old_group_names]

    if diff_added or diff_removed:
        entry = ChangeLog(
            object_id=user_id,
            object_type="User",
            action="matrix_sync",
            field="user_groups",
            old_value=f"Removed: {', '.join(diff_removed)}" if diff_removed else None,
            new_value=f"Added: {', '.join(diff_added)}" if diff_added else None,
            comment="User groups auto-synced from position matrix",
            created_by='System',  # system task
            created_at=datetime.utcnow(),
        )
        db.add(entry)
        db.commit()

def sync_position_matrix(db: Session):
    """Synchronize user group memberships based on position matrix rules."""
    users = db.query(User).all()
    for user in users:
        # gather all groups assigned via positions
        position_groups = set()
        for pos in user.user_positions or []:
            for g in pos.groups or []:
                position_groups.add(g)

        # retain only manually assigned groups excluded from matrix
        retained_groups = [g for g in user.user_groups if g.exclude_from_matrix]

        # final computed set
        new_groups = list(position_groups.union(retained_groups))

        # compare & apply changes
        old_group_names = [g.name for g in user.user_groups]
        new_group_names = [g.name for g in new_groups]

        if set(old_group_names) != set(new_group_names):
            user.user_groups = new_groups
            db.commit()
            log_matrix_change(db, user.id, old_group_names, new_group_names)
            print(f"✅ Updated user {user.email}: {old_group_names} → {new_group_names}")

def run():
    db = next(get_db())
    print("🔁 Starting position matrix sync...")
    sync_position_matrix(db)
    print("✅ Matrix sync completed.")

if __name__ == "__main__":
    run()