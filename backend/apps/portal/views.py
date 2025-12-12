from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Q
from django.shortcuts import redirect
from django.conf import settings
from allauth.account.models import EmailConfirmationHMAC, EmailConfirmation
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model

from .models import (
    UserProfile, Player, GuardianRelationship,
    DuesAccount, DuesTransaction, SavedPaymentMethod,
    PromoCredit, EventCheckIn
)
from .serializers import (
    UserProfileSerializer, PlayerSummarySerializer, PlayerDetailSerializer,
    PlayerCreateSerializer, GuardianRelationshipSerializer,
    DuesAccountSerializer, DuesTransactionSerializer,
    SavedPaymentMethodSerializer, PromoCreditSerializer,
    EventCheckInSerializer, WaiverStatusSerializer, WaiverSignSerializer
)
from .permissions import IsParentOrStaff, IsStaffMember, IsOwnerOrStaff
from apps.registrations.models import EventRegistration
from apps.registrations.serializers import EventRegistrationListSerializer
from apps.payments.models import Order
from apps.payments.serializers import OrderSerializer
from apps.events.models import Event


class UserProfileViewSet(viewsets.ModelViewSet):
    """
    Manage user profile.

    The user can only access their own profile.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    def get_object(self):
        """Always return the current user's profile"""
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

    def list(self, request, *args, **kwargs):
        """Return single profile instead of list"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class PlayerViewSet(viewsets.ModelViewSet):
    """
    Manage players (children).

    Parents see their linked players. Staff see all players.
    """
    permission_classes = [IsAuthenticated, IsParentOrStaff]

    def get_serializer_class(self):
        if self.action == 'list':
            return PlayerSummarySerializer
        if self.action == 'create':
            return PlayerCreateSerializer
        return PlayerDetailSerializer

    def get_queryset(self):
        user = self.request.user

        # Staff sees all players
        if user.is_staff or (hasattr(user, 'profile') and user.profile.is_staff_member):
            return Player.objects.all()

        # Parents see linked players only
        return Player.objects.filter(
            guardian_relationships__guardian=user
        ).distinct()

    @action(detail=True, methods=['get'])
    def schedule(self, request, pk=None):
        """Get upcoming events for a player"""
        player = self.get_object()
        registrations = EventRegistration.objects.filter(
            participant_first_name=player.first_name,
            participant_last_name=player.last_name,
            event__start_datetime__gte=timezone.now()
        ).select_related('event').order_by('event__start_datetime')

        return Response(EventRegistrationListSerializer(registrations, many=True).data)

    @action(detail=True, methods=['get'])
    def dues(self, request, pk=None):
        """Get dues account for a player"""
        player = self.get_object()
        account, created = DuesAccount.objects.get_or_create(player=player)
        return Response(DuesAccountSerializer(account).data)

    @action(detail=True, methods=['get'])
    def guardians(self, request, pk=None):
        """Get all guardians for a player"""
        player = self.get_object()
        relationships = player.guardian_relationships.all()
        return Response(GuardianRelationshipSerializer(relationships, many=True).data)


class DuesAccountViewSet(viewsets.ReadOnlyModelViewSet):
    """
    View dues accounts and transactions.

    Parents see their children's accounts. Staff see all.
    """
    serializer_class = DuesAccountSerializer
    permission_classes = [IsAuthenticated, IsParentOrStaff]

    def get_queryset(self):
        user = self.request.user

        if user.is_staff or (hasattr(user, 'profile') and user.profile.is_staff_member):
            return DuesAccount.objects.all()

        player_ids = Player.objects.filter(
            guardian_relationships__guardian=user
        ).values_list('id', flat=True)

        return DuesAccount.objects.filter(player_id__in=player_ids)

    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        """Get full transaction history for an account"""
        account = self.get_object()
        transactions = account.transactions.all()
        return Response(DuesTransactionSerializer(transactions, many=True).data)


class SavedPaymentMethodViewSet(viewsets.ModelViewSet):
    """
    Manage saved payment methods.

    Users can only see and manage their own payment methods.
    """
    serializer_class = SavedPaymentMethodSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrStaff]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return SavedPaymentMethod.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set a payment method as default"""
        payment_method = self.get_object()
        payment_method.is_default = True
        payment_method.save()
        return Response(SavedPaymentMethodSerializer(payment_method).data)


