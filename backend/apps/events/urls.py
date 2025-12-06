from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet
from apps.registrations.views import EventRegistrationViewSet

router = DefaultRouter()
router.register(r'', EventViewSet, basename='event')
router.register(r'registrations', EventRegistrationViewSet, basename='event-registration')

urlpatterns = [
    path('', include(router.urls)),
]
