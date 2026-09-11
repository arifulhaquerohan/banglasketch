# Bangla Sketch — Django REST Framework Backend

This is the Django REST Framework migration candidate for Bangla Sketch (বাংলা স্কেচ). Public projects have PostgreSQL and frontend fetching contract coverage. Full backend compatibility and production readiness are still under review; see [the migration audit](../docs/DJANGO_MIGRATION_AUDIT.md). The feature descriptions below describe implementation intent, not a completed compatibility certification.

---

## Key Features

1. **Exact Schema Mapping (`db_table`):**
   - Connects directly to the existing PostgreSQL database schema (`projects`, `blog_posts`, `videos`, `testimonials`, `clients`, `enquiries`, `admin_users`, etc.).
   - No data migration or loss of existing content.
   
2. **Frontend Compatibility:**
   - Standard envelope response: `{ "success": true, "data": ..., "pagination": { "page": 1, "limit": 24, "hasMore": false, "nextCursor": null } }`.
   - Error envelope: `{ "success": false, "error": "Reason" }`.
   - Handles both trailing slash and slashless URLs (`/api/projects` and `/api/projects/`).
   - Supports both `/api/` and legacy `/api/v1/` route prefixes.

3. **Security & Authentication:**
   - HS256 JWT Authentication with `token_version` invalidation matching Express session management.
   - Native Bcrypt password hashing (`$2a$` and `$2b$` support).
   - Time-based One-Time Passwords (TOTP RFC 6238) for Two-Factor Authentication (2FA) via `pyotp`.
   - Role-based permissions (`owner` > `admin` > `editor` > `viewer`).
   - Cloudinary upload signature generation (`/api/admin/cloudinary-sign`).
   - Audit logging (`audit_logs`) and Content Versioning (`content_versions`).

4. **Dual Admin Interface:**
   - Next.js Headless Admin CMS integration via `/api/admin/*`.
   - Django Built-in Admin Interface at `/django-admin/` with inlines for Proposals, Proposal Versions, Change Orders, and Enquiry Follow-ups.

---

## Getting Started

### 1. Virtual Environment & Dependencies
```bash
cd django_backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Environment Variables
Copy `.env.example` to `.env` and set the production values before deployment:
```bash
cp .env.example .env
```

### 3. Database Migrations
For a new local database:
```bash
python manage.py migrate
```

For an existing PostgreSQL database, first restore a copy and verify the schema. Use `--fake-initial` only after that verification confirms Django's initial tables already match the existing tables.

### 4. Create or Setup Django Admin Superuser
```bash
python manage.py setup_admin
```
This configures a superuser matching the owner account in `admin_users` for `/django-admin/`.

### 5. Run Development Server
```bash
python manage.py runserver 5000
```
Runs at `http://127.0.0.1:5000/`.

---

## Running Automated Tests

Run the complete test suite against PostgreSQL:
```bash
python manage.py test tests --keepdb -v2
```

Test suites include:
- `tests/test_api.py`: Public endpoints (projects, blog, videos, testimonials, contact, newsletter, portal) and admin CRUD, soft-deletes, restore, settings, Cloudinary upload signatures.
- `tests/test_auth_security.py`: AES-256-GCM TOTP secret encryption/decryption, 2FA workflow, login rate limiting, owner role invariants, and login audit trail logging.
- `tests/test_email_jobs.py`: Lead submission atomicity, anti-spam honeypot and timing checks, background email job processor with exponential backoff, and scheduled blog publishing.
- `tests/test_client_handling.py`: Client enquiries, intake follow-ups, proposal lifecycle, and client portal access tokens.

---

## Background Services & Management Commands

### 1. Reliable Email Worker
Processes queued contact notifications and confirmation emails with atomic `SKIP LOCKED` concurrency and exponential backoff retries:
```bash
python manage.py run_email_worker
```
For a single one-off batch (e.g. cron job):
```bash
python manage.py run_email_worker --once
```

### 2. Scheduled Jobs & Data Purging
Publishes scheduled blog posts and purges expired rate limits and stale operational records:
```bash
python manage.py run_jobs
```
One-off mode:
```bash
python manage.py run_jobs --once
```

### 3. Encrypted Database Backup & Verification
Creates an AES-256-GCM encrypted database dump using `pg_dump`:
```bash
python scripts/backup.py
```
Decrypts and validates the integrity of a backup archive:
```bash
python scripts/verify_backup.py
```

---

## Production Deployment

### Gunicorn
Run via Gunicorn with 3 workers:
```bash
gunicorn banglasketch_api.wsgi:application --bind 127.0.0.1:5000 --workers 3
```

### PM2 Integration
Run backend API and workers via PM2:
```bash
pm2 start "django_backend/.venv/bin/gunicorn banglasketch_api.wsgi:application --bind 127.0.0.1:5000 --workers 3" --name banglasketch-api
pm2 start "django_backend/.venv/bin/python manage.py run_email_worker" --name banglasketch-email-worker
pm2 start "django_backend/.venv/bin/python manage.py run_jobs" --name banglasketch-scheduler
```
