# Django + Wagtail Rebuild - Implementation Plan

> **Status:** Phase 2 Complete • Phase 3 In Progress • Phase 4 Started (Wagtail pages)
> **Date:** December 4, 2024 (updated with Phase 4 kickoff)

This document outlines the complete implementation plan for rebuilding the NJ Stars platform with Django + Wagtail CMS.

---

## 🎯 Implementation Overview

### What We're Building
- **Django 5.0** backend with **Wagtail 6.0** CMS
- **Keep all current features:** Merch store, Instagram integration, blog posts, events
- **Add new features:** Subscriptions, enhanced events, team management, Wagtail CMS for non-technical users
- **Print-on-Demand:** Integrate Printful for merch fulfillment
- **Single-tenant now:** Multi-tenant ready for future expansion

### What We're Keeping
- Next.js 14 frontend (update API calls only)
- Docker infrastructure (update for Django)
- All current pages and UI components
- Mobile-ready architecture
- Testing infrastructure (pytest for Django)

---

## Phase 2: Django Settings Configuration

### Files to Create/Modify

#### `backend/config/settings/base.py` (Split settings)
```python
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)

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

    # Third party - API
    'rest_framework',
    'corsheaders',

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

# Database
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

# Wagtail
WAGTAIL_SITE_NAME = 'NJ Stars Elite AAU'
WAGTAILADMIN_BASE_URL = config('WAGTAIL_ADMIN_URL', default='http://localhost:8000')

# Stripe
STRIPE_PUBLIC_KEY = config('STRIPE_PUBLIC_KEY')
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET')

# Print-on-Demand (Future - Phase 2)
# PRINTIFY_API_KEY = config('PRINTIFY_API_KEY', default='')

# Instagram
INSTAGRAM_ACCESS_TOKEN = config('INSTAGRAM_ACCESS_TOKEN', default='')
INSTAGRAM_USER_ID = config('INSTAGRAM_USER_ID', default='')

# django-allauth
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

SITE_ID = 1

ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_EMAIL_VERIFICATION = 'optional'

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'},
    },
    'facebook': {
        'METHOD': 'oauth2',
        'SCOPE': ['email', 'public_profile'],
    },
    'apple': {
        'APP': {
            'client_id': config('APPLE_CLIENT_ID', default=''),
            'secret': config('APPLE_KEY_ID', default=''),
            'key': config('APPLE_PRIVATE_KEY', default=''),
        }
    }
}

# CORS
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000',
    cast=lambda v: [s.strip() for s in v.split(',')]
)
CORS_ALLOW_CREDENTIALS = True

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

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

#### `backend/config/settings/development.py`
```python
from .base import *

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Use console email backend in dev
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

#### `backend/config/settings/production.py`
```python
from .base import *

DEBUG = False
ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=lambda v: [s.strip() for s in v.split(',')])

# Security settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
```

#### `backend/.env.example`
```bash
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=njstars
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# Wagtail
WAGTAIL_ADMIN_URL=http://localhost:8000

# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Print-on-Demand (Phase 2 - Future)
# PRINTIFY_API_KEY=your-printify-key

# Instagram (optional)
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_USER_ID=

# Social Auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
APPLE_CLIENT_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## Phase 3: Django Models

### Events App (`apps/events/models.py`)

```python
from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify

User = get_user_model()

class EventType(models.TextChoices):
    TRYOUT = 'tryout', 'Tryout'
    OPEN_GYM = 'open_gym', 'Open Gym'
    TOURNAMENT = 'tournament', 'Tournament'
    PRACTICE = 'practice', 'Practice'
    CAMP = 'camp', 'Camp'
    GAME = 'game', 'Game'