class PromoCreditViewSet(viewsets.ReadOnlyModelViewSet):
    """
    View promo credits.

    Users see their own credits only.
    """
    serializer_class = PromoCreditSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PromoCredit.objects.filter(
            user=self.request.user,
            is_active=True
        )


class EventCheckInViewSet(viewsets.ModelViewSet):
    """
    Manage event check-ins.

    Parents see their children's check-ins (read-only).
    Staff can perform check-in/check-out operations.
    """
    serializer_class = EventCheckInSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user

        if user.is_staff or (hasattr(user, 'profile') and user.profile.is_staff_member):
            return EventCheckIn.objects.all().select_related(
                'event_registration__event'
            )

        # Parents see check-ins for their children's registrations
        player_names = Player.objects.filter(
            guardian_relationships__guardian=user
        ).values_list('first_name', 'last_name')

        q_filter = Q()
        for first, last in player_names:
            q_filter |= Q(
                event_registration__participant_first_name=first,
                event_registration__participant_last_name=last
            )

        return EventCheckIn.objects.filter(q_filter).select_related(
            'event_registration__event'
        )

    @action(detail=True, methods=['post'], permission_classes=[IsStaffMember])
    def check_in(self, request, pk=None):
        """Mark as checked in (staff only)"""
        check_in = self.get_object()
        check_in.check_in(user=request.user)
        return Response(EventCheckInSerializer(check_in).data)

    @action(detail=True, methods=['post'], permission_classes=[IsStaffMember])
    def check_out(self, request, pk=None):
        """Mark as checked out (staff only)"""
        check_in = self.get_object()
        check_in.check_out()
        return Response(EventCheckInSerializer(check_in).data)


# ==================== Dashboard Views ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def parent_dashboard(request):
    """
    Aggregated dashboard for parents.

    Returns all key information in a single API call for performance.
    """
    user = request.user

    # Get or create profile
    profile, _ = UserProfile.objects.get_or_create(user=user)

    # Get children
    children = Player.objects.filter(
        guardian_relationships__guardian=user
    ).distinct()

    # Calculate total balance across all children
    total_balance = DuesAccount.objects.filter(
        player__in=children
    ).aggregate(total=Sum('balance'))['total'] or 0

    # Get upcoming events for all children
    upcoming_events = []
    for child in children:
        regs = EventRegistration.objects.filter(
            participant_first_name=child.first_name,
            participant_last_name=child.last_name,
            event__start_datetime__gte=timezone.now()
        ).select_related('event').order_by('event__start_datetime')[:5]

        for reg in regs:
            upcoming_events.append({
                'player_name': child.full_name,
                'event_title': reg.event.title,
                'event_date': reg.event.start_datetime,
                'registration_id': reg.id,
            })

    # Sort all events by date
    upcoming_events.sort(key=lambda x: x['event_date'])
    upcoming_events = upcoming_events[:10]  # Limit to 10

    # Get recent orders
    recent_orders = Order.objects.filter(user=user).order_by('-created_at')[:5]

    # Get promo credit total
    promo_total = PromoCredit.objects.filter(
        user=user, is_active=True
    ).aggregate(total=Sum('remaining_amount'))['total'] or 0

    # Get active check-ins
    active_check_ins = []
    for child in children:
        check_ins = EventCheckIn.objects.filter(
            event_registration__participant_first_name=child.first_name,
            event_registration__participant_last_name=child.last_name,
            checked_in_at__isnull=False,
            checked_out_at__isnull=True
        ).select_related('event_registration__event')

        for ci in check_ins:
            active_check_ins.append({
                'player_name': child.full_name,
                'event_title': ci.event_registration.event.title,
                'checked_in_at': ci.checked_in_at,
            })

    return Response({
        'profile': UserProfileSerializer(profile).data,
        'children': PlayerSummarySerializer(children, many=True).data,
        'total_balance': str(total_balance),
        'auto_pay_enabled': profile.auto_pay_enabled,
        'upcoming_events': upcoming_events,
        'recent_orders': OrderSerializer(recent_orders, many=True).data,
        'promo_credit_total': str(promo_total),
        'active_check_ins': active_check_ins,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStaffMember])
