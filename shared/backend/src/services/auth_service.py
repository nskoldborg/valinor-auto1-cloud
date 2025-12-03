# backend/server/utils/auth_utils.py

from datetime import datetime, timedelta
import os
from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer

from backend.scr.models import database
from backend.scr.models.models_users import User, UserGroup, UserRole, UserPosition

# ============================================================
# 🔐 Config
# ============================================================
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "supersecret")  # ⚠️ replace in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# ============================================================
# 🔒 Password Hashing Setup with Auto-Fallback
# ============================================================
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    # quick runtime test to ensure bcrypt works
    pwd_context.hash("test")
except Exception as e:
    print("⚠️  bcrypt backend not available — falling back to sha256_crypt:", e)
    pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


# ============================================================
# 🧱 DB Dependency
# ============================================================
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================
# 🔑 Password utilities
# ============================================================
def get_password_hash(password: str) -> str:
    """Hash the password using the active cryptographic context."""
    # bcrypt has a 72-byte limit; truncate for safety
    if isinstance(password, str):
        password = password.encode("utf-8")
    if len(password) > 72 and "bcrypt" in pwd_context.schemes():
        print("⚠️  Password too long for bcrypt (truncated to 72 bytes).")
        password = password[:72]
    return pwd_context.hash(password.decode("utf-8", errors="ignore"))


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against its hash."""
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


# ============================================================
# 🧾 JWT utilities
# ============================================================
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ============================================================
# 👤 Current User & Auth Context (supports impersonation)
# ============================================================
class AuthContext:
    """
    Wraps authentication info, including impersonation.

    - user: effective user (who the system is acting as)
    - original_user: real actor (admin) if impersonating, else None
    - is_impersonating: True if token represents an impersonated session
    """

    def __init__(self, user: User, original_user: User | None, is_impersonating: bool):
        self.user = user
        self.original_user = original_user
        self.is_impersonating = is_impersonating


def get_auth_context(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> AuthContext:
    """Decode JWT and return AuthContext (supports impersonation)."""
    if not token or token.lower() == "null":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )

        impersonated_by_id: int | None = payload.get("impersonated_by")
        is_impersonating: bool = bool(payload.get("impersonated", False))

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # Effective user (current identity)
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    original_user = None
    if impersonated_by_id:
        original_user = db.query(User).filter(User.id == impersonated_by_id).first()

    return AuthContext(
        user=user,
        original_user=original_user,
        is_impersonating=is_impersonating,
    )


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Backwards-compatible helper: returns the effective user only.
    Internally uses get_auth_context so impersonation works transparently.
    """
    ctx = get_auth_context(token=token, db=db)
    return ctx.user


# ============================================================
# 🧩 Role Helpers
# ============================================================
def get_user_roles(user: User) -> set[str]:
    """Return a flat set of role names for a user (direct, via groups, via positions)."""
    roles = set()

    # Direct roles
    if user.user_roles:
        roles.update(r.name for r in user.user_roles)

    # Roles via groups
    for group in user.user_groups:
        roles.update(r.name for r in (group.roles or []))

    # Roles via positions (if your business logic links them)
    for pos in user.user_positions:
        for group in getattr(pos, "groups", []):
            roles.update(r.name for r in (group.roles or []))

    return roles


def require_role(user: User, allowed: list[str]):
    """Check if user has required role(s). Admin bypass included."""
    flattened = get_user_roles(user)

    # ✅ Admin bypass
    if "admin" in flattened:
        return

    if not any(role in flattened for role in allowed):
        raise HTTPException(status_code=403, detail="Not authorized")


# ============================================================
# 🔐 Symmetric Encryption Utilities (for DataSource passwords)
# ============================================================
from base64 import urlsafe_b64encode, urlsafe_b64decode
from hashlib import sha256
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad


def _get_encryption_key() -> bytes:
    """Derive a 32-byte AES key from the global SECRET_KEY."""
    return sha256(SECRET_KEY.encode("utf-8")).digest()


def encrypt_value(plaintext: str) -> str:
    """Encrypts a plaintext value (AES-CBC)."""
    if not plaintext:
        return None
    key = _get_encryption_key()
    cipher = AES.new(key, AES.MODE_CBC)
    ct_bytes = cipher.encrypt(pad(plaintext.encode("utf-8"), AES.block_size))
    return urlsafe_b64encode(cipher.iv + ct_bytes).decode("utf-8")


def decrypt_value(ciphertext: str) -> str:
    """Decrypts an AES-encrypted value."""
    if not ciphertext:
        return None
    key = _get_encryption_key()
    raw = urlsafe_b64decode(ciphertext)
    iv = raw[: AES.block_size]
    ct = raw[AES.block_size:]
    cipher = AES.new(key, AES.MODE_CBC, iv)
    return unpad(cipher.decrypt(ct), AES.block_size).decode("utf-8")