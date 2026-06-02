import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# For a solo-operator local app, we derive a key from a local secret or env var
# If no secret is provided, we use a fixed salt + machine-specific info if possible, 
# but for now we'll stick to an environment variable or a default.
SECRET_KEY = os.getenv("PFOS_ENCRYPTION_KEY", "solo-operator-default-secret-change-me")
SALT = b'pfos-salt-2026'

def _get_fernet():
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=SALT,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(SECRET_KEY.encode()))
    return Fernet(key)

def encrypt_value(value: str) -> str:
    if not value:
        return value
    f = _get_fernet()
    return f.encrypt(value.encode()).decode()

def decrypt_value(value: str) -> str:
    if not value:
        return value
    try:
        f = _get_fernet()
        return f.decrypt(value.encode()).decode()
    except Exception:
        # Fallback for old plaintext values or wrong key
        return value