def staff_dashboard(request):
    """
    Extended dashboard for staff with admin features.

    Includes parent dashboard data plus admin statistics.
    """
    # Get parent dashboard data first
    parent_response = parent_dashboard(request)
    data = parent_response.data.copy()

    # Add admin stats
    today = timezone.now().date()

    admin_stats = {
        'total_players': Player.objects.filter(is_active=True).count(),
        'todays_events': Event.objects.filter(
            start_datetime__date=today
        ).count(),
        'pending_payments': DuesAccount.objects.filter(
            balance__gt=0
        ).count(),
        'check_ins_today': EventCheckIn.objects.filter(
            checked_in_at__date=today
        ).count(),
    }

    # Get pending check-ins for today's events
    pending_check_ins = EventCheckIn.objects.filter(
        event_registration__event__start_datetime__date=today,
        checked_in_at__isnull=True
    ).select_related('event_registration__event')[:20]

    # Get recent registrations
    recent_registrations = EventRegistration.objects.order_by('-registered_at')[:10]

    data['admin_stats'] = admin_stats
    data['pending_check_ins'] = EventCheckInSerializer(pending_check_ins, many=True).data
    data['recent_registrations'] = EventRegistrationListSerializer(recent_registrations, many=True).data

    return Response(data)


# ==================== Waiver Views ====================

