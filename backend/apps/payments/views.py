from rest_framework import viewsets, filters, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from django.db import transaction
import stripe
import uuid

from .models import Product, SubscriptionPlan, Payment, Cart, CartItem
from .serializers import (
    ProductSerializer,
    SubscriptionPlanSerializer,
    CartSerializer,
    CartItemSerializer,
    AddToCartSerializer,
    UpdateCartItemSerializer,
)

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

def _stripe_key_configured() -> bool:
    """Basic guard to prevent calling Stripe with placeholder keys."""
    key = getattr(settings, "STRIPE_SECRET_KEY", "")
    if not key:
        return False
    # Treat obvious placeholders (containing * or the word dummy) as invalid
    placeholder_markers = ["*", "dummy", "your-secret-key"]
    return not any(marker in key for marker in placeholder_markers)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for products (merch).

    List all products or retrieve a single product.
    Supports filtering by category and featured status.
    """
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'featured']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'created_at']
    ordering = ['name']


class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for subscription plans.

    List all active subscription plans.
    """
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    lookup_field = 'slug'
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['price']
    ordering = ['price']


@api_view(['POST'])
@permission_classes([AllowAny])
def create_product_checkout(request):
    """Create Stripe checkout session for product purchase"""
    try:
        if not _stripe_key_configured():
            return Response(
                {"error": "Stripe secret key is not configured. Set STRIPE_SECRET_KEY in the backend environment."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)
        success_url = request.data.get('success_url')
        cancel_url = request.data.get('cancel_url')

        # Get product
        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check stock
        if product.stock_quantity < quantity:
            return Response(
                {'error': 'Insufficient stock'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'unit_amount': int(product.price * 100),  # Convert to cents
                    'product_data': {
                        'name': product.name,
                        'description': product.description,
                        'images': [product.image_url] if product.image_url else [],
                    },
                },
                'quantity': quantity,
            }],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            client_reference_id=f"product_{product.id}",
            metadata={
                'product_id': product.id,
                'user_id': request.user.id if request.user.is_authenticated else None,
                'quantity': quantity,
            }
        )

        return Response({
            'session_id': checkout_session.id,
            'url': checkout_session.url,
        })

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_event_checkout(request):
    """Create Stripe checkout session for event registration"""
    try:
        from apps.events.models import Event

        if not _stripe_key_configured():
            return Response(
                {"error": "Stripe secret key is not configured. Set STRIPE_SECRET_KEY in the backend environment."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        event_slug = request.data.get('event_slug')
        success_url = request.data.get('success_url')
        cancel_url = request.data.get('cancel_url')

        # Get event
        try:
            event = Event.objects.get(slug=event_slug, is_public=True)
        except Event.DoesNotExist:
            return Response(
                {'error': 'Event not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if registration is open
        if not event.is_registration_open:
            return Response(
                {'error': 'Registration is closed for this event'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if requires payment
        if not event.requires_payment or not event.price:
            return Response(
                {'error': 'This event does not require payment'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'unit_amount': int(event.price * 100),  # Convert to cents
                    'product_data': {
                        'name': f"{event.title} - Registration",
                        'description': event.description,
                    },
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            client_reference_id=f"event_{event.id}",
            metadata={
                'event_id': event.id,
                'user_id': request.user.id,
            }
        )

        return Response({
            'session_id': checkout_session.id,
            'url': checkout_session.url,
        })

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    """Handle Stripe webhook events"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    webhook_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError:
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        return HttpResponse(status=400)

    # Handle the checkout.session.completed event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']

        # Create or update payment record
        Payment.objects.create(
            user_id=session.get('metadata', {}).get('user_id'),
            stripe_payment_intent_id=session.get('payment_intent'),
            amount=session.get('amount_total') / 100,  # Convert from cents
            currency=session.get('currency', 'usd').upper(),
            status='completed',
            payment_method=session.get('payment_method_types', ['card'])[0],
        )

        # Clear cart after successful checkout
        user_id = session.get('metadata', {}).get('user_id')
        session_key = session.get('metadata', {}).get('session_key')
        if user_id:
            Cart.objects.filter(user_id=user_id).delete()
        elif session_key:
            Cart.objects.filter(session_key=session_key).delete()

        # TODO: Update event registration or order status based on metadata

    return HttpResponse(status=200)


def get_or_create_cart(request):
    """Helper to get or create a cart for the current user/session"""
    if request.user.is_authenticated:
        cart, created = Cart.objects.get_or_create(user=request.user)
        return cart
    else:
        # For guest users, use session key from header or create new one
        session_key = request.headers.get('X-Cart-Session')
        if not session_key:
            session_key = str(uuid.uuid4())

        cart, created = Cart.objects.get_or_create(session_key=session_key)
        return cart


class CartAPIView(APIView):
    """
    Shopping Cart API

    GET: Retrieve current cart with all items
    POST: Add item to cart
    DELETE: Clear entire cart
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """Get current cart"""
        cart = get_or_create_cart(request)
        serializer = CartSerializer(cart)
        response_data = serializer.data

        # Include session key for guest users
        if not request.user.is_authenticated:
            response_data['session_key'] = cart.session_key

        return Response(response_data)

    def post(self, request):
        """Add item to cart"""
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = get_or_create_cart(request)
        product_id = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']

        product = Product.objects.get(pk=product_id)

        # Check if item already in cart
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )

        if not created:
            # Update quantity if item exists
            cart_item.quantity += quantity
            cart_item.save()

        # Return updated cart
        cart_serializer = CartSerializer(cart)
        response_data = cart_serializer.data
        if not request.user.is_authenticated:
            response_data['session_key'] = cart.session_key

        return Response(response_data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        """Clear cart"""
        cart = get_or_create_cart(request)
        cart.clear()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CartItemAPIView(APIView):
    """
    Cart Item API

    PATCH: Update item quantity
    DELETE: Remove item from cart
    """
    permission_classes = [AllowAny]

    def patch(self, request, item_id):
        """Update cart item quantity"""
        cart = get_or_create_cart(request)

        try:
            cart_item = cart.items.get(pk=item_id)
        except CartItem.DoesNotExist:
            return Response(
                {'error': 'Item not found in cart'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quantity = serializer.validated_data['quantity']

        if quantity == 0:
            cart_item.delete()
        else:
            # Check stock if inventory managed
            if cart_item.product.manage_inventory:
                if quantity > cart_item.product.stock_quantity:
                    return Response(
                        {'error': f'Only {cart_item.product.stock_quantity} items available'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            cart_item.quantity = quantity
            cart_item.save()

        # Return updated cart
        cart_serializer = CartSerializer(cart)
        response_data = cart_serializer.data
        if not request.user.is_authenticated:
            response_data['session_key'] = cart.session_key

        return Response(response_data)

    def delete(self, request, item_id):
        """Remove item from cart"""
        cart = get_or_create_cart(request)

        try:
            cart_item = cart.items.get(pk=item_id)
            cart_item.delete()
        except CartItem.DoesNotExist:
            pass  # Item already removed, that's fine

        # Return updated cart
        cart_serializer = CartSerializer(cart)
        response_data = cart_serializer.data
        if not request.user.is_authenticated:
            response_data['session_key'] = cart.session_key

        return Response(response_data)


@api_view(['POST'])
@permission_classes([AllowAny])
def cart_checkout(request):
    """Create Stripe checkout session for entire cart"""
    try:
        if not _stripe_key_configured():
            return Response(
                {"error": "Stripe is not configured"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        cart = get_or_create_cart(request)

        if cart.item_count == 0:
            return Response(
                {'error': 'Cart is empty'},
                status=status.HTTP_400_BAD_REQUEST
            )

        success_url = request.data.get('success_url')
        cancel_url = request.data.get('cancel_url')

        if not success_url or not cancel_url:
            return Response(
                {'error': 'success_url and cancel_url are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Build line items from cart
        line_items = []
        for item in cart.items.select_related('product').all():
            if not item.is_available:
                return Response(
                    {'error': f'{item.product.name} is no longer available'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check stock
            if item.product.manage_inventory:
                if item.quantity > item.product.stock_quantity:
                    return Response(
                        {'error': f'Only {item.product.stock_quantity} of {item.product.name} available'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            line_items.append({
                'price_data': {
                    'currency': 'usd',
                    'unit_amount': int(item.product.price * 100),
                    'product_data': {
                        'name': item.product.name,
                        'description': item.product.description[:500] if item.product.description else '',
                        'images': [item.product.image_url] if item.product.image_url else [],
                    },
                },
                'quantity': item.quantity,
            })

        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            shipping_address_collection={
                'allowed_countries': ['US'],
            },
            metadata={
                'cart_id': cart.id,
                'user_id': request.user.id if request.user.is_authenticated else None,
                'session_key': cart.session_key if not request.user.is_authenticated else None,
            }
        )

        return Response({
            'session_id': checkout_session.id,
            'url': checkout_session.url,
        })

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def merge_cart(request):
    """Merge guest cart into user cart on login"""
    session_key = request.data.get('session_key')

    if not session_key:
        return Response(
            {'error': 'session_key is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        guest_cart = Cart.objects.get(session_key=session_key)
    except Cart.DoesNotExist:
        # No guest cart to merge, just return user's cart
        user_cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(CartSerializer(user_cart).data)

    # Get or create user cart
    user_cart, _ = Cart.objects.get_or_create(user=request.user)

    # Merge guest cart into user cart
    with transaction.atomic():
        user_cart.merge_from_guest_cart(guest_cart)

    return Response(CartSerializer(user_cart).data)
