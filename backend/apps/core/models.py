from django.db import models


class Coach(models.Model):
    """Coaching staff member"""

    ROLE_CHOICES = [
        ('head_coach', 'Head Coach'),
        ('assistant_coach', 'Assistant Coach'),
        ('trainer', 'Trainer'),
        ('skills_coach', 'Skills Coach'),
        ('founder', 'Founder'),
    ]

    # Basic info
    name = models.CharField(max_length=100, help_text="Full legal name")
    display_name = models.CharField(
        max_length=50,
        blank=True,
        help_text="Name shown on website (e.g., 'Coach K', 'Tray')"
    )
    slug = models.SlugField(unique=True, help_text="URL-friendly identifier")
    role = models.CharField(max_length=30, choices=ROLE_CHOICES)
    title = models.CharField(
        max_length=100,
        blank=True,
        help_text="Custom title (e.g., 'Head Coach & Trainer')"
    )
    bio = models.TextField(blank=True, help_text="Coach biography")

    # Photo
    photo_url = models.URLField(
        max_length=500,
        blank=True,
        help_text="URL to coach photo"
    )

    # Contact & Social
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    instagram_handle = models.CharField(
        max_length=30,
        blank=True,
        help_text="Instagram handle without @ (e.g., 'traygotbounce')"
    )

    # Specialties (stored as comma-separated values)
    specialties = models.CharField(
        max_length=255,
        blank=True,
        help_text="Comma-separated list of specialties (e.g., 'ball handling, shooting, defense')"
    )

    # Status
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(
        default=0,
        help_text="Display order (lower numbers appear first)"
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'name']
        verbose_name = 'Coach'
        verbose_name_plural = 'Coaches'

    def __str__(self):
        return self.display_name or self.name

    @property
    def instagram_url(self):
        """Full Instagram profile URL"""
        if self.instagram_handle:
            return f"https://instagram.com/{self.instagram_handle}"
        return None

    @property
    def specialties_list(self):
        """Return specialties as a list"""
        if self.specialties:
            return [s.strip() for s in self.specialties.split(',')]
        return []

    def save(self, *args, **kwargs):
        # Auto-generate slug from name if not provided
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class InstagramPost(models.Model):
    """Cache Instagram posts for performance"""

    instagram_id = models.CharField(max_length=100, unique=True)
    caption = models.TextField(blank=True)
    media_type = models.CharField(max_length=20)  # IMAGE, VIDEO, CAROUSEL_ALBUM
    media_url = models.URLField(max_length=2000)  # Instagram CDN URLs can be long
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


