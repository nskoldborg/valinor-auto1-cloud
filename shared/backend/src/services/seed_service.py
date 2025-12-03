from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text

from backend.scr.models import Base, User, UserGroup, UserPosition, UserRole
from backend.scr.models.database import engine, SessionLocal
from backend.scr.services import auth_service

# ============================================================
# 🧱 Schema Configuration
# ============================================================
REQUIRED_SCHEMAS = [
    "api_load",
    "dwh_load",
    "ba_load",
    "valinor_prod",
    "valinor_meta",
    "valinor_qa",
]

# ============================================================
# 🧩 Role Definitions (Streamlined Descriptions)
# ============================================================
REQUIRED_ROLES = {
    "admin": "Full system administration access.",
    "route:admin-actions#delete-countries": "Admin rights to delete countries instead of disableing them - should only be handed to Developers",
    # "route:admin-actionsv1#delete-roles": "Admin rights to delete roles instead of disableing them - should only be handed to Developers",
    "route:admin-actions#delete-groups": "Admin rights to groups countries instead of disableing them - should only be handed to Developers",
    "route:admin-actions#delete-positions": "Admin rights to delete positions instead of disableing them - should only be handed to Developers",
    # "route:admin-actions#delete-users": "Admin rights to delete users instead of disableing them - should only be handed to Developers",
    "route:about": "Access to the About page.",
    "route:analytics#datasources": "Grants rights to view the /analytics/datasources page.",
    "route:analytics#datasources-create": "Grants rights to create a new datasource through /analytics/datasources/create.",
    "route:analytics#datasources-edit": "Grants rights to edit a specific datasource through /analytics/datasources/:id/edit.",
    "route:analytics#datasources#view-password": "Grants rights to view the decrypted password for a specific datasource",
    "route:analytics#delete-datasource": "Grants rights to delete connected datasources from the /analytics/datasources page.",
    "route:api-keys": "View API Keys administration page.",
    "route:api-keys#create": "Create new API keys.",
    "route:api-keys#delete": "Delete API keys.",
    "route:api-keys#suspend": "Suspend API keys.",
    "route:batch-uploader": "Access batch uploader interface.",
    "route:batch-uploader#history": "View batch upload history.",
    "route:batch-uploader#workday-uploader": "Access Workday batch uploader.",
    "route:countries": "View and manage Countries.",
    "route:countries#create": "Create new Country records.",
    "route:countries#edit": "Edit Country records.",
    "route:countires#update-translations": "The role grants access to view the 'Get Translations' button on the /countries page to update the master translation file.",
    "route:groups": "View and manage Groups.",
    "route:groups#create": "Create new Groups.",
    "route:groups#edit": "Edit existing Groups.",
    "route:matrix#view": "Access Position Matrix log.",
    "route:positions": "View and manage Positions.",
    "route:positions#create": "Create new Positions.",
    "route:positions#edit": "Edit existing Positions.",
    "route:product": "Access the Product menu.",
    "route:product#features": "View Feature Requests.",
    "route:product#features-create": "Create Feature Requests.",
    "route:product#features-edit": "Edit Feature Requests.",
    "route:product#features-comment": "Add comments to Feature Requests.",
    "route:product#features-comment-delete": "Delete comments on Feature Requests.",
    "route:product#position-change": "View Position Change Requests.",
    "route:product#position-change-create": "Create Position Change Requests.",
    "route:product#position-change-edit": "Edit Position Change Requests.",
    "route:product#position-change-approval": "Approve or reject Position Change Requests.",
    "route:roles": "View and manage Roles.",
    "route:roles#create": "Create new Roles.",
    "route:roles#edit": "Edit existing Roles.",
    "route:settings#admin": "Access Admin dropdown and settings menu.",
    "route:tasks#create": "Create new tasks.",
    "route:tasks#gnt": "Use Get Next Task feature.",
    "route:tasks#team-view": "View team tasks on the homepage.",
    "route:users": "View and manage Users.",
    "route:users#create": "Create new Users.",
    "route:users#edit": "Edit existing Users.",
    "route:users#view": "View user details.",
    "route:users#view-changelog": "View user changelog history.",
    "route:users#admin-view-users-api-keys": "View user API keys in Admin.",
    "route:users#admin-impersonate-user": "Grants rights to see the 'impersonate user' button on the /admin/users/:id/view page to start user impersination.",
    "route:users#can-assign-countries": "Assign Countries to other users.",
    "route:users#can-assign-groups": "Assign Groups to other users.",
    "route:users#can-assign-positions": "Assign Positions to other users.",
}

