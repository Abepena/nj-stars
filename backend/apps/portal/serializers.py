from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import (
    UserProfile, Player, GuardianRelationship,
    DuesAccount, DuesTransaction, SavedPaymentMethod,
    PromoCredit, EventCheckIn
)
from apps.registrations.models import EventRegistration
from apps.payments.models import Order

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    """User profile with basic info"""
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    full_name = serializers.CharField(read_only=True)
    profile_completeness = serializers.IntegerField(read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone', 'address_line1', 'address_line2',
            'city', 'state', 'zip_code', 'auto_pay_enabled',
            'notification_email', 'notification_sms',
            'profile_completeness', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'email', 'role', 'created_at', 'updated_at']

    def update(self, instance, validated_data):
        # Handle nested user data
        user_data = validated_data.pop('user', {})
        if user_data:
            user = instance.user
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()

        return super().update(instance, validated_data)


class PlayerSummarySerializer(serializers.ModelSerializer):
    """Lightweight player serializer for lists"""
    age = serializers.IntegerField(read_only=True)
    primary_photo_url = serializers.CharField(read_only=True)

    class Meta:
        model = Player
        fields = [
            'id', 'first_name', 'last_name', 'age',
            'team_name', 'primary_photo_url', 'is_active'
        ]


class PlayerDetailSerializer(serializers.ModelSerializer):
    """Full player details for profile view"""
    age = serializers.IntegerField(read_only=True)
    can_have_own_account = serializers.BooleanField(read_only=True)
    primary_photo_url = serializers.CharField(read_only=True)
    dues_balance = serializers.SerializerMethodField()
    upcoming_events_count = serializers.SerializerMethodField()
    is_checked_in = serializers.SerializerMethodField()

    class Meta:
        model = Player
        fields = [
            'id', 'first_name', 'last_name', 'date_of_birth', 'age',
            'email', 'phone', 'jersey_number', 'position', 'team_name',
            'primary_photo_url', 'medical_notes',
            'emergency_contact_name', 'emergency_contact_phone',
            'emergency_contact_relationship',
            'is_active', 'can_have_own_account',
            'dues_balance', 'upcoming_events_count', 'is_checked_in',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'age', 'created_at', 'updated_at']

    def get_dues_balance(self, obj):
        if hasattr(obj, 'dues_account'):
            return str(obj.dues_account.balance)
        return "0.00"

    def get_upcoming_events_count(self, obj):
        return EventRegistration.objects.filter(
            participant_first_name=obj.first_name,
            participant_last_name=obj.last_name,
            event__start_datetime__gte=timezone.now()
        ).count()

    def get_is_checked_in(self, obj):
        """Check if player is currently checked into any event"""
        active_checkins = EventCheckIn.objects.filter(
            event_registration__participant_first_name=obj.first_name,
            event_registration__participant_last_name=obj.last_name,
            checked_in_at__isnull=False,
            checked_out_at__isnull=True
        ).exists()
        return active_checkins


class PlayerCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new players with guardian link"""

    class Meta:
        model = Player
        fields = [
            'first_name', 'last_name', 'date_of_birth',
            'email', 'phone', 'jersey_number', 'position', 'team_name',
            'medical_notes', 'emergency_contact_name',
            'emergency_contact_phone', 'emergency_contact_relationship'
        ]

    def create(self, validated_data):
        player = super().create(validated_data)

        # Link the creating user as primary guardian
        user = self.context['request'].user
        GuardianRelationship.objects.create(
            guardian=user,
            player=player,
            relationship='parent',
            is_primary=True
        )

        return player


class GuardianRelationshipSerializer(serializers.ModelSerializer):
    """Guardian-player relationship info"""
    guardian_email = serializers.EmailField(source='guardian.email', read_only=True)
    guardian_name = serializers.SerializerMethodField()
    player_name = serializers.CharField(source='player.full_name', read_only=True)

    class Meta:
        model = GuardianRelationship
        fields = [
            'id', 'guardian', 'guardian_email', 'guardian_name',
            'player', 'player_name', 'relationship',
            'is_primary', 'can_pickup', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_guardian_name(self, obj):
        return obj.guardian.get_full_name() or obj.guardian.email


class DuesTransactionSerializer(serializers.ModelSerializer):
    """Individual transaction record"""

    class Meta:
        model = DuesTransaction
        fields = [
            'id', 'transaction_type', 'amount', 'description',
            'balance_after', 'created_at'
        ]


class DuesAccountSerializer(serializers.ModelSerializer):
    """Dues account with recent transactions"""
    player_name = serializers.CharField(source='player.full_name', read_only=True)
    recent_transactions = serializers.SerializerMethodField()

    class Meta:
        model = DuesAccount
        fields = [
            'id', 'player', 'player_name', 'balance',
            'is_good_standing', 'last_payment_date',
            'recent_transactions', 'created_at'
        ]

    def get_recent_transactions(self, obj):
        transactions = obj.transactions.all()[:5]
        return DuesTransactionSerializer(transactions, many=True).data


class SavedPaymentMethodSerializer(serializers.ModelSerializer):
    """Saved payment method display"""
    display_name = serializers.CharField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = SavedPaymentMethod
        fields = [
            'id', 'card_brand', 'card_last4',
            'card_exp_month', 'card_exp_year',
            'is_default', 'nickname', 'display_name',
            'is_expired', 'created_at'
        ]
        read_only_fields = [
            'id', 'card_brand', 'card_last4',
            'card_exp_month', 'card_exp_year', 'created_at'
        ]


class PromoCreditSerializer(serializers.ModelSerializer):
    """Promo credit display"""
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = PromoCredit
        fields = [
            'id', 'credit_type', 'amount', 'remaining_amount',
            'description', 'expires_at', 'is_active',
            'is_expired', 'created_at'
        ]


class EventCheckInSerializer(serializers.ModelSerializer):
    """Check-in status for events"""
    event_title = serializers.CharField(
        source='event_registration.event.title',
        read_only=True
    )
    event_date = serializers.DateTimeField(
        source='event_registration.event.start_datetime',
        read_only=True
    )
    participant_name = serializers.SerializerMethodField()
    is_checked_in = serializers.BooleanField(read_only=True)
    is_checked_out = serializers.BooleanField(read_only=True)

    class Meta:
        model = EventCheckIn
        fields = [
            'id', 'event_registration', 'event_title', 'event_date',
            'participant_name', 'checked_in_at', 'checked_out_at',
            'is_checked_in', 'is_checked_out', 'notes'
        ]

    def get_participant_name(self, obj):
        reg = obj.event_registration
        return f"{reg.participant_first_name} {reg.participant_last_name}"


# ==================== Dashboard Serializers ====================

class UpcomingEventSerializer(serializers.Serializer):
    """Upcoming event for dashboard"""
    player_name = serializers.CharField()
    event_title = serializers.CharField()
    event_date = serializers.DateTimeField()
    registration_id = serializers.IntegerField()


class ActiveCheckInSerializer(serializers.Serializer):
    """Active check-in for dashboard"""
    player_name = serializers.CharField()
    event_title = serializers.CharField()
    checked_in_at = serializers.DateTimeField()


class ParentDashboardSerializer(serializers.Serializer):
    """Aggregated dashboard data for parents"""
    profile = UserProfileSerializer()
    children = PlayerSummarySerializer(many=True)
    total_balance = serializers.DecimalField(max_digits=10, decimal_places=2)
    auto_pay_enabled = serializers.BooleanField()
    upcoming_events = UpcomingEventSerializer(many=True)
    recent_orders = serializers.ListField()
    promo_credit_total = serializers.DecimalField(max_digits=10, decimal_places=2)
    active_check_ins = ActiveCheckInSerializer(many=True)


class AdminStatsSerializer(serializers.Serializer):
    """Admin statistics for staff dashboard"""
    total_players = serializers.IntegerField()
    todays_events = serializers.IntegerField()
    pending_payments = serializers.IntegerField()
    check_ins_today = serializers.IntegerField()


# ==================== Waiver Serializers ====================

class WaiverStatusSerializer(serializers.Serializer):
    """Waiver status for a user"""
    has_signed_waiver = serializers.BooleanField()
    waiver_signed_at = serializers.DateTimeField(allow_null=True)
    waiver_version = serializers.CharField(allow_blank=True)
    waiver_signer_name = serializers.CharField(allow_blank=True)
    current_version = serializers.CharField()
    needs_update = serializers.BooleanField()


class WaiverSignSerializer(serializers.Serializer):
    """Sign a waiver"""
    signer_name = serializers.CharField(max_length=200, required=True)
    acknowledged = serializers.BooleanField(required=True)


# ==================== Admin Serializers ====================

class GuardianSummarySerializer(serializers.Serializer):
    """Guardian info for roster admin view"""
    id = serializers.IntegerField(source='guardian.id')
    first_name = serializers.CharField(source='guardian.first_name')
    last_name = serializers.CharField(source='guardian.last_name')
    email = serializers.EmailField(source='guardian.email')
    phone = serializers.SerializerMethodField()
    relationship = serializers.CharField()
    is_primary = serializers.BooleanField()

    def get_phone(self, obj):
        if hasattr(obj.guardian, 'profile'):
            return obj.guardian.profile.phone
        return ''


class PlayerAdminSerializer(serializers.ModelSerializer):
    """Full player info for admin roster view"""
    age = serializers.IntegerField(read_only=True)
    guardians = serializers.SerializerMethodField()
    waiver_signed = serializers.SerializerMethodField()
    grade = serializers.SerializerMethodField()
    school = serializers.SerializerMethodField()

    class Meta:
        model = Player
        fields = [
            'id', 'first_name', 'last_name', 'date_of_birth', 'age',
            'email', 'phone', 'jersey_number', 'position',
            'team_name', 'medical_notes',
            'emergency_contact_name', 'emergency_contact_phone',
            'guardians', 'waiver_signed', 'grade', 'school',
            'is_active', 'created_at'
        ]

    def get_guardians(self, obj):
        relationships = obj.guardian_relationships.select_related(
            'guardian', 'guardian__profile'
        ).all()
        return GuardianSummarySerializer(relationships, many=True).data

    def get_waiver_signed(self, obj):
        # Check if any guardian has signed waiver
        for rel in obj.guardian_relationships.select_related('guardian__profile'):
            if hasattr(rel.guardian, 'profile') and rel.guardian.profile.has_signed_waiver:
                return True
        return False

    def get_grade(self, obj):
        # Calculate grade from age (rough estimate)
        age = obj.age
        if age < 5:
            return None
        if age >= 18:
            return 12
        return max(1, min(12, age - 5))

    def get_school(self, obj):
        # School info could be stored in team_name or a dedicated field
        return obj.team_name if obj.team_name else None


class RegistrationAdminSerializer(serializers.ModelSerializer):
    """Registration info for admin view"""
    event = serializers.SerializerMethodField()
    checked_in = serializers.SerializerMethodField()
    checked_in_at = serializers.SerializerMethodField()

    class Meta:
        model = EventRegistration
        fields = [
            'id', 'event',
            'participant_first_name', 'participant_last_name',
            'participant_email', 'participant_phone', 'participant_age',
            'emergency_contact_name', 'emergency_contact_phone',
            'waiver_signed', 'payment_status', 'amount_paid',
            'registered_at', 'checked_in', 'checked_in_at'
        ]

    def get_event(self, obj):
        return {
            'id': obj.event.id,
            'title': obj.event.title,
            'slug': obj.event.slug,
            'start_datetime': obj.event.start_datetime,
        }

    def get_checked_in(self, obj):
        return hasattr(obj, 'check_in') and obj.check_in.is_checked_in

    def get_checked_in_at(self, obj):
        if hasattr(obj, 'check_in') and obj.check_in.checked_in_at:
            return obj.check_in.checked_in_at
        return None


class EventCheckInAdminSerializer(serializers.Serializer):
    """Event with registrations for check-in admin view"""
    id = serializers.IntegerField()
    title = serializers.CharField()
    slug = serializers.CharField()
    start_datetime = serializers.DateTimeField()
    end_datetime = serializers.DateTimeField()
    location = serializers.CharField()
    registrations = serializers.SerializerMethodField()
    checked_in_count = serializers.SerializerMethodField()
    total_registrations = serializers.SerializerMethodField()

    def get_registrations(self, obj):
        registrations = obj.registrations.select_related('check_in').all()
        result = []
        for reg in registrations:
            checked_in = hasattr(reg, 'check_in') and reg.check_in.is_checked_in
            checked_in_at = None
            checked_in_by = None
            if hasattr(reg, 'check_in') and reg.check_in.checked_in_at:
                checked_in_at = reg.check_in.checked_in_at.isoformat()
                if reg.check_in.checked_in_by:
                    checked_in_by = reg.check_in.checked_in_by.get_full_name() or reg.check_in.checked_in_by.email

            result.append({
                'id': reg.id,
                'participant_first_name': reg.participant_first_name,
                'participant_last_name': reg.participant_last_name,
                'participant_email': reg.participant_email,
                'checked_in': checked_in,
                'checked_in_at': checked_in_at,
                'checked_in_by': checked_in_by,
                'registered_at': reg.registered_at.isoformat(),
            })
        return result

    def get_checked_in_count(self, obj):
        return EventCheckIn.objects.filter(
            event_registration__event=obj,
            checked_in_at__isnull=False,
            checked_out_at__isnull=True
        ).count()

    def get_total_registrations(self, obj):
        return obj.registrations.count()