class Event(models.Model):
    """Event model with enhanced registration features"""
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField()
    event_type = models.CharField(max_length=20, choices=EventType.choices)

    # Date & Time
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    location = models.CharField(max_length=255)

    # Payment settings
    requires_payment = models.BooleanField(default=False)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stripe_price_id = models.CharField(max_length=255, blank=True, help_text="Stripe Price ID for this event")

    # Registration settings
    max_participants = models.IntegerField(null=True, blank=True, help_text="Leave blank for unlimited")
    registration_open = models.BooleanField(default=True)
    registration_deadline = models.DateTimeField(null=True, blank=True)

    # Metadata
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_events')

    class Meta:
        ordering = ['-start_datetime']
        indexes = [
            models.Index(fields=['event_type', 'start_datetime']),
            models.Index(fields=['registration_open', 'start_datetime']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.start_datetime.strftime('%Y-%m-%d')}"

    @property
    def spots_remaining(self):
        if not self.max_participants:
            return None
        registered = self.registrations.filter(payment_status='completed').count()
        return max(0, self.max_participants - registered)

    @property
    def is_full(self):
        if not self.max_participants:
            return False
        return self.spots_remaining == 0
```

### Registrations App (`apps/registrations/models.py`)

```python
from django.db import models
from django.contrib.auth import get_user_model
from apps.events.models import Event

User = get_user_model()

class EventRegistration(models.Model):
    """Enhanced event registration with participant details"""
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_registrations')

    # Participant info (may differ from user for parent registering child)
    participant_first_name = models.CharField(max_length=100)
    participant_last_name = models.CharField(max_length=100)
    participant_age = models.IntegerField()
    participant_email = models.EmailField(blank=True)
    participant_phone = models.CharField(max_length=20, blank=True)

    # Emergency contact
    emergency_contact_name = models.CharField(max_length=100)
    emergency_contact_phone = models.CharField(max_length=20)
    emergency_contact_relationship = models.CharField(max_length=50, default='Parent/Guardian')

    # Medical info (optional)
    medical_notes = models.TextField(blank=True, help_text="Allergies, conditions, medications, etc.")

    # Payment tracking
    payment_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
            ('refunded', 'Refunded'),
        ],
        default='pending'
    )
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Metadata
    registered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['event', 'user', 'participant_email']
        ordering = ['-registered_at']
        indexes = [
            models.Index(fields=['event', 'payment_status']),
        ]

    def __str__(self):
        return f"{self.participant_first_name} {self.participant_last_name} - {self.event.title}"
```

### Payments App (`apps/payments/models.py`)

```python
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

User = get_user_model()

class SubscriptionPlan(models.Model):
    """Subscription plans for recurring memberships

    Typical Bergen County AAU Basketball Pricing (2024-2025):
    - Monthly: $175/month (flexible, month-to-month)
    - Seasonal: $475 for 3-month season (save $50 vs monthly)
    - Annual: $1,800/year (save $300 vs monthly)
    - Team Dues (one-time): $950 per season (secures team spot, must pay by deadline)
    """
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    billing_period = models.CharField(
        max_length=20,
        choices=[
            ('monthly', 'Monthly'),
            ('seasonal', 'Seasonal'),
            ('annual', 'Annual'),
            ('one_time', 'One-Time (Team Dues)'),
        ]
    )

    # For team dues payment option
    is_team_dues = models.BooleanField(default=False, help_text="One-time season payment to secure team spot")
    payment_deadline = models.DateField(null=True, blank=True, help_text="Deadline for team dues payment")

    # Stripe integration
    stripe_price_id = models.CharField(max_length=255, help_text="Stripe Price ID")
    stripe_product_id = models.CharField(max_length=255, help_text="Stripe Product ID")

    # Features
    features = models.JSONField(default=list, help_text="List of plan features")
    is_active = models.BooleanField(default=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['price']

    def __str__(self):
        return f"{self.name} - ${self.price}/{self.billing_period}"

class Subscription(models.Model):
    """User subscriptions tracking"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)

    # Stripe tracking
    stripe_subscription_id = models.CharField(max_length=255, unique=True)
    stripe_customer_id = models.CharField(max_length=255)

    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('canceled', 'Canceled'),
            ('past_due', 'Past Due'),
            ('trialing', 'Trialing'),
            ('incomplete', 'Incomplete'),
        ]
    )

    # Billing period
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    cancel_at_period_end = models.BooleanField(default=False)
    canceled_at = models.DateTimeField(null=True, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['stripe_subscription_id']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.plan.name} ({self.status})"

class Payment(models.Model):
    """Generic payment tracking for all payment types"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')

    # Amount
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='usd')

    # Stripe tracking
    stripe_payment_intent_id = models.CharField(max_length=255, unique=True)
    stripe_charge_id = models.CharField(max_length=255, blank=True)

    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('succeeded', 'Succeeded'),
            ('failed', 'Failed'),
            ('refunded', 'Refunded'),
        ]
    )
    payment_method = models.CharField(max_length=50, blank=True)

    # Link to what was purchased (generic relation)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True)
    object_id = models.PositiveIntegerField(null=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['stripe_payment_intent_id']),
        ]

    def __str__(self):
        return f"{self.user.email} - ${self.amount} ({self.status})"

