"""
Calendar sync service for importing events from iCal/ICS feeds.

Supports any iCal-compatible calendar:
- Google Calendar (public iCal URL)
- Apple Calendar (shared calendar URL)
- Outlook Calendar (ICS export URL)
- Any other iCal feed
"""

import logging
from datetime import datetime, timedelta
from typing import Optional
import requests
from django.utils import timezone
from django.utils.text import slugify
from icalendar import Calendar

from ..models import CalendarSource, Event

logger = logging.getLogger(__name__)


class CalendarSyncError(Exception):
    """Custom exception for calendar sync errors"""
    pass


def fetch_ical_feed(url: str, timeout: int = 30) -> str:
    """Fetch iCal feed from URL"""
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        raise CalendarSyncError(f"Failed to fetch calendar: {str(e)}")


def parse_ical_datetime(dt_value) -> Optional[datetime]:
    """
    Parse iCal datetime value to timezone-aware datetime.
    Handles both DATE and DATE-TIME types.
    """
    if dt_value is None:
        return None

    dt = dt_value.dt

    # If it's a date (not datetime), convert to datetime at midnight
    if not isinstance(dt, datetime):
        dt = datetime.combine(dt, datetime.min.time())

    # Make timezone-aware if naive
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt)

    return dt


def generate_unique_slug(title: str, event_id: Optional[int] = None) -> str:
    """Generate a unique slug for an event"""
    base_slug = slugify(title)[:180]  # Leave room for suffix

    # Check for existing slugs
    existing = Event.objects.filter(slug__startswith=base_slug)
    if event_id:
        existing = existing.exclude(id=event_id)

    if not existing.exists():
        return base_slug

    # Add numeric suffix
    counter = 1
    while True:
        new_slug = f"{base_slug}-{counter}"
        if not existing.filter(slug=new_slug).exists():
            return new_slug
        counter += 1


def sync_calendar_source(source: CalendarSource) -> dict:
    """
    Sync events from a single calendar source.

    Returns dict with sync stats:
        - created: number of new events created
        - updated: number of existing events updated
        - skipped: number of locally-modified events skipped
        - errors: list of error messages
    """
    stats = {
        'created': 0,
        'updated': 0,
        'skipped': 0,
        'deleted': 0,
        'errors': [],
    }

    try:
        # Fetch the iCal feed
        ical_content = fetch_ical_feed(source.ical_url)

        # Parse the calendar
        try:
            cal = Calendar.from_ical(ical_content)
        except Exception as e:
            raise CalendarSyncError(f"Failed to parse calendar: {str(e)}")

        # Track which external UIDs we've seen (for cleanup)
        seen_uids = set()

        # Process each event
        for component in cal.walk():
            if component.name != 'VEVENT':
                continue

            try:
                # Extract iCal UID
                uid = str(component.get('uid', ''))
                if not uid:
                    stats['errors'].append("Event missing UID, skipped")
                    continue

                seen_uids.add(uid)

                # Extract event data
                summary = str(component.get('summary', '')) or 'Untitled Event'
                description = str(component.get('description', '')) or ''
                location = str(component.get('location', '')) or ''

                start_dt = parse_ical_datetime(component.get('dtstart'))
                end_dt = parse_ical_datetime(component.get('dtend'))

                if not start_dt:
                    stats['errors'].append(f"Event '{summary}' missing start time, skipped")
                    continue

                # Default end time to start + 1 hour if not specified
                if not end_dt:
                    end_dt = start_dt + timedelta(hours=1)

                # Skip past events (more than 30 days ago)
                if start_dt < timezone.now() - timedelta(days=30):
                    continue

                # Find existing event by external UID
                existing_event = Event.objects.filter(
                    external_uid=uid,
                    calendar_source=source
                ).first()

                if existing_event:
                    # Update existing event (unless locally modified)
                    if existing_event.is_locally_modified:
                        stats['skipped'] += 1
                        continue

                    # Update fields from calendar
                    existing_event.title = summary
                    existing_event.description = description
                    existing_event.location = location
                    existing_event.start_datetime = start_dt
                    existing_event.end_datetime = end_dt
                    existing_event.save()
                    stats['updated'] += 1

                else:
                    # Create new event
                    new_event = Event(
                        title=summary,
                        description=description,
                        location=location,
                        start_datetime=start_dt,
                        end_datetime=end_dt,
                        event_type=source.default_event_type,
                        is_public=source.auto_publish,
                        external_uid=uid,
                        calendar_source=source,
                        registration_open=False,  # Default to closed, admin enables
                    )
                    new_event.slug = generate_unique_slug(summary)
                    new_event.save()
                    stats['created'] += 1

            except Exception as e:
                summary = str(component.get('summary', 'Unknown'))
                stats['errors'].append(f"Error processing '{summary}': {str(e)}")
                logger.exception(f"Error processing event '{summary}'")

        # Update source metadata
        source.last_synced_at = timezone.now()
        source.last_sync_count = stats['created'] + stats['updated']
        source.sync_error = ''
        source.save()

        logger.info(
            f"Calendar sync completed for '{source.name}': "
            f"{stats['created']} created, {stats['updated']} updated, "
            f"{stats['skipped']} skipped"
        )

    except CalendarSyncError as e:
        source.sync_error = str(e)
        source.save()
        stats['errors'].append(str(e))
        logger.error(f"Calendar sync failed for '{source.name}': {e}")

    except Exception as e:
        source.sync_error = f"Unexpected error: {str(e)}"
        source.save()
        stats['errors'].append(str(e))
        logger.exception(f"Unexpected error syncing calendar '{source.name}'")

    return stats


def sync_all_calendars() -> dict:
    """
    Sync all active calendar sources.

    Returns dict with per-source stats.
    """
    results = {}

    active_sources = CalendarSource.objects.filter(is_active=True)

    for source in active_sources:
        results[source.name] = sync_calendar_source(source)

    return results
