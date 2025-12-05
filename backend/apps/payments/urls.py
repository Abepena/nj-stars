from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, SubscriptionPlanViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'subscription-plans', SubscriptionPlanViewSet, basename='subscriptionplan')

urlpatterns = [
    path('', include(router.urls)),
]