class Product(models.Model):
    """Products (merch) with Printful integration"""
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField()

    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    compare_at_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Stripe
    stripe_price_id = models.CharField(max_length=255, blank=True)
    stripe_product_id = models.CharField(max_length=255, blank=True)

    # Print-on-Demand integration (Phase 2 - Printify)
    printify_product_id = models.CharField(max_length=100, blank=True, help_text="Printify Product ID (Phase 2)")
    printify_variant_id = models.CharField(max_length=100, blank=True, help_text="Printify Variant ID (Phase 2)")

    # Inventory management (simple for MVP, Printify sync in Phase 2)
    manage_inventory = models.BooleanField(default=True, help_text="Track inventory locally")
    stock_quantity = models.IntegerField(default=0)

    # Categorization
    category = models.CharField(
        max_length=50,
        choices=[
            ('jersey', 'Jersey'),
            ('apparel', 'Apparel'),
            ('accessories', 'Accessories'),
            ('equipment', 'Equipment'),
        ]
    )

    # Media
    image_url = models.URLField(max_length=500, blank=True)

    # Status
    is_active = models.BooleanField(default=True)
    featured = models.BooleanField(default=False)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['featured', 'is_active']),
        ]

    def __str__(self):
        return self.name

class Order(models.Model):
    """Orders for products"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')

    # Order details
    order_number = models.CharField(max_length=50, unique=True)

    # Stripe
    stripe_session_id = models.CharField(max_length=255, blank=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)

    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('paid', 'Paid'),
            ('processing', 'Processing'),
            ('shipped', 'Shipped'),
            ('delivered', 'Delivered'),
            ('canceled', 'Canceled'),
            ('refunded', 'Refunded'),
        ],
        default='pending'
    )

    # Amounts
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    shipping = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    # Shipping info
    shipping_name = models.CharField(max_length=200)
    shipping_email = models.EmailField()
    shipping_address_line1 = models.CharField(max_length=255)
    shipping_address_line2 = models.CharField(max_length=255, blank=True)
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100)
    shipping_zip = models.CharField(max_length=20)
    shipping_country = models.CharField(max_length=100, default='US')

    # Shipping tracking (Printify integration in Phase 2)
    printify_order_id = models.CharField(max_length=100, blank=True, help_text="Printify Order ID (Phase 2)")
    tracking_number = models.CharField(max_length=255, blank=True)
    tracking_url = models.URLField(max_length=500, blank=True)

    # Metadata
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['order_number']),
        ]

    def __str__(self):
        return f"Order {self.order_number} - {self.user.email}"

class OrderItem(models.Model):
    """Items in an order"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)

    # Product snapshot at time of purchase
    product_name = models.CharField(max_length=200)
    product_price = models.DecimalField(max_digits=10, decimal_places=2)

    # Quantity
    quantity = models.IntegerField(default=1)

    # Print-on-Demand tracking (Phase 2)
    printify_line_item_id = models.CharField(max_length=100, blank=True, help_text="Printify Line Item ID (Phase 2)")

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.quantity}x {self.product_name}"

    @property
    def total_price(self):
        return self.product_price * self.quantity
```

### Core App (`apps/core/models.py`)

```python
from django.db import models
from django.contrib.auth.models import AbstractUser

# Custom user model (good practice to define early)
# For now, we'll use Django's default User model
# But we can extend it later if needed

class InstagramPost(models.Model):
    """Cache Instagram posts"""
    instagram_id = models.CharField(max_length=100, unique=True)
    caption = models.TextField(blank=True)
    media_type = models.CharField(max_length=20)  # IMAGE, VIDEO, CAROUSEL_ALBUM
    media_url = models.URLField(max_length=500)
    permalink = models.URLField(max_length=500)
    timestamp = models.DateTimeField()

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
        ]

    def __str__(self):
        return f"Instagram Post {self.instagram_id}"
```

---

## Phase 4: Wagtail CMS Pages

### CMS App (`apps/cms/models.py`)

```python
from django.db import models
from wagtail.models import Page
from wagtail.fields import RichTextField, StreamField
from wagtail.admin.panels import FieldPanel, InlinePanel, MultiFieldPanel
from wagtail import blocks
from wagtail.images.blocks import ImageChooserBlock
from wagtail.api import APIField
from modelcluster.fields import ParentalKey

