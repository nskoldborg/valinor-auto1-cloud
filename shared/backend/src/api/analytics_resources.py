from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from backend.scr.models.models_analytics import DataSource
from backend.scr.models.models_users import User
from backend.scr.models.schemas.analytics import DataSourceCreate, DataSourceUpdate, DataSourceOut
from backend.scr.services import auth_service


router = APIRouter(prefix="/analytics/resources", tags=["Analytics Resources"])


# ============================================================
# 🧱 Helpers
# ============================================================

def _serialize_resource(resource: DataSource, db: Session):
    """Convert SQLAlchemy object into serializable dict with decrypted password hidden."""
    creator = db.query(User).filter(User.id == resource.created_by_id).first()

    return {
        "id": resource.id,
        "name": resource.name,
        "description": resource.description,
        "type": resource.type,
        "host": resource.host,
        "port": resource.port,
        "database": resource.database,
        "username": resource.username,
        "enabled": resource.enabled,
        "created_at": resource.created_at.strftime("%Y-%m-%d %H:%M:%S") if resource.created_at else None,
        "updated_at": resource.updated_at.strftime("%Y-%m-%d %H:%M:%S") if resource.updated_at else None,
        "created_by": f"{creator.first_name} {creator.last_name}" if creator else None,
        "password_set": bool(resource.password_encrypted),
    }


# ============================================================
# 📄 GET: List All Resources
# ============================================================

@router.get("/", response_model=List[DataSourceOut])
def list_resources(
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """List all available data sources."""
    auth_service.require_role(current_user, ["route:analytics#resources"])
    resources = db.query(DataSource).order_by(DataSource.created_at.desc()).all()
    return [_serialize_resource(r, db) for r in resources]


# ============================================================
# 📄 GET: Single Resource (with decrypted password if admin)
# ============================================================

@router.get("/{resource_id}", response_model=DataSourceOut)
def get_resource(
    resource_id: int,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """Fetch a single resource by ID."""
    resource = db.query(DataSource).filter(DataSource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    data = _serialize_resource(resource, db)

    # If user has admin role, return decrypted password
    roles = auth_service.get_user_roles(current_user)
    if "admin" in roles or "route:analytics#datasources#view-password" in roles:
        try:
            data["password"] = auth_service.decrypt_value(resource.password_encrypted)
        except Exception:
            data["password"] = None

    return data


# ============================================================
# 🧩 POST: Create Resource
# ============================================================

@router.post("/create", response_model=DataSourceOut)
def create_resource(
    data: DataSourceCreate,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """Create a new database resource."""
    auth_service.require_role(current_user, ["route:analytics#resources#create"])

    existing = db.query(DataSource).filter(DataSource.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="A resource with that name already exists.")

    new = DataSource(
        name=data.name,
        description=data.description,
        type=data.type,
        host=data.host,
        port=data.port,
        database=data.database,
        username=data.username,
        password_encrypted=auth_service.encrypt_value(data.password) if data.password else None,
        enabled=data.enabled,
        created_at=datetime.utcnow(),
        created_by_id=current_user.id,
    )

    db.add(new)
    db.commit()
    db.refresh(new)

    return _serialize_resource(new, db)


# ============================================================
# ✏️ PUT: Update Resource
# ============================================================

@router.put("/{resource_id}/edit", response_model=DataSourceOut)
def update_resource(
    resource_id: int,
    data: DataSourceUpdate,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """Edit an existing resource."""
    auth_service.require_role(current_user, ["route:analytics#resources#edit"])

    resource = db.query(DataSource).filter(DataSource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    for key, value in data.dict(exclude_unset=True).items():
        if key == "password" and value:
            setattr(resource, "password_encrypted", auth_service.encrypt_value(value))
        elif hasattr(resource, key):
            setattr(resource, key, value)

    resource.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(resource)

    return _serialize_resource(resource, db)


# ============================================================
# ❌ DELETE: Remove Resource
# ============================================================

@router.delete("/{resource_id}")
def delete_resource(
    resource_id: int,
    db: Session = Depends(auth_service.get_db),
    current_user=Depends(auth_service.get_current_user),
):
    """Delete a resource."""
    auth_service.require_role(current_user, ["route:analytics#resources#delete"])

    resource = db.query(DataSource).filter(DataSource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    db.delete(resource)
    db.commit()

    return {"ok": True, "message": f"Data source '{resource.name}' deleted."}