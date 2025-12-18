from rest_framework import viewsets, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .emails import send_contact_notification
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


@api_view(['POST'])
@permission_classes([AllowAny])
def contact_submit(request):
    """
    Submit a contact form.

    POST /api/contact/
    {
        "name": "John Smith",
        "email": "john@example.com",
        "phone": "555-1234",  // optional
        "category": "general",
        "subject": "Question about tryouts",
        "message": "I wanted to ask about..."
    }
    """
    from .serializers import ContactSubmissionSerializer

    serializer = ContactSubmissionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    # Add request metadata
    submission = serializer.save(
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
    )

    # Send email notification (async in background)
    send_contact_notification(submission)

    return Response(
        {
            'message': 'Thank you for contacting us! We will get back to you soon.',
            'submission_id': submission.id,
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def contact_submissions_list(request):
    """
    List contact submissions for admin dashboard.

    GET /api/contact/admin/
    Query params:
    - status: filter by status (new, in_progress, resolved, closed)
    - category: filter by category
    - limit: number of results (default 10)
    """
    from .models import ContactSubmission
    from .serializers import ContactSubmissionAdminSerializer

    # Check if user is staff
    if not request.user.is_staff:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )

    queryset = ContactSubmission.objects.all()

    # Filter by status
    status_filter = request.GET.get('status')
    if status_filter:
        queryset = queryset.filter(status=status_filter)

    # Filter by category
    category = request.GET.get('category')
    if category:
        queryset = queryset.filter(category=category)

    # Limit results
    limit = int(request.GET.get('limit', 10))
    queryset = queryset[:limit]

    serializer = ContactSubmissionAdminSerializer(queryset, many=True)
    return Response({
        'submissions': serializer.data,
        'total_new': ContactSubmission.objects.filter(status='new').count(),
        'total_in_progress': ContactSubmission.objects.filter(status='in_progress').count(),
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def contact_submission_update(request, pk):
    """
    Update a contact submission status.

    PATCH /api/contact/admin/<id>/
    {
        "status": "in_progress",
        "priority": "high",
        "admin_notes": "Following up via email"
    }
    """
    from .models import ContactSubmission
    from .serializers import ContactSubmissionAdminSerializer

    # Check if user is staff
    if not request.user.is_staff:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        submission = ContactSubmission.objects.get(pk=pk)
    except ContactSubmission.DoesNotExist:
        return Response(
            {'error': 'Submission not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Handle status change to resolved
    if request.data.get('status') == 'resolved' and submission.status != 'resolved':
        submission.mark_resolved(request.user)
    else:
        serializer = ContactSubmissionAdminSerializer(
            submission,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

    return Response(ContactSubmissionAdminSerializer(submission).data)


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def contact_reply(request, pk):
    """
    Send a reply to a contact submission.

    POST /api/contact/<id>/reply/
    {
        "message": "Thank you for reaching out..."
    }
    """
    from .models import ContactSubmission
    from .emails import send_contact_reply

    # Check if user is staff
    if not request.user.is_staff:
        return Response(
            {"error": "Permission denied"},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        submission = ContactSubmission.objects.get(pk=pk)
    except ContactSubmission.DoesNotExist:
        return Response(
            {"error": "Submission not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    message = request.data.get("message", "").strip()
    if not message:
        return Response(
            {"error": "Message is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Send the reply email
    success = send_contact_reply(
        submission=submission,
        reply_message=message,
        staff_user=request.user
    )

    if success:
        # Update submission status to in_progress if it was new
        if submission.status == "new":
            submission.status = "in_progress"
            submission.assigned_to = request.user
            submission.save()

        return Response({
            "message": "Reply sent successfully",
            "sent_to": submission.email
        })
    else:
        return Response(
            {"error": "Failed to send email. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def contact_status_update(request, pk):
    """
    Update contact submission status.

    PATCH /api/contact/<id>/status/
    {
        "status": "resolved"
    }
    """
    from .models import ContactSubmission

    # Check if user is staff
    if not request.user.is_staff:
        return Response(
            {"error": "Permission denied"},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        submission = ContactSubmission.objects.get(pk=pk)
    except ContactSubmission.DoesNotExist:
        return Response(
            {"error": "Submission not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    new_status = request.data.get("status")
    if new_status not in ["new", "in_progress", "resolved", "closed"]:
        return Response(
            {"error": "Invalid status"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if new_status == "resolved":
        submission.mark_resolved(request.user)
    else:
        submission.status = new_status
        submission.save()

    return Response({"status": submission.status})