class HomePage(Page):
    """Homepage with hero section and flexible content"""

    # Hero section
    hero_title = models.CharField(max_length=200, default="Welcome to NJ Stars Elite AAU")
    hero_subtitle = models.TextField(default="Building Champions On and Off the Court")
    hero_image = models.ForeignKey(
        'wagtailimages.Image',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='+',
        help_text="Hero background image"
    )
    hero_cta_text = models.CharField(max_length=50, default="Join Us", blank=True)
    hero_cta_link = models.URLField(blank=True, help_text="Call-to-action button link")

    # Flexible content
    body = StreamField([
        ('heading', blocks.CharBlock(form_classname="title", icon="title")),
        ('paragraph', blocks.RichTextBlock(icon="pilcrow")),
        ('image', ImageChooserBlock(icon="image")),
        ('embedded_video', blocks.URLBlock(icon="media", help_text="YouTube or Vimeo URL")),
        ('quote', blocks.BlockQuoteBlock(icon="openquote")),
        ('html', blocks.RawHTMLBlock(icon="code")),
    ], use_json_field=True, blank=True)

    # Newsletter
    show_newsletter_signup = models.BooleanField(default=True, help_text="Show newsletter signup section")
    newsletter_title = models.CharField(max_length=100, default="Stay Updated", blank=True)
    newsletter_description = models.TextField(default="Get the latest news and updates", blank=True)

    content_panels = Page.content_panels + [
        MultiFieldPanel([
            FieldPanel('hero_title'),
            FieldPanel('hero_subtitle'),
            FieldPanel('hero_image'),
            FieldPanel('hero_cta_text'),
            FieldPanel('hero_cta_link'),
        ], heading="Hero Section"),
        FieldPanel('body'),
        MultiFieldPanel([
            FieldPanel('show_newsletter_signup'),
            FieldPanel('newsletter_title'),
            FieldPanel('newsletter_description'),
        ], heading="Newsletter Section"),
    ]

    # Expose fields to API
    api_fields = [
        APIField('hero_title'),
        APIField('hero_subtitle'),
        APIField('hero_image'),
        APIField('hero_cta_text'),
        APIField('hero_cta_link'),
        APIField('body'),
    ]

    max_count = 1  # Only one homepage

    class Meta:
        verbose_name = "Home Page"

class BlogPage(Page):
    """Blog post page"""

    date = models.DateField("Post date")
    author = models.ForeignKey(
        'auth.User',
        on_delete=models.PROTECT,
        related_name='blog_posts'
    )
    excerpt = models.TextField(max_length=250, help_text="Brief summary for listings")

    # Featured image
    featured_image = models.ForeignKey(
        'wagtailimages.Image',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='+',
        help_text="Featured image for blog post"
    )

    # Content
    body = StreamField([
        ('heading', blocks.CharBlock(form_classname="title", icon="title")),
        ('paragraph', blocks.RichTextBlock(icon="pilcrow")),
        ('image', ImageChooserBlock(icon="image")),
        ('embedded_video', blocks.URLBlock(icon="media")),
        ('quote', blocks.BlockQuoteBlock(icon="openquote")),
    ], use_json_field=True)

    content_panels = Page.content_panels + [
        FieldPanel('date'),
        FieldPanel('author'),
        FieldPanel('excerpt'),
        FieldPanel('featured_image'),
        FieldPanel('body'),
    ]

    api_fields = [
        APIField('date'),
        APIField('author'),
        APIField('excerpt'),
        APIField('featured_image'),
        APIField('body'),
    ]

    parent_page_types = ['cms.BlogIndexPage']

    class Meta:
        verbose_name = "Blog Post"

class BlogIndexPage(Page):
    """Blog listing page"""

    intro = RichTextField(blank=True)

    content_panels = Page.content_panels + [
        FieldPanel('intro'),
    ]

    def get_posts(self):
        return BlogPage.objects.live().descendant_of(self).order_by('-date')

    api_fields = [
        APIField('intro'),
    ]

    max_count = 1
    subpage_types = ['cms.BlogPage']

    class Meta:
        verbose_name = "Blog Index"

