from backend.server.model import Base
from backend.server.model.database import engine

print("🧱 Creating all tables in schema...")
Base.metadata.create_all(bind=engine)
print("✅ Tables created successfully.")