class NewsletterSubscriber(models.Model):
    """Newsletter subscription management"""

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('unsubscribed', 'Unsubscribed'),
        ('bounced', 'Bounced'),
    ]

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    # Subscription preferences
    subscribe_events = models.BooleanField(default=True, help_text="Receive event announcements")
    subscribe_news = models.BooleanField(default=True, help_text="Receive team news and updates")
    subscribe_promotions = models.BooleanField(default=True, help_text="Receive merch promotions")

    # Tracking
    subscribed_at = models.DateTimeField(auto_now_add=True)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)
    source = models.CharField(
        max_length=50,
        default='website',
        help_text="Where the subscription came from (website, checkout, portal)"
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-subscribed_at']
        verbose_name = 'Newsletter Subscriber'
        verbose_name_plural = 'Newsletter Subscribers'

    def __str__(self):
        return f"{self.email} ({self.status})"

    def unsubscribe(self):
        """Mark subscriber as unsubscribed"""
        from django.utils import timezone
        self.status = 'unsubscribed'
        self.unsubscribed_at = timezone.now()
        self.save()


class ContactSubmission(models.Model):
    """Contact form submissions from the website"""

    CATEGORY_CHOICES = [
        ('general', 'General Question'),
        ('registration', 'Registration & Events'),
        ('payments', 'Orders & Payments'),
        ('portal', 'Portal / Account Issues'),
        ('technical', 'Website / Technical Issues'),
        ('feedback', 'Feedback & Suggestions'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('new', 'New'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    # Contact info
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)

    # Submission details
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    subject = models.CharField(max_length=200)
    message = models.TextField()

    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')

    # Admin notes (internal)
    admin_notes = models.TextField(blank=True, help_text="Internal notes for staff")
    assigned_to = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_contact_submissions'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_contact_submissions'
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Contact Submission'
        verbose_name_plural = 'Contact Submissions'

    def __str__(self):
        return f"{self.subject} - {self.name} ({self.status})"

    def mark_resolved(self, user):
        """Mark this submission as resolved"""
        from django.utils import timezone
        self.status = 'resolved'
        self.resolved_at = timezone.now()
        self.resolved_by = user
        self.save()


class InstagramCredential(models.Model):
    """
    Instagram API credentials with automatic token refresh support.

    Designed for multi-tenancy: supports multiple Instagram accounts.
    For MVP, we'll have one primary account.

    Token Lifecycle:
    - Long-lived tokens expire after 60 days
    - Tokens can be refreshed before expiry to get a new 60-day window
    - Refresh should happen when < 7 days remain
    """

    # Account identification
    account_name = models.CharField(
        max_length=100,
        help_text="Friendly name (e.g., 'NJ Stars Official')"
    )
    instagram_username = models.CharField(
        max_length=50,
        help_text="Instagram handle without @ (e.g., 'njstarselite_aau')"
    )
    instagram_user_id = models.CharField(
        max_length=50,
        help_text="Instagram/Facebook User ID (from API)"
    )

    # Token management
    access_token = models.TextField(
        help_text="Long-lived access token from Instagram Graph API"
    )
    token_expires_at = models.DateTimeField(
        help_text="When the token expires (60 days from issue)"
    )
    token_issued_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this token was first added"
    )
    last_refreshed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last time the token was refreshed"
    )

    # NOTE: App ID and App Secret are read from environment variables
    # META_APP_ID and META_APP_SECRET - not stored in database for security

    # Status
    is_active = models.BooleanField(
        default=True,
        help_text="Whether to use this account for fetching posts"
    )
    is_primary = models.BooleanField(
        default=False,
        help_text="Primary account (used when no specific account requested)"
    )
    last_sync_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last successful post sync"
    )
    last_error = models.TextField(
        blank=True,
        help_text="Last error message (cleared on success)"
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Instagram Credential'
        verbose_name_plural = 'Instagram Credentials'
        ordering = ['-is_primary', 'account_name']

    def __str__(self):
        status = "✓" if self.is_active else "✗"
        primary = " (Primary)" if self.is_primary else ""
        return f"{status} @{self.instagram_username}{primary}"

    def save(self, *args, **kwargs):
        # Ensure only one primary account
        if self.is_primary:
            InstagramCredential.objects.filter(is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)

    @property
    def days_until_expiry(self):
        """Days remaining until token expires"""
        from django.utils import timezone
        if not self.token_expires_at:
            return 0
        delta = self.token_expires_at - timezone.now()
        return max(0, delta.days)

    @property
    def needs_refresh(self):
        """Check if token should be refreshed (< 7 days remaining)"""
        return self.days_until_expiry < 7

    @property
    def is_expired(self):
        """Check if token is already expired"""
        from django.utils import timezone
        return self.token_expires_at and self.token_expires_at < timezone.now()

    @property
    def can_refresh(self):
        """Check if we have credentials to refresh the token"""
        if self.is_expired:
            return False
        # Instagram (IG) tokens can be refreshed with just the token itself
        if self.access_token.startswith('IG'):
            return True
        # Facebook (EA) tokens require app credentials
        from django.conf import settings
        app_id = getattr(settings, 'META_APP_ID', '')
        app_secret = getattr(settings, 'META_APP_SECRET', '')
        return bool(app_id and app_secret)

    @property
    def token_status(self):
        """Human-readable token status"""
        if self.is_expired:
            return "❌ Expired"
        elif self.needs_refresh:
            return f"⚠️ Expiring soon ({self.days_until_expiry} days)"
        else:
            return f"✅ Valid ({self.days_until_expiry} days)"

    @classmethod
    def get_primary(cls):
        """Get the primary active credential"""
        return cls.objects.filter(is_active=True, is_primary=True).first()

    @classmethod
    def get_active_credentials(cls):
        """Get all active credentials"""
        return cls.objects.filter(is_active=True)


class IntegrationSettings(models.Model):
    """
    Singleton model for storing third-party integration credentials and site settings.

    Designed for multi-tenancy: in the future, add a tenant FK.
    For now, we use a single instance (enforced in save()).
    """

    # Contact Settings
    contact_email = models.EmailField(
        default='contact@leag.app',
        help_text="Email address that receives contact form submissions"
    )
    instagram_url = models.URLField(
        max_length=200,
        blank=True,
        default='https://instagram.com/njstarselite_aau',
        help_text="Instagram profile URL for footer/social links"
    )

    # Printify Integration
    printify_api_key = models.TextField(
        blank=True,
        help_text="Printify API token from Account > Connections"
    )
    printify_shop_id = models.CharField(
        max_length=50,
        blank=True,
        help_text="Printify Shop ID"
    )
    printify_shop_name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Printify Shop name (for display)"
    )
    printify_connected_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When Printify was connected"
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Integration Settings'
        verbose_name_plural = 'Integration Settings'

    def __str__(self):
        return "Integration Settings"

    def save(self, *args, **kwargs):
        # Enforce singleton pattern
        if not self.pk and IntegrationSettings.objects.exists():
            raise ValueError("Only one IntegrationSettings instance allowed")
        super().save(*args, **kwargs)

    @classmethod
    def get_instance(cls):
        """Get or create the singleton instance"""
        instance, _ = cls.objects.get_or_create(pk=1)
        return instance

    @property
    def printify_configured(self):
        """Check if Printify credentials are set"""
        return bool(self.printify_api_key and self.printify_shop_id)
