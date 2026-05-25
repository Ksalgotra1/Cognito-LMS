"""
Development settings — local dev environment.
Extends base.py with debug-friendly defaults.
"""
from .base import *  # noqa: F401,F403

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Database: Use DATABASE_URL if set, fallback to SQLite for quick local dev
DATABASE_URL = get_env_variable('DATABASE_URL', default=None, required=False)

if DATABASE_URL:
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.config(default=DATABASE_URL)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# CORS: Explicitly allow frontend origin
CORS_ALLOWED_ORIGINS = [
    FRONTEND_URL,
    FRONTEND_URL.replace('localhost', '127.0.0.1'),
    FRONTEND_URL.replace('127.0.0.1', 'localhost'),
]

# Site URL for certificate QR codes etc.
SITE_URL = "http://127.0.0.1:8000"
