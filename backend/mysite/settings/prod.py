"""
Production settings — deployed environment.
Extends base.py with strict security and PostgreSQL.
"""

from .base import *

DEBUG = False

# Must be set via ALLOWED_HOSTS env var in production
ALLOWED_HOSTS_STR = get_env_variable("ALLOWED_HOSTS", default="", required=True)
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_STR.split(",") if host.strip()]

# Database: PostgreSQL required in production
DATABASE_URL = get_env_variable("DATABASE_URL", required=True)
import dj_database_url

DATABASES = {"default": dj_database_url.config(default=DATABASE_URL)}

# CORS: Only allow specific production origins
CORS_ALLOWED_ORIGINS_STR = get_env_variable("CORS_ALLOWED_ORIGINS", default="", required=False)
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in CORS_ALLOWED_ORIGINS_STR.split(",") if origin.strip()]

# Security hardening
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = "DENY"
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Site URL (set via env in production)
SITE_URL = get_env_variable("SITE_URL", default="https://example.com", required=False)

# Static files — collectstatic writes here; Nginx serves from this directory
STATIC_ROOT = BASE_DIR / "staticfiles"

# HTTPS enforcement behind reverse proxy (Nginx terminates TLS, forwards X-Forwarded-Proto)
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# CSRF trusted origins — required for Django admin login over HTTPS
# Set via env var; falls back to SITE_URL if not explicitly provided
CSRF_TRUSTED_ORIGINS_STR = get_env_variable("CSRF_TRUSTED_ORIGINS", default="", required=False)
CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in CSRF_TRUSTED_ORIGINS_STR.split(",") if origin.strip()]
if not CSRF_TRUSTED_ORIGINS and SITE_URL:
    CSRF_TRUSTED_ORIGINS = [SITE_URL]
