from backend.scr.models import Base
from backend.scr.models.database import engine

print("🧱 Creating all tables in schema...")
Base.metadata.create_all(bind=engine)
print("✅ Tables created successfully.")