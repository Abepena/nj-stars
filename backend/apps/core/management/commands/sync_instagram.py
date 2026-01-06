"""
Instagram Graph API sync command.

Fetches posts from Instagram Business accounts and stores them
in the InstagramPost model for display in the news feed.

Usage:
    python manage.py sync_instagram
    python manage.py sync_instagram --limit 10
    python manage.py sync_instagram --verbose
    python manage.py sync_instagram --account njstarselite_aau
    python manage.py sync_instagram --all-accounts
    python manage.py sync_instagram --if-empty  # For deployment: only sync if no posts exist

Setup:
    1. Add Instagram credentials via Django Admin → Instagram Credentials
    2. Or use environment variables (legacy):
       - INSTAGRAM_ACCESS_TOKEN
       - INSTAGRAM_BUSINESS_ACCOUNT_ID
"""

import requests
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.utils import timezone
from apps.core.models import InstagramPost, InstagramCredential


class Command(BaseCommand):
    help = 'Sync Instagram posts from the Graph API to the database'

    # Instagram Graph API base URLs
    # Tokens starting with "IG" use graph.instagram.com
    # Tokens starting with "EA" use graph.facebook.com
    INSTAGRAM_API_BASE = 'https://graph.instagram.com'
    FACEBOOK_API_BASE = 'https://graph.facebook.com/v18.0'

    # Fields to fetch from the API
    MEDIA_FIELDS = [
        'id',
        'caption',
        'media_type',
        'media_url',
        'permalink',
        'timestamp',
        'thumbnail_url',  # For video posts
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=25,
            help='Maximum number of posts to fetch (default: 25)',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed output for each post',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Fetch posts but do not save to database',
        )
        parser.add_argument(
            '--account',
            type=str,
            help='Sync specific account by username (e.g., njstarselite_aau)',
        )
        parser.add_argument(
            '--all-accounts',
            action='store_true',
            help='Sync all active accounts',
        )
        parser.add_argument(
            '--use-env',
            action='store_true',
            help='Use environment variables instead of database credentials (legacy)',
        )
        parser.add_argument(
            '--if-empty',
            action='store_true',
            help='Only sync if no posts exist in database (useful for deployment)',
        )

    def handle(self, *args, **options):
        limit = options['limit']
        verbose = options['verbose']
        dry_run = options['dry_run']
        if_empty = options['if_empty']

        # Check if we should skip (--if-empty and posts exist)
        if if_empty:
            post_count = InstagramPost.objects.count()
            if post_count > 0:
                self.stdout.write(
                    f'Skipping sync: {post_count} posts already exist (--if-empty flag set)'
                )
                return
            self.stdout.write('No posts found, proceeding with sync...')
        use_env = options['use_env']
        specific_account = options['account']
        all_accounts = options['all_accounts']

        # Determine credential source
        if use_env:
            # Legacy: use environment variables
            credentials = self.get_env_credentials()
            if credentials:
                self.sync_account(credentials, limit, verbose, dry_run)
            return

        # Get credentials from database
        if specific_account:
            credential = InstagramCredential.objects.filter(
                instagram_username=specific_account,
                is_active=True
            ).first()
            if not credential:
                raise CommandError(f'No active credential found for @{specific_account}')
            credentials_list = [credential]
        elif all_accounts:
            credentials_list = list(InstagramCredential.get_active_credentials())
            if not credentials_list:
                raise CommandError('No active Instagram credentials found in database.')
        else:
            # Default: use primary credential, fallback to env vars
            credential = InstagramCredential.get_primary()
            if credential:
                credentials_list = [credential]
            else:
                # Fallback to environment variables
                self.stdout.write(self.style.WARNING(
                    'No primary Instagram credential in database. '
                    'Falling back to environment variables.'
                ))
                env_creds = self.get_env_credentials()
                if env_creds:
                    self.sync_account(env_creds, limit, verbose, dry_run)
                return

        # Sync each account
        for credential in credentials_list:
            self.stdout.write(f'\n{"="*50}')
            self.stdout.write(f'Syncing @{credential.instagram_username}...')
            self.stdout.write(f'Token status: {credential.token_status}')

            if credential.is_expired:
                self.stdout.write(self.style.ERROR(
                    f'Token expired for @{credential.instagram_username}. Skipping.'
                ))
                continue

            if credential.needs_refresh:
                self.stdout.write(self.style.WARNING(
                    f'Token expiring soon ({credential.days_until_expiry} days). '
                    'Consider running: python manage.py refresh_instagram_tokens'
                ))

            creds = {
                'access_token': credential.access_token,
                'account_id': credential.instagram_user_id,
                'credential': credential,
            }
            self.sync_account(creds, limit, verbose, dry_run)

    def get_env_credentials(self):
        """Get credentials from environment variables (legacy support)"""
        access_token = getattr(settings, 'INSTAGRAM_ACCESS_TOKEN', None)
        account_id = getattr(settings, 'INSTAGRAM_BUSINESS_ACCOUNT_ID', None)

        if not access_token:
            raise CommandError(
                'No Instagram credentials found. Either:\n'
                '1. Add credentials via Django Admin → Instagram Credentials, or\n'
                '2. Set INSTAGRAM_ACCESS_TOKEN environment variable'
            )

        if not account_id:
            raise CommandError(
                'INSTAGRAM_BUSINESS_ACCOUNT_ID is not set. '
                'See documentation/NEXT_STEPS.md for setup instructions.'
            )

        return {
            'access_token': access_token,
            'account_id': account_id,
            'credential': None,
        }

    def sync_account(self, credentials, limit, verbose, dry_run):
        """Sync posts for a single account"""
        access_token = credentials['access_token']
        account_id = credentials['account_id']
        credential = credentials.get('credential')  # May be None for env-based credentials

        self.stdout.write(f'Fetching up to {limit} posts from Instagram...')

        try:
            # Fetch posts from the Graph API
            posts = self.fetch_posts(access_token, account_id, limit)

            if not posts:
                self.stdout.write(self.style.WARNING('No posts found.'))
                # Update credential if using database
                if credential:
                    credential.last_sync_at = timezone.now()
                    credential.last_error = ''
                    credential.save(update_fields=['last_sync_at', 'last_error', 'updated_at'])
                return

            self.stdout.write(f'Found {len(posts)} posts.')

            if dry_run:
                self.stdout.write(self.style.WARNING('Dry run - not saving to database.'))
                for post in posts:
                    self.stdout.write(f"  - {post.get('id')}: {post.get('media_type')}")
                return

            # Save posts to database
            created_count = 0
            updated_count = 0

            for post_data in posts:
                post, created = self.save_post(post_data)

                if verbose:
                    status = 'Created' if created else 'Updated'
                    caption_preview = (post_data.get('caption') or '')[:50]
                    self.stdout.write(f"  {status}: {post.instagram_id} - {caption_preview}...")

                if created:
                    created_count += 1
                else:
                    updated_count += 1

            # Update credential with success
            if credential:
                credential.last_sync_at = timezone.now()
                credential.last_error = ''
                credential.save(update_fields=['last_sync_at', 'last_error', 'updated_at'])

            self.stdout.write(
                self.style.SUCCESS(
                    f'Sync complete! Created: {created_count}, Updated: {updated_count}'
                )
            )

        except CommandError as e:
            # Update credential with error
            if credential:
                credential.last_error = str(e)
                credential.save(update_fields=['last_error', 'updated_at'])
            raise

    def get_api_base(self, access_token: str) -> str:
        """Determine the correct API base URL based on token type."""
        if access_token.startswith('IG'):
            return self.INSTAGRAM_API_BASE
        return self.FACEBOOK_API_BASE

    def fetch_posts(self, access_token: str, account_id: str, limit: int) -> list:
        """Fetch posts from the Instagram Graph API."""
        api_base = self.get_api_base(access_token)
        url = f'{api_base}/{account_id}/media'
        params = {
            'fields': ','.join(self.MEDIA_FIELDS),
            'limit': limit,
            'access_token': access_token,
        }

        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            return data.get('data', [])
        except requests.exceptions.HTTPError as e:
            error_data = e.response.json() if e.response else {}
            error_msg = error_data.get('error', {}).get('message', str(e))

            # Check for common token errors
            if 'token' in error_msg.lower() or 'expired' in error_msg.lower():
                raise CommandError(
                    f'Instagram API token error: {error_msg}\n'
                    'Your token may have expired. See documentation/NEXT_STEPS.md '
                    'for token refresh instructions.'
                )
            raise CommandError(f'Instagram API error: {error_msg}')
        except requests.exceptions.RequestException as e:
            raise CommandError(f'Network error fetching Instagram posts: {e}')

    def save_post(self, post_data: dict) -> tuple:
        """
        Save or update a post in the database.

        Returns:
            tuple: (InstagramPost instance, created boolean)
        """
        instagram_id = post_data['id']

        # Parse timestamp (Instagram uses ISO 8601 format)
        timestamp_str = post_data.get('timestamp')
        if timestamp_str:
            # Parse ISO format: 2025-12-09T15:30:00+0000
            timestamp = datetime.fromisoformat(timestamp_str.replace('+0000', '+00:00'))
        else:
            timestamp = timezone.now()

        # For videos, use thumbnail_url as the display image
        media_url = post_data.get('media_url', '')
        if post_data.get('media_type') == 'VIDEO' and post_data.get('thumbnail_url'):
            # Store thumbnail for display, but keep original media_url
            media_url = post_data.get('thumbnail_url')

        # Create or update the post
        post, created = InstagramPost.objects.update_or_create(
            instagram_id=instagram_id,
            defaults={
                'caption': post_data.get('caption', ''),
                'media_type': post_data.get('media_type', 'IMAGE'),
                'media_url': media_url,
                'permalink': post_data.get('permalink', ''),
                'timestamp': timestamp,
            }
        )

        return post, created
