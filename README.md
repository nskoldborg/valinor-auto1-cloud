🧭 Valinor Platform

A modular, Docker-first system for managing workflows, analytics, and user administration — built with FastAPI, React (Vite), and PostgreSQL.

This project provides a unified framework for:
	•	🔐 Secure user & access management
	•	⚙️ Workflow automation
	•	📊 Analytics queries and datasource connectors
	•	🧠 Modular REST API + frontend architecture

⸻

🧱 Tech Stack
Layer                     Technology
Frontend                  React (Vite + TailwindCSS)
Backend                   FastAPI (Python 3.13)
Database                  PostgreSQL 16
ORM                       SQLAlchemy + Alembic
Auth                      JWT (via python-jose)
Encryption                AES (via pycryptodome)
Containerization          Docker & Docker Compose
Environment               Synology NAS compatible deployment

auto1-project-valinor-dev/
│
├── backend/                # FastAPI backend
│   ├── server/
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   ├── requirements.txt
│   └── ...
│
├── frontend/               # React + Vite + Nginx frontend
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── ...
│
├── database/               # Database configuration & migrations
│   ├── dev.env
│   ├── prod.env
│   ├── init.sql
│   └── prod_data/
│
└── docker-compose.yml      # Full stack configuration

🚀 Quick Start (Local or Synology)

1. Clone and navigate
git clone <your_repo_url>
cd auto1-project-valinor-dev

2. Setup environment variables

Create a file at database/prod.env:

APP_ENV=prod

POSTGRES_USER=prod_user
POSTGRES_PASSWORD=prod_password
POSTGRES_DB=auto1_prod
POSTGRES_HOST=db_prod
POSTGRES_PORT=5432

JWT_SECRET_KEY=supersecretkey
ENCRYPTION_KEY=your_32_byte_key_here

3. Build and run
docker compose build
docker compose up -d

4. Access services
Service                   URL                              Description
Frontend (React)          http://<NAS_IP>:8501            Main app interface
Backend (FastAPI)         http://<NAS_IP>:8500/docs       REST API docs
pgAdmin (optional)        http://<NAS_IP>:8502            DB management GUI

🧰 Developer Mode (Local Only)

If you want to run the backend manually:
cd backend
uvicorn server.main:app --reload --host 0.0.0.0 --port 8000

And for the frontend:
cd frontend
npm install
npm run dev

Then open:
👉 http://localhost:5174 (frontend)
👉 http://localhost:8000/docs (backend)

🧩 Database Management

This project supports Alembic migrations (under database/migrations).

Initialize migrations:
alembic init database/migrations

Run migrations:
alembic revision --autogenerate -m "init"
alembic upgrade head

⚙️ Docker Compose Overview
Service                   Description
backend                   FastAPI API server (Uvicorn + Python 3.13)
frontend                  React + Nginx app container
db_prod                   PostgreSQL 16 database
pgadmin                   Optional pgAdmin UI for database management

🔒 Security Notes
	•	All JWT and encryption keys should be set via .env files.
	•	Never commit .env files to version control.
	•	Use HTTPS with Synology reverse proxy for production access.
	•	Rotate JWT_SECRET_KEY periodically.

🧹 Maintenance Commands
Action                                      Command
Stop all services                           docker compose down
Stop & remove containers + volumes          docker compose down -v
Rebuild all containers                      docker compose build --no-cache
View logs                                   docker compose logs -f backend
Restart backend only                        docker compose restart backend

🧠 Next Steps
	•	Enable Alembic migrations (production-ready)
	•	Integrate backend job/workflow system (Retool-style)
	•	Add secure datasource connection management (Redash-style)
	•	Setup HTTPS reverse proxy (Synology or Traefik)
	•	Connect with your production Postgres instance

⸻

🏁 Summary

You now have a full-stack, Synology-ready platform combining:
	•	FastAPI backend (modular, encrypted, JWT-authenticated)
	•	React frontend (Vite + Tailwind + Nginx)
	•	PostgreSQL persistence layer
	•	Dockerized dev + production deployment