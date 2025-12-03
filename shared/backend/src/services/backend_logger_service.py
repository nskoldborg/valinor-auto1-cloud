import logging
import sys
from datetime import datetime

# ---------------------------------------------------------------------------
# Configure the root logger
# ---------------------------------------------------------------------------

LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

logging.basicConfig(
    level=logging.INFO,
    format=LOG_FORMAT,
    datefmt=DATE_FORMAT,
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# ---------------------------------------------------------------------------
# Convenience wrapper
# ---------------------------------------------------------------------------

class Logger:
    """Lightweight structured logger for consistent console output."""

    def __init__(self, name="server"):
        self.logger = logging.getLogger(name)

    def debug(self, context: str, message: str):
        """Debug-level log with optional context prefix."""
        self.logger.debug(f"[{context}] {message}")

    def info(self, context: str, message: str):
        """Info-level log with optional context prefix."""
        self.logger.info(f"[{context}] {message}")

    def warning(self, context: str, message: str):
        """Warning-level log with optional context prefix."""
        self.logger.warning(f"[{context}] {message}")

    def error(self, context: str, message: str):
        """Error-level log with optional context prefix."""
        self.logger.error(f"[{context}] {message}")

    def critical(self, context: str, message: str):
        """Critical-level log with optional context prefix."""
        self.logger.critical(f"[{context}] {message}")

    def separator(self, label: str = "", char: str = "-"):
        """Print a nice visual separator line in logs."""
        line = f" {label} " if label else ""
        self.logger.info(f"{char * 20}{line}{char * 20}")


# Global singleton logger instance
log = Logger("ValinorCloud")