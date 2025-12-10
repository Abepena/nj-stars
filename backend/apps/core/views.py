from rest_framework import viewsets, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Coach, InstagramPost, NewsletterSubscriber
from .serializers import (
    CoachSerializer,
    InstagramPostSerializer,
    NewsletterSubscribeSerializer,
)


class CoachViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for coaching staff.

    List all active coaches ordered by display order.
    Optionally filter by role.
    """
    queryset = Coach.objects.filter(is_active=True)
    serializer_class = CoachSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['role']
    ordering_fields = ['order', 'name']
    ordering = ['order', 'name']
    lookup_field = 'slug'


class InstagramPostViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for Instagram posts.

    List all Instagram posts ordered by timestamp (newest first).
    """
    queryset = InstagramPost.objects.all()
    serializer_class = InstagramPostSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['timestamp', 'created_at']
    ordering = ['-timestamp']


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Get dashboard statistics for the authenticated user.

    Returns counts for:
    - Upcoming events the user is registered for
    - Past event registrations
    - Recent orders
    - Payment status
    """
    user = request.user

    # Import models here to avoid circular imports
    from apps.registrations.models import EventRegistration
    from apps.payments.models import Order

    # Get upcoming events user is registered for
    upcoming_events = EventRegistration.objects.filter(
        user=user,
        event__start_datetime__gte=timezone.now(),
        status__in=['confirmed', 'pending']
    ).count()

    # Get past event registrations
    past_events = EventRegistration.objects.filter(
        user=user,
        event__start_datetime__lt=timezone.now()
    ).count()

    # Get recent orders count
    recent_orders = Order.objects.filter(
        user=user,
        status__in=['paid', 'processing', 'shipped', 'delivered']
    ).count()

    # Get pending orders count
    pending_orders = Order.objects.filter(
        user=user,
        status='pending'
    ).count()

    # Payment status - check if user has any pending payments
    has_outstanding = pending_orders > 0

    return Response({
        'upcoming_events': upcoming_events,
        'past_events': past_events,
        'recent_orders': recent_orders,
        'pending_orders': pending_orders,
        'payment_status': 'outstanding' if has_outstanding else 'current',
        'unread_announcements': 0,  # Future feature
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def newsletter_subscribe(request):
    """
    Subscribe to the newsletter.

    POST /api/newsletter/subscribe/
    {
        "email": "user@example.com",
        "first_name": "John"  // optional
    }

    Returns 201 for new subscribers, 200 for reactivated/existing.
    """
    serializer = NewsletterSubscribeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    subscriber = serializer.save()

    return Response(
        {
            'message': 'Successfully subscribed to the newsletter!',
            'email': subscriber.email,
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def newsletter_unsubscribe(request):
    """
    Unsubscribe from the newsletter.

    POST /api/newsletter/unsubscribe/
    {
        "email": "user@example.com"
    }
    """
    email = request.data.get('email', '').lower().strip()

    if not email:
        return Response(
            {'error': 'Email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        subscriber = NewsletterSubscriber.objects.get(email=email)
        subscriber.unsubscribe()
        return Response({'message': 'Successfully unsubscribed'})
    except NewsletterSubscriber.DoesNotExist:
        # Don't reveal if email exists or not
        return Response({'message': 'Successfully unsubscribed'})
