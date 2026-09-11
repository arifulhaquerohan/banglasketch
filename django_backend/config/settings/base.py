"""
Django settings for banglasketch_api project.
"""

import os
from pathlib import Path
from urllib.parse import urlparse
from dotenv import load_dotenv

from django.core.exceptions import ImproperlyConfigured

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parents[2]

# Load environment variables from django_backend/.env or backend/.env or root .env
for env_path in [
    BASE_DIR / ".env",
    BASE_DIR.parent / "backend" / ".env",
    BASE_DIR.parent / ".env",
]:
    if env_path.exists():
        load_dotenv(env_path)
        break

DEBUG = os.getenv("NODE_ENV", "development") != "production"

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    if not DEBUG:
        raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set in production environment")
    SECRET_KEY = "django-insecure-banglasketch-production-key-seed-98213974"

allowed_hosts_str = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,0.0.0.0,testserver")
ALLOWED_HOSTS = [h.strip() for h in allowed_hosts_str.split(",") if h.strip()]
if "testserver" not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append("testserver")

APPEND_SLASH = False

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "corsheaders",
    "rest_framework",
    # Local Apps
    "apps.authentication.apps.AuthenticationConfig",
    "apps.core.apps.CoreConfig",
    "apps.projects.apps.ProjectsConfig",
    "apps.blog.apps.BlogConfig",
    "apps.media_assets.apps.MediaAssetsConfig",
    "apps.leads.apps.LeadsConfig",
    "apps.clients.apps.ClientsConfig",
    "apps.chatbot.apps.ChatbotConfig",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and (DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://")):
    parsed = urlparse(DATABASE_URL)
    # Handle Supabase/PostgreSQL SSL options from environment
    ssl_mode = os.getenv("DB_SSL_MODE", "require")
    ssl_ca_file = os.getenv("DB_SSL_CA_FILE")

    # Map common SSL modes to psycopg options
    # 'require' = sslmode='require' (default)
    # 'verify-ca' = sslmode='verify-ca'
    # 'verify-full' = sslmode='verify-full'
    ssl_options = {}
    if ssl_mode == "verify-ca" or ssl_mode == "verify-full":
        if ssl_ca_file:
            ssl_options["sslrootcert"] = ssl_ca_file
        else:
            # Log warning or raise error if verification is requested but CA file is missing
            pass

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": parsed.path.lstrip("/"),
            "USER": parsed.username or "",
            "PASSWORD": parsed.password or "",
            "HOST": parsed.hostname or "localhost",
            "PORT": parsed.port or 5432,
            "CONN_MAX_AGE": int(os.getenv("CONN_MAX_AGE", 60)),
            "OPTIONS": {
                "sslmode": ssl_mode,
                **ssl_options,
            },
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# Password Hashers (Supports existing bcrypt hashes from Express)
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
    "django.contrib.auth.hashers.BCryptPasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]

# REST Framework Configuration
REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "config.pagination.EnvelopePagination",
    "PAGE_SIZE": 24,
    "EXCEPTION_HANDLER": "config.exceptions.custom_exception_handler",
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.authentication.auth.AdminJWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
}

if DEBUG:
    REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"].append("rest_framework.renderers.BrowsableAPIRenderer")

# CORS Configuration
frontend_url_str = os.getenv("FRONTEND_URL", "http://localhost:3000,http://127.0.0.1:3000")
CORS_ALLOWED_ORIGINS = [u.strip() for u in frontend_url_str.split(",") if u.strip()]
CORS_ALLOW_CREDENTIALS = True

# JWT Secrets & Config
ADMIN_JWT_SECRET = os.getenv("ADMIN_JWT_SECRET")
if not ADMIN_JWT_SECRET:
    if not DEBUG:
        raise ImproperlyConfigured("ADMIN_JWT_SECRET must be set in production environment")
    ADMIN_JWT_SECRET = "super-secret-jwt-key-banglasketch-32bytes"
ADMIN_TOKEN_TTL_HOURS = 8
ADMIN_RECOVERY_EMAIL = os.getenv("ADMIN_RECOVERY_EMAIL", "arifulhaquerohan@gmail.com")

# TOTP 2FA Encryption Key (AES-256-GCM 32-bytes base64 encoded)
TOTP_ENCRYPTION_KEY = os.getenv("TOTP_ENCRYPTION_KEY")
if not TOTP_ENCRYPTION_KEY:
    if not DEBUG:
        raise ImproperlyConfigured("TOTP_ENCRYPTION_KEY must be set in production environment")
    TOTP_ENCRYPTION_KEY = "MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI="

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")

if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    import cloudinary
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
        secure=True,
    )

# Email / SMTP Configuration
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("SMTP_PORT", 587))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv("SMTP_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("SMTP_PASS", "")
DEFAULT_FROM_EMAIL = os.getenv("CONTACT_EMAIL", os.getenv("SMTP_USER", "info@banglasketch.com"))

# ... (keeping existing, removing DEBUG, SECURE_HSTS, etc.)
# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Dhaka"
USE_I18N = True
USE_TZ = True

# Static & Media
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "uploads/"
MEDIA_ROOT = BASE_DIR / "uploads"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
