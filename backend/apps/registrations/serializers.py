from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
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
            'waiver_signed',
            'waiver_signer_name',
            'waiver_signed_at',
            'waiver_version',
            'payment_status',
            'amount_paid',
            'registered_at',
        ]
        read_only_fields = [
            'id',
            'event',
            'user',
            'waiver_signed_at',
            'waiver_version',
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
        request = self.context['request']
        event = Event.objects.get(slug=attrs['event_slug'])

        # Email required for guest registrations
        if not request.user.is_authenticated and not attrs.get('participant_email'):
            raise serializers.ValidationError({
                'participant_email': 'Email is required for registration.'
            })

        # Waiver must be signed
        if not attrs.get('waiver_signed'):
            raise serializers.ValidationError({
                'waiver_signed': 'You must sign the liability waiver to register.'
            })

        # Signer name required if waiver is signed
        if attrs.get('waiver_signed') and not attrs.get('waiver_signer_name', '').strip():
            raise serializers.ValidationError({
                'waiver_signer_name': 'Please enter your name to sign the waiver.'
            })

        # Check for duplicate registration
        email = attrs.get('participant_email', '')
        existing_query = EventRegistration.objects.filter(
            event=event,
            participant_email=email
        )
        if request.user.is_authenticated:
            existing_query = existing_query.filter(user=request.user)

        if existing_query.exists():
            raise serializers.ValidationError(
                "A registration with this email already exists for this event."
            )

        # Check if event requires payment
        if event.requires_payment and event.price:
            attrs['amount_paid'] = event.price

        return attrs

    def create(self, validated_data):
        """Create registration and link to event"""
        event_slug = validated_data.pop('event_slug')
        event = Event.objects.get(slug=event_slug)
        request = self.context['request']

        # Set the event
        validated_data['event'] = event

        # Set user only if authenticated (None for guests)
        if request.user.is_authenticated:
            validated_data['user'] = request.user
        else:
            validated_data['user'] = None

        # Set waiver timestamp and version if signed
        if validated_data.get('waiver_signed'):
            validated_data['waiver_signed_at'] = timezone.now()
            validated_data['waiver_version'] = '2024.1'

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
