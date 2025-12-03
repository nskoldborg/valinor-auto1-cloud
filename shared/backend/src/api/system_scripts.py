# backend/server/routers/system_scripts.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
import subprocess
from pathlib import Path

from backend.scr.services.auth_service import get_current_user

router = APIRouter(
    prefix="/system/scripts",
    tags=["System Scripts"],
)


@router.post("/run")
async def run_script(script_name: str, current_user = Depends(get_current_user)):
    """Run a Node.js script from frontend/script/ and return full output & errors."""

    # Build paths
    scripts_dir = (
        Path(__file__)
        .resolve()
        .parent.parent.parent.parent  # root/
        / "frontend"
        / "scripts"
    )

    script_path = scripts_dir / script_name

    print("🔎 Looking for script at:", script_path)

    if not script_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Script not found: {script_path}"
        )

    # Check if Node exists
    try:
        node_check = subprocess.run(["node", "-v"], capture_output=True, text=True)
        print("ℹ️ Node version:", node_check.stdout or node_check.stderr)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Node is not available: {e}")

    # --- Run the script ---
    try:
        result = subprocess.run(
            ["node", str(script_path)],
            capture_output=True,
            text=True,
            cwd=scripts_dir,  # Run inside the script folder
            timeout=60
        )

        output = result.stdout.strip()
        errors = result.stderr.strip()

        print("📤 SCRIPT STDOUT:", output)
        print("⚠️ SCRIPT STDERR:", errors)

        return {
            "success": result.returncode == 0,
            "return_code": result.returncode,
            "stdout": output,
            "stderr": errors,
            "script_path": str(script_path),
            "cwd": str(scripts_dir),
        }

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Script execution timed out")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution error: {e}")