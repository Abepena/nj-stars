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


@receiver(post_save, sender=Player)
def create_dues_account(sender, instance, created, **kwargs):
    """Auto-create DuesAccount when a new Player is created"""
    if created:
        DuesAccount.objects.get_or_create(player=instance)
