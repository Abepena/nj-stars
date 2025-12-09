from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet,
    SubscriptionPlanViewSet,
    create_product_checkout,
    create_event_checkout,
    stripe_webhook,
    CartAPIView,
    CartItemAPIView,
    cart_checkout,
    merge_cart,
    get_checkout_session,
)

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'subscription-plans', SubscriptionPlanViewSet, basename='subscriptionplan')

urlpatterns = [
    path('', include(router.urls)),
    # Checkout endpoints
    path('checkout/product/', create_product_checkout, name='product-checkout'),
    path('checkout/event/', create_event_checkout, name='event-checkout'),
    path('checkout/cart/', cart_checkout, name='cart-checkout'),
    path('checkout/session/<str:session_id>/', get_checkout_session, name='checkout-session'),
    # Cart endpoints
    path('cart/', CartAPIView.as_view(), name='cart'),
    path('cart/items/<int:item_id>/', CartItemAPIView.as_view(), name='cart-item'),
    path('cart/merge/', merge_cart, name='cart-merge'),
    # Webhooks
    path('webhook/stripe/', stripe_webhook, name='stripe-webhook'),
]
