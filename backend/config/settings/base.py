"""
Django base settings for NJ Stars Elite AAU platform
"""

from pathlib import Path
from decouple import config
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=lambda v: [s.strip() for s in v.split(',')])


# Application definition

INSTALLED_APPS = [
    # Django core
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',

    # Third party - Auth
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.facebook',
    'allauth.socialaccount.providers.apple',
    'dj_rest_auth',
    'dj_rest_auth.registration',

    # Third party - API
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'django_filters',

    # Third party - Wagtail
    'wagtail.contrib.forms',
    'wagtail.contrib.redirects',
    'wagtail.embeds',
    'wagtail.sites',
    'wagtail.users',
    'wagtail.snippets',
    'wagtail.documents',
    'wagtail.images',
    'wagtail.search',
    'wagtail.admin',
    'wagtail',
    'wagtail.api.v2',
    'modelcluster',
    'taggit',
    'wagtail_modeladmin',

    # Local apps
    'apps.core',
    'apps.events',
    'apps.registrations',
    'apps.payments',
    'apps.cms',
    'apps.portal',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'wagtail.contrib.redirects.middleware.RedirectMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

# Use DATABASE_URL if available (Railway, Heroku, etc.), otherwise use individual settings
DATABASE_URL = config('DATABASE_URL', default=None)

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME', default='njstars'),
            'USER': config('DB_USER', default='postgres'),
            'PASSWORD': config('DB_PASSWORD', default='postgres'),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
        }
    }


# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'America/New_York'  # Eastern Time for NJ

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# Wagtail settings
WAGTAIL_SITE_NAME = 'NJ Stars Elite AAU'
WAGTAILADMIN_BASE_URL = config('WAGTAIL_ADMIN_URL', default='http://localhost:8000')


# Stripe settings
STRIPE_PUBLIC_KEY = config('STRIPE_PUBLIC_KEY', default='')
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='')


# Print-on-Demand (Printify Integration)
# Two product types: POD (via Printify) and Local (coach delivery)
# See documentation/plans/PRINTIFY_INTEGRATION.md for setup guide
PRINTIFY_API_KEY = config('PRINTIFY_API_KEY', default='')
PRINTIFY_SHOP_ID = config('PRINTIFY_SHOP_ID', default='')
PRINTIFY_WEBHOOK_SECRET = config('PRINTIFY_WEBHOOK_SECRET', default='')


# Instagram Graph API
# See documentation/NEXT_STEPS.md for setup guide
INSTAGRAM_ACCESS_TOKEN = config('INSTAGRAM_ACCESS_TOKEN', default='')
INSTAGRAM_BUSINESS_ACCOUNT_ID = config('INSTAGRAM_BUSINESS_ACCOUNT_ID', default='')
META_APP_ID = config('META_APP_ID', default='')
META_APP_SECRET = config('META_APP_SECRET', default='')


# django-allauth settings
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

SITE_ID = 1

ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_EMAIL_VERIFICATION = 'optional'

# Custom adapter for email confirmation URLs
ACCOUNT_ADAPTER = 'apps.portal.adapters.CustomAccountAdapter'

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'},
        'APP': {
            'client_id': config('GOOGLE_CLIENT_ID', default=''),
            'secret': config('GOOGLE_CLIENT_SECRET', default=''),
        }
    },
    'facebook': {
        'METHOD': 'oauth2',
        'SCOPE': ['email', 'public_profile'],
        'APP': {
            'client_id': config('FACEBOOK_APP_ID', default=''),
            'secret': config('FACEBOOK_APP_SECRET', default=''),
        }
    },
    'apple': {
        'APP': {
            'client_id': config('APPLE_CLIENT_ID', default=''),
            'secret': config('APPLE_KEY_ID', default=''),
            'key': config('APPLE_PRIVATE_KEY', default=''),
        }
    }
}


# CORS settings
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000',
    cast=lambda v: [s.strip() for s in v.split(',')]
)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-bag-session',  # Custom header for guest bag session tracking
]


# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}


# Frontend URL (Next.js app)
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')

# Backend URL (Django API) - used for email verification links
BACKEND_URL = config('BACKEND_URL', default='http://localhost:8000')


# dj-rest-auth settings
REST_AUTH = {
    'USE_JWT': False,  # Using Token auth, not JWT
    'TOKEN_MODEL': 'rest_framework.authtoken.models.Token',
    'PASSWORD_RESET_USE_SITES_DOMAIN': False,
    'OLD_PASSWORD_FIELD_ENABLED': True,
    'LOGOUT_ON_PASSWORD_CHANGE': False,
    'REGISTER_SERIALIZER': 'apps.portal.auth_serializers.CustomRegisterSerializer',
    'USER_DETAILS_SERIALIZER': 'apps.portal.auth_serializers.UserDetailsSerializer',
}

# Password reset email settings
ACCOUNT_EMAIL_SUBJECT_PREFIX = '[NJ Stars Elite] '
PASSWORD_RESET_TIMEOUT = 86400  # 24 hours in seconds

# =============================================================================
# EMAIL CONFIGURATION
# =============================================================================
# Currently using Django's built-in email backend.
# For production at scale, consider migrating to:
#   - SendGrid (recommended for transactional emails)
#   - Amazon SES (cost-effective at scale)
#   - Mailgun (good deliverability)
#   - Postmark (excellent for transactional)
#
# TODO: Migrate to dedicated email service when:
#   - Monthly email volume exceeds 500 emails
#   - Need for email analytics/tracking
#   - Deliverability becomes a concern
# =============================================================================

# Default email settings (can be overridden in development.py/production.py)
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='NJ Stars Elite <noreply@njstarselite.com>')
SERVER_EMAIL = config('SERVER_EMAIL', default='NJ Stars Elite <noreply@njstarselite.com>')

# Email templates context
EMAIL_CONTEXT = {
    'site_name': 'NJ Stars Elite AAU',
    'support_email': 'support@njstarselite.com',
    'site_url': FRONTEND_URL,
}
