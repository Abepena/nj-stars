from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from .models import EventRegistration
from .serializers import EventRegistrationSerializer, EventRegistrationListSerializer


class EventRegistrationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for event registrations.

    - POST /api/events/registrations/ - Create a new registration
    - GET /api/events/registrations/ - List user's registrations
    - GET /api/events/registrations/{id}/ - Get specific registration
    - DELETE /api/events/registrations/{id}/ - Cancel registration (if allowed)
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return only the authenticated user's registrations"""
        return EventRegistration.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        """Use different serializers for list vs create"""
        if self.action == 'list':
            return EventRegistrationListSerializer
        return EventRegistrationSerializer

    def create(self, request, *args, **kwargs):
        """Create a new event registration"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        registration = serializer.save()

        # Use list serializer for response
        response_serializer = EventRegistrationListSerializer(registration)

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )

    def destroy(self, request, *args, **kwargs):
        """Cancel a registration (only if payment is pending or event allows)"""
        instance = self.get_object()

        # Only allow cancellation if payment is still pending
        if instance.payment_status != 'pending':
            return Response(
                {"error": "Cannot cancel a registration with completed payment. Please contact support."},
                status=status.HTTP_400_BAD_REQUEST
            )

        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get user's upcoming event registrations"""
        from django.utils import timezone

        upcoming_registrations = self.get_queryset().filter(
            event__start_datetime__gte=timezone.now()
        ).select_related('event')

        serializer = EventRegistrationListSerializer(upcoming_registrations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def past(self, request):
        """Get user's past event registrations"""
        from django.utils import timezone

        past_registrations = self.get_queryset().filter(
            event__start_datetime__lt=timezone.now()
        ).select_related('event')

        serializer = EventRegistrationListSerializer(past_registrations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_event_ids(self, request):
        """
        Get list of event IDs the user is registered for.
        Used by frontend to filter 'My Events' view.
        Returns only upcoming events with completed or pending payment.
        """
        from django.utils import timezone

        event_ids = self.get_queryset().filter(
            event__start_datetime__gte=timezone.now(),
            payment_status__in=['completed', 'pending']
        ).values_list('event_id', flat=True).distinct()

        return Response({'event_ids': list(event_ids)})

    @action(detail=False, methods=['get'], url_path='calendar.ics')
    def calendar_ics(self, request):
        """
        Generate iCalendar (.ics) feed for user's registered events.
        No API key required - iCalendar is just a file format standard.

        Usage:
        - Direct download: GET /api/events/registrations/calendar.ics
        - Subscribe in calendar apps: webcal://domain/api/events/registrations/calendar.ics
        """
        from django.utils import timezone
        from django.conf import settings
        import hashlib

        # Get upcoming registered events
        registrations = self.get_queryset().filter(
            event__start_datetime__gte=timezone.now(),
            payment_status__in=['completed', 'pending']
        ).select_related('event').order_by('event__start_datetime')

        # Build iCalendar content
        lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//NJ Stars Elite AAU//Events Calendar//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:NJ Stars - My Events',
            'X-WR-TIMEZONE:America/New_York',
        ]

        for reg in registrations:
            event = reg.event

            # Generate unique ID for this event
            uid = hashlib.md5(f"njstars-event-{event.id}".encode()).hexdigest()

            # Format datetimes in iCal format (YYYYMMDDTHHMMSSz)
            start_dt = event.start_datetime.strftime('%Y%m%dT%H%M%SZ')
            end_dt = event.end_datetime.strftime('%Y%m%dT%H%M%SZ')
            created_dt = event.created_at.strftime('%Y%m%dT%H%M%SZ') if hasattr(event, 'created_at') else start_dt

            # Escape special characters in text fields
            def escape_ical(text):
                if not text:
                    return ''
                return text.replace('\\', '\\\\').replace(';', '\\;').replace(',', '\\,').replace('\n', '\\n')

            title = escape_ical(event.title)
            description = escape_ical(event.description or '')
            location = escape_ical(event.location or '')

            # Get frontend URL for event details
            frontend_url = getattr(settings, 'FRONTEND_URL', 'https://njstarselite.com')
            event_url = f"{frontend_url}/events/{event.slug}"

            lines.extend([
                'BEGIN:VEVENT',
                f'UID:{uid}@njstarselite.com',
                f'DTSTAMP:{start_dt}',
                f'DTSTART:{start_dt}',
                f'DTEND:{end_dt}',
                f'SUMMARY:{title}',
                f'DESCRIPTION:{description}\\n\\nView details: {event_url}',
                f'LOCATION:{location}',
                f'URL:{event_url}',
                'STATUS:CONFIRMED',
                'END:VEVENT',
            ])

        lines.append('END:VCALENDAR')

        # Join with CRLF as per iCal spec
        ical_content = '\r\n'.join(lines)

        response = HttpResponse(ical_content, content_type='text/calendar; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="njstars-my-events.ics"'
        return response
