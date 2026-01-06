"""
Instagram token refresh command.

Refreshes Instagram access tokens before they expire.
Run this daily via cron/Celery to ensure uninterrupted API access.

Usage:
    python manage.py refresh_instagram_tokens
    python manage.py refresh_instagram_tokens --force
    python manage.py refresh_instagram_tokens --account njstarselite_aau
"""

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from apps.core.models import InstagramCredential
from apps.core.services import refresh_instagram_token, refresh_all_expiring_tokens


class Command(BaseCommand):
    help = 'Refresh Instagram access tokens that are expiring soon'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Refresh all tokens regardless of expiry date',
        )
        parser.add_argument(
            '--account',
            type=str,
            help='Refresh specific account by username',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Refresh tokens expiring within this many days (default: 7)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Check which tokens need refresh without actually refreshing',
        )

    def handle(self, *args, **options):
        force = options['force']
        specific_account = options['account']
        days_threshold = options['days']
        dry_run = options['dry_run']

        self.stdout.write('Instagram Token Refresh')
        self.stdout.write('=' * 50)

        if specific_account:
            # Refresh specific account
            credential = InstagramCredential.objects.filter(
                instagram_username=specific_account
            ).first()

            if not credential:
                raise CommandError(f'No credential found for @{specific_account}')

            self.refresh_single(credential, force, dry_run)
        else:
            # Refresh all accounts that need it
            self.refresh_all(days_threshold, force, dry_run)

    def refresh_single(self, credential, force, dry_run):
        """Refresh a single credential"""
        self.stdout.write(f'\nAccount: @{credential.instagram_username}')
        self.stdout.write(f'Status: {credential.token_status}')
        self.stdout.write(f'Days until expiry: {credential.days_until_expiry}')
        self.stdout.write(f'Can refresh: {credential.can_refresh}')

        if credential.is_expired:
            self.stdout.write(self.style.ERROR(
                'Token has expired. Manual re-authorization required.'
            ))
            return

        if not force and not credential.needs_refresh:
            self.stdout.write(self.style.SUCCESS(
                f'Token is valid for {credential.days_until_expiry} days. No refresh needed.'
            ))
            return

        if not credential.can_refresh:
            self.stdout.write(self.style.WARNING(
                'Cannot refresh: Missing App ID or App Secret in credential settings.'
            ))
            return

        if dry_run:
            self.stdout.write(self.style.WARNING(
                'DRY RUN: Would refresh this token.'
            ))
            return

        # Perform refresh
        self.stdout.write('Refreshing token...')
        success, message = refresh_instagram_token(credential)

        if success:
            self.stdout.write(self.style.SUCCESS(f'✓ {message}'))
        else:
            self.stdout.write(self.style.ERROR(f'✗ {message}'))

    def refresh_all(self, days_threshold, force, dry_run):
        """Refresh all credentials that need it"""
        credentials = InstagramCredential.objects.filter(is_active=True)
        count = credentials.count()

        if count == 0:
            self.stdout.write(self.style.WARNING(
                'No active Instagram credentials found in database.'
            ))
            return

        self.stdout.write(f'Found {count} active credential(s)')
        self.stdout.write(f'Refresh threshold: {days_threshold} days')
        self.stdout.write('')

        refreshed = 0
        skipped = 0
        failed = 0

        for credential in credentials:
            self.stdout.write(f'\n@{credential.instagram_username}:')

            if credential.is_expired:
                self.stdout.write(self.style.ERROR('  ✗ Token expired - needs re-auth'))
                failed += 1
                continue

            needs_refresh = force or credential.days_until_expiry <= days_threshold

            if not needs_refresh:
                self.stdout.write(f'  ○ Valid ({credential.days_until_expiry} days) - skipping')
                skipped += 1
                continue

            if not credential.can_refresh:
                self.stdout.write(self.style.WARNING('  ○ Cannot refresh - missing app credentials'))
                skipped += 1
                continue

            if dry_run:
                self.stdout.write(self.style.WARNING(
                    f'  ○ Would refresh (expires in {credential.days_until_expiry} days)'
                ))
                continue

            # Perform refresh
            success, message = refresh_instagram_token(credential)

            if success:
                self.stdout.write(self.style.SUCCESS(f'  ✓ Refreshed - {message}'))
                refreshed += 1
            else:
                self.stdout.write(self.style.ERROR(f'  ✗ Failed - {message}'))
                failed += 1

        # Summary
        self.stdout.write('\n' + '=' * 50)
        self.stdout.write('Summary:')
        if dry_run:
            self.stdout.write('  (DRY RUN - no changes made)')
        self.stdout.write(f'  Refreshed: {refreshed}')
        self.stdout.write(f'  Skipped: {skipped}')
        self.stdout.write(f'  Failed: {failed}')
