"""
Email service for NJ Stars Elite AAU platform.

Handles all transactional email sending with template support.
Uses Django's built-in email backend which is configured to use:
- MailHog for development (http://localhost:8025)
- SMTP provider (SendGrid, Gmail, etc.) for production

Usage:
    from apps.core.services import EmailService

    # Send newsletter welcome email
    EmailService.send_newsletter_welcome(subscriber)

    # Send generic email
    EmailService.send_email(
        subject="Your Subject",
        template="emails/my_template.html",
        context={"name": "John"},
        to_email="john@example.com"
    )
"""

import logging
from typing import Optional

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


class EmailService:
    """
    Service class for sending transactional emails.

    All email methods are static for easy usage throughout the application.
    """

    @staticmethod
    def _get_base_context() -> dict:
        """Get base context for all email templates."""
        return {
            'site_name': settings.EMAIL_CONTEXT.get('site_name', 'NJ Stars Elite AAU'),
            'support_email': settings.EMAIL_CONTEXT.get('support_email', 'support@njstarselite.com'),
            'site_url': settings.FRONTEND_URL,
            'current_year': __import__('datetime').datetime.now().year,
        }

    @staticmethod
    def send_email(
        subject: str,
        template: str,
        context: dict,
        to_email: str,
        from_email: Optional[str] = None,
        reply_to: Optional[str] = None,
    ) -> bool:
        """
        Send an email using a template.

        Args:
            subject: Email subject line
            template: Path to the HTML template (e.g., 'emails/welcome.html')
            context: Dictionary of context variables for the template
            to_email: Recipient email address
            from_email: Sender email (defaults to DEFAULT_FROM_EMAIL)
            reply_to: Reply-to email address (optional)

        Returns:
            True if email was sent successfully, False otherwise
        """
        try:
            # Merge base context with provided context
            full_context = EmailService._get_base_context()
            full_context.update(context)

            # Render HTML template
            html_content = render_to_string(template, full_context)

            # Create plain text version by stripping HTML tags
            text_content = strip_tags(html_content)

            # Create email message
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email or settings.DEFAULT_FROM_EMAIL,
                to=[to_email],
                reply_to=[reply_to] if reply_to else None,
            )
            msg.attach_alternative(html_content, "text/html")

            # Send the email
            msg.send(fail_silently=False)

            logger.info(f"Email sent successfully to {to_email}: {subject}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

    @staticmethod
    def send_newsletter_welcome(subscriber) -> bool:
        """
        Send welcome email to new newsletter subscriber.

        Args:
            subscriber: NewsletterSubscriber instance

        Returns:
            True if email was sent successfully
        """
        context = {
            'first_name': subscriber.first_name or 'there',
            'email': subscriber.email,
            'unsubscribe_url': f"{settings.FRONTEND_URL}/unsubscribe?email={subscriber.email}",
        }

        return EmailService.send_email(
            subject="Welcome to NJ Stars Elite!",
            template="emails/newsletter_welcome.html",
            context=context,
            to_email=subscriber.email,
        )

    @staticmethod
    def send_order_confirmation(order) -> bool:
        """
        Send order confirmation email.

        Args:
            order: Order instance

        Returns:
            True if email was sent successfully
        """
        context = {
            'order': order,
            'order_number': order.order_number,
            'items': order.items.all(),
            'total': order.total,
            'shipping_name': order.shipping_name,
        }

        return EmailService.send_email(
            subject=f"Order Confirmation - #{order.order_number}",
            template="emails/order_confirmation.html",
            context=context,
            to_email=order.shipping_email,
        )

    @staticmethod
    def send_event_registration_confirmation(registration) -> bool:
        """
        Send event registration confirmation email.

        Args:
            registration: EventRegistration instance

        Returns:
            True if email was sent successfully
        """
        context = {
            'registration': registration,
            'event': registration.event,
            'participant_name': registration.participant_name or registration.user.get_full_name(),
            'event_name': registration.event.title,
            'event_date': registration.event.start_datetime,
            'event_location': registration.event.location,
        }

        return EmailService.send_email(
            subject=f"Registration Confirmed - {registration.event.title}",
            template="emails/event_registration.html",
            context=context,
            to_email=registration.user.email,
        )

    @staticmethod
    def send_simple_email(
        subject: str,
        message: str,
        to_email: str,
        from_email: Optional[str] = None,
    ) -> bool:
        """
        Send a simple plain-text email without a template.

        Args:
            subject: Email subject line
            message: Plain text message body
            to_email: Recipient email address
            from_email: Sender email (defaults to DEFAULT_FROM_EMAIL)

        Returns:
            True if email was sent successfully
        """
        try:
            from django.core.mail import send_mail

            send_mail(
                subject=subject,
                message=message,
                from_email=from_email or settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to_email],
                fail_silently=False,
            )

            logger.info(f"Simple email sent to {to_email}: {subject}")
            return True

        except Exception as e:
            logger.error(f"Failed to send simple email to {to_email}: {str(e)}")
            return False
