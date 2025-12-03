from datetime import datetime
from sqlalchemy.orm import Session
from backend.server.model.models_tasks import UserTask, TaskSource
from backend.server.model.models_users import User
from backend.server.utils import auth_utils  # ✅ correct import

def generate_onboarding_offboarding_tasks():
    """
    (Future) Generate tasks based on employee_onboarding / employee_offboarding tables.
    For now: placeholder that logs a message.
    """
    # ✅ Get a DB session the same way your app does
    db_gen = auth_utils.get_db()
    db: Session = next(db_gen)

    try:
        print(f"[{datetime.utcnow()}] Running position matrix task sync...")

        # TODO:
        # 1️⃣ Query employee_onboarding and employee_offboarding tables.
        # 2️⃣ For each record with a start/exit date due today, create/update tasks.
        # 3️⃣ Skip excluded users (exclude_from_gnt = True).
        # 4️⃣ Assign to responsible manager or team.
        # 5️⃣ Create via /tasks/system-create equivalent.

        # Example stub for now:
        example_task = UserTask(
            title="Auto-Generated Placeholder Task",
            description="This task was created by the hourly matrix sync job.",
            priority="medium",
            assigned_to=1,  # TODO: dynamically resolve responsible user
            created_by=1,   # system user
            source=TaskSource.ONBOARDING,
            start_at=datetime.utcnow(),
        )
        db.add(example_task)
        db.commit()

        print("✅ Task sync executed successfully.")
    except Exception as e:
        db.rollback()
        print(f"❌ Matrix sync failed: {e}")
    finally:
        db.close()