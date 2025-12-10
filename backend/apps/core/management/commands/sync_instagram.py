"""
Instagram Graph API sync command.

Fetches posts from the NJ Stars Instagram Business account and stores them
in the InstagramPost model for display in the news feed.

Usage:
    python manage.py sync_instagram
    python manage.py sync_instagram --limit 10
    python manage.py sync_instagram --verbose

Setup:
    See documentation/NEXT_STEPS.md for the Instagram Graph API setup guide.
    Required environment variables:
    - INSTAGRAM_ACCESS_TOKEN: Long-lived access token (60 days)
    - INSTAGRAM_BUSINESS_ACCOUNT_ID: Instagram Business Account ID
"""

import requests
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.utils import timezone
from apps.core.models import InstagramPost


class Command(BaseCommand):
    help = 'Sync Instagram posts from the Graph API to the database'

    # Instagram Graph API base URL
    GRAPH_API_BASE = 'https://graph.facebook.com/v18.0'

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

    def handle(self, *args, **options):
        # Get credentials from settings/environment
        access_token = getattr(settings, 'INSTAGRAM_ACCESS_TOKEN', None)
        account_id = getattr(settings, 'INSTAGRAM_BUSINESS_ACCOUNT_ID', None)

        if not access_token:
            raise CommandError(
                'INSTAGRAM_ACCESS_TOKEN is not set. '
                'See documentation/NEXT_STEPS.md for setup instructions.'
            )

        if not account_id:
            raise CommandError(
                'INSTAGRAM_BUSINESS_ACCOUNT_ID is not set. '
                'See documentation/NEXT_STEPS.md for setup instructions.'
            )

        limit = options['limit']
        verbose = options['verbose']
        dry_run = options['dry_run']

        self.stdout.write(f'Fetching up to {limit} posts from Instagram...')

        # Fetch posts from the Graph API
        posts = self.fetch_posts(access_token, account_id, limit)

        if not posts:
            self.stdout.write(self.style.WARNING('No posts found.'))
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

        self.stdout.write(
            self.style.SUCCESS(
                f'Sync complete! Created: {created_count}, Updated: {updated_count}'
            )
        )

    def fetch_posts(self, access_token: str, account_id: str, limit: int) -> list:
        """Fetch posts from the Instagram Graph API."""
        url = f'{self.GRAPH_API_BASE}/{account_id}/media'
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
