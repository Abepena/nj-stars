from rest_framework import serializers
from .models import Coach, InstagramPost, NewsletterSubscriber


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


class NewsletterSubscribeSerializer(serializers.Serializer):
    """Serializer for newsletter subscription requests"""

    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    source = serializers.CharField(max_length=50, required=False, default='website')

    def validate_email(self, value):
        """Normalize email to lowercase"""
        return value.lower().strip()

    def create(self, validated_data):
        """Create or reactivate subscription"""
        email = validated_data['email']
        first_name = validated_data.get('first_name', '')
        source = validated_data.get('source', 'website')

        subscriber, created = NewsletterSubscriber.objects.get_or_create(
            email=email,
            defaults={
                'first_name': first_name,
                'source': source,
                'status': 'active',
            }
        )

        if not created:
            # Reactivate if previously unsubscribed
            if subscriber.status == 'unsubscribed':
                subscriber.status = 'active'
                subscriber.unsubscribed_at = None
            # Update first name if provided
            if first_name:
                subscriber.first_name = first_name
            subscriber.save()

        return subscriber


class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    """Serializer for newsletter subscriber details"""

    class Meta:
        model = NewsletterSubscriber
        fields = [
            'id',
            'email',
            'first_name',
            'status',
            'subscribe_events',
            'subscribe_news',
            'subscribe_promotions',
            'subscribed_at',
            'source',
        ]
        read_only_fields = ['id', 'subscribed_at']
