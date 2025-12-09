from rest_framework import serializers
from .models import Coach, InstagramPost


class CoachSerializer(serializers.ModelSerializer):
    """Serializer for Coach profiles"""

    instagram_url = serializers.ReadOnlyField()
    specialties_list = serializers.ReadOnlyField()

    class Meta:
        model = Coach
        fields = [
            'id',
            'name',
            'display_name',
            'slug',
            'role',
            'title',
            'bio',
            'photo_url',
            'instagram_handle',
            'instagram_url',
            'specialties',
            'specialties_list',
            'is_active',
            'order',
        ]


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
