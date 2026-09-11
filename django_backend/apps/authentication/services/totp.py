import os
import base64
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

def get_totp_key():
    """Retrieve and validate the TOTP encryption key from settings."""
    key_str = getattr(settings, "TOTP_ENCRYPTION_KEY", None)
    if not key_str:
        if not settings.DEBUG:
            raise ImproperlyConfigured("TOTP_ENCRYPTION_KEY must be set in production environment")
        # Development fallback: a fixed 32-byte key
        return b"12345678901234567890123456789012"

    try:
        # Check if already 32 raw bytes
        if isinstance(key_str, bytes) and len(key_str) == 32:
            return key_str

        # Check if 32 hex chars (common in some key formats)
        if isinstance(key_str, str) and len(key_str) == 64:
            return bytes.fromhex(key_str)

        # Check if base64 encoded
        key = base64.b64decode(key_str)
        if len(key) == 32:
            return key

        # Fallback to sha256 derivation of the key string for any other string
        return hashlib.sha256(str(key_str).encode("utf-8")).digest()
    except Exception as e:
        if not settings.DEBUG:
            raise ImproperlyConfigured(f"Invalid TOTP_ENCRYPTION_KEY: {key_str[:10]}...")
        # Fallback to dev key in DEBUG mode
        return hashlib.sha256(b"dev-fallback-key").digest()

def encrypt_totp_secret(secret: str) -> str:
    """
    Encrypts a TOTP secret using AES-256-GCM.
    Compatible with Express/Node.js: Buffer.concat([iv, tag, ciphertext]).toString('base64url')
    """
    if not secret:
        return ""

    key = get_totp_key()
    aesgcm = AESGCM(key)
    iv = os.urandom(12)

    # encrypt returns ciphertext + tag
    ciphertext_with_tag = aesgcm.encrypt(iv, secret.encode('utf-8'), None)

    # Express layout: IV (12) + TAG (16) + Ciphertext
    # cryptography.AESGCM.encrypt returns ciphertext then tag
    tag = ciphertext_with_tag[-16:]
    ciphertext = ciphertext_with_tag[:-16]

    payload = iv + tag + ciphertext
    return base64.urlsafe_b64encode(payload).decode('ascii').rstrip('=')

def decrypt_totp_secret(token: str) -> str:
    """
    Decrypts a TOTP secret using AES-256-GCM.
    Compatible with Express/Node.js layout.
    """
    if not token:
        return ""

    # Attempt to detect if token is actually encrypted (base64url)
    # If it looks like a raw base32 secret, return as is for compatibility
    if len(token) < 28 or not any(c in token for c in "-_"):
        # Heuristic: raw base32 secrets usually don't have - or _ and are shorter
        # than an AES-GCM payload (12+16+secret_len).
        # However, we should try to decrypt if it's plausible.
        pass

    try:
        key = get_totp_key()
        # Padding for urlsafe_b64decode
        padded = token + '=' * (-len(token) % 4)
        raw = base64.urlsafe_b64decode(padded)

        if len(raw) < 28:
            return token # Too short to be an encrypted payload

        iv = raw[:12]
        tag = raw[12:28]
        ciphertext = raw[28:]

        aesgcm = AESGCM(key)
        # cryptography.AESGCM expects ciphertext + tag
        plaintext = aesgcm.decrypt(iv, ciphertext + tag, None)
        return plaintext.decode('utf-8')
    except Exception:
        # Return the token as-is if decryption fails (handles raw secrets)
        return token
