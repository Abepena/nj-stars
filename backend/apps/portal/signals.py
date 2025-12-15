from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from .models import UserProfile, Player, DuesAccount

User = get_user_model()


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Auto-create UserProfile when a new User is created"""
    if created:
        UserProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def link_guest_registrations(sender, instance, created, **kwargs):
    """
    Auto-link guest registrations to user when account is created.

    When a user creates an account, any guest registrations (user=None)
    with a matching participant_email are automatically linked to their account.
    """
    if created and instance.email:
        from apps.registrations.models import EventRegistration

        # Find guest registrations with matching email
        guest_registrations = EventRegistration.objects.filter(
            user__isnull=True,
            participant_email__iexact=instance.email
        )

        # Link them to the new user
        linked_count = guest_registrations.update(user=instance)

        if linked_count > 0:
            import logging
            logger = logging.getLogger(__name__)
            logger.info(
                f"Linked {linked_count} guest registration(s) to new user {instance.email}"
            )


@receiver(post_save, sender=Player)
def create_dues_account(sender, instance, created, **kwargs):
    """Auto-create DuesAccount when a new Player is created"""
    if created:
        DuesAccount.objects.get_or_create(player=instance)
