from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CoachViewSet,
    InstagramPostViewSet,
    dashboard_stats,
    newsletter_subscribe,
    newsletter_unsubscribe,
    contact_submit,
    contact_submissions_list,
    contact_submission_update,
)

router = DefaultRouter()
router.register(r'coaches', CoachViewSet, basename='coach')
router.register(r'instagram', InstagramPostViewSet, basename='instagram')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    path('newsletter/subscribe/', newsletter_subscribe, name='newsletter-subscribe'),
    path('newsletter/unsubscribe/', newsletter_unsubscribe, name='newsletter-unsubscribe'),
    # Contact form
    path('contact/', contact_submit, name='contact-submit'),
    path('contact/admin/', contact_submissions_list, name='contact-admin-list'),
    path('contact/admin/<int:pk>/', contact_submission_update, name='contact-admin-update'),
]
