import subprocess
import sys
from datetime import datetime

# 🔧 Change this before running if you want a custom message
CUSTOM_MESSAGE = "add_updated_at_and_updated_by_fields"

def run(cmd):
    """Run a shell command and stream output live."""
    print(f"\n$ {' '.join(cmd)}")
    result = subprocess.run(cmd, text=True)
    if result.returncode != 0:
        sys.exit(result.returncode)

def main():
    # Use timestamp in migration message
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Priority: CLI arg > CUSTOM_MESSAGE > fallback
    if len(sys.argv) > 1 and sys.argv[1] != "--dry-run":
        message = "_".join(sys.argv[1:])
    elif CUSTOM_MESSAGE:
        message = CUSTOM_MESSAGE
    else:
        message = "auto_migration"

    migration_message = f"{timestamp}_{message}"

    # Detect dry-run
    dry_run = "--dry-run" in sys.argv

    # Step 1: generate migration file
    run([
        "alembic", "-c", "backend/server/alembic.ini",
        "revision", "--autogenerate", "-m", migration_message
    ])

    if dry_run:
        # Preview SQL without applying
        run([
            "alembic", "-c", "backend/server/alembic.ini",
            "upgrade", "head", "--sql"
        ])
        print(f"\n🔎 Dry-run complete. Migration file created but DB not upgraded.")
    else:
        # Step 2: upgrade DB
        run([
            "alembic", "-c", "backend/server/alembic.ini",
            "upgrade", "head"
        ])
        print(f"\n✅ Migration applied: {migration_message}")

if __name__ == "__main__":
    main()