class TeamPage(Page):
    """Team/roster page"""

    introduction = RichTextField(blank=True)

    # Season info
    current_season = models.CharField(max_length=50, default="2024-2025")

    content_panels = Page.content_panels + [
        FieldPanel('introduction'),
        FieldPanel('current_season'),
        InlinePanel('players', label="Team Players"),
    ]

    api_fields = [
        APIField('introduction'),
        APIField('current_season'),
        APIField('players'),
    ]

    max_count = 1

    class Meta:
        verbose_name = "Team Page"

class PlayerProfile(models.Model):
    """Player profile (Wagtail Orderable)"""

    page = ParentalKey(TeamPage, on_delete=models.CASCADE, related_name='players')

    # Player info
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    jersey_number = models.IntegerField()
    position = models.CharField(
        max_length=50,
        choices=[
            ('PG', 'Point Guard'),
            ('SG', 'Shooting Guard'),
            ('SF', 'Small Forward'),
            ('PF', 'Power Forward'),
            ('C', 'Center'),
        ]
    )
    grade = models.CharField(max_length=20, help_text="e.g., 10th Grade, Sophomore")
    height = models.CharField(max_length=10, blank=True, help_text="e.g., 6'2\"")

    # Photo
    photo = models.ForeignKey(
        'wagtailimages.Image',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='+'
    )

    # Bio
    bio = RichTextField(blank=True)

    # Stats (Phase 2 - Nice to have, not MVP priority)
    # Keeping in model for future use, but not emphasized in first launch
    ppg = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True, verbose_name="Points per game")
    rpg = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True, verbose_name="Rebounds per game")
    apg = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True, verbose_name="Assists per game")

    panels = [
        MultiFieldPanel([
            FieldPanel('first_name'),
            FieldPanel('last_name'),
            FieldPanel('jersey_number'),
            FieldPanel('position'),
            FieldPanel('grade'),
            FieldPanel('height'),
        ], heading="Player Info"),
        FieldPanel('photo'),
        FieldPanel('bio'),
        MultiFieldPanel([
            FieldPanel('ppg'),
            FieldPanel('rpg'),
            FieldPanel('apg'),
        ], heading="Stats (Optional)"),
    ]

    class Meta:
        ordering = ['jersey_number']

    def __str__(self):
        return f"#{self.jersey_number} {self.first_name} {self.last_name}"
```

---

## Phase 5: Django REST Framework API

### API Structure

```
backend/apps/
├── events/api/
│   ├── __init__.py
│   ├── serializers.py
│   └── views.py
├── payments/api/
│   ├── __init__.py
│   ├── serializers.py
│   └── views.py
└── core/api/
    ├── __init__.py
    ├── serializers.py
    └── views.py
```

### Events API (`apps/events/api/views.py`)

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404
from ..models import Event
from apps.registrations.models import EventRegistration
from .serializers import EventSerializer, EventDetailSerializer

class EventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for events

    list: Get all events
    retrieve: Get single event
    register: Register for an event (POST /events/{id}/register/)
    """
    queryset = Event.objects.filter(is_public=True, registration_open=True)
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EventDetailSerializer
        return EventSerializer

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def register(self, request, slug=None):
        """Register user for an event"""
        event = self.get_object()

        # Check if already registered
        if EventRegistration.objects.filter(event=event, user=request.user).exists():
            return Response(
                {'error': 'Already registered for this event'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if event is full
        if event.is_full:
            return Response(
                {'error': 'Event is full'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create registration
        from apps.registrations.api.serializers import EventRegistrationSerializer
        serializer = EventRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            registration = serializer.save(event=event, user=request.user)

            # If payment required, create Stripe Checkout Session
            if event.requires_payment:
                from apps.payments.services import create_event_checkout_session
                checkout_url = create_event_checkout_session(registration)
                return Response({
                    'registration': serializer.data,
                    'checkout_url': checkout_url
                }, status=status.HTTP_201_CREATED)

            # Free event - mark as completed
            registration.payment_status = 'completed'
            registration.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

### Payments API (`apps/payments/api/views.py`)

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
import stripe

stripe.api_key = settings.STRIPE_SECRET_KEY

class CreateCheckoutSessionView(APIView):
    """Create Stripe Checkout Session for products or subscriptions"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        session_type = request.data.get('type')  # 'subscription' or 'product'

        if session_type == 'subscription':
            # Subscription checkout
            plan_id = request.data.get('plan_id')
            # Create subscription checkout session
            pass

        elif session_type == 'product':
            # Product checkout
            items = request.data.get('items', [])
            # Create product checkout session
            pass

        return Response({'checkout_url': 'https://checkout.stripe.com/...'})

class StripeWebhookView(APIView):
    """Handle Stripe webhooks"""
    permission_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except Exception as e:
            return Response({'error': str(e)}, status=400)

        # Handle different event types
        if event['type'] == 'checkout.session.completed':
            # Handle payment success
            pass

        elif event['type'] == 'customer.subscription.updated':
            # Handle subscription updates
            pass

        return Response({'status': 'success'})
```

