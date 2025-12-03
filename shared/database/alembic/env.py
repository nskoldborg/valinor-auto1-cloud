import os, sys
from pathlib import Path
from dotenv import load_dotenv

# Make backend importable when running from /database
ROOT = Path(__file__).resolve().parents[2]   # repo root
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

APP_ENV = os.getenv("APP_ENV", "dev")
ENV_FILE = BACKEND / "database" / f"{APP_ENV}.env"
if ENV_FILE.exists():
    load_dotenv(ENV_FILE)

from server.model.base import Base
from server.model.database import DATABASE_URL, DB_SCHEMA
from sqlalchemy import engine_from_config, pool
from alembic import context

config = context.config
config.set_main_option("sqlalchemy.url", DATABASE_URL)

target_metadata = Base.metadata

def run_migrations_offline():
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        version_table_schema=DB_SCHEMA,
        include_schemas=True,
        literal_binds=True,
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            version_table_schema=DB_SCHEMA,
            include_schemas=True,
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()