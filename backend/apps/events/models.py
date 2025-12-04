from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from django.utils import timezone

User = get_user_model()


class EventType(models.TextChoices):
    """Event type choices"""
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
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Price for this event"
    )
    stripe_price_id = models.CharField(
        max_length=255,
        blank=True,
        help_text="Stripe Price ID for this event"
    )

    # Registration settings
    max_participants = models.IntegerField(
        null=True,
        blank=True,
        help_text="Leave blank for unlimited"
    )
    registration_open = models.BooleanField(default=True)
    registration_deadline = models.DateTimeField(null=True, blank=True)

    # Metadata
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_events'
    )

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
        """Calculate remaining spots"""
        if not self.max_participants:
            return None
        registered = self.registrations.filter(payment_status='completed').count()
        return max(0, self.max_participants - registered)

    @property
    def is_full(self):
        """Check if event is at capacity"""
        if not self.max_participants:
            return False
        return self.spots_remaining == 0

    @property
    def is_registration_open(self):
        """Check if registration is currently open"""
        if not self.registration_open:
            return False
        if self.registration_deadline and timezone.now() > self.registration_deadline:
            return False
        if self.is_full:
            return False
        return True
