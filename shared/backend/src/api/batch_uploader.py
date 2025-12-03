from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import io
import time
from datetime import datetime

from backend.server.utils import auth_utils
from backend.server.model.models_batch_uploader import EmployeeBase, BatchUploadLog

router = APIRouter(prefix="/batch-upload", tags=["batch-uploader"])


# ============================================================
# Helper: normalize Yes/No → bool + parse dates
# ============================================================
def normalize_value(key, value):
    if value in [None, ""]:
        return None

    if key == "employee_active":
        if isinstance(value, str):
            val = value.strip().lower()
            if val in ["yes", "true", "1", "y"]:
                return True
            elif val in ["no", "false", "0", "n"]:
                return False
        if isinstance(value, bool):
            return value
        return None

    if "date" in key and isinstance(value, str):
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
            try:
                return datetime.strptime(value, fmt).date()
            except Exception:
                continue
        return None

    return value

def validate_dataframe(df, required_columns):
    """Check column presence and data consistency before upload."""
    missing_cols = [c for c in required_columns if c not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(missing_cols)}",
        )

    invalid_bools = []
    invalid_dates = []

    for idx, row in df.iterrows():
        for col, val in row.items():
            if col == "employee_active" and isinstance(val, str) and val.lower() not in ["yes", "no", "true", "false", "1", "0", "y", "n", ""]:
                invalid_bools.append((idx + 1, val))
            if "date" in col and isinstance(val, str):
                try:
                    normalize_value(col, val)
                except Exception:
                    invalid_dates.append((idx + 1, val))

    issues = []
    if invalid_bools:
        issues.append(f"{len(invalid_bools)} invalid boolean values found in 'employee_active'.")
    if invalid_dates:
        issues.append(f"{len(invalid_dates)} invalid date values found.")

    return issues


# ============================================================
# Workday Uploader
# ============================================================
@router.post("/workday")
def upload_workday_file(
    file: UploadFile = File(...),
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Upload and upsert Workday employee data, with detailed logging."""
    auth_utils.require_role(current_user, ["route:batch-uploader#workday-uploader"])

    uploader_name = "workday"
    file_name = file.filename or "unknown"
    inserted_count, updated_count = 0, 0
    start_time = time.time()

    try:
        # Read and validate file
        content = file.file.read().decode("utf-8")
        df = pd.read_csv(io.StringIO(content))
        df = df.where(pd.notnull(df), None)

        required_columns = [
            "country", "work_location", "full_name", "work_email",
            "department", "sub_department", "sub_team", "management_level",
            "business_title", "tech_position", "direct_supervisor",
            "cost_center", "start_date", "probation_start_date",
            "probation_end_date", "onboarding_status", "contract_end_date",
            "exit_date", "offboarding_status", "employee_active",
            "hiring_company", "workday_id", "termination_type", "employee_type"
        ]

        missing = [c for c in required_columns if c not in df.columns]
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing columns: {missing}")

        records = [
            {k: normalize_value(k, v) for k, v in row.items()}
            for row in df.to_dict(orient="records")
        ]

        # Process upserts
        for record in records:
            existing = db.query(EmployeeBase).filter_by(workday_id=record["workday_id"]).first()
            if existing:
                for k, v in record.items():
                    setattr(existing, k, v)
                existing.updated_at = datetime.utcnow()
                updated_count += 1
            else:
                new_row = EmployeeBase(**record)
                new_row.created_at = datetime.utcnow()
                db.add(new_row)
                inserted_count += 1

        db.commit()

        # Compute metrics
        duration_seconds = round(time.time() - start_time, 2)
        row_count = len(records)

        # ✅ Log success
        log_entry = BatchUploadLog(
            uploader_name=uploader_name,
            uploaded_by=current_user.id,
            file_name=file_name,
            inserted_count=inserted_count,
            updated_count=updated_count,
            row_count=row_count,
            duration_seconds=duration_seconds,
            status="success",
            message=f"Upload successful ({inserted_count} inserted, {updated_count} updated)",
            created_at=datetime.utcnow(),
        )
        db.add(log_entry)
        db.commit()

        return {
            "inserted": inserted_count,
            "updated": updated_count,
            "rows": row_count,
            "duration_seconds": duration_seconds,
            "message": "Upload successful",
        }

    except Exception as e:
        db.rollback()
        duration_seconds = round(time.time() - start_time, 2)
        error_msg = str(e)
        print("❌ Upload failed:", error_msg)

        # ✅ Log failure
        try:
            row_count = len(df) if "df" in locals() else 0
            log_entry = BatchUploadLog(
                uploader_name=uploader_name,
                uploaded_by=current_user.id,
                file_name=file_name,
                inserted_count=inserted_count,
                updated_count=updated_count,
                row_count=row_count,
                duration_seconds=duration_seconds,
                status="failed",
                message=error_msg[:2000],
                created_at=datetime.utcnow(),
            )
            db.add(log_entry)
            db.commit()
        except Exception as log_err:
            print("⚠️ Failed to record upload log:", log_err)

        raise HTTPException(status_code=500, detail="Upload failed: " + error_msg)


# ============================================================
# Validate Workday File (Dry Run)
# ============================================================

@router.post("/workday/validate")
def validate_workday_file(
    file: UploadFile = File(...),
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Dry-run validation — checks file without committing anything."""
    auth_utils.require_role(current_user, ["route:batch-uploader#workday-uploader"])

    try:
        content = file.file.read().decode("utf-8")
        df = pd.read_csv(io.StringIO(content))

        required_columns = [
            "country", "work_location", "full_name", "work_email",
            "department", "sub_department", "sub_team", "management_level",
            "business_title", "tech_position", "direct_supervisor",
            "cost_center", "start_date", "probation_start_date",
            "probation_end_date", "onboarding_status", "contract_end_date",
            "exit_date", "offboarding_status", "employee_active",
            "hiring_company", "workday_id", "termination_type", "employee_type"
        ]

        issues = validate_dataframe(df, required_columns)
        df = df.where(pd.notnull(df), None)

        if issues:
            return {
                "status": "warning",
                "issues": issues,
                "message": f"Validation completed with {len(issues)} issue(s).",
                "row_count": len(df),
            }

        # ✅ Try to normalize all rows without committing
        df_records = [
            {k: normalize_value(k, v) for k, v in row.items()} for row in df.to_dict(orient="records")
        ]

        db.rollback()  # ensure nothing persists

        return {
            "status": "success",
            "row_count": len(df),
            "message": "Validation successful — no issues found.",
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Validation failed: {e}")
    

# ============================================================
# Upload History
# ============================================================
@router.get("/history")
def get_upload_history(
    db: Session = Depends(auth_utils.get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Return recent upload logs for the batch uploader."""
    auth_utils.require_role(current_user, ["route:batch-uploader#history"])

    logs = (
        db.query(BatchUploadLog)
        .order_by(BatchUploadLog.created_at.desc())
        .limit(100)
        .all()
    )

    return [
        {
            "id": l.id,
            "uploader_name": l.uploader_name,
            "uploaded_by": l.uploaded_by,
            "file_name": l.file_name,
            "inserted_count": l.inserted_count,
            "updated_count": l.updated_count,
            "row_count": getattr(l, "row_count", None),
            "duration_seconds": getattr(l, "duration_seconds", None),
            "status": l.status,
            "message": l.message,
            "created_at": l.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        }
        for l in logs
    ]