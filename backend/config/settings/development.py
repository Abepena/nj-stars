"""
Development settings for NJ Stars Elite AAU platform
"""

from .base import *
from decouple import config

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

# Allow configuration via env var for Railway, with sensible defaults including Railway dev domain
ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS',
    default='localhost,127.0.0.1,0.0.0.0,backend,api.development.njstarselite.com,.railway.app',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

# CSRF trusted origins - includes Railway dev and Vercel preview domains by default
CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default='http://localhost:3000,http://127.0.0.1:3000,https://api.development.njstarselite.com,https://*.vercel.app,https://*.railway.app',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

# CORS for Railway development
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
    r"^https://.*\.railway\.app$",
    r"^https://.*\.njstarselite\.com$",
]

# =============================================================================
# EMAIL CONFIGURATION (MailHog for development)
# =============================================================================
# MailHog captures all emails for testing without sending them
# Web UI: http://localhost:8025
# SMTP: mailhog:1025 (inside Docker network)
# =============================================================================
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='mailhog')
EMAIL_PORT = config('EMAIL_PORT', default=1025, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=False, cast=bool)
EMAIL_HOST_USER = ''
EMAIL_HOST_PASSWORD = ''

# Disable some security features for local development
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Django Debug Toolbar (optional - install if needed)
# INSTALLED_APPS += ['debug_toolbar']
# MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
# INTERNAL_IPS = ['127.0.0.1']

# =============================================================================
# CLOUDINARY CONFIGURATION (Optional for development)
# =============================================================================
# Enable Cloudinary in development if credentials are provided.
# Useful for Railway "development" environment which has ephemeral storage.
# Local Docker development can skip this (uses local /media/ folder).
# =============================================================================
CLOUDINARY_CLOUD_NAME = config('CLOUDINARY_CLOUD_NAME', default='')
CLOUDINARY_API_KEY = config('CLOUDINARY_API_KEY', default='')
CLOUDINARY_API_SECRET = config('CLOUDINARY_API_SECRET', default='')

if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    INSTALLED_APPS += ['cloudinary_storage', 'cloudinary']

    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': CLOUDINARY_CLOUD_NAME,
        'API_KEY': CLOUDINARY_API_KEY,
        'API_SECRET': CLOUDINARY_API_SECRET,
    }

    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

    import logging
    logging.info("Cloudinary configured for media storage (development)")
