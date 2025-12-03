import subprocess
import sys
from datetime import datetime

# 🔧 Change this before running if you want a custom message
CUSTOM_MESSAGE = "add_updated_at_and_updated_by_fields"

# --- NEW CONFIG PATH ---
# Path relative from scripts/ to shared/database/alembic.ini
ALEMBIC_CONFIG_PATH = "../database/alembic.ini"
# -----------------------

def run(cmd):
    """Run a shell command and stream output live."""
    print(f"\n$ {' '.join(cmd)}")
    result = subprocess.run(cmd, text=True)
    if result.returncode != 0:
        sys.exit(result.returncode)

# ... (main function logic) ...

    # Step 1: generate migration file
    run([
        "alembic", "-c", ALEMBIC_CONFIG_PATH,
        "revision", "--autogenerate", "-m", migration_message
    ])

    if dry_run:
        # Preview SQL without applying
        run([
            "alembic", "-c", ALEMBIC_CONFIG_PATH,
            "upgrade", "head", "--sql"
        ])
        print(f"\n🔎 Dry-run complete. Migration file created but DB not upgraded.")
    else:
        # Step 2: upgrade DB
        run([
            "alembic", "-c", ALEMBIC_CONFIG_PATH,
            "upgrade", "head"
        ])
        print(f"\n✅ Migration applied: {migration_message}")

# ... (if __name__ == "__main__": main() )