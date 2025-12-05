from rest_framework import viewsets, filters
from .models import InstagramPost
from .serializers import InstagramPostSerializer


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
