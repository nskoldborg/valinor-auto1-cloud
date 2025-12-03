from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import sqlalchemy as sa
import socket
import psycopg2

from backend.scr.models.database import get_db
from backend.scr.models.models_analytics import DataSource
from backend.scr.services import crypto, auth_service  # ✅ unified import

router = APIRouter(
    prefix="/analytics/resources",
    tags=["Analytics Resources"],
)

# ============================================================
# 🧩 Schemas
# ============================================================

class DataSourceBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: str
    host: str
    port: int
    database: str
    username: Optional[str] = None
    password: Optional[str] = None
    enabled: bool = True


class DataSourceCreate(DataSourceBase):
    pass


class DataSourceUpdate(DataSourceBase):
    pass


class DataSourceOut(DataSourceBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # ✅ Pydantic v2 replacement for orm_mode


class QueryPayload(BaseModel):
    query: str

# ============================================================
# 🧠 PostgreSQL Connection Validation
# ============================================================

def test_postgres_connection(ds: DataSourceBase):
    """Validate connectivity to a PostgreSQL data source."""
    # Ensure host:port is reachable
    try:
        with socket.create_connection((ds.host, ds.port), timeout=3):
            pass
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Host {ds.host}:{ds.port} not reachable — {str(e)}",
        )

    try:
        conn = psycopg2.connect(
            host=ds.host,
            port=ds.port,
            dbname=ds.database,
            user=ds.username,
            password=ds.password,
            connect_timeout=3,
        )
        cur = conn.cursor()
        cur.execute("SELECT version();")
        version = cur.fetchone()[0]
        cur.close()
        conn.close()
        return {"status": "success", "version": version}
    except Exception as e:
        msg = str(e)
        if "authentication" in msg.lower():
            msg = "Authentication failed — check username or password."
        elif "refused" in msg.lower():
            msg = "Connection refused — database may not be running."
        raise HTTPException(status_code=400, detail=f"Connection test failed: {msg}")


# ============================================================
# 🧱 ROUTES
# ============================================================

@router.get("/", response_model=List[DataSourceOut])
def list_datasources(
    db: Session = Depends(get_db),
    current_user=Depends(auth_service.get_current_user),
):
    return db.query(DataSource).order_by(DataSource.name.asc()).all()


@router.get("/{datasource_id}", response_model=DataSourceOut)
def get_datasource(
    datasource_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth_service.get_current_user),
):
    ds = db.query(DataSource).filter(DataSource.id == datasource_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found")
    return ds


@router.post("/test")
def test_datasource_connection(
    payload: DataSourceBase,
    current_user=Depends(auth_service.get_current_user),
):
    if payload.type.lower() not in ["postgres", "postgresql"]:
        raise HTTPException(
            status_code=400,
            detail="Only PostgreSQL connections are supported at this time.",
        )

    # Optional: better error if password is missing
    if not payload.password:
        raise HTTPException(
            status_code=400,
            detail="No password supplied for connection test. For saved data sources, use /analytics/resources/{id}/test.",
        )

    return test_postgres_connection(payload)


@router.post("/{datasource_id}/test")
def test_existing_datasource_connection(
    datasource_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth_service.get_current_user),
):
    ds = db.query(DataSource).filter(DataSource.id == datasource_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found")

    if ds.type.lower() not in ["postgres", "postgresql"]:
        raise HTTPException(
            status_code=400,
            detail="Only PostgreSQL connections are supported at this time.",
        )

    # 🔐 Decrypt stored password, handle key mismatch / corruption
    try:
        password = crypto.decrypt(ds.password_encrypted) if ds.password_encrypted else None
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=(
                "Failed to decrypt stored password. The encryption key has changed "
                "or the saved credentials are corrupted. Please re-enter and save "
                "the password for this datasource."
            ),
        )

    payload = DataSourceBase(
        name=ds.name,
        description=ds.description,
        type=ds.type,
        host=ds.host,
        port=ds.port,
        database=ds.database,
        username=ds.username,
        password=password,
        enabled=ds.enabled,
    )

    return test_postgres_connection(payload)


