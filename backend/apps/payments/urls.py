from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet,
    SubscriptionPlanViewSet,
    create_product_checkout,
    create_event_checkout,
    stripe_webhook,
    get_checkout_session,
)

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'subscription-plans', SubscriptionPlanViewSet, basename='subscriptionplan')

urlpatterns = [
    path('', include(router.urls)),
    path('checkout/product/', create_product_checkout, name='product-checkout'),
    path('checkout/event/', create_event_checkout, name='event-checkout'),
    path('checkout/session/<str:session_id>/', get_checkout_session, name='checkout-session'),
    path('webhook/stripe/', stripe_webhook, name='stripe-webhook'),
]
