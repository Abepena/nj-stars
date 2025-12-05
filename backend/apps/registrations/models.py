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
    medical_notes = models.TextField(
        blank=True,
        help_text="Allergies, conditions, medications, etc."
    )

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
