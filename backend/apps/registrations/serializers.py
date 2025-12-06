from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import EventRegistration
from apps.events.models import Event

User = get_user_model()


class EventRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for creating event registrations"""

    event_title = serializers.ReadOnlyField(source='event.title')
    event_slug = serializers.CharField(write_only=True)

    class Meta:
        model = EventRegistration
        fields = [
            'id',
            'event',
            'event_slug',
            'event_title',
            'user',
            'participant_first_name',
            'participant_last_name',
            'participant_age',
            'participant_email',
            'participant_phone',
            'emergency_contact_name',
            'emergency_contact_phone',
            'emergency_contact_relationship',
            'medical_notes',
            'payment_status',
            'amount_paid',
            'registered_at',
        ]
        read_only_fields = [
            'id',
            'event',
            'user',
            'payment_status',
            'amount_paid',
            'registered_at',
        ]

    def validate_event_slug(self, value):
        """Validate that the event exists and is open for registration"""
        try:
            event = Event.objects.get(slug=value, is_public=True)
        except Event.DoesNotExist:
            raise serializers.ValidationError("Event not found or not available.")

        if not event.is_registration_open:
            raise serializers.ValidationError(
                "Registration is currently closed for this event."
            )

        return value

    def validate(self, attrs):
        """Additional validation"""
        # Get the event
        event = Event.objects.get(slug=attrs['event_slug'])

        # Check if event requires payment
        if event.requires_payment and event.price:
            attrs['amount_paid'] = event.price

        return attrs

    def create(self, validated_data):
        """Create registration and link to event"""
        event_slug = validated_data.pop('event_slug')
        event = Event.objects.get(slug=event_slug)

        # Set the event and user
        validated_data['event'] = event
        validated_data['user'] = self.context['request'].user

        # Set payment status based on event requirements
        if event.requires_payment:
            validated_data['payment_status'] = 'pending'
        else:
            validated_data['payment_status'] = 'completed'
            validated_data['amount_paid'] = 0

        return super().create(validated_data)


class EventRegistrationListSerializer(serializers.ModelSerializer):
    """Serializer for listing user's registrations"""

    event_title = serializers.ReadOnlyField(source='event.title')
    event_slug = serializers.ReadOnlyField(source='event.slug')
    event_start_datetime = serializers.ReadOnlyField(source='event.start_datetime')
    event_location = serializers.ReadOnlyField(source='event.location')
    event_type = serializers.ReadOnlyField(source='event.event_type')

    class Meta:
        model = EventRegistration
        fields = [
            'id',
            'event_title',
            'event_slug',
            'event_start_datetime',
            'event_location',
            'event_type',
            'participant_first_name',
            'participant_last_name',
            'payment_status',
            'amount_paid',
            'registered_at',
        ]
