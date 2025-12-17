"""
Management command to geocode event locations.

Usage:
    python manage.py geocode_events           # Geocode events without coordinates
    python manage.py geocode_events --all     # Re-geocode ALL events
    python manage.py geocode_events --dry-run # Preview without saving
"""

from django.core.management.base import BaseCommand
from apps.events.models import Event
from apps.cms.wagtail_hooks import geocode_address
import time


class Command(BaseCommand):
    help = 'Geocode event locations to get latitude/longitude coordinates'

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='Re-geocode all events (not just those missing coordinates)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview changes without saving to database',
        )

    def handle(self, *args, **options):
        geocode_all = options['all']
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No changes will be saved\n'))

        # Get events to geocode
        if geocode_all:
            events = Event.objects.exclude(location='').exclude(location__isnull=True)
            self.stdout.write(f'Found {events.count()} events with locations to geocode\n')
        else:
            events = Event.objects.filter(
                latitude__isnull=True
            ).exclude(location='').exclude(location__isnull=True) | Event.objects.filter(
                longitude__isnull=True
            ).exclude(location='').exclude(location__isnull=True)
            self.stdout.write(f'Found {events.count()} events without coordinates\n')

        if not events.exists():
            self.stdout.write(self.style.SUCCESS('No events to geocode!'))
            return

        success_count = 0
        fail_count = 0

        for event in events:
            self.stdout.write(f'\nProcessing: {event.title}')
            self.stdout.write(f'  Location: {event.location}')

            lat, lng = geocode_address(event.location)

            if lat and lng:
                self.stdout.write(self.style.SUCCESS(f'  → Found: {lat}, {lng}'))
                if not dry_run:
                    event.latitude = lat
                    event.longitude = lng
                    event.save(update_fields=['latitude', 'longitude'])
                success_count += 1
            else:
                self.stdout.write(self.style.ERROR('  → Failed to geocode'))
                fail_count += 1

            # Rate limit to respect Nominatim's usage policy (1 request/second)
            time.sleep(1)

        self.stdout.write('\n' + '=' * 50)
        self.stdout.write(f'Geocoding complete!')
        self.stdout.write(self.style.SUCCESS(f'  Success: {success_count}'))
        if fail_count:
            self.stdout.write(self.style.ERROR(f'  Failed: {fail_count}'))
        if dry_run:
            self.stdout.write(self.style.WARNING('\nDRY RUN - No changes were saved'))
