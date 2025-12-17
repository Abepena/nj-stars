from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserProfileViewSet, PlayerViewSet, DuesAccountViewSet,
    SavedPaymentMethodViewSet, PromoCreditViewSet, EventCheckInViewSet,
    parent_dashboard, staff_dashboard, waiver_status, sign_waiver,
    check_email, link_registration, social_auth,
    # Admin views
    admin_roster, admin_check_ins, admin_check_in_participant, admin_registrations
)

router = DefaultRouter()
router.register(r'profile', UserProfileViewSet, basename='profile')
router.register(r'players', PlayerViewSet, basename='player')
router.register(r'dues-accounts', DuesAccountViewSet, basename='dues-account')
router.register(r'payment-methods', SavedPaymentMethodViewSet, basename='payment-method')
router.register(r'promo-credits', PromoCreditViewSet, basename='promo-credit')
router.register(r'check-ins', EventCheckInViewSet, basename='check-in')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', parent_dashboard, name='parent-dashboard'),
    path('dashboard/staff/', staff_dashboard, name='staff-dashboard'),
    path('waiver/status/', waiver_status, name='waiver-status'),
    path('waiver/sign/', sign_waiver, name='waiver-sign'),
    path('check-email/', check_email, name='check-email'),
    path('link-registration/', link_registration, name='link-registration'),
    path('social-auth/', social_auth, name='social-auth'),

    # Admin endpoints
    path('admin/roster/', admin_roster, name='admin-roster'),
    path('admin/check-ins/', admin_check_ins, name='admin-check-ins'),
    path('admin/check-ins/<slug:event_slug>/<int:registration_id>/', admin_check_in_participant, name='admin-check-in-participant'),
    path('admin/registrations/', admin_registrations, name='admin-registrations'),
]
