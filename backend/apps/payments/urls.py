from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet,
    SubscriptionPlanViewSet,
    create_product_checkout,
    create_event_checkout,
    create_subscription_checkout,
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
    HandoffListView,
    HandoffUpdateView,
    PrintifyPublishView,
    PrintifyUnpublishView,
    PrintifyProductsView,
    PrintifySyncView,
    PrintifySyncAndUnpublishView,
    PrintifyDeleteLocalView,
    PrintifyUnlockView,
    PrintifyStatusView,
    PrintifyShopsView,
    PrintifyConnectView,
    PrintifyDisconnectView,
    # Cash payment views
    collect_cash,
    pending_cash,
    cash_handoff,
    cash_undo_handoff,
    cash_by_staff,
    cash_history,
    cash_export,
    # Subscription admin views
    fetch_stripe_price,
    create_subscription_plan,
    list_subscription_plans_admin,
    update_subscription_plan,
    delete_subscription_plan,
    # Payment link generation
    generate_payment_link,
    # Merch drop settings
    MerchDropSettingsView,
)

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'subscription-plans', SubscriptionPlanViewSet, basename='subscriptionplan')

urlpatterns = [
    path('', include(router.urls)),
    # Checkout endpoints
    path('checkout/product/', create_product_checkout, name='product-checkout'),
    path('checkout/event/', create_event_checkout, name='event-checkout'),
    path('checkout/subscription/', create_subscription_checkout, name='subscription-checkout'),
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
    # Handoff management (staff only)
    path('handoffs/', HandoffListView.as_view(), name='handoff-list'),
    path('handoffs/<int:item_id>/', HandoffUpdateView.as_view(), name='handoff-update'),
    # Printify admin (superuser only)
    path('admin/printify/status/', PrintifyStatusView.as_view(), name='printify-status'),
    path('admin/printify/shops/', PrintifyShopsView.as_view(), name='printify-shops'),
    path('admin/printify/connect/', PrintifyConnectView.as_view(), name='printify-connect'),
    path('admin/printify/disconnect/', PrintifyDisconnectView.as_view(), name='printify-disconnect'),
    path('admin/printify/products/', PrintifyProductsView.as_view(), name='printify-products'),
    path('admin/printify/publish/', PrintifyPublishView.as_view(), name='printify-publish'),
    path('admin/printify/unpublish/', PrintifyUnpublishView.as_view(), name='printify-unpublish'),
    path('admin/printify/sync/', PrintifySyncView.as_view(), name='printify-sync'),
    path('admin/printify/sync-and-unpublish/', PrintifySyncAndUnpublishView.as_view(), name='printify-sync-unpublish'),
    path('admin/printify/delete-local/', PrintifyDeleteLocalView.as_view(), name='printify-delete-local'),
    path('admin/printify/unlock/', PrintifyUnlockView.as_view(), name='printify-unlock'),
    # Cash payment endpoints
    path('cash/collect/', collect_cash, name='cash-collect'),
    path('cash/pending/', pending_cash, name='cash-pending'),
    path('cash/<int:cash_id>/handoff/', cash_handoff, name='cash-handoff'),
    path('cash/<int:cash_id>/undo-handoff/', cash_undo_handoff, name='cash-undo-handoff'),
    path('cash/by-staff/', cash_by_staff, name='cash-by-staff'),
    path('cash/history/', cash_history, name='cash-history'),
    path('cash/export/', cash_export, name='cash-export'),
    # Subscription admin endpoints
    path('admin/subscriptions/', list_subscription_plans_admin, name='subscription-plans-admin'),
    path('admin/subscriptions/fetch-price/', fetch_stripe_price, name='fetch-stripe-price'),
    path('admin/subscriptions/create/', create_subscription_plan, name='create-subscription-plan'),
    path('admin/subscriptions/<int:plan_id>/', update_subscription_plan, name='update-subscription-plan'),
    path('admin/subscriptions/<int:plan_id>/delete/', delete_subscription_plan, name='delete-subscription-plan'),
    # Payment link generation
    path('generate-link/', generate_payment_link, name='generate-payment-link'),
    # Merch drop settings
    path('merch-drop/', MerchDropSettingsView.as_view(), name='merch-drop-settings'),
]