---

## Phase 6: Simple Product Management (Printify Integration - Phase 2)

**Note:** Per user request, we're starting with simple inventory management. Printify integration will be added after core features are validated.

### Product Management (Phase 1 - MVP)

For now, products will be managed with:
- Manual product entry in Django admin
- Image URLs (can upload to media folder)
- Simple inventory tracking
- Direct Stripe checkout

### Printify Integration (Phase 2 - Future Enhancement)

**To be implemented after core features work:**

```python
# apps/payments/services/printify.py (FUTURE)

class PrintifyService:
    """Printify API integration for print-on-demand"""

    BASE_URL = 'https://api.printify.com/v1'

    # Implementation details in NEXT_STEPS.md
    # - Product sync
    # - Order creation
    # - Fulfillment tracking
```

**Advantages of Printify (per user research):**
- Better API documentation
- More competitive pricing
- Wider product selection
- Easier integration

This will be fully documented in Phase 2 implementation.

---

## Phase 7: Instagram Service Migration

### Service (`apps/core/services/instagram.py`)

```python
import requests
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from apps.core.models import InstagramPost

class InstagramService:
    """Instagram Basic Display API integration"""

    BASE_URL = 'https://graph.instagram.com'

    @classmethod
    def get_posts(cls, limit=10, use_cache=True):
        """Get Instagram posts (cached or live)"""

        # Check cache first if enabled
        if use_cache:
            cached = InstagramPost.objects.filter(
                created_at__gte=timezone.now() - timedelta(hours=1)
            )[:limit]

            if cached.count() >= limit:
                return [cls._serialize_post(post) for post in cached]

        # Fetch from API
        if not settings.INSTAGRAM_ACCESS_TOKEN:
            return cls.get_mock_posts()[:limit]

        try:
            response = requests.get(
                f'{cls.BASE_URL}/me/media',
                params={
                    'fields': 'id,caption,media_type,media_url,permalink,timestamp',
                    'access_token': settings.INSTAGRAM_ACCESS_TOKEN,
                    'limit': limit
                }
            )

            data = response.json()

            if 'data' in data:
                # Cache posts
                for post_data in data['data']:
                    cls._cache_post(post_data)

                return data['data']

            return cls.get_mock_posts()[:limit]

        except Exception:
            return cls.get_mock_posts()[:limit]

    @classmethod
    def _cache_post(cls, post_data):
        """Cache Instagram post to database"""
        InstagramPost.objects.update_or_create(
            instagram_id=post_data['id'],
            defaults={
                'caption': post_data.get('caption', ''),
                'media_type': post_data['media_type'],
                'media_url': post_data['media_url'],
                'permalink': post_data['permalink'],
                'timestamp': post_data['timestamp'],
            }
        )

    @classmethod
    def get_mock_posts(cls):
        """Return mock Instagram posts for development"""
        return [
            {
                'id': f'mock_{i}',
                'caption': f'Mock Instagram post {i}',
                'media_type': 'IMAGE',
                'media_url': f'https://picsum.photos/400/400?random={i}',
                'permalink': 'https://instagram.com',
                'timestamp': timezone.now().isoformat(),
            }
            for i in range(1, 11)
        ]
```

---

## Phase 8: Frontend Updates

### Update API Client (`frontend/src/lib/api-client.ts`)

**Changes needed:**
1. Update all endpoint URLs to match Django REST Framework
2. Update authentication to work with django-allauth tokens
3. Add Wagtail API endpoints for CMS content

```typescript
// Key changes:
- POST /api/v1/auth/login → POST /api/auth/login/
- GET /api/v1/blog/posts → GET /api/blog/ (BlogIndexPage)
- GET /api/v1/events → GET /api/events/
- POST /api/v1/events/{id}/register → POST /api/events/{slug}/register/
- GET /api/v1/products → GET /api/products/
- POST /api/v1/stripe/checkout/create-session → POST /api/payments/checkout/

// New Wagtail API endpoints:
- GET /api/v2/pages/ - All Wagtail pages
- GET /api/v2/pages/{id}/ - Single page
- GET /api/v2/images/ - Images
```