CURRENT_WAIVER_VERSION = "2024.1"


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def waiver_status(request):
    """
    Check if the user has a signed waiver on file.

    GET /api/portal/waiver/status/

    Returns:
    {
        "has_signed_waiver": true/false,
        "waiver_signed_at": "2024-01-15T...",
        "waiver_version": "2024.1",
        "waiver_signer_name": "John Doe",
        "current_version": "2024.1",
        "needs_update": false  # True if signed version != current version
    }
    """
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    needs_update = False
    if profile.has_signed_waiver and profile.waiver_version != CURRENT_WAIVER_VERSION:
        needs_update = True

    serializer = WaiverStatusSerializer({
        'has_signed_waiver': profile.has_signed_waiver,
        'waiver_signed_at': profile.waiver_signed_at,
        'waiver_version': profile.waiver_version,
        'waiver_signer_name': profile.waiver_signer_name,
        'current_version': CURRENT_WAIVER_VERSION,
        'needs_update': needs_update,
    })

    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sign_waiver(request):
    """
    Sign the liability waiver.

    POST /api/portal/waiver/sign/
    {
        "signer_name": "John Doe",
        "acknowledged": true
    }

    Returns the updated waiver status.
    """
    serializer = WaiverSignSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    signer_name = serializer.validated_data['signer_name']
    acknowledged = serializer.validated_data['acknowledged']

    if not acknowledged:
        return Response(
            {'error': 'You must acknowledge the waiver to sign it.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    profile.sign_waiver(signer_name=signer_name, version=CURRENT_WAIVER_VERSION)

    return Response({
        'message': 'Waiver signed successfully',
        'has_signed_waiver': True,
        'waiver_signed_at': profile.waiver_signed_at,
        'waiver_version': profile.waiver_version,
        'waiver_signer_name': profile.waiver_signer_name,
    }, status=status.HTTP_200_OK)


# ==================== Email Confirmation Views ====================

@api_view(['GET'])
@permission_classes([AllowAny])
def confirm_email(request, key):
    """
    Confirm email address and redirect to frontend.

    This replaces the default dj-rest-auth template-based view with a
    redirect to our Next.js frontend.

    GET /api/auth/registration/account-confirm-email/<key>/

    Redirects to:
    - Success: {FRONTEND_URL}/portal/verify-email?status=success
    - Error: {FRONTEND_URL}/portal/verify-email?status=error&message=...
    """
    frontend_url = settings.FRONTEND_URL

    try:
        # Try HMAC-based confirmation first (newer method)
        email_confirmation = EmailConfirmationHMAC.from_key(key)
        if email_confirmation:
            email_confirmation.confirm(request)
            return redirect(f"{frontend_url}/portal/verify-email?status=success")
    except Exception:
        pass

    try:
        # Fall back to database-based confirmation
        email_confirmation = EmailConfirmation.objects.get(key=key)
        email_confirmation.confirm(request)
        return redirect(f"{frontend_url}/portal/verify-email?status=success")
    except EmailConfirmation.DoesNotExist:
        return redirect(f"{frontend_url}/portal/verify-email?status=error&message=invalid_key")
    except Exception as e:
        return redirect(f"{frontend_url}/portal/verify-email?status=error&message=confirmation_failed")


# ==================== Social Auth Views ====================

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def social_auth(request):
    """
    Handle social authentication from NextAuth.

    This endpoint receives user data from social providers (Google, Facebook, Apple)
    via the frontend and creates/updates the Django user and profile.

    POST /api/portal/social-auth/
    {
        "provider": "google" | "facebook" | "apple",
        "provider_account_id": "123456789",
        "email": "user@example.com",
        "name": "John Doe",
        "first_name": "John",           # Optional
        "last_name": "Doe",             # Optional
        "image": "https://...",         # Profile picture URL
        "email_verified": true          # Whether provider verified email
    }

    Returns:
    {
        "user": { ... user details ... },
        "token": "abc123...",           # Django REST token for API calls
        "created": true/false           # Whether user was newly created
    }
    """
    data = request.data

    # Validate required fields
    provider = data.get('provider')
    provider_account_id = data.get('provider_account_id')
    email = data.get('email')

    if not all([provider, provider_account_id, email]):
        return Response(
            {'error': 'Missing required fields: provider, provider_account_id, email'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Parse name fields
    name = data.get('name', '')
    first_name = data.get('first_name', '')
    last_name = data.get('last_name', '')

    # If first/last not provided, try to parse from full name
    if name and not (first_name and last_name):
        name_parts = name.strip().split(' ', 1)
        first_name = first_name or name_parts[0]
        last_name = last_name or (name_parts[1] if len(name_parts) > 1 else '')

    image = data.get('image', '')
    email_verified = data.get('email_verified', False)

    # Find or create user
    created = False
    try:
        user = User.objects.get(email=email)
        # Update user info if provided and empty
        if first_name and not user.first_name:
            user.first_name = first_name
        if last_name and not user.last_name:
            user.last_name = last_name
        user.save()
    except User.DoesNotExist:
        # Create new user
        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=first_name,
            last_name=last_name,
        )
        # Set unusable password for social-only users
        user.set_unusable_password()
        user.save()
        created = True

    # Get or create profile
    profile, _ = UserProfile.objects.get_or_create(user=user)

    # Store social auth metadata in profile (for future reference)
    # We could add a SocialAccount model later if needed for linking multiple providers

    # Get or create auth token
    token, _ = Token.objects.get_or_create(user=user)

    # Build response with user details
    from .serializers import UserProfileSerializer
    profile_data = UserProfileSerializer(profile).data

    return Response({
        'user': {
            'pk': user.pk,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'name': f"{user.first_name} {user.last_name}".strip() or user.email,
            'image': image,  # Pass through the social image
            **profile_data,
        },
        'token': token.key,
        'created': created,
    }, status=status.HTTP_200_OK)
