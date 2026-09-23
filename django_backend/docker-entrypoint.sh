#!/bin/sh
set -e

echo "==> Bangla Sketch Backend Container Bootstrapping..."

# Wait for PostgreSQL database if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
    echo "==> Waiting for PostgreSQL database connection..."
    python - <<'EOF'
import os
import sys
import time
from urllib.parse import urlparse
import psycopg

db_url = os.getenv("DATABASE_URL")
if not db_url:
    sys.exit(0)

parsed = urlparse(db_url)
host = parsed.hostname or "127.0.0.1"
port = parsed.port or 5432
dbname = parsed.path.lstrip("/")
user = parsed.username or ""
password = parsed.password or ""
ssl_mode = os.getenv("DB_SSL_MODE", "disable")

max_retries = 30
retry_interval = 2

for i in range(1, max_retries + 1):
    try:
        conn = psycopg.connect(
            host=host,
            port=port,
            dbname=dbname,
            user=user,
            password=password,
            sslmode=ssl_mode,
            connect_timeout=3,
        )
        conn.close()
        print("==> Database connection established successfully!")
        sys.exit(0)
    except Exception as e:
        print(f"==> Waiting for database ({i}/{max_retries})... ({e})")
        time.sleep(retry_interval)

print("==> Error: Database connection timed out after 60 seconds.")
sys.exit(1)
EOF
fi

# Run migrations if this is the main API container or migrations are explicitly requested
if [ "$RUN_MIGRATIONS" = "true" ] || [ "$1" = "gunicorn" ]; then
    echo "==> Applying database migrations..."
    python manage.py migrate --noinput

    echo "==> Collecting static assets..."
    python manage.py collectstatic --noinput || true

    if [ "$AUTO_SETUP_ADMIN" = "true" ] && [ -n "$ADMIN_INITIAL_PASSWORD" ]; then
        echo "==> Ensuring admin user exists..."
        python manage.py setup_admin --password "$ADMIN_INITIAL_PASSWORD" || true
    fi
fi

echo "==> Executing: $@"
exec "$@"