@router.post("/", response_model=DataSourceOut, status_code=status.HTTP_201_CREATED)
def create_datasource(
    payload: DataSourceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(auth_service.get_current_user),
):
    if payload.type.lower() not in ["postgres", "postgresql"]:
        raise HTTPException(status_code=400, detail="Only PostgreSQL connections are supported at this time.")

    # Ensure unique name
    existing = db.query(DataSource).filter(sa.func.lower(DataSource.name) == payload.name.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Data source name already exists")

    # Test connection before saving
    test_postgres_connection(payload)

    # Encrypt password
    encrypted_pw = crypto.encrypt(payload.password) if payload.password else None

    ds = DataSource(
        name=payload.name,
        description=payload.description,
        type="PostgreSQL",
        host=payload.host,
        port=payload.port,
        database=payload.database,
        username=payload.username,
        password_encrypted=encrypted_pw,
        enabled=payload.enabled,
        created_by_id=current_user.id if current_user else None,
        created_at=datetime.utcnow(),
    )

    db.add(ds)
    db.commit()
    db.refresh(ds)
    return ds


@router.put("/{datasource_id}", response_model=DataSourceOut)
def update_datasource(
    datasource_id: int,
    payload: DataSourceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(auth_service.get_current_user),
):
    ds = db.query(DataSource).filter(DataSource.id == datasource_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found")

    if payload.type.lower() not in ["postgres", "postgresql"]:
        raise HTTPException(status_code=400, detail="Only PostgreSQL connections are supported at this time.")

    # Use stored password if not replaced
    if not payload.password and ds.password_encrypted:
        payload.password = crypto.decrypt(ds.password_encrypted)

    # Test connection
    test_postgres_connection(payload)

    # Update record
    ds.name = payload.name
    ds.description = payload.description
    ds.type = "PostgreSQL"
    ds.host = payload.host
    ds.port = payload.port
    ds.database = payload.database
    ds.username = payload.username
    if payload.password:
        ds.password_encrypted = crypto.encrypt(payload.password)
    ds.enabled = payload.enabled
    ds.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(ds)
    return ds


@router.delete("/{datasource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_datasource(
    datasource_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth_service.get_current_user),
):
    ds = db.query(DataSource).filter(DataSource.id == datasource_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found")
    db.delete(ds)
    db.commit()
    return None


@router.get("/{datasource_id}/schema")
def get_schema(
    datasource_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth_service.get_current_user),
):
    ds = db.query(DataSource).filter(DataSource.id == datasource_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found")

    password = crypto.decrypt(ds.password_encrypted) if ds.password_encrypted else None
    try:
        conn = psycopg2.connect(
            host=ds.host,
            port=ds.port,
            dbname=ds.database,
            user=ds.username,
            password=password,
            connect_timeout=3,
        )
        cur = conn.cursor()

        # ✅ Fetch all visible schemas (exclude system ones)
        cur.execute("""
            SELECT schema_name
            FROM information_schema.schemata
            WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
            ORDER BY schema_name;
        """)
        schemas = [row[0] for row in cur.fetchall()]

        tables = []
        for schema in schemas:
            cur.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = %s
                ORDER BY table_name;
            """, (schema,))

            for (table_name,) in cur.fetchall():
                qualified_name = f"{schema}.{table_name}"  # ✅ include schema prefix

                cur.execute("""
                    SELECT column_name, data_type
                    FROM information_schema.columns
                    WHERE table_schema = %s AND table_name = %s
                    ORDER BY ordinal_position;
                """, (schema, table_name))

                columns = [{"name": col, "type": dtype} for col, dtype in cur.fetchall()]
                tables.append({
                    "schema": schema,
                    "name": qualified_name,
                    "columns": columns,
                })

        cur.close()
        conn.close()

        return {"tables": tables, "schemas": schemas}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{datasource_id}/execute")
def execute_query(
    datasource_id: int,
    payload: QueryPayload,  # ✅ use Pydantic model
    db: Session = Depends(get_db),
    current_user=Depends(auth_service.get_current_user),
):
    ds = db.query(DataSource).filter(DataSource.id == datasource_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found")

    password = crypto.decrypt(ds.password_encrypted) if ds.password_encrypted else None
    query = payload.query.strip() if payload.query else None
    if not query:
        raise HTTPException(status_code=400, detail="No query provided")

    try:
        conn = psycopg2.connect(
            host=ds.host,
            port=ds.port,
            dbname=ds.database,
            user=ds.username,
            password=password,
            connect_timeout=5,
        )
        cur = conn.cursor()
        cur.execute(query)

        # Try fetching rows if SELECT
        rows, columns = [], []
        if cur.description:
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()

        conn.commit()
        cur.close()
        conn.close()

        return {
            "columns": columns,
            "rows": [dict(zip(columns, r)) for r in rows],
        }
    except psycopg2.Error as e:
        raise HTTPException(status_code=400, detail=f"PostgreSQL error: {e.pgerror or str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query execution failed: {str(e)}")