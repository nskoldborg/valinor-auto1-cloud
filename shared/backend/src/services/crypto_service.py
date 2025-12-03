import os
from cryptography.fernet import Fernet, InvalidToken

# ============================================================
# 🔐 Persistent encryption key (env or fallback)
# ============================================================

DEFAULT_KEY = "ZL0xZomEYJ3NquQlK-ljXUqvL4A5tRbGb8-8jL0EkxY="  # fallback
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", DEFAULT_KEY)

if not ENCRYPTION_KEY:
  raise RuntimeError("ENCRYPTION_KEY not set and no default key available.")

# Make sure we pass bytes to Fernet
if isinstance(ENCRYPTION_KEY, str):
  KEY_BYTES = ENCRYPTION_KEY.encode("utf-8")
else:
  KEY_BYTES = ENCRYPTION_KEY

fernet = Fernet(KEY_BYTES)

# ============================================================
# 🔄 Encrypt / Decrypt helpers
# ============================================================

def encrypt(plaintext: str | None) -> str | None:
    """Encrypt plaintext string into a Fernet token."""
    if not plaintext:
        return None
    return fernet.encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str | None) -> str | None:
    """Decrypt Fernet token back to plaintext."""
    if not ciphertext:
        return None
    try:
        return fernet.decrypt(ciphertext.encode()).decode()
    except InvalidToken as e:
        # Raise a clearer error that callers can handle
        raise ValueError("Invalid encryption key or corrupted ciphertext") from e