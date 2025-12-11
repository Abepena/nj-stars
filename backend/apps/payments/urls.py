from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet,
    SubscriptionPlanViewSet,
    create_product_checkout,
    create_event_checkout,
    stripe_webhook,
    printify_webhook,
    BagAPIView,
    BagItemAPIView,
    bag_checkout,
    merge_bag,
    get_checkout_session,
    get_order,
    get_user_orders,
    calculate_shipping,
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
    path('bag/shipping/', calculate_shipping, name='bag-shipping'),
    # Webhooks
    path('webhook/stripe/', stripe_webhook, name='stripe-webhook'),
    path('webhook/printify/', printify_webhook, name='printify-webhook'),
    # Order endpoints
    path('orders/', get_user_orders, name='user-orders'),
    path('orders/<str:order_number>/', get_order, name='order-detail'),
]
