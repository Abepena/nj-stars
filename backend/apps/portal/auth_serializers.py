"""
Custom authentication serializers for dj-rest-auth.

These extend the default serializers to integrate with the UserProfile model.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from dj_rest_auth.registration.serializers import RegisterSerializer
from dj_rest_auth.serializers import PasswordResetSerializer
from django.conf import settings

User = get_user_model()


class CustomRegisterSerializer(RegisterSerializer):
    """
    Extended registration serializer with first/last name.

    Creates a User and the UserProfile signal handles creating the profile.
    """
    first_name = serializers.CharField(max_length=150, required=True)
    last_name = serializers.CharField(max_length=150, required=True)
    phone = serializers.CharField(max_length=20, required=True, allow_blank=False)

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data['first_name'] = self.validated_data.get('first_name', '')
        data['last_name'] = self.validated_data.get('last_name', '')
        data['phone'] = self.validated_data.get('phone', '')
        # Set username to email address for consistency
        data['username'] = self.validated_data.get('email', '')
        return data

    def save(self, request):
        user = super().save(request)
        user.first_name = self.validated_data.get('first_name', '')
        user.last_name = self.validated_data.get('last_name', '')
        # Ensure username matches email
        user.username = user.email
        user.save()

        # Update phone on profile if provided
        phone = self.validated_data.get('phone', '')
        if phone and hasattr(user, 'profile'):
            user.profile.phone = phone
            user.profile.save()

        return user


class UserDetailsSerializer(serializers.ModelSerializer):
    """
    User details serializer for dj-rest-auth /user/ endpoint.

    Returns user info along with profile data.
    """
    role = serializers.CharField(source='profile.role', read_only=True)
    phone = serializers.CharField(source='profile.phone', read_only=True)
    has_signed_waiver = serializers.BooleanField(source='profile.has_signed_waiver', read_only=True)
    profile_completeness = serializers.IntegerField(source='profile.profile_completeness', read_only=True)

    class Meta:
        model = User
        fields = [
            'pk', 'email', 'first_name', 'last_name',
            'role', 'phone', 'has_signed_waiver', 'profile_completeness'
        ]
        read_only_fields = ['pk', 'email']


class CustomPasswordResetSerializer(PasswordResetSerializer):
    """
    Custom password reset serializer with frontend URL support.

    Generates reset links pointing to the frontend password reset page.
    """

    def get_email_options(self):
        """Return options for the password reset email."""
        return {
            'domain_override': settings.FRONTEND_URL.replace('http://', '').replace('https://', ''),
            'use_https': settings.FRONTEND_URL.startswith('https'),
            'extra_email_context': {
                'frontend_url': settings.FRONTEND_URL,
            }
        }