### NextAuth Configuration Update

Update to work with django-allauth backend:

```typescript
// frontend/src/app/api/auth/[...nextauth]/route.ts

// Change credentials provider to call Django
CredentialsProvider({
  async authorize(credentials) {
    const res = await fetch('http://localhost:8000/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: { 'Content-Type': 'application/json' }
    })

    const user = await res.json()

    if (res.ok && user) {
      return user
    }
    return null
  }
})
```

---

## Phase 9: Docker Configuration

### Update `backend/Dockerfile`

```dockerfile
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Gunicorn
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

### Update `docker-compose.yml`

```yaml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: njstars
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings.development
    depends_on:
      - db
    env_file:
      - ./backend/.env

  frontend:
    build: ./frontend
    command: npm run dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend
```

---

## Phase 10: Testing Strategy

### Pytest Configuration (`backend/pytest.ini`)

```ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings.development
python_files = tests.py test_*.py *_tests.py
addopts =
    --cov=apps
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=80
    -v
```

### Test Structure

```
backend/tests/
├── __init__.py
├── conftest.py           # Fixtures
├── factories.py          # Factory Boy factories
├── test_models.py        # Model tests
├── test_api.py           # API tests
└── test_services.py      # Service tests
```

---

## Phase 11: Seed Data Script

### Create `backend/seed_data.py`

```python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.events.models import Event, EventType
from apps.payments.models import Product, SubscriptionPlan
# ... import other models

User = get_user_model()

def seed_users():
    """Create test users"""
    users = [
        {'email': 'admin@njstars.com', 'password': 'admin123', 'is_staff': True, 'is_superuser': True},
        {'email': 'parent1@example.com', 'password': 'parent123'},
        {'email': 'player1@example.com', 'password': 'player123'},
    ]

    for user_data in users:
        user, created = User.objects.get_or_create(
            email=user_data['email'],
            defaults={'username': user_data['email']}
        )
        if created:
            user.set_password(user_data['password'])
            user.is_staff = user_data.get('is_staff', False)
            user.is_superuser = user_data.get('is_superuser', False)
            user.save()
            print(f'Created user: {user.email}')

def seed_events():
    """Create test events"""
    # ... create events

def seed_products():
    """Create test products"""
    # ... create products

def seed_subscription_plans():
    """Create subscription plans"""
    # ... create plans

if __name__ == '__main__':
    print('Seeding database...')
    seed_users()
    seed_events()
    seed_products()
    seed_subscription_plans()
    print('Done!')
