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
