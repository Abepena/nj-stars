"""
Production settings for NJ Stars Elite AAU platform
"""

from .base import *

DEBUG = False

ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS',
    default='njstarselite.com,www.njstarselite.com,api.njstarselite.com,.vercel.app',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

# CORS: Allow Vercel preview deployments (pattern match)
# This supplements CORS_ALLOWED_ORIGINS from base.py
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",  # All Vercel preview URLs
]

# Security settings for production
# Note: Railway handles SSL termination, so we disable SECURE_SSL_REDIRECT
# to prevent redirect loops with health checks
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=False, cast=bool)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Trust Railway's proxy
CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default='https://*.railway.app,https://*.njstarselite.com,https://*.vercel.app',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

# CORS: Allow Vercel preview deployments (pattern match)
# This supplements CORS_ALLOWED_ORIGINS from base.py
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",  # All Vercel preview URLs
]

# =============================================================================
# EMAIL CONFIGURATION - PRODUCTION
# =============================================================================
# Using Django's SMTP backend with configurable provider
# Supported: Gmail, SendGrid, AWS SES, Mailgun, or any SMTP server
#
# Environment variables needed:
#   EMAIL_HOST - SMTP server hostname
#   EMAIL_PORT - SMTP port (usually 587 for TLS, 465 for SSL)
#   EMAIL_HOST_USER - SMTP username/API key
#   EMAIL_HOST_PASSWORD - SMTP password/API secret
#   EMAIL_USE_TLS - Use TLS (default: True)
#
# Example configurations in .env:
#
# SendGrid:
#   EMAIL_HOST=smtp.sendgrid.net
#   EMAIL_PORT=587
#   EMAIL_HOST_USER=apikey
#   EMAIL_HOST_PASSWORD=SG.xxxxx
#
# Gmail (requires App Password):
#   EMAIL_HOST=smtp.gmail.com
#   EMAIL_PORT=587
#   EMAIL_HOST_USER=your-email@gmail.com
#   EMAIL_HOST_PASSWORD=your-app-password
#
# Amazon SES:
#   EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
#   EMAIL_PORT=587
#   EMAIL_HOST_USER=AKIAXXXXXXXX
#   EMAIL_HOST_PASSWORD=xxxxx
# =============================================================================

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_USE_SSL = config('EMAIL_USE_SSL', default=False, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_TIMEOUT = 30  # seconds

# Fallback to console if email credentials not configured
if not EMAIL_HOST_USER or not EMAIL_HOST_PASSWORD:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    import logging
    logging.warning("EMAIL_HOST_USER or EMAIL_HOST_PASSWORD not set - using console email backend")

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# =============================================================================
# CLOUDINARY CONFIGURATION - Media File Storage
# =============================================================================
# Cloudinary provides persistent cloud storage for uploaded media files.
# Railway's filesystem is ephemeral - files are lost on redeploy.
#
# Setup:
# 1. Create free account at https://cloudinary.com
# 2. Go to Dashboard to find your credentials
# 3. Add to Railway environment variables:
#    CLOUDINARY_CLOUD_NAME=your-cloud-name
#    CLOUDINARY_API_KEY=your-api-key
#    CLOUDINARY_API_SECRET=your-api-secret
# =============================================================================

CLOUDINARY_CLOUD_NAME = config('CLOUDINARY_CLOUD_NAME', default='')
CLOUDINARY_API_KEY = config('CLOUDINARY_API_KEY', default='')
CLOUDINARY_API_SECRET = config('CLOUDINARY_API_SECRET', default='')

if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    # Cloudinary is configured - use it for media storage
    INSTALLED_APPS += ['cloudinary_storage', 'cloudinary']

    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': CLOUDINARY_CLOUD_NAME,
        'API_KEY': CLOUDINARY_API_KEY,
        'API_SECRET': CLOUDINARY_API_SECRET,
    }

    # Use Cloudinary for media files
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

    import logging
    logging.info("Cloudinary configured for media storage")
else:
    import logging
    logging.warning("Cloudinary not configured - media files will use local storage (ephemeral on Railway)")