```

---

## Phase 12: Documentation Updates

### Files to Update

1. **README.md** - Update backend instructions for Django
2. **PROJECT_STATUS.md** - Update with Django implementation status
3. **ARCHITECTURE.md** - Update architecture diagrams for Django + Wagtail
4. **DOCKER.md** - Update Docker commands for Django
5. **TESTING.md** - Update testing guide for pytest-django

### New Documentation

**Create `WAGTAIL_CMS_GUIDE.md`:**
- How to access Wagtail admin (`/admin`)
- Creating pages (HomePage, BlogPage, TeamPage)
- Managing content with StreamFields
- Adding players to Team page
- Publishing content

---

## 📋 Implementation Checklist

### Phase 2: Settings ✅
- [ ] Create split settings (base, development, production)
- [ ] Configure database settings
- [ ] Configure Wagtail settings
- [ ] Configure django-allauth (Google + Facebook)
- [ ] Configure Stripe settings
- [ ] Configure Printful settings
- [ ] Configure CORS for Next.js
- [ ] Create .env.example

### Phase 3: Models ✅
- [ ] Events app models (Event, EventType)
- [ ] Registrations app models (EventRegistration with enhanced fields)
- [ ] Payments app models (SubscriptionPlan, Subscription, Payment, Product, Order, OrderItem)
- [ ] Core app models (InstagramPost)
- [ ] Register all models in admin.py files

### Phase 4: Wagtail CMS ✅
- [ ] HomePage model with StreamFields
- [ ] BlogPage and BlogIndexPage models
- [ ] TeamPage model with PlayerProfile
- [ ] Configure Wagtail API
- [ ] Test Wagtail admin interface

### Phase 5: API Endpoints ✅
- [ ] Events API (list, retrieve, register)
- [ ] Products API (list, retrieve)
- [ ] Subscriptions API (list plans, create subscription)
- [ ] Payments API (create checkout session, webhook)
- [ ] Instagram API (get posts)
- [ ] Wagtail pages API (integrate with existing endpoints)

### Phase 6: Stripe Integration ✅
- [ ] Checkout session creation (products)
- [ ] Checkout session creation (subscriptions)
- [ ] Checkout session creation (events)
- [ ] Webhook handlers (payment success, subscription updates)
- [ ] Payment model updates

### Phase 7: Printful Integration ✅
- [ ] Printful service class
- [ ] Product sync from Printful
- [ ] Order creation in Printful
- [ ] Webhook handler for fulfillment updates
- [ ] Product inventory sync

### Phase 8: Instagram Migration ✅
- [ ] InstagramService class
- [ ] Post caching in database
- [ ] API endpoint for posts
- [ ] Mock data fallback

### Phase 9: Frontend Updates ✅
- [ ] Update API client endpoints
- [ ] Update NextAuth configuration
- [ ] Add Wagtail API integration
- [ ] Test all pages with Django API
- [ ] Update environment variables

### Phase 10: Docker ✅
- [ ] Update backend Dockerfile
- [ ] Update docker-compose.yml
- [ ] Update docker-compose.prod.yml
- [ ] Update Makefile commands
- [ ] Test Docker build

### Phase 11: Testing ✅
- [ ] Configure pytest-django
- [ ] Create test fixtures and factories
- [ ] Write model tests
- [ ] Write API tests
- [ ] Write service tests
- [ ] Achieve 80%+ coverage

### Phase 12: Seed Data ✅
- [ ] Create seed_data.py script
- [ ] Seed users (admin, parents, players)
- [ ] Seed events
- [ ] Seed products (with Printful IDs)
- [ ] Seed subscription plans
- [ ] Seed blog posts (Wagtail pages)
- [ ] Seed team page with players

### Phase 13: Documentation ✅
- [ ] Update README.md
- [ ] Update PROJECT_STATUS.md
- [ ] Update ARCHITECTURE.md
- [ ] Update DOCKER.md
- [ ] Update TESTING.md
- [ ] Create WAGTAIL_CMS_GUIDE.md
- [ ] Create PRINTFUL_INTEGRATION.md

### Phase 14: Final Testing & Deployment ✅
- [ ] Run all migrations
- [ ] Run seed data
- [ ] Test Wagtail admin
- [ ] Test all API endpoints
- [ ] Test frontend integration
- [ ] Test Stripe payments (test mode)
- [ ] Test Printful sync
- [ ] Run full test suite
- [ ] Create initial Wagtail pages
- [ ] Deploy to staging
- [ ] Final review

---

## 🚀 Estimated Timeline

- **Phase 2-4 (Settings, Models, CMS):** 2-3 hours
- **Phase 5-7 (API, Stripe, Printful):** 2-3 hours
- **Phase 8-9 (Frontend, Docker):** 1-2 hours
- **Phase 10-12 (Testing, Seed, Docs):** 1-2 hours
- **Phase 13-14 (Final Testing):** 1 hour

**Total: 6-11 hours of focused development**

---

## ❓ Questions for Review

Before I proceed with implementation, please confirm:

1. **Printful vs Direct Inventory:** Are you committed to Printful, or would you like the option to manage inventory directly initially and add Printful later?

2. **Facebook OAuth:** Do you need Facebook login, or is Google OAuth sufficient? (Facebook requires app review)

3. **Subscription Plans:** What specific subscription plans should I create? (e.g., "Monthly Membership - $49", "Seasonal Pass - $120", etc.)

4. **Player Stats:** Do you want to track player statistics (PPG, RPG, APG) in Wagtail, or is basic bio sufficient?

5. **Priority:** Should I start with core features (Events, Payments, CMS) and add Printful integration later, or do you need Printful from day one?

---

## ✅ Ready to Proceed?

Reply with:
- **"Approve"** - I'll start Phase 2 immediately
- **"Approve with changes"** - Specify what to modify
- **Questions** - I'll clarify before starting

This plan preserves all current features while adding CMS, subscriptions, and enhanced functionality. Your friend will have a powerful Wagtail admin to manage all content without touching code.
