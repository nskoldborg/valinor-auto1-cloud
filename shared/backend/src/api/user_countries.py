from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, aliased
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List

from backend.server.model.models_users import User, UserCountry
from backend.server.utils import auth_utils
from backend.server.utils.change_logger import log_scalar_change

router = APIRouter(prefix="/countries", tags=["countries"])


# ============================================================
# 📦 Schemas
# ============================================================

class CountryBase(BaseModel):
    name: str
    code: str
    enabled: bool = True


class CountryOut(CountryBase):
    id: int
    created_at: Optional[str] = None
    created_by: Optional[str] = None
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================
# 🔧 Helpers
# ============================================================

def _require_role(user: User, allowed: List[str]):
    """Ensure the user has at least one of the allowed roles, or is admin."""
    roles = auth_utils.get_user_roles(user)
    if "admin" in roles:
        return
    if not any(role in roles for role in allowed):
        raise HTTPException(status_code=403, detail="Not authorized")


# ============================================================
# 🧭 Routes
# ============================================================

@router.get("/", response_model=List[CountryOut])
def list_countries(
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """List all countries."""

    creator = aliased(User)
    updater = aliased(User)

    countries = (
        db.query(UserCountry, creator, updater)
        .outerjoin(creator, UserCountry.created_by == creator.id)
        .outerjoin(updater, UserCountry.updated_by == updater.id)
        .all()
    )

    result = []
    for c, creator_obj, updater_obj in countries:
        result.append({
            "id": c.id,
            "name": c.name,
            "code": c.code,
            "enabled": c.enabled,
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S") if c.created_at else None,
            "created_by": (
                f"{creator_obj.first_name} {creator_obj.last_name}".strip()
                if creator_obj else None
            ),
            "updated_at": c.updated_at.strftime("%Y-%m-%d %H:%M:%S") if c.updated_at else None,
            "updated_by": (
                f"{updater_obj.first_name} {updater_obj.last_name}".strip()
                if updater_obj else None
            ),
        })
    return result


@router.post("/create", response_model=CountryOut)
def create_country(
    country: CountryBase,
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Create a new country."""
    _require_role(current_user, ["route:countries#create"])

    existing = db.query(UserCountry).filter(
        (UserCountry.code == country.code.upper()) |
        (UserCountry.name.ilike(country.name))
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Country already exists")

    new_country = UserCountry(
        code=country.code.upper(),
        name=country.name.strip(),
        enabled=country.enabled,
        created_at=datetime.utcnow(),
        created_by=current_user.id,
    )
    db.add(new_country)
    db.commit()
    db.refresh(new_country)

    # ✅ Log creation
    log_scalar_change(
        db=db,
        actor=current_user,
        object_type="UserCountry",
        object_id=new_country.id,
        field="Name",
        old_value=None,
        new_value=f"{new_country.name} ({new_country.code})",
        action="create",
        comment=f"Country '{new_country.name}' created",
    )

    return {
        "id": new_country.id,
        "name": new_country.name,
        "code": new_country.code,
        "enabled": new_country.enabled,
        "created_at": new_country.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "created_by": f"{current_user.first_name} {current_user.last_name}",
        "updated_at": None,
        "updated_by": None,
    }


@router.put("/{country_id}/edit", response_model=CountryOut)
def update_country(
    country_id: int,
    country_update: CountryBase,
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Update an existing country."""
    _require_role(current_user, ["route:countries#edit"])

    db_country = db.query(UserCountry).filter(UserCountry.id == country_id).first()
    if not db_country:
        raise HTTPException(status_code=404, detail="Country not found")

    # Track changes
    old_values = {
        "name": db_country.name,
        "code": db_country.code,
        "enabled": db_country.enabled,
    }

    if country_update.name and country_update.name != db_country.name:
        log_scalar_change(
            db=db,
            actor=current_user,
            object_type="UserCountry",
            object_id=country_id,
            field="Name",
            old_value=db_country.name,
            new_value=country_update.name,
            action="update",
            comment=None,
        )
        db_country.name = country_update.name

    new_code = country_update.code.upper()
    if new_code != db_country.code:
        log_scalar_change(
            db=db,
            actor=current_user,
            object_type="UserCountry",
            object_id=country_id,
            field="Code",
            old_value=db_country.code,
            new_value=new_code,
            action="update",
            comment=None,
        )
        db_country.code = new_code

    if country_update.enabled != db_country.enabled:
        log_scalar_change(
            db=db,
            actor=current_user,
            object_type="UserCountry",
            object_id=country_id,
            field="Enabled",
            old_value=str(db_country.enabled),
            new_value=str(country_update.enabled),
            action="update",
            comment=None,
        )
        db_country.enabled = country_update.enabled

    db_country.updated_at = datetime.utcnow()
    db_country.updated_by = current_user.id

    db.commit()
    db.refresh(db_country)

    creator = db.query(User).filter(User.id == db_country.created_by).first()
    updater = db.query(User).filter(User.id == db_country.updated_by).first()

    return {
        "id": db_country.id,
        "name": db_country.name,
        "code": db_country.code,
        "enabled": db_country.enabled,
        "created_at": db_country.created_at.strftime("%Y-%m-%d %H:%M:%S") if db_country.created_at else None,
        "created_by": f"{creator.first_name} {creator.last_name}" if creator else None,
        "updated_at": db_country.updated_at.strftime("%Y-%m-%d %H:%M:%S") if db_country.updated_at else None,
        "updated_by": f"{updater.first_name} {updater.last_name}" if updater else None,
    }


@router.delete("/{country_id}")
def delete_country(
    country_id: int,
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Delete a country."""
    _require_role(current_user, ["route:admin-actions#delete-countries"])

    db_country = db.query(UserCountry).filter(UserCountry.id == country_id).first()
    if not db_country:
        raise HTTPException(status_code=404, detail="Country not found")

    name = db_country.name
    code = db_country.code

    db.delete(db_country)
    db.commit()

    # ✅ Log deletion
    log_scalar_change(
        db=db,
        actor=current_user,
        object_type="UserCountry",
        object_id=country_id,
        field="Name",
        old_value=f"{name} ({code})",
        new_value=None,
        action="delete",
        comment=None,
    )

    return {"ok": True, "message": f"Country '{name}' deleted successfully"}