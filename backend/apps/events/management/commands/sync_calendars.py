"""
Management command to sync events from external calendar sources.

Usage:
    # Sync all active calendar sources
    python manage.py sync_calendars

    # Sync a specific source by ID
    python manage.py sync_calendars --source=1

    # Sync a specific source by name
    python manage.py sync_calendars --name="Master Schedule"

    # Verbose output
    python manage.py sync_calendars -v 2
"""

from django.core.management.base import BaseCommand, CommandError

from apps.events.models import CalendarSource
from apps.events.services import sync_calendar_source, sync_all_calendars


class Command(BaseCommand):
    help = 'Sync events from external iCal/ICS calendar sources'

    def add_arguments(self, parser):
        parser.add_argument(
            '--source',
            type=int,
            help='Sync only the calendar source with this ID',
        )
        parser.add_argument(
            '--name',
            type=str,
            help='Sync only the calendar source with this name',
        )
        parser.add_argument(
            '--list',
            action='store_true',
            help='List all calendar sources and their sync status',
        )

    def handle(self, *args, **options):
        # List mode
        if options['list']:
            self.list_sources()
            return

        # Single source by ID
        if options['source']:
            try:
                source = CalendarSource.objects.get(id=options['source'])
            except CalendarSource.DoesNotExist:
                raise CommandError(f"Calendar source with ID {options['source']} not found")

            self.sync_single_source(source)
            return

        # Single source by name
        if options['name']:
            try:
                source = CalendarSource.objects.get(name__iexact=options['name'])
            except CalendarSource.DoesNotExist:
                raise CommandError(f"Calendar source '{options['name']}' not found")

            self.sync_single_source(source)
            return

        # Sync all active sources
        self.sync_all_sources()

    def list_sources(self):
        """List all calendar sources"""
        sources = CalendarSource.objects.all()

        if not sources.exists():
            self.stdout.write(self.style.WARNING('No calendar sources configured.'))
            self.stdout.write('Add one in Django admin at /django-admin/events/calendarsource/')
            return

        self.stdout.write('\nCalendar Sources:')
        self.stdout.write('-' * 80)

        for source in sources:
            status = self.style.SUCCESS('Active') if source.is_active else self.style.WARNING('Inactive')
            last_sync = source.last_synced_at.strftime('%Y-%m-%d %H:%M') if source.last_synced_at else 'Never'

            self.stdout.write(f"\n  [{source.id}] {source.name}")
            self.stdout.write(f"      Status: {status}")
            self.stdout.write(f"      Last Sync: {last_sync}")
            self.stdout.write(f"      Events: {source.last_sync_count}")
            self.stdout.write(f"      Default Type: {source.default_event_type}")

            if source.sync_error:
                self.stdout.write(f"      Error: {self.style.ERROR(source.sync_error)}")

        self.stdout.write('')

    def sync_single_source(self, source: CalendarSource):
        """Sync a single calendar source"""
        self.stdout.write(f"\nSyncing calendar: {source.name}")
        self.stdout.write(f"  URL: {source.ical_url[:60]}...")

        stats = sync_calendar_source(source)

        self.print_stats(stats)

    def sync_all_sources(self):
        """Sync all active calendar sources"""
        active_count = CalendarSource.objects.filter(is_active=True).count()

        if active_count == 0:
            self.stdout.write(self.style.WARNING('\nNo active calendar sources found.'))
            self.stdout.write('Add one in Django admin at /django-admin/events/calendarsource/')
            return

        self.stdout.write(f"\nSyncing {active_count} active calendar source(s)...")
        self.stdout.write('-' * 40)

        results = sync_all_calendars()

        for source_name, stats in results.items():
            self.stdout.write(f"\n{source_name}:")
            self.print_stats(stats, indent=2)

        self.stdout.write('\n' + self.style.SUCCESS('Sync complete!'))

    def print_stats(self, stats: dict, indent: int = 0):
        """Print sync statistics"""
        prefix = ' ' * indent

        created = stats.get('created', 0)
        updated = stats.get('updated', 0)
        skipped = stats.get('skipped', 0)
        errors = stats.get('errors', [])

        if created:
            self.stdout.write(f"{prefix}  Created: {self.style.SUCCESS(str(created))}")
        if updated:
            self.stdout.write(f"{prefix}  Updated: {self.style.SUCCESS(str(updated))}")
        if skipped:
            self.stdout.write(f"{prefix}  Skipped (locally modified): {skipped}")

        if errors:
            self.stdout.write(f"{prefix}  Errors: {self.style.ERROR(str(len(errors)))}")
            for error in errors[:5]:  # Show first 5 errors
                self.stdout.write(f"{prefix}    - {error}")
            if len(errors) > 5:
                self.stdout.write(f"{prefix}    ... and {len(errors) - 5} more")

        if not created and not updated and not skipped and not errors:
            self.stdout.write(f"{prefix}  No changes")
