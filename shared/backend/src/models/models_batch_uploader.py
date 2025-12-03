from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, Text, Float
from datetime import datetime
from backend.scr.models.database import Base

# ============================================================
# 🧩 EmployeeBase — target table for Workday data
# ============================================================

class EmployeeBase(Base):
    __tablename__ = "employee_base"
    __table_args__ = {"schema": "api_load"}  # schema-level separation

    id = Column(Integer, primary_key=True, autoincrement=True)
    country = Column(String(50))
    work_location = Column(String(255))
    full_name = Column(String(255))
    work_email = Column(String(255))
    department = Column(String(255))
    sub_department = Column(String(255))
    sub_team = Column(String(255))
    management_level = Column(String(255))
    business_title = Column(String(255))
    tech_position = Column(String(255))
    direct_supervisor = Column(String(255))
    direct_supervisor_email = Column(String(255))
    matrix_manager = Column(String(255))
    cost_center = Column(String(255))
    start_date = Column(Date)
    probation_start_date = Column(Date)
    probation_end_date = Column(Date)
    onboarding_status = Column(String(50))
    contract_end_date = Column(Date)
    exit_date = Column(Date)
    offboarding_status = Column(String(50))
    employee_active = Column(Boolean, default=True)
    hiring_company = Column(String(255))
    workday_id = Column(String(255), unique=True, index=True)
    eagle_id = Column(String(255))
    termination_type = Column(String(255))
    employee_type = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============================================================
# 🧾 BatchUploadLog — tracks each upload
# ============================================================

class BatchUploadLog(Base):
    __tablename__ = "batch_upload_log"
    __table_args__ = {"schema": "valinor_meta"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    uploader_name = Column(String(255))
    uploaded_by = Column(Integer)  # user.id of uploader
    file_name = Column(String(255))
    inserted_count = Column(Integer, default=0)
    updated_count = Column(Integer, default=0)    
    row_count = Column(Integer, default=0)
    duration_seconds = Column(Float, default=0.0)
    status = Column(String(50), default="success")  # success / failed
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)