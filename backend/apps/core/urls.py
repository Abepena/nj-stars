from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CoachViewSet, InstagramPostViewSet

router = DefaultRouter()
router.register(r'coaches', CoachViewSet, basename='coach')
router.register(r'instagram', InstagramPostViewSet, basename='instagram')

urlpatterns = [
    path('', include(router.urls)),
]
