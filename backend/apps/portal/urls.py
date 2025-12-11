from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserProfileViewSet, PlayerViewSet, DuesAccountViewSet,
    SavedPaymentMethodViewSet, PromoCreditViewSet, EventCheckInViewSet,
    parent_dashboard, staff_dashboard, waiver_status, sign_waiver,
    social_auth
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
    path('social-auth/', social_auth, name='social-auth'),
]
