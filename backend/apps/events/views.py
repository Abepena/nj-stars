from rest_framework import viewsets, filters, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from apps.portal.permissions import IsStaffMember, IsAdminUser
from .models import Event
from .serializers import EventSerializer


class EventViewSet(viewsets.ModelViewSet):
    """
    API endpoint for events.

    Public endpoints:
    - GET /api/events/ - List all public events
    - GET /api/events/{slug}/ - Retrieve a single event

    Admin endpoints (requires staff/admin permission):
    - POST /api/events/ - Create a new event
    - PUT/PATCH /api/events/{slug}/ - Update an event
    - DELETE /api/events/{slug}/ - Delete an event
    """
    serializer_class = EventSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event_type', 'registration_open']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['start_datetime', 'created_at', 'price']
    ordering = ['start_datetime']

    def get_queryset(self):
        """
        - Public users see only public events
        - Staff/admin see all events
        """
        user = self.request.user
        
        # Staff can see all events (including non-public)
        if user.is_authenticated:
            if user.is_staff or user.is_superuser:
                return Event.objects.all()
            if hasattr(user, 'profile') and user.profile.is_staff_member:
                return Event.objects.all()
        
        # Public sees only public events
        return Event.objects.filter(is_public=True)

    def get_permissions(self):
        """
        - List/Retrieve: Anyone can access (public events)
        - Create/Update/Delete: Staff members only
        """
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsStaffMember()]

    def perform_create(self, serializer):
        """Set created_by when creating an event"""
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsStaffMember])
    def duplicate(self, request, slug=None):
        """
        Duplicate an event (create a copy with updated dates).
        POST /api/events/{slug}/duplicate/
        
        Body: { "start_datetime": "2025-02-01T10:00:00Z", "end_datetime": "2025-02-01T12:00:00Z" }
        """
        original = self.get_object()
        
        # Get new dates from request or default to original
        new_start = request.data.get('start_datetime', original.start_datetime)
        new_end = request.data.get('end_datetime', original.end_datetime)
        new_title = request.data.get('title', f"{original.title} (Copy)")
        
        # Create duplicate
        new_event = Event.objects.create(
            title=new_title,
            description=original.description,
            event_type=original.event_type,
            start_datetime=new_start,
            end_datetime=new_end,
            location=original.location,
            latitude=original.latitude,
            longitude=original.longitude,
            max_participants=original.max_participants,
            price=original.price,
            requires_payment=original.requires_payment,
            registration_open=False,  # Don't auto-open registration
            is_public=False,  # Start as draft
            created_by=request.user,
        )
        
        serializer = self.get_serializer(new_event)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsStaffMember])
    def toggle_registration(self, request, slug=None):
        """
        Toggle registration open/closed.
        POST /api/events/{slug}/toggle_registration/
        """
        event = self.get_object()
        event.registration_open = not event.registration_open
        event.save(update_fields=['registration_open'])
        serializer = self.get_serializer(event)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsStaffMember])
    def toggle_public(self, request, slug=None):
        """
        Toggle event visibility (public/private).
        POST /api/events/{slug}/toggle_public/
        """
        event = self.get_object()
        event.is_public = not event.is_public
        event.save(update_fields=['is_public'])
        serializer = self.get_serializer(event)
        return Response(serializer.data)
