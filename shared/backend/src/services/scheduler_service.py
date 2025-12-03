from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import requests
import os # Import os to read environment variables

# --- CONFIGURATION ---
scheduler = BackgroundScheduler(timezone="UTC")

# CRITICAL FIX: Read the internal API hostname and port from environment variables.
# This variable must be set in the docker-compose.yml file.
# Defaulting to api-dev:8000 for local sanity checks.
API_BASE = os.getenv("API_BASE_HOST", "http://api-dev:8000") 

# --- JOB DEFINITION ---

def matrix_sync_job():
    """Run the position matrix sync job (through the official API)."""
    print(f"🔁 [{datetime.utcnow()}] Starting scheduled position matrix sync...")

    try:
        # NOTE: Using requests.post for direct API communication
        res = requests.post(f"{API_BASE}/system/matrix-sync", timeout=300)
        
        if res.status_code == 200:
            data = res.json()
            print(f"✅ Matrix sync completed: {data.get('message')}")
        else:
            # Log the full response content for better debugging
            print(f"⚠️ Matrix sync failed (Status: {res.status_code}). Response: {res.text}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Matrix sync job failed (Network/Timeout error): {e}")
    except Exception as e:
        print(f"❌ Matrix sync job failed (General error): {e}")

# --- SCHEDULER INITIALIZATION ---

def init_scheduler():
    """Initialize and register recurring jobs."""
    if scheduler.running:
        return scheduler

    scheduler.add_job(
        matrix_sync_job,
        CronTrigger(minute=0),  # every full hour
        id="matrix_sync_job",
        replace_existing=True,
    )

    scheduler.start()
    print("🕒 Scheduler initialized — matrix sync job registered.")
    return scheduler

# NOTE: You must call init_scheduler() when your API starts up (e.g., in src/main.py)
# to ensure the background thread begins running.