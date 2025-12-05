from rest_framework import serializers
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    """Serializer for Event model"""

    spots_remaining = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()
    is_registration_open = serializers.ReadOnlyField()

    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'slug',
            'description',
            'event_type',
            'start_datetime',
            'end_datetime',
            'location',
            'requires_payment',
            'price',
            'max_participants',
            'registration_open',
            'registration_deadline',
            'is_public',
            'created_at',
            'updated_at',
            # Computed fields
            'spots_remaining',
            'is_full',
            'is_registration_open',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
