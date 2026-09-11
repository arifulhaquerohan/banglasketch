from .base import *

DEBUG = False

# Production must require secrets even when NODE_ENV is absent or set to development.
for required_secret in ("DJANGO_SECRET_KEY", "ADMIN_JWT_SECRET", "TOTP_ENCRYPTION_KEY"):
    if not os.getenv(required_secret):
        raise ImproperlyConfigured(f"{required_secret} must be set in production environment")

REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = ["rest_framework.renderers.JSONRenderer"]

# Production-specific settings
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True
