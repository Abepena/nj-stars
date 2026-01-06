"""
Background tasks for the core app.

These tasks can be run via:
1. Django management commands (cron-friendly)
2. Celery beat (if configured)
3. Railway scheduled jobs

Scheduling Recommendations:
- refresh_instagram_tokens: Daily at 3 AM
- sync_instagram_posts: Every 2-4 hours
"""

import logging
from django.core.management import call_command
from django.utils import timezone

logger = logging.getLogger(__name__)


def refresh_instagram_tokens():
    """
    Refresh Instagram tokens that are expiring soon.

    Run daily. Tokens expiring within 7 days will be refreshed.

    Cron example (daily at 3 AM):
        0 3 * * * cd /app && python manage.py refresh_instagram_tokens

    Railway scheduled job:
        python manage.py refresh_instagram_tokens
    """
    logger.info("Starting Instagram token refresh task")
    try:
        call_command('refresh_instagram_tokens', verbosity=1)
        logger.info("Instagram token refresh completed")
    except Exception as e:
        logger.error(f"Instagram token refresh failed: {e}")
        raise


def sync_instagram_posts(limit=25):
    """
    Sync Instagram posts from all active accounts.

    Run every 2-4 hours to keep the feed fresh.

    Cron example (every 4 hours):
        0 */4 * * * cd /app && python manage.py sync_instagram --all-accounts

    Railway scheduled job:
        python manage.py sync_instagram --all-accounts
    """
    logger.info("Starting Instagram post sync task")
    try:
        call_command('sync_instagram', all_accounts=True, limit=limit, verbosity=1)
        logger.info("Instagram post sync completed")
    except Exception as e:
        logger.error(f"Instagram post sync failed: {e}")
        raise


# Celery task definitions (only used if Celery is configured)
try:
    from celery import shared_task

    @shared_task(name='core.refresh_instagram_tokens')
    def celery_refresh_instagram_tokens():
        """Celery wrapper for token refresh"""
        return refresh_instagram_tokens()

    @shared_task(name='core.sync_instagram_posts')
    def celery_sync_instagram_posts(limit=25):
        """Celery wrapper for post sync"""
        return sync_instagram_posts(limit=limit)

except ImportError:
    # Celery not installed - tasks will be run via management commands
    pass
