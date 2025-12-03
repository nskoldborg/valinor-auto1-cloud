from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from backend.scr.models import base, database
from backend.scr.services import seed
from backend.scr.api import (
    analytics_datasources,
    analytics_queries,
    analytics_resources,
    auth,
    batch_uploader,
    changelog,
    feature_requests,
    position_requests,
    releases,
    support,
    system_scripts,
    system,
    user_api_keys,
    user_countries,
    user_groups,
    user_positions,
    user_roles,
    user_tasks,
    users,
)

# Create FastAPI app
app = FastAPI(title="Auto1 Backend")

# ✅ CORS setup
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://10.46.0.140:5173",
    "http://10.46.0.140:8651",  # ✅ external port you’re using in the browser
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Register Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(user_roles.router)
app.include_router(user_groups.router)
app.include_router(user_countries.router)
app.include_router(user_api_keys.router)
app.include_router(changelog.router)
app.include_router(user_positions.router)
app.include_router(system.router)
app.include_router(user_tasks.router)
app.include_router(batch_uploader.router)
app.include_router(feature_requests.router)
app.include_router(releases.router)
app.include_router(position_requests.router)
app.include_router(analytics_resources.router)
app.include_router(support.router)
app.include_router(analytics_datasources.router)
app.include_router(analytics_queries.router)
app.include_router(system_scripts.router)

@app.get("/", include_in_schema=False)
@app.head("/", include_in_schema=False)
def root():
    return {"message": "Backend is running"}


# ✅ Startup Event (create schema + tables + seed)
@app.on_event("startup")
def startup_event():
    print("🚀 Starting backend and connecting to database...")

    try:
        # -------------------------------------------------------
        # 🧱 Ensure required schemas exist before creating tables
        # -------------------------------------------------------
        with database.engine.connect() as conn:
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS api_load"))
            conn.commit()
        print("✅ Schema 'api_load' verified or created.")

        # -------------------------------------------------------
        # 🧩 Create tables and seed
        # -------------------------------------------------------
        base.Base.metadata.create_all(bind=database.engine)
        print("✅ Database tables created or verified.")

        seed.seed()
        print("🌱 Database seeded successfully.")

    except Exception as e:
        print("❌ Database startup failed:", e)


@app.on_event("shutdown")
def shutdown_event():
    print("🛑 Shutting down backend...")