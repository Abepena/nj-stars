from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Coach, InstagramPost
from .serializers import CoachSerializer, InstagramPostSerializer


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
