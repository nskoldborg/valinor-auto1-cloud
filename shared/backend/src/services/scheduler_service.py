from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
from backend.scr.services.auth_service import get_db
import requests

scheduler = BackgroundScheduler(timezone="UTC")

API_BASE = "http://10.46.0.140:8650"  # or your container hostname

def matrix_sync_job():
    """Run the position matrix sync job (through the official API)."""
    print(f"🔁 [{datetime.utcnow()}] Starting scheduled position matrix sync...")

    try:
        res = requests.post(f"{API_BASE}/system/matrix-sync", timeout=300)
        if res.status_code == 200:
            data = res.json()
            print(f"✅ Matrix sync completed: {data.get('message')}")
        else:
            print(f"⚠️ Matrix sync failed: {res.status_code} {res.text}")
    except Exception as e:
        print("❌ Matrix sync job failed:", e)

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