from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet,
    SubscriptionPlanViewSet,
    create_product_checkout,
    create_event_checkout,
    stripe_webhook,
    BagAPIView,
    BagItemAPIView,
    bag_checkout,
    merge_bag,
    get_checkout_session,
    get_order,
)

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'subscription-plans', SubscriptionPlanViewSet, basename='subscriptionplan')

urlpatterns = [
    path('', include(router.urls)),
    # Checkout endpoints
    path('checkout/product/', create_product_checkout, name='product-checkout'),
    path('checkout/event/', create_event_checkout, name='event-checkout'),
    path('checkout/bag/', bag_checkout, name='bag-checkout'),
    path('checkout/session/<str:session_id>/', get_checkout_session, name='checkout-session'),
    # Bag endpoints
    path('bag/', BagAPIView.as_view(), name='bag'),
    path('bag/items/<int:item_id>/', BagItemAPIView.as_view(), name='bag-item'),
    path('bag/merge/', merge_bag, name='bag-merge'),
    # Webhooks
    path('webhook/stripe/', stripe_webhook, name='stripe-webhook'),
    # Order lookup
    path('orders/<str:order_number>/', get_order, name='order-detail'),
]
