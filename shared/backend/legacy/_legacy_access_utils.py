from fastapi import Depends, HTTPException, status, Request
from server.utils import auth_utils
from sqlalchemy.orm import Session
from backend.extra.__legacy_models import _legacy_models


def require_access(
    roles: list[str] = None,
    tenant_check: bool = False,
):
    """
    Dependency for role & tenant-based access control.

    Args:
        roles (list[str], optional): List of allowed role names.
        tenant_check (bool, optional): Require tenant membership check.

    Usage:
        @router.get("/secure-data")
        def secure_data(current_user=Depends(require_access(roles=["admin"]))):
            return {"data": "secret"}
    """

    def dependency(
        db: Session = Depends(auth_utils.get_db),
        current_user=Depends(auth_utils.get_current_user),
        request: Request = None,
    ):
        # Normalize role names
        role_names = [r.name.lower() for r in current_user.roles]

        # Role check
        if roles and not any(r.lower() in role_names for r in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role privileges",
            )

        # Tenant check (basic placeholder)
        if tenant_check:
            # Example: Require at least one tenant assigned
            if not current_user.tenants or len(current_user.tenants) == 0:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tenant access assigned",
                )

            # Optional: Check if resource belongs to an allowed tenant
            # e.g. by parsing tenant_id from path/query
            # tenant_id = request.path_params.get("tenant_id")
            # if tenant_id and int(tenant_id) not in [t.id for t in current_user.tenants]:
            #     raise HTTPException(status_code=403, detail="Tenant access denied")

        return current_user

    return dependency