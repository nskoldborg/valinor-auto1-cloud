# ============================================================
# 🧩 AUTO1 Valinor — Environment Control (Monorepo/Profile Makefile)
# ============================================================

.PHONY: db-up db-down dev-up dev-down dev-build prod-up prod-down prod-build ps clean help db-restart dev-restart prod-restart migrate-dry migrate-apply

# --- Variables ---
# Assumes 'docker compose' (V2) is available
DOCKER_COMPOSE=sudo docker compose

# ============================================================
# 🗄️ Database Control (Managed by the Main Compose file)
# ============================================================

db-up:
	@echo "🚀 Starting shared database service..."
	# Starts *only* the 'database' service defined in the root docker-compose.yml
	$(DOCKER_COMPOSE) up -d database

db-down:
	@echo "🧹 Stopping shared database service..."
	$(DOCKER_COMPOSE) stop database

db-restart:
	@echo "🔄 Restarting shared database service..."
	$(DOCKER_COMPOSE) restart database

db-logs:
	@echo "📜 Tailing shared database logs..."
	$(DOCKER_COMPOSE) logs -f database

# ============================================================
# 🧱 Development Stack (Uses the 'dev' Profile)
# ============================================================

dev-up:
	@echo "🚀 Starting Valinor DEV environment (Hot-Reloading)..."
	# Starts all services with the 'dev' profile (e.g., api-dev, web-dev)
	$(DOCKER_COMPOSE) --profile dev up --build -d

dev-down:
	@echo "🧹 Stopping Valinor DEV environment..."
	$(DOCKER_COMPOSE) --profile dev down

dev-build:
	@echo "🏗️ Rebuilding DEV containers (no cache)..."
	$(DOCKER_COMPOSE) --profile dev build --no-cache

dev-restart:
	@echo "🔄 Restarting Valinor DEV containers..."
	$(DOCKER_COMPOSE) --profile dev restart

dev-logs:
	@echo "📜 Showing DEV logs (api-dev and web-dev)..."
	$(DOCKER_COMPOSE) --profile dev logs -f

# ============================================================
# 🚀 Production Stack (Uses the 'prod' Profile)
# ============================================================

prod-up:
	@echo "🚀 Starting Valinor PROD environment (Stable Images)..."
	# Starts all services with the 'prod' profile (e.g., api-prod, web-prod)
	$(DOCKER_COMPOSE) --profile prod up --build -d

prod-down:
	@echo "🧹 Stopping Valinor PROD environment..."
	$(DOCKER_COMPOSE) --profile prod down

prod-build:
	@echo "🏗️ Rebuilding PROD containers (no cache)..."
	$(DOCKER_COMPOSE) --profile prod build --no-cache

prod-restart:
	@echo "🔄 Restarting Valinor PROD containers..."
	$(DOCKER_COMPOSE) --profile prod restart

prod-logs:
	@echo "📜 Showing PROD logs..."
	$(DOCKER_COMPOSE) --profile prod logs -f

# ============================================================
# 🔧 Database Utilities (Migration/Reset)
# ============================================================

migrate-dry:
	@echo "🔎 Starting DRY RUN migration..."
	$(DOCKER_COMPOSE) exec api-dev python ./shared/backend/scripts/dbSchemaMigrator.py --dry-run

migrate-apply: message ?= auto_migration
	@echo "🔨 Applying migration: $(message)..."
	$(DOCKER_COMPOSE) exec api-dev python ./shared/backend/scripts/dbSchemaMigrator.py $(message)

db-reset:
	@echo "⚠️  WARNING: Running interactive DB reset (DATA WILL BE LOST)..."
	$(DOCKER_COMPOSE) exec api-dev python ./shared/backend/scripts/reset_db.py

# ============================================================
# 🔍 Global Utilities
# ============================================================

ps:
	@echo "📦 Active Docker containers:"
	sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

clean:
	@echo "🧹 Removing stopped containers and unused images..."
	sudo docker system prune -f

# ============================================================
# 🧭 Help
# ============================================================

help:
	@echo ""
	@echo "============================================================"
	@echo "🧩 AUTO1 Valinor Deployment Control — Commands Overview"
	@echo "============================================================"
	@echo ""
	@echo "🗄️  Database:"
	@echo "  make db-up          → Start shared PostgreSQL"
	@echo "  make db-down        → Stop shared PostgreSQL"
	@echo "  make db-logs        → View DB logs"
	@echo ""
	@echo "🧱  Development Environment:"
	@echo "  make dev-up         → Start DEV stack"
	@echo "  make dev-down       → Stop DEV stack"
	@echo "  make dev-build      → Rebuild DEV from scratch"
	@echo "  make dev-logs       → Show DEV logs"
	@echo ""
	@echo "🚀  Production Environment:"
	@echo "  make prod-up        → Start PROD stack"
	@echo "  make prod-down      → Stop PROD stack"
	@echo "  make prod-build     → Rebuild PROD from scratch"
	@echo "  make prod-logs      → Show PROD logs"
	@echo ""
	@echo "🔧  Utilities:"
	@echo "  make ps             → Show running containers"
	@echo "  make clean          → Clean stopped containers/images"
	@echo "  make status         → Show Docker disk usage"
	@echo ""
	@echo "============================================================"
	@echo ""