from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Event
from .serializers import EventSerializer


class EventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for events.

    List all events or retrieve a single event.
    Supports filtering by event_type and searching by title/description.
    """
    queryset = Event.objects.filter(is_public=True)
    serializer_class = EventSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event_type', 'registration_open']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['start_datetime', 'created_at', 'price']
    ordering = ['start_datetime']
