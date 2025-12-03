from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import time
import psycopg2

from backend.server.model.database import get_db
from backend.server.model.models_analytics import Query, DataSource, Tag
from backend.server.utils import auth_utils, crypto

router = APIRouter(
    prefix="/analytics/queries",
    tags=["Analytics Queries"],
)

# ============================================================
# 🧩 Schemas
# ============================================================

class QueryBase(BaseModel):
    name: str
    datasource_id: Optional[int] = None
    sql_text: Optional[str] = None
    is_published: bool = False
    is_archived: bool = False
    tags: Optional[List[str]] = []
    refresh_schedule: Optional[str] = "Never"


class QueryCreate(QueryBase):
    pass


class QueryOut(QueryBase):
    id: int
    created_at: datetime
    last_executed_at: Optional[datetime] = None
    last_execution_duration: Optional[float] = None
    last_row_count: Optional[int] = None
    last_row_scanned: Optional[int] = None
    last_executed_by_id: Optional[int] = None

    class Config:
        from_attributes = True


# ============================================================
# 🧠 Helpers
# ============================================================

def get_or_create_tags(db: Session, tag_names: List[str]) -> List[Tag]:
    """Return Tag objects for each tag name, creating if missing."""
    if not tag_names:
        return []
    existing_tags = db.query(Tag).filter(Tag.name.in_(tag_names)).all()
    existing_names = {t.name for t in existing_tags}
    new_tags = [Tag(name=n) for n in tag_names if n not in existing_names]
    db.add_all(new_tags)
    db.flush()
    return existing_tags + new_tags


# ============================================================
# 📊 ROUTES
# ============================================================

@router.get("/", response_model=List[QueryOut])
def list_queries(
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Return all non-archived queries."""
    queries = (
        db.query(Query)
        .options(joinedload(Query.tags))
        .filter(Query.is_archived == False)
        .order_by(Query.created_at.desc())
        .all()
    )
    return [
        QueryOut(
            id=q.id,
            name=q.name,
            datasource_id=q.datasource_id,
            sql_text=q.sql_text,
            is_published=q.is_published,
            is_archived=q.is_archived,
            tags=[t.name for t in q.tags],
            created_at=q.created_at,
            last_executed_at=q.last_executed_at,
            last_execution_duration=q.last_execution_duration,
            last_row_count=q.last_row_count,
            last_row_scanned=q.last_row_scanned,
            last_executed_by_id=q.last_executed_by_id,
            refresh_schedule=q.refresh_schedule,
        )
        for q in queries
    ]


@router.post("/", response_model=QueryOut, status_code=status.HTTP_201_CREATED)
def create_query(
    payload: QueryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Create a new analytics query."""
    if payload.datasource_id:
        ds = db.query(DataSource).filter(DataSource.id == payload.datasource_id).first()
        if not ds:
            raise HTTPException(status_code=404, detail="Datasource not found")

    new_query = Query(
        name=payload.name,
        sql_text=payload.sql_text,
        datasource_id=payload.datasource_id,
        created_by_id=current_user.id,
        is_published=payload.is_published,
        is_archived=payload.is_archived,
        created_at=datetime.utcnow(),
    )

    new_query.tags = get_or_create_tags(db, payload.tags or [])
    db.add(new_query)
    db.commit()
    db.refresh(new_query)

    return QueryOut(
        id=new_query.id,
        name=new_query.name,
        datasource_id=new_query.datasource_id,
        sql_text=new_query.sql_text,
        is_published=new_query.is_published,
        is_archived=new_query.is_archived,
        tags=[t.name for t in new_query.tags],
        created_at=new_query.created_at,
        last_executed_at=new_query.last_executed_at,
        refresh_schedule=new_query.refresh_schedule,
    )


# ============================================================
# ⚡ Execute Query with Cache
# ============================================================

@router.post("/{query_id}/execute")
def execute_query(
    query_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Executes a saved query, using cached results if available."""
    q = db.query(Query).filter(Query.id == query_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")

    ds = db.query(DataSource).filter(DataSource.id == q.datasource_id).first()
    if not ds:
        raise HTTPException(status_code=400, detail="Datasource not found")

    # 🔹 Check for valid cache (within 15 minutes)
    if (
        q.cached_result
        and q.last_executed_at
        and (datetime.utcnow() - q.last_executed_at).total_seconds() < 900
    ):
        return {
            "cached": True,
            "columns": q.cached_result.get("columns"),
            "rows": q.cached_result.get("rows"),
            "execution_time": q.last_execution_duration,
            "row_count": q.last_row_count,
            "row_scanned": q.last_row_scanned,
        }

    password = crypto.decrypt(ds.password_encrypted) if ds.password_encrypted else None
    start_time = time.time()

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
        cur.execute(q.sql_text)

        try:
            rows = cur.fetchall()
            columns = [desc[0] for desc in cur.description]
        except psycopg2.ProgrammingError:
            rows, columns = [], []

        conn.commit()
        cur.close()
        conn.close()

        duration = round(time.time() - start_time, 3)
        row_count = len(rows)
        row_scanned = max(row_count * 5, row_count)  # simple estimation

        # 🧠 Cache result (limit rows to prevent memory blowup)
        q.cached_result = {"columns": columns, "rows": rows[:1000]}
        q.last_executed_at = datetime.utcnow()
        q.last_executed_by_id = current_user.id
        q.last_execution_duration = duration
        q.last_row_count = row_count
        q.last_row_scanned = row_scanned

        db.commit()
        db.refresh(q)

        return {
            "cached": False,
            "columns": columns,
            "rows": rows,
            "execution_time": duration,
            "row_count": row_count,
            "row_scanned": row_scanned,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query execution failed: {e}")


# ============================================================
# 🧹 Delete Query
# ============================================================

@router.delete("/{query_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_query(
    query_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(auth_utils.get_current_user),
):
    """Delete a query (hard delete)."""
    q = db.query(Query).filter(Query.id == query_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")
    db.delete(q)
    db.commit()
    return None