from rest_framework import serializers
from .models import InstagramPost


class InstagramPostSerializer(serializers.ModelSerializer):
    """Serializer for Instagram posts"""

    class Meta:
        model = InstagramPost
        fields = [
            'id',
            'instagram_id',
            'caption',
            'media_type',
            'media_url',
            'permalink',
            'timestamp',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
