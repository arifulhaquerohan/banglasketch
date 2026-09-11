#!/usr/bin/env python3
"""
Encrypted Database Backup Utility for Banglasketch Studio
Creates an AES-256-GCM encrypted database dump of PostgreSQL or SQLite database.
"""

import os
import sys
import gzip
import shutil
import hashlib
import datetime
import subprocess
from pathlib import Path
from urllib.parse import urlparse
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

def get_backup_key() -> bytes:
    """Derive 32-byte AES key from BACKUP_ENCRYPTION_KEY or DJANGO_SECRET_KEY."""
    raw_key = os.getenv("BACKUP_ENCRYPTION_KEY") or os.getenv("DJANGO_SECRET_KEY") or "banglasketch-default-backup-seed-key-32b"
    # Ensure 32 bytes via SHA-256 derivation
    return hashlib.sha256(raw_key.encode("utf-8")).digest()

def create_backup(output_dir: Path = None) -> Path:
    if output_dir is None:
        output_dir = BASE_DIR / "backups"
    output_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d_%H%M%SZ")
    database_url = os.getenv("DATABASE_URL")

    raw_data: bytes = b""
    is_postgres = False

    if database_url and ("postgres://" in database_url or "postgresql://" in database_url):
        is_postgres = True
        parsed = urlparse(database_url)
        env = os.environ.copy()
        if parsed.password:
            env["PGPASSWORD"] = parsed.password

        host = parsed.hostname or "localhost"
        port = str(parsed.port or 5432)
        user = parsed.username or "postgres"
        dbname = parsed.path.lstrip("/")

        pg_dump_cmd = [
            "pg_dump",
            "-h", host,
            "-p", port,
            "-U", user,
            "-d", dbname,
            "--no-owner",
            "--no-privileges",
        ]

        try:
            print(f"Executing pg_dump for PostgreSQL database '{dbname}' on {host}:{port}...")
            result = subprocess.run(
                pg_dump_cmd,
                env=env,
                capture_output=True,
                check=True,
            )
            raw_data = result.stdout
        except FileNotFoundError:
            print("pg_dump not found in PATH. Falling back to Django dumpdata...")
            is_postgres = False
        except subprocess.CalledProcessError as e:
            print(f"pg_dump error: {e.stderr.decode('utf-8')}", file=sys.stderr)
            raise

    if not is_postgres:
        print("Exporting data via Django manage.py dumpdata...")
        dumpdata_cmd = [
            sys.executable,
            str(BASE_DIR / "manage.py"),
            "dumpdata",
            "--natural-foreign",
            "--natural-primary",
            "--exclude", "contenttypes",
            "--exclude", "auth.permission",
            "--indent", "2",
        ]
        result = subprocess.run(dumpdata_cmd, capture_output=True, check=True)
        raw_data = result.stdout

    # 1. Compress raw data with gzip
    compressed = gzip.compress(raw_data, compresslevel=9)
    sha256_unencrypted = hashlib.sha256(compressed).hexdigest()

    # 2. Encrypt with AES-256-GCM
    key = get_backup_key()
    aesgcm = AESGCM(key)
    iv = os.urandom(12)
    # encrypt returns ciphertext + 16-byte tag
    ciphertext_with_tag = aesgcm.encrypt(iv, compressed, None)
    tag = ciphertext_with_tag[-16:]
    ciphertext = ciphertext_with_tag[:-16]

    # Package: Magic Header (8 bytes) + IV (12) + Tag (16) + Ciphertext
    magic = b"BSENC001"
    package = magic + iv + tag + ciphertext

    filename = f"backup_{'pg' if is_postgres else 'django'}_{timestamp}.enc"
    output_path = output_dir / filename
    output_path.write_bytes(package)

    print(f"Encrypted backup successfully created:")
    print(f"  File: {output_path}")
    print(f"  Raw Size: {len(raw_data):,} bytes")
    print(f"  Compressed Size: {len(compressed):,} bytes")
    print(f"  Encrypted File Size: {len(package):,} bytes")
    print(f"  SHA-256 (compressed payload): {sha256_unencrypted}")

    return output_path

if __name__ == "__main__":
    create_backup()
