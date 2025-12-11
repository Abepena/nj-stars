"""
Custom allauth adapters for NJ Stars Elite.

These adapters customize email verification and other auth flows
to work with our decoupled Next.js frontend.
"""

from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings


class CustomAccountAdapter(DefaultAccountAdapter):
    """
    Custom adapter that generates email confirmation URLs pointing
    to the backend API (which then redirects to frontend).

    This ensures verification links use the correct domain instead
    of the Django sites framework default (example.com).
    """

    def get_email_confirmation_url(self, request, emailconfirmation):
        """
        Generate the email confirmation URL.

        Points to our custom backend endpoint which handles verification
        and redirects to the frontend.
        """
        # Get the backend URL from settings or request
        if hasattr(settings, 'BACKEND_URL') and settings.BACKEND_URL:
            base_url = settings.BACKEND_URL.rstrip('/')
        elif request:
            base_url = f"{request.scheme}://{request.get_host()}"
        else:
            # Fallback to localhost for development
            base_url = "http://localhost:8000"

        # Build the confirmation URL pointing to our custom view
        return f"{base_url}/api/auth/registration/account-confirm-email/{emailconfirmation.key}/"

    def send_confirmation_mail(self, request, emailconfirmation, signup):
        """
        Send the confirmation email with the correct URL.
        """
        # Use the parent implementation which will call get_email_confirmation_url
        super().send_confirmation_mail(request, emailconfirmation, signup)
