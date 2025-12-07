"""
Production settings for NJ Stars Elite AAU platform
"""

from .base import *

DEBUG = False

ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS',
    default='njstarselite.com,www.njstarselite.com',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

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
    default='https://*.railway.app,https://*.njstarselite.com',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

# Email configuration (add when ready)
# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_HOST = config('EMAIL_HOST', default='smtp.sendgrid.net')
# EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
# EMAIL_USE_TLS = True
# EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
# EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
# DEFAULT_FROM_EMAIL = 'admin@njstarselite.com'

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
