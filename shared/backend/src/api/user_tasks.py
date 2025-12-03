from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import case
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from backend.scr.models.models_users import User
from backend.scr.models.models_tasks import UserTask, TaskSource
from backend.scr.services import auth_service
from backend.scr.services.changelog_service import log_scalar_change

router = APIRouter(prefix="/tasks", tags=["tasks"])

# ============================================================
# Schemas
# ============================================================

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "normal"
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    assigned_to: Optional[int] = None
    reference_id: Optional[str] = None


class TaskOut(TaskBase):
    id: int
    completed: bool
    source: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============================================================
# Helpers
# ============================================================

def _require_role(user: User, allowed: List[str]):
    """Ensure user has at least one allowed role or admin."""
    roles = auth_service.get_user_roles(user)
    if "admin" in roles:
        return
    if not any(r in roles for r in allowed):
        raise HTTPException(status_code=403, detail="Not authorized")


# ============================================================
# Routes
# ============================================================

@router.get("/", response_model=List[TaskOut])
def list_tasks(
    include_team: bool = False,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """List tasks for current user or team."""
    _require_role(current_user, ["route:tasks#view"])

    query = db.query(UserTask)
    if not include_team:
        query = query.filter(UserTask.assigned_to == current_user.id)

    tasks = query.order_by(UserTask.end_at.asc()).all()

    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "priority": t.priority,
            "start_at": t.start_at,
            "end_at": t.end_at,
            "assigned_to": t.assigned_to,
            "reference_id": t.reference_id,
            "completed": t.completed,
            "source": t.source,
            "created_at": t.created_at,
        }
        for t in tasks
    ]


# ============================================================
# 🧭 Create (Manual)
# ============================================================

@router.post("/", response_model=TaskOut)
def create_task(
    task: TaskBase,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """Manually create a task (logged)."""
    _require_role(current_user, ["route:tasks#create"])

    new_task = UserTask(
        title=task.title,
        description=task.description,
        priority=task.priority,
        start_at=task.start_at,
        end_at=task.end_at,
        assigned_to=task.assigned_to or current_user.id,
        created_by=current_user.id,
        source=TaskSource.MANUAL,
        reference_id=task.reference_id,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    # ✅ Log creation
    log_scalar_change(
        db=db,
        actor=current_user,
        object_type="Task",
        object_id=new_task.id,
        field="Task",
        old_value=None,
        new_value=new_task.title,
        action="create",
        comment=None,
    )

    return new_task


# ============================================================
# 🧭 Create (System)
# ============================================================

@router.post("/system-create", response_model=TaskOut)
def create_system_task(
    title: str,
    description: str,
    assigned_to: int,
    source: TaskSource,
    reference_id: Optional[str] = None,
    db: Session = Depends(auth_service.get_db),
):
    """Create system-generated task (actor = SYSTEM)."""
    new_task = UserTask(
        title=title,
        description=description,
        priority="high" if source != TaskSource.MANUAL else "normal",
        assigned_to=assigned_to,
        created_by=None,  # no user link
        source=source,
        reference_id=reference_id,
        start_at=datetime.utcnow(),
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    # ✅ Log as SYSTEM
    log_scalar_change(
        db=db,
        actor=None,  # SYSTEM marker
        object_type="Task",
        object_id=new_task.id,
        field="Task",
        old_value=None,
        new_value=title,
        action="create",
        comment=f"SYSTEM created task '{title}' for user {assigned_to}",
        system_actor=True,  # Custom flag handled in logger to show “SYSTEM”
    )

    return new_task


# ============================================================
# 🧭 Complete
# ============================================================

@router.put("/{task_id}/complete", response_model=TaskOut)
def complete_task(
    task_id: int,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """Mark a task as completed (logs change)."""
    task = db.query(UserTask).filter(UserTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.assigned_to != current_user.id and "admin" not in auth_service.get_user_roles(current_user):
        raise HTTPException(status_code=403, detail="Not allowed")

    task.completed = True
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)

    log_scalar_change(
        db=db,
        actor=current_user,
        object_type="Task",
        object_id=task.id,
        field="Completed",
        old_value="False",
        new_value="True",
        action="update",
        comment=None,
    )

    return task


# ============================================================
# 🧭 Next Task (auto-assign)
# ============================================================

@router.get("/next", response_model=TaskOut)
def get_next_task(
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """
    Return next prioritized task for current user.
    Priority: end_at ASC → High → Medium → Low.
    """
    _require_role(current_user, ["route:tasks#gnt"])

    priority_order = case(
        (UserTask.priority.ilike("high"), 1),
        (UserTask.priority.ilike("medium"), 2),
        (UserTask.priority.ilike("low"), 3),
        else_=4,
    )

    # Step 1: own open tasks
    my_task = (
        db.query(UserTask)
        .filter(UserTask.assigned_to == current_user.id, UserTask.completed == False)
        .order_by(UserTask.end_at.asc(), priority_order.asc())
        .first()
    )

    if my_task:
        return my_task

    # Step 2: open team tasks
    open_task = (
        db.query(UserTask)
        .filter(
            (UserTask.assigned_to == None) | (UserTask.assigned_to != current_user.id),
            UserTask.completed == False,
        )
        .order_by(UserTask.end_at.asc(), priority_order.asc())
        .first()
    )

    if not open_task:
        raise HTTPException(status_code=404, detail="No available tasks found")

    open_task.assigned_to = current_user.id
    db.commit()
    db.refresh(open_task)

    # ✅ Log automatic assignment
    log_scalar_change(
        db=db,
        actor=None,                # no human actor
        object_type="Task",
        object_id=open_task.id,
        field="Assigned To",
        old_value="Unassigned",
        new_value=f"User {current_user.id}",
        action="update",
        comment=f"SYSTEM auto-assigned next task '{open_task.title}' to {current_user.first_name} {current_user.last_name}",
        system_actor=True,          # mark as SYSTEM in logger
    )

    return open_task


# ============================================================
# 🧭 Accept Task
# ============================================================

@router.put("/{task_id}/accept", response_model=TaskOut)
def accept_task(
    task_id: int,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """Accept task (reaffirm ownership)."""
    task = db.query(UserTask).filter(UserTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.assigned_to is None or task.assigned_to != current_user.id:
        prev = task.assigned_to
        task.assigned_to = current_user.id
        task.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(task)

        log_scalar_change(
            db=db,
            actor=current_user,
            object_type="Task",
            object_id=task.id,
            field="Assigned To",
            old_value=f"User {prev}" if prev else "Unassigned",
            new_value=f"User {current_user.id}",
            action="update",
            comment=None,
        )

    return task


# ============================================================
# 🧭 Skip Task
# ============================================================

@router.put("/{task_id}/skip", response_model=dict)
def skip_task(
    task_id: int,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """Skip task (unassign for others to take)."""
    task = db.query(UserTask).filter(UserTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.assigned_to != current_user.id and "admin" not in auth_service.get_user_roles(current_user):
        raise HTTPException(status_code=403, detail="Not allowed")

    prev_user = task.assigned_to
    task.assigned_to = None
    task.updated_at = datetime.utcnow()
    db.commit()

    log_scalar_change(
        db=db,
        actor=current_user,
        object_type="Task",
        object_id=task.id,
        field="Assigned To",
        old_value=f"User {prev_user}" if prev_user else "None",
        new_value="Unassigned",
        action="update",
        comment=f"{current_user.first_name} {current_user.last_name} skipped task '{task.title}'",
    )

    return {"message": "Task skipped successfully"}