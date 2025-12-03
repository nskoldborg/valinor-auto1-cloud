# shared/backend/Dockerfile

# ============================================================
# Stage 1: Builder - Install Python Dependencies
# ============================================================
FROM python:3.11-slim as builder

# Install system dependencies needed to build Python packages (like psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev postgresql-client wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency file first to utilize Docker's cache layer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ============================================================
# Stage 2: Final Image - Production Runtime
# ============================================================
FROM python:3.11-slim
WORKDIR /app

# Copy only the installed packages from the builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Copy the application source code (src/, scripts/, etc.)
COPY . .

# Environment setup
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/src
EXPOSE 8000

# Production Command (Gunicorn) - Overridden for Dev
CMD ["gunicorn", "src.main:app", "-b", "0.0.0.0:8000", "--workers", "4", "--timeout", "30"]

# Production Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider http://localhost:8000/ || exit 1