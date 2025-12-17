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
        """Normalize email to lowercase and check for duplicates"""
        normalized = value.lower().strip()

        # Check if email already exists and is active
        existing = NewsletterSubscriber.objects.filter(email=normalized).first()
        if existing and existing.status == 'active':
            raise serializers.ValidationError(
                "This email is already subscribed to our newsletter."
            )

        return normalized

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


class ContactSubmissionSerializer(serializers.Serializer):
    """Serializer for public contact form submissions"""

    name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    category = serializers.ChoiceField(choices=[
        ('general', 'General Question'),
        ('registration', 'Registration & Events'),
        ('payments', 'Orders & Payments'),
        ('portal', 'Portal / Account Issues'),
        ('technical', 'Website / Technical Issues'),
        ('feedback', 'Feedback & Suggestions'),
        ('other', 'Other'),
    ])
    subject = serializers.CharField(max_length=200)
    message = serializers.CharField()

    def create(self, validated_data):
        from .models import ContactSubmission
        return ContactSubmission.objects.create(**validated_data)


class ContactSubmissionAdminSerializer(serializers.ModelSerializer):
    """Serializer for admin view of contact submissions"""

    assigned_to_name = serializers.SerializerMethodField()
    resolved_by_name = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        from .models import ContactSubmission
        model = ContactSubmission
        fields = [
            'id', 'name', 'email', 'phone',
            'category', 'category_display',
            'subject', 'message',
            'status', 'status_display',
            'priority', 'priority_display',
            'admin_notes', 'assigned_to', 'assigned_to_name',
            'resolved_at', 'resolved_by', 'resolved_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.email
        return None

    def get_resolved_by_name(self, obj):
        if obj.resolved_by:
            return obj.resolved_by.get_full_name() or obj.resolved_by.email
        return None
