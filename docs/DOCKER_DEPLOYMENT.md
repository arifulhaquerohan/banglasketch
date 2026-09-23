# Bangla Sketch — Docker & Production Deployment Guide

This repository contains a containerized production deployment setup for the **Bangla Sketch Architectural Studio** web platform, orchestrating:
- **Next.js 15** standalone frontend (Node.js 20 Alpine)
- **Django 5.1** REST API (Gunicorn WSGI server on Python 3.12 Slim)
- **WeasyPrint** headless PDF generation engine (Cairo/Pango/FontConfig)
- **PostgreSQL 16** relational database with persistent volumes
- **Redis 7** caching and asynchronous queue backend
- **Django Job Scheduler** (`python manage.py run_jobs`) for periodic tasks
- **Django Email Worker** (`python manage.py run_email_worker`) for transactional SMTP queues
- **Nginx** reverse proxy with TLS termination, rate limiting, and security headers

---

## 1. Quickstart Deployment

### Prerequisites
- Docker Engine 24.0+ and Docker Compose v2.20+
- A Linux server (Ubuntu 22.04 / 24.04 LTS or Debian 12 recommended) with at least 2GB RAM.

### Step 1: Clone Repository & Create Environment Configuration
```bash
git clone git@github.com:arifulhaquerohan/banglasketch.git
cd banglasketch

# Copy environment template
cp .env.docker.example .env.docker
```

### Step 2: Generate Secure Production Keys
Generate strong cryptographic keys for Django, JWT, and TOTP:

```bash
# Generate Django Secret Key
python3 -c "import secrets; print('DJANGO_SECRET_KEY=' + secrets.token_urlsafe(50))"

# Generate Admin JWT Secret
python3 -c "import secrets; print('ADMIN_JWT_SECRET=' + secrets.token_urlsafe(32))"

# Generate AES-256 TOTP Encryption Key (Base64 encoded 32 bytes)
python3 -c "import secrets, base64; print('TOTP_ENCRYPTION_KEY=' + base64.b64encode(secrets.token_bytes(32)).decode())"
```

Paste the generated keys and configure your domain names, Cloudinary credentials, and SMTP settings inside `.env.docker`.

---

## 2. Launching the Docker Stack

### Build & Start Containers
```bash
docker compose up --build -d
```

### Inspect Container Health & Logs
```bash
# View live status of all services
docker compose ps

# Inspect logs of a specific service
docker compose logs -f django_api
docker compose logs -f frontend
docker compose logs -f django_email_worker
```

---

## 3. Database Management & Superuser Setup

### Create Initial Studio Superuser
To create an administrative account interactively:
```bash
docker compose exec django_api python manage.py createsuperuser
```

Or run the custom studio setup command:
```bash
docker compose exec django_api python manage.py setup_admin --password "YourStrongPasswordHere"
```

### Apply Migrations Manually (if needed)
```bash
docker compose exec django_api python manage.py migrate
```

---

## 4. SSL / TLS Setup with Let's Encrypt & Certbot

Nginx is pre-configured to handle ACME challenge files at `/.well-known/acme-challenge/`.

To obtain certificates for your domain:
```bash
sudo certbot certonly --webroot \
  -w /var/lib/docker/volumes/banglasketch_certbot_webroot/_data \
  -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

Once certificates are obtained, uncomment the SSL block in `nginx/nginx.conf` and reload Nginx:
```bash
docker compose exec nginx nginx -s reload
```

---

## 5. Automated Database Backups & Encryption

The project includes an encrypted, zero-plain-text backup utility (`apps.core.management.commands.backup_database`).

To run an ad-hoc encrypted backup:
```bash
docker compose exec django_api python manage.py backup_database --output /tmp/db_backup.enc
```

---

## 6. Continuous Integration (GitHub Actions)

Every pull request and commit to `main` runs the automated CI workflow at `.github/workflows/ci.yml`:
1. **Django Backend Tests**: Runs all 77 test cases against an isolated PostgreSQL 16 container.
2. **Frontend Typechecks & Unit Tests**: Runs Node.js 20 unit tests and verifies full-stack Next.js production builds.
