"""
Base settings — shared across dev and prod.
Contains everything that doesn't change between environments.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
# Note: extra .parent because settings is now a package (settings/)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
env_path = BASE_DIR / '.env'
load_dotenv(dotenv_path=env_path)


# --- ENVIRONMENT VALIDATION ---
def get_env_variable(var_name, default=None, required=True):
    """
    Get environment variable or raise an error if required and not set.
    """
    value = os.getenv(var_name, default)
    if required and value is None:
        error_msg = f"Environment variable '{var_name}' is not set!"
        if 'runserver' in sys.argv or 'migrate' in sys.argv:
            raise ValueError(error_msg)
        print(f"⚠️ WARNING: {error_msg}")
    return value


# Required environment variables
SECRET_KEY = get_env_variable('SECRET_KEY', required=True)
REDIS_URL = get_env_variable('REDIS_URL', default='redis://localhost:6379/0', required=False)
FRONTEND_URL = get_env_variable('FRONTEND_URL', default='http://localhost:5173', required=False)

# Application definition

INSTALLED_APPS = [
    "users",
    "courses",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'mysite.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'mysite.wsgi.application'


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# Static files
STATIC_URL = 'static/'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model
AUTH_USER_MODEL = 'users.User'

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 24,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'user': '100/hour',
        'ai': '10/minute',
        'search': '200/minute',
        'search_ai_fallback': '5/minute',
    }
}

# --- INFRASTRUCTURE DEFENSE ---
# Reject payloads larger than 1MB before parsing (protects against memory exhaustion)
DATA_UPLOAD_MAX_MEMORY_SIZE = 1048576

# Simple JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# Redis Cache — derived from REDIS_URL env var
# REDIS_URL default is redis://localhost:6379/0 (broker); cache uses logical db /1
_redis_base = REDIS_URL.rsplit('/', 1)[0]  # strip trailing db number
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": f"{_redis_base}/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}

# Celery — broker and result backend on db0 (from REDIS_URL directly)
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_RESULT_EXPIRES = 3600

# Task time limits — prevent stuck AI calls from blocking workers forever.
# SoftTimeLimitExceeded is raised first (allows graceful cleanup at 25s);
# the hard limit forcibly kills the process at 30s.
CELERY_TASK_TIME_LIMIT = 30
CELERY_TASK_SOFT_TIME_LIMIT = 25

# --- AI Provider Configuration ---
# Options: 'ollama' (local Llama 3, free) | 'openai' (GPT-4o via GitHub Models)
AI_PROVIDER = get_env_variable('AI_PROVIDER', default='ollama', required=False)
AI_MODEL = get_env_variable('AI_MODEL', default='llama3', required=False)
AI_API_KEY = get_env_variable('AI_API_KEY', default='', required=False)
