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
Copy `.env.example` to `.env` (or let it auto-read from `../backend/.env`):
```bash
cp .env.example .env
```

### 3. Database Migrations
To apply initial migrations without conflicting with existing PostgreSQL tables:
```bash
python manage.py migrate --fake-initial
```

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

Run the full integration test suite:
```bash
python manage.py test tests.test_api --keepdb -v2
```

Tests cover:
- Public portfolio projects (list, pagination envelope, category filter, search, detail)
- Public blog articles (list, detail view count increment)
- Public media assets (videos, testimonials)
- Lead capture (contact inquiries, newsletter subscriptions)
- Client portal access & proposal decision approvals
- Admin JWT authentication, profile, password reset, 2FA
- Admin CRUD (projects, blog, videos, testimonials, settings)
- Soft delete, trash listing, restore, and permanent deletion
- Cloudinary upload signing

---

## Production Deployment

### Gunicorn
Run via Gunicorn with 3 workers:
```bash
gunicorn banglasketch_api.wsgi:application --bind 127.0.0.1:5000 --workers 3
```

### PM2 Integration
Add or run with PM2:
```bash
pm2 start "django_backend/.venv/bin/gunicorn banglasketch_api.wsgi:application --bind 127.0.0.1:5000 --workers 3" --name banglasketch-backend
```
