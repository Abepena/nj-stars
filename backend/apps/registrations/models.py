from django.db import models
from django.contrib.auth import get_user_model
from apps.events.models import Event

User = get_user_model()


class EventRegistration(models.Model):
    """Enhanced event registration with participant details"""

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='event_registrations',
        null=True,
        blank=True,
        help_text="Null for guest registrations"
    )

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
    medical_notes = models.TextField(
        blank=True,
        help_text="Conditions, medications, etc."
    )

    # Waiver acknowledgment (stored per-registration for guests and logged-in users)
    waiver_signed = models.BooleanField(default=False)
    waiver_signer_name = models.CharField(max_length=200, blank=True)
    waiver_signed_at = models.DateTimeField(null=True, blank=True)
    waiver_version = models.CharField(max_length=20, default='2024.1')

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


    # Payment method (for tracking cash vs online payments)
    PAYMENT_METHOD_CHOICES = [
        ("stripe", "Stripe"),
        ("cash", "Cash"),
        ("check", "Check"),
        ("free", "Free Event"),
    ]
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default="stripe",
        help_text="How this registration was paid"
    )

    # Metadata
    registered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-registered_at']
        indexes = [
            models.Index(fields=['event', 'payment_status']),
        ]
        # Note: unique_together removed to allow guest registrations
        # Uniqueness validated in serializer based on event + email

    def __str__(self):
        return f"{self.participant_first_name} {self.participant_last_name} - {self.event.title}"
