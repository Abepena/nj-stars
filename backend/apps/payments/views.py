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

from .models import Product, SubscriptionPlan, Payment, Bag, BagItem, Order
from .serializers import (
    ProductSerializer,
    SubscriptionPlanSerializer,
    BagSerializer,
    BagItemSerializer,
    AddToBagSerializer,
    UpdateBagItemSerializer,
    OrderSerializer,
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
        # Note: payment_method_types is omitted to use Dashboard-configured methods
        checkout_session = stripe.checkout.Session.create(
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
        from apps.registrations.models import EventRegistration

        if not _stripe_key_configured():
            return Response(
                {"error": "Stripe secret key is not configured. Set STRIPE_SECRET_KEY in the backend environment."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        event_slug = request.data.get('event_slug')
        registration_id = request.data.get('registration_id')
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

        # If registration_id provided, verify it belongs to the user and event
        if registration_id:
            try:
                registration = EventRegistration.objects.get(
                    id=registration_id,
                    user=request.user,
                    event=event,
                    payment_status='pending'
                )
            except EventRegistration.DoesNotExist:
                return Response(
                    {'error': 'Registration not found or already paid'},
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

        # Build metadata
        metadata = {
            'event_id': str(event.id),
            'user_id': str(request.user.id),
            'type': 'event_registration',
        }
        if registration_id:
            metadata['registration_id'] = str(registration_id)

        # Create Stripe checkout session
        # Note: payment_method_types is omitted to use Dashboard-configured methods
        checkout_session = stripe.checkout.Session.create(
            customer_email=request.user.email,
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'unit_amount': int(event.price * 100),  # Convert to cents
                    'product_data': {
                        'name': f"{event.title} - Registration",
                        'description': event.description or f"Registration for {event.title}",
                    },
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            client_reference_id=f"event_{event.id}_reg_{registration_id or 'new'}",
            metadata=metadata
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
        metadata = session.get('metadata', {})

        # Create or update payment record
        user_id = metadata.get('user_id')
        Payment.objects.create(
            user_id=user_id if user_id else None,
            stripe_payment_intent_id=session.get('payment_intent'),
            amount=session.get('amount_total') / 100,  # Convert from cents
            currency=session.get('currency', 'usd').upper(),
            status='completed',
            payment_method=session.get('payment_method_types', ['card'])[0],
        )

        # Remove only the purchased items from bag (not entire bag)
        item_ids_str = metadata.get('item_ids', '')
        bag_id = metadata.get('bag_id')
        session_key = metadata.get('session_key')

        if item_ids_str and bag_id:
            # Parse item IDs and remove only those items
            item_ids = [int(id) for id in item_ids_str.split(',') if id]
            if item_ids:
                BagItem.objects.filter(id__in=item_ids, bag_id=bag_id).delete()

                # Update product stock quantities
                # Note: In production, this should be done atomically
                # but for now we'll update after bag items are removed
        elif user_id:
            # Fallback: clear entire bag for authenticated user
            Bag.objects.filter(user_id=user_id).delete()
        elif session_key:
            # Fallback: clear entire bag for guest
            Bag.objects.filter(session_key=session_key).delete()

        # Handle event registration payments
        if metadata.get('type') == 'event_registration':
            registration_id = metadata.get('registration_id')
            if registration_id:
                from apps.registrations.models import EventRegistration
                try:
                    registration = EventRegistration.objects.get(id=registration_id)
                    registration.payment_status = 'completed'
                    registration.stripe_payment_intent_id = session.get('payment_intent', '')
                    registration.amount_paid = session.get('amount_total', 0) / 100
                    registration.save()
                except EventRegistration.DoesNotExist:
                    pass  # Log this in production

    return HttpResponse(status=200)


def get_or_create_bag(request):
    """Helper to get or create a bag for the current user/session"""
    if request.user.is_authenticated:
        bag, created = Bag.objects.get_or_create(user=request.user)
        return bag
    else:
        # For guest users, use session key from header or create new one
        session_key = request.headers.get('X-Bag-Session')
        if not session_key:
            session_key = str(uuid.uuid4())

        bag, created = Bag.objects.get_or_create(session_key=session_key)
        return bag


class BagAPIView(APIView):
    """
    Shopping Bag API

    GET: Retrieve current bag with all items
    POST: Add item to bag
    DELETE: Clear entire bag
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """Get current bag"""
        bag = get_or_create_bag(request)
        serializer = BagSerializer(bag)
        response_data = serializer.data

        # Include session key for guest users
        if not request.user.is_authenticated:
            response_data['session_key'] = bag.session_key

        return Response(response_data)

    def post(self, request):
        """Add item to bag"""
        serializer = AddToBagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        bag = get_or_create_bag(request)
        product_id = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']
        selected_size = serializer.validated_data.get('selected_size') or None
        selected_color = serializer.validated_data.get('selected_color') or None

        product = Product.objects.get(pk=product_id)

        # Check if item with same product AND variants already in bag
        bag_item, created = BagItem.objects.get_or_create(
            bag=bag,
            product=product,
            selected_size=selected_size,
            selected_color=selected_color,
            defaults={'quantity': quantity}
        )

        if not created:
            # Update quantity if item with same variants exists
            bag_item.quantity += quantity
            bag_item.save()

        # Return updated bag
        bag_serializer = BagSerializer(bag)
        response_data = bag_serializer.data
        if not request.user.is_authenticated:
            response_data['session_key'] = bag.session_key

        return Response(response_data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        """Clear bag"""
        bag = get_or_create_bag(request)
        bag.clear()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BagItemAPIView(APIView):
    """
    Bag Item API

    PATCH: Update item quantity
    DELETE: Remove item from bag
    """
    permission_classes = [AllowAny]

    def patch(self, request, item_id):
        """Update bag item quantity"""
        bag = get_or_create_bag(request)

        try:
            bag_item = bag.items.get(pk=item_id)
        except BagItem.DoesNotExist:
            return Response(
                {'error': 'Item not found in bag'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = UpdateBagItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quantity = serializer.validated_data['quantity']

        if quantity == 0:
            bag_item.delete()
        else:
            # Check stock if inventory managed
            if bag_item.product.manage_inventory:
                if quantity > bag_item.product.stock_quantity:
                    return Response(
                        {'error': f'Only {bag_item.product.stock_quantity} items available'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            bag_item.quantity = quantity
            bag_item.save()

        # Return updated bag
        bag_serializer = BagSerializer(bag)
        response_data = bag_serializer.data
        if not request.user.is_authenticated:
            response_data['session_key'] = bag.session_key

        return Response(response_data)

    def delete(self, request, item_id):
        """Remove item from bag"""
        bag = get_or_create_bag(request)

        try:
            bag_item = bag.items.get(pk=item_id)
            bag_item.delete()
        except BagItem.DoesNotExist:
            pass  # Item already removed, that's fine

        # Return updated bag
        bag_serializer = BagSerializer(bag)
        response_data = bag_serializer.data
        if not request.user.is_authenticated:
            response_data['session_key'] = bag.session_key

        return Response(response_data)


@api_view(['POST'])
@permission_classes([AllowAny])
def bag_checkout(request):
    """Create Stripe checkout session for bag items (all or selected)"""
    try:
        if not _stripe_key_configured():
            return Response(
                {"error": "Stripe is not configured"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        bag = get_or_create_bag(request)

        if bag.item_count == 0:
            return Response(
                {'error': 'Bag is empty'},
                status=status.HTTP_400_BAD_REQUEST
            )

        success_url = request.data.get('success_url')
        cancel_url = request.data.get('cancel_url')
        item_ids = request.data.get('item_ids')  # Optional: specific item IDs to checkout

        if not success_url or not cancel_url:
            return Response(
                {'error': 'success_url and cancel_url are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get bag items - filter by item_ids if provided
        bag_items = bag.items.select_related('product').all()
        if item_ids:
            bag_items = bag_items.filter(id__in=item_ids)
            if not bag_items.exists():
                return Response(
                    {'error': 'No valid items selected for checkout'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Build line items from bag
        line_items = []
        checkout_item_ids = []  # Track which items are being checked out
        for item in bag_items:
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

            # Build product name with variant info
            product_name = item.product.name
            variant_parts = []
            if item.selected_size:
                variant_parts.append(f"Size: {item.selected_size}")
            if item.selected_color:
                variant_parts.append(f"Color: {item.selected_color}")
            if variant_parts:
                product_name = f"{product_name} ({', '.join(variant_parts)})"

            line_items.append({
                'price_data': {
                    'currency': 'usd',
                    'unit_amount': int(item.product.price * 100),
                    'product_data': {
                        'name': product_name,
                        'description': item.product.description[:500] if item.product.description else '',
                        'images': [item.product.image_url] if item.product.image_url else [],
                    },
                },
                'quantity': item.quantity,
            })
            checkout_item_ids.append(item.id)

        # Create Stripe checkout session
        # Note: payment_method_types is omitted to use Dashboard-configured methods
        # (Google Pay, Apple Pay, PayPal, etc. - see documentation/STRIPE_PAYMENT_METHODS.md)
        checkout_session = stripe.checkout.Session.create(
            line_items=line_items,
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            shipping_address_collection={
                'allowed_countries': ['US'],
            },
            metadata={
                'bag_id': bag.id,
                'user_id': request.user.id if request.user.is_authenticated else None,
                'session_key': bag.session_key if not request.user.is_authenticated else None,
                'item_ids': ','.join(map(str, checkout_item_ids)),  # Store checked-out item IDs
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


@api_view(['GET'])
@permission_classes([AllowAny])
def get_checkout_session(request, session_id):
    """Retrieve checkout session details from Stripe for order confirmation"""
    try:
        if not _stripe_key_configured():
            return Response(
                {"error": "Stripe is not configured"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Retrieve the checkout session with expanded line items
        session = stripe.checkout.Session.retrieve(
            session_id,
            expand=['line_items', 'line_items.data.price.product', 'customer_details', 'shipping_details']
        )

        # Format the response
        line_items = []
        if session.line_items:
            for item in session.line_items.data:
                product_data = item.price.product if hasattr(item.price, 'product') else {}
                line_items.append({
                    'name': product_data.get('name', item.description) if isinstance(product_data, dict) else getattr(product_data, 'name', item.description),
                    'description': product_data.get('description', '') if isinstance(product_data, dict) else getattr(product_data, 'description', ''),
                    'image': (product_data.get('images', []) if isinstance(product_data, dict) else getattr(product_data, 'images', []) or [None])[0],
                    'quantity': item.quantity,
                    'unit_price': item.price.unit_amount / 100,  # Convert from cents
                    'total': item.amount_total / 100,  # Convert from cents
                })

        # Get shipping details if available
        shipping = None
        if session.shipping_details:
            shipping = {
                'name': session.shipping_details.name,
                'address': {
                    'line1': session.shipping_details.address.line1,
                    'line2': session.shipping_details.address.line2,
                    'city': session.shipping_details.address.city,
                    'state': session.shipping_details.address.state,
                    'postal_code': session.shipping_details.address.postal_code,
                    'country': session.shipping_details.address.country,
                }
            }

        # Get customer details
        customer = None
        if session.customer_details:
            customer = {
                'email': session.customer_details.email,
                'name': session.customer_details.name,
            }

        # Get purchased item IDs from metadata (for removing from bag)
        purchased_item_ids = []
        if session.metadata and session.metadata.get('item_ids'):
            purchased_item_ids = [int(id) for id in session.metadata['item_ids'].split(',') if id]

        return Response({
            'id': session.id,
            'status': session.status,
            'payment_status': session.payment_status,
            'amount_total': session.amount_total / 100,  # Convert from cents
            'currency': session.currency.upper(),
            'line_items': line_items,
            'shipping': shipping,
            'customer': customer,
            'created': session.created,
            'purchased_item_ids': purchased_item_ids,  # Item IDs to remove from bag
        })

    except stripe.error.InvalidRequestError:
        return Response(
            {'error': 'Invalid session ID'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def merge_bag(request):
    """Merge guest bag into user bag on login"""
    session_key = request.data.get('session_key')

    if not session_key:
        return Response(
            {'error': 'session_key is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        guest_bag = Bag.objects.get(session_key=session_key)
    except Bag.DoesNotExist:
        # No guest bag to merge, just return user's bag
        user_bag, _ = Bag.objects.get_or_create(user=request.user)
        return Response(BagSerializer(user_bag).data)

    # Get or create user bag
    user_bag, _ = Bag.objects.get_or_create(user=request.user)

    # Merge guest bag into user bag
    with transaction.atomic():
        user_bag.merge_from_guest_bag(guest_bag)

    return Response(BagSerializer(user_bag).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_order(request, order_number):
    """
    Retrieve order details by order number.

    Allows customers to look up their order status and details
    using the order number from their confirmation.
    """
    try:
        # Look up order by order_number (case-insensitive)
        order = Order.objects.prefetch_related('items', 'items__product').get(
            order_number__iexact=order_number
        )

        serializer = OrderSerializer(order)
        return Response(serializer.data)

    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
