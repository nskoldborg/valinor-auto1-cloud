import logging
from sqlalchemy import text
from server.model.database import engine

logger = logging.getLogger("incremental_vacuum")

def incremental_vacuum():
    """
    Run SQLite incremental_vacuum and WAL checkpoint.
    Only runs if we're using SQLite.
    """
    try:
        if "sqlite" not in str(engine.url):
            logger.debug("Skipping incremental_vacuum, not using SQLite.")
            return

        with engine.begin() as conn:
            logger.debug("Running incremental_vacuum(200) and wal_checkpoint(PASSIVE)...")
            conn.execute(text("PRAGMA incremental_vacuum(200)"))
            conn.execute(text("PRAGMA wal_checkpoint(PASSIVE)"))

        logger.info("Incremental vacuum completed successfully.")
    except Exception as e:
        logger.error(f"Failed incremental vacuum: {e}")