# ============================================================
# 🚀 Seeder Logic
# ============================================================

def ensure_schemas_exist():
    """Create all required schemas if missing."""
    with engine.begin() as conn:
        for schema in REQUIRED_SCHEMAS:
            conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema}";'))
    print(f"✅ Verified/created {len(REQUIRED_SCHEMAS)} schemas: {', '.join(REQUIRED_SCHEMAS)}")


def seed():
    """Seeds the initial system data into the database."""
    print("\n🧱 Initializing database and verifying schemas...")
    ensure_schemas_exist()

    # Create tables
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    existing_tables = inspector.get_table_names(schema=Base.metadata.schema)
    if not existing_tables:
        print("❌ No tables found — model import issue detected.")
        return

    print(f"✅ Found {len(existing_tables)} tables in schema '{Base.metadata.schema}'")

    db: Session = SessionLocal()

    try:
        # ============================================================
        # Groups
        # ============================================================
        def ensure_group(name, desc):
            group = db.query(UserGroup).filter_by(name=name).first()
            if not group:
                group = UserGroup(name=name, description=desc, enabled=True)
                db.add(group)
                db.commit()
                print(f"✅ Created group: {name}")
            return group

        admin_group = ensure_group("admin", "Full SuperAdmin access.")
        basic_group = ensure_group("basic", "Basic user authentication access.")

        # ============================================================
        # Roles
        # ============================================================
        print("\n🔑 Seeding roles...")
        seeded_roles = []
        for role_name, description in REQUIRED_ROLES.items():
            role = db.query(UserRole).filter_by(name=role_name).first()
            if not role:
                role = UserRole(
                    name=role_name,
                    description=description,
                    created_at=datetime.utcnow(),
                )
                db.add(role)
                db.commit()
                print(f"✅ Created role: {role_name}")
            elif not role.description:
                role.description = description
                db.commit()
                print(f"📝 Updated missing description for: {role_name}")
            seeded_roles.append(role)

        # ============================================================
        # Positions
        # ============================================================
        manager = db.query(UserPosition).filter_by(name="Super Admin").first()
        if not manager:
            manager = UserPosition(name="Super Admin")
            db.add(manager)
            db.commit()
            print("✅ Created position: Super Admin")

        # ============================================================
        # Admin User
        # ============================================================
        print("\n👤 Verifying admin user...")
        admin_user = db.query(User).filter_by(email="admin@example.com").first()
        if not admin_user:
            admin_user = User(
                first_name="System",
                last_name="Admin",
                email="admin@example.com",
                password_hash=auth_utils.get_password_hash("admin123"),
                status=True,
                country="SE",
                created_at=datetime.utcnow(),
            )
            admin_user.user_groups.extend([admin_group, basic_group])
            admin_user.user_positions.append(manager)
            admin_user.user_roles.extend(seeded_roles)
            db.add(admin_user)
            db.commit()
            print("✅ Seeded admin@example.com / admin123 with all roles, groups, and positions.")
        else:
            changed = False
            for assoc, target in [
                (admin_user.user_groups, [admin_group, basic_group]),
                (admin_user.user_positions, [manager]),
                (admin_user.user_roles, seeded_roles),
            ]:
                for item in target:
                    if item not in assoc:
                        assoc.append(item)
                        changed = True
            if changed:
                db.commit()
                print("🔄 Updated existing admin user with missing defaults.")
            else:
                print("ℹ️ Admin user already up to date.")

    finally:
        db.close()
        print("\n🏁 Database seed complete.\n")


if __name__ == "__main__":
    seed()