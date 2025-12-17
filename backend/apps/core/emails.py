"""
Email utilities for the core app.
"""
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Contact form notification recipient
CONTACT_EMAIL = 'contact@leag.app'


def send_contact_notification(submission):
    """
    Send email notification when a new contact form is submitted.

    Args:
        submission: ContactSubmission model instance
    """
    subject = f"[Contact Form] {submission.get_category_display()}: {submission.subject}"

    # Context for the email template
    context = {
        'submission': submission,
        'category_display': submission.get_category_display(),
        'priority_display': submission.get_priority_display(),
        'admin_url': f"{settings.BACKEND_URL}/django-admin/core/contactsubmission/{submission.id}/change/",
    }

    # Render HTML and plain text versions
    try:
        html_content = render_to_string('core/emails/contact_notification.html', context)
        text_content = render_to_string('core/emails/contact_notification.txt', context)
    except Exception as e:
        # Fallback to simple text email if template fails
        logger.warning(f"Failed to render email template: {e}")
        text_content = f"""
New Contact Form Submission

From: {submission.name} <{submission.email}>
Phone: {submission.phone or 'Not provided'}
Category: {submission.get_category_display()}
Subject: {submission.subject}

Message:
{submission.message}

---
View in admin: {settings.BACKEND_URL}/django-admin/core/contactsubmission/{submission.id}/change/
        """.strip()
        html_content = None

    try:
        if html_content:
            # Send multipart email (HTML + plain text)
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[CONTACT_EMAIL],
                reply_to=[submission.email],
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
        else:
            # Send plain text only
            send_mail(
                subject=subject,
                message=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[CONTACT_EMAIL],
                fail_silently=False,
            )

        logger.info(f"Contact notification sent for submission #{submission.id}")
        return True

    except Exception as e:
        logger.error(f"Failed to send contact notification for submission #{submission.id}: {e}")
        return False


def send_contact_confirmation(submission):
    """
    Send confirmation email to the person who submitted the contact form.

    Args:
        submission: ContactSubmission model instance
    """
    subject = f"We received your message - {submission.subject}"

    context = {
        'submission': submission,
        'name': submission.name.split()[0] if submission.name else 'there',
    }

    try:
        html_content = render_to_string('core/emails/contact_confirmation.html', context)
        text_content = render_to_string('core/emails/contact_confirmation.txt', context)
    except Exception as e:
        logger.warning(f"Failed to render confirmation template: {e}")
        text_content = f"""
Hi {submission.name.split()[0] if submission.name else 'there'},

Thank you for reaching out to NJ Stars Elite! We've received your message and will get back to you within 24-48 hours.

Your submission:
- Subject: {submission.subject}
- Category: {submission.get_category_display()}

If you have any urgent questions, please call us directly.

Best regards,
NJ Stars Elite Team
        """.strip()
        html_content = None

    try:
        if html_content:
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[submission.email],
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
        else:
            send_mail(
                subject=subject,
                message=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[submission.email],
                fail_silently=False,
            )

        logger.info(f"Contact confirmation sent to {submission.email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send contact confirmation to {submission.email}: {e}")
        return False
