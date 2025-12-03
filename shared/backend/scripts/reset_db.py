import sys, os
from sqlalchemy import text

from backend.scr.models import Base
from backend.scr.models.database import engine
from backend.scr.services.seed_service import seed

def drop_all_tables_cascade(engine, schema: str):
    """
    Drop all tables in the given schema using CASCADE to remove dependent objects.
    Safe for development resets.
    """
    with engine.connect() as conn:
        print(f"⚠️  Dropping all tables in schema '{schema}' (CASCADE)...")
        conn.execute(
            text(f"""
            DO $$
            DECLARE
                r RECORD;
            BEGIN
                FOR r IN (
                    SELECT tablename
                    FROM pg_tables
                    WHERE schemaname = '{schema}'
                ) LOOP
                    EXECUTE 'DROP TABLE IF EXISTS "{schema}".' || quote_ident(r.tablename) || ' CASCADE';
                END LOOP;
            END $$;
            """)
        )
        conn.commit()
        print(f"✅ All tables in '{schema}' dropped successfully.")


def ensure_schema_exists(engine, schema: str):
    """Ensure that the given schema exists before creating tables."""
    with engine.connect() as conn:
        conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema}";'))
        conn.commit()


def reset_database():
    """
    Drops all tables in both 'public' and 'api_load' schemas,
    recreates them, and runs the seeding routine.
    """
    schemas_to_reset = ["public", "api_load"]

    for schema in schemas_to_reset:
        ensure_schema_exists(engine, schema)
        drop_all_tables_cascade(engine, schema)

    print("\n🛠️  Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully.")

    print("\n🌱  Seeding defaults...")
    seed()
    print("\n✅  Database reset and seeding completed successfully!\n")


if __name__ == "__main__":
    confirm = input("⚠️  This will DELETE all data and recreate all schemas. Continue? (y/N): ").strip().lower()
    if confirm == "y":
        reset_database()
    else:
        print("❌  Operation cancelled.")