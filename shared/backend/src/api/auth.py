from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime

from backend.server.model.models_users import User
from backend.server.utils import auth_utils
from backend.server.utils.change_logger import log_scalar_change

router = APIRouter(prefix="/auth", tags=["auth"])


# ============================================================
# 🔐 User Login Endpoint (with SYSTEM changelog)
# ============================================================

@router.post("/login")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(auth_utils.get_db),
):
    """Authenticate a user and return a JWT access token."""
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not auth_utils.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # --- Create token ---
    token = auth_utils.create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # --- Metadata ---
    ip_address = request.client.host if request.client else "unknown"
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    # --- Track login timestamp ---
    old_login_time = (
        user.last_login_datetime.strftime("%Y-%m-%d %H:%M:%S")
        if user.last_login_datetime
        else "Never logged in"
    )

    user.last_login_datetime = datetime.utcnow()
    db.commit()
    db.refresh(user)

    # --- Log login as SYSTEM actor ---
    try:
        log_scalar_change(
            db=db,
            actor=None,  # None → logged as SYSTEM
            object_type="User",
            object_id=user.id,
            field="Last Login",
            old_value=old_login_time,
            new_value=user.last_login_datetime.strftime("%Y-%m-%d %H:%M:%S"),
            action="system",
            comment=(
                f"User '{user.first_name} {user.last_name}' "
                f"logged in at {timestamp} from {ip_address}"
            ),
        )
    except Exception as e:
        print(f"⚠️ Failed to log login event: {e}")

    # --- Return JWT payload ---
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "roles": [r.name for r in user.user_roles],
        "last_login_datetime": user.last_login_datetime.strftime("%Y-%m-%d %H:%M:%S"),
    }


@router.post("/impersonate/{target_user_id}")
def impersonate_user(
    target_user_id: int,
    request: Request,
    db: Session = Depends(auth_utils.get_db),
    current_user: User = Depends(auth_utils.get_current_user),
):
    """
    Issue an impersonation token so an admin can 'assume identity' of another user.
    The returned JWT uses:
      - sub = target_user_id (effective user)
      - impersonated = true
      - impersonated_by = current admin's id
    """
    # 1) Only allow certain roles (e.g. admin) to impersonate
    auth_utils.require_role(current_user, ["admin"])  # adjust if you have super_admin etc.

    # 2) Load target user
    target_user = db.query(User).filter(User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    # Optional: Disallow impersonating other admins / self if you want stricter rules
    # flattened_roles = auth_utils.get_user_roles(target_user)
    # if "admin" in flattened_roles:
    #     raise HTTPException(status_code=403, detail="Cannot impersonate another admin")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You are already this user")

    # 3) Create impersonation token
    token = auth_utils.create_access_token(
        data={
            "sub": str(target_user.id),
            "impersonated": True,
            "impersonated_by": current_user.id,
        },
        expires_delta=timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    # 4) Log impersonation as SYSTEM (or as admin – up to you)
    ip_address = request.client.host if request.client else "unknown"
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    try:
        log_scalar_change(
            db=db,
            actor=current_user,  # real actor is the admin
            object_type="User",
            object_id=target_user.id,
            field="Impersonation",
            old_value=None,
            new_value=f"Impersonated by {current_user.email}",
            action="impersonate",
            comment=(
                f"User '{current_user.first_name} {current_user.last_name}' "
                f"started impersonating '{target_user.first_name} {target_user.last_name}' "
                f"at {timestamp} from {ip_address}"
            ),
        )
    except Exception as e:
        print(f"⚠️ Failed to log impersonation event: {e}")

    # 5) Return token + some context for the frontend
    return {
        "access_token": token,
        "token_type": "bearer",
        "impersonated": True,
        "impersonated_by": {
            "id": current_user.id,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "email": current_user.email,
        },
        "acting_as": {
            "id": target_user.id,
            "first_name": target_user.first_name,
            "last_name": target_user.last_name,
            "email": target_user.email,
            "roles": [r.name for r in target_user.user_roles],
        },
    }


@router.post("/impersonation/stop")
def stop_impersonation(
    db: Session = Depends(auth_utils.get_db),
    ctx: auth_utils.AuthContext = Depends(auth_utils.get_auth_context),
):
    if not ctx.is_impersonating or not ctx.original_user:
        raise HTTPException(status_code=400, detail="Not currently impersonating")

    # Issue a fresh token for the original user (admin)
    token = auth_utils.create_access_token(
        data={"sub": str(ctx.original_user.id)},
        expires_delta=timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "impersonated": False,
    }