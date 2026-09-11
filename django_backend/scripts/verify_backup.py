#!/usr/bin/env python3
"""
Encrypted Database Backup Verification Utility for Banglasketch Studio
Decrypts, verifies integrity, and tests decompressed contents of a backup archive.
"""

import os
import sys
import gzip
import json
import hashlib
from pathlib import Path
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

def get_backup_key() -> bytes:
    raw_key = os.getenv("BACKUP_ENCRYPTION_KEY") or os.getenv("DJANGO_SECRET_KEY") or "banglasketch-default-backup-seed-key-32b"
    return hashlib.sha256(raw_key.encode("utf-8")).digest()

def verify_backup(backup_path: Path) -> bool:
    if not backup_path.exists():
        print(f"Error: Backup file not found: {backup_path}", file=sys.stderr)
        return False

    data = backup_path.read_bytes()
    magic = data[:8]
    if magic != b"BSENC001":
        print("Error: Invalid or corrupted backup file format (magic header mismatch).", file=sys.stderr)
        return False

    iv = data[8:20]
    tag = data[20:36]
    ciphertext = data[36:]

    key = get_backup_key()
    aesgcm = AESGCM(key)

    try:
        compressed = aesgcm.decrypt(iv, ciphertext + tag, None)
    except Exception as e:
        print(f"Decryption failed: {e}. Check that BACKUP_ENCRYPTION_KEY / DJANGO_SECRET_KEY matches.", file=sys.stderr)
        return False

    print("Decryption successful (AES-256-GCM auth tag verified).")

    try:
        decompressed = gzip.decompress(compressed)
    except Exception as e:
        print(f"Decompression failed: {e}", file=sys.stderr)
        return False

    print(f"Decompression successful ({len(decompressed):,} uncompressed bytes).")

    # Content inspection
    if decompressed.startswith(b"--") or b"PostgreSQL database dump" in decompressed or b"CREATE TABLE" in decompressed:
        print("Backup type: PostgreSQL SQL Dump")
        lines = decompressed.decode("utf-8", errors="ignore").splitlines()[:10]
        print("Header Preview:")
        for line in lines:
            print(f"  {line}")
    else:
        # Check if valid JSON dump
        try:
            parsed = json.loads(decompressed.decode("utf-8"))
            print(f"Backup type: Django JSON Dump ({len(parsed)} model records found)")
            models_summary = {}
            for item in parsed:
                model_name = item.get("model", "unknown")
                models_summary[model_name] = models_summary.get(model_name, 0) + 1
            print("Records breakdown:")
            for m, count in sorted(models_summary.items()):
                print(f"  - {m}: {count}")
        except Exception:
            print("Warning: Content is not standard SQL dump or JSON fixture, but raw decompression succeeded.")

    print(f"\n[PASSED] Backup verification succeeded for {backup_path.name}")
    return True

if __name__ == "__main__":
    backups_dir = BASE_DIR / "backups"
    target_file = None

    if len(sys.argv) > 1:
        target_file = Path(sys.argv[1])
    else:
        # Find latest .enc file in backups directory
        candidates = sorted(backups_dir.glob("*.enc"), key=os.path.getmtime, reverse=True)
        if candidates:
            target_file = candidates[0]

    if not target_file:
        print("No backup file specified and no .enc files found in backups directory.", file=sys.stderr)
        sys.exit(1)

    print(f"Verifying backup file: {target_file}")
    success = verify_backup(target_file)
    sys.exit(0 if success else 1)
