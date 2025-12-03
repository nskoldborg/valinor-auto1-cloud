from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, constr
from typing import Optional
import httpx
import os

from backend.server.utils import auth_utils

router = APIRouter(prefix="/support", tags=["Support"])

# ─────────────────────────────────────────────
# Environment Config
# ─────────────────────────────────────────────
FRESHSERVICE_API_KEY = "ANYpDLpKyZzXKa6W0DJj"
FRESHSERVICE_DOMAIN = "auto1group.freshservice.com"

if not FRESHSERVICE_API_KEY:
    print("⚠️ WARNING: Missing FRESHSERVICE_API_KEY environment variable")

# ─────────────────────────────────────────────
# Request Schema
# ─────────────────────────────────────────────
class SupportTicketCreate(BaseModel):
    name: constr(strip_whitespace=True, min_length=2)
    email: EmailStr
    subject: constr(strip_whitespace=True, min_length=3)
    description: constr(strip_whitespace=True, min_length=5)
    category: Optional[str] = "other"

# ─────────────────────────────────────────────
# POST /support/create-ticket
# ─────────────────────────────────────────────
@router.post("/create-ticket")
async def create_support_ticket(
    payload: SupportTicketCreate,
    request: Request,
    current_user=Depends(auth_utils.get_current_user),

):
    """
    Creates a new support ticket in Freshservice via backend.
    """

    # Validate Freshservice credentials
    if not FRESHSERVICE_API_KEY or not FRESHSERVICE_DOMAIN:
        raise HTTPException(
            status_code=500, detail="Freshservice integration not configured"
        )

    # Build Freshservice ticket payload
    data = {
        "email": payload.email,
        "subject": payload.subject,
        "description": (
            f"<b>Requester:</b> {payload.name}<br/>"
            f"<b>Category:</b> {payload.category}<br/><br/>{payload.description}"
        ),
        "priority": 2,  # Normal
        "status": 2,    # Open
        "source": 2,    # Portal
    }

    # Optional: category → Freshservice group mapping
    category_mapping = {
        "it_support": 101000001,
        "hr": 101000002,
        "facilities": 101000003,
        "software": 101000004,
    }
    if payload.category in category_mapping:
        data["group_id"] = category_mapping[payload.category]

    # Send request to Freshservice
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(
                f"https://{FRESHSERVICE_DOMAIN}/api/v2/tickets",
                json=data,
                auth=(FRESHSERVICE_API_KEY, "X"),  # Basic auth
                headers={"Content-Type": "application/json"},
            )

        if res.status_code not in (200, 201):
            raise HTTPException(
                status_code=res.status_code,
                detail=f"Freshservice error: {res.text}",
            )

    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Connection error: {e}")

    return {"success": True, "message": "Ticket successfully created in Freshservice."}