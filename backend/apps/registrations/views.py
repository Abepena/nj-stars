from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
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
