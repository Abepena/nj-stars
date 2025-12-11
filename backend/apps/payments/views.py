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

from .models import Product, SubscriptionPlan, Payment, Bag, BagItem, Order, OrderItem
from .services.printify_client import get_printify_client, PrintifyError
import logging

logger = logging.getLogger(__name__)
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

        # Create payment record
        user_id = metadata.get('user_id')
        Payment.objects.create(
            user_id=user_id if user_id else None,
            stripe_payment_intent_id=session.get('payment_intent'),
            amount=session.get('amount_total') / 100,  # Convert from cents
            currency=session.get('currency', 'usd').upper(),
            status='completed',
            payment_method=session.get('payment_method_types', ['card'])[0],
        )

        # Get bag items being purchased
        item_ids_str = metadata.get('item_ids', '')
        bag_id = metadata.get('bag_id')
        session_key = metadata.get('session_key')

        # Create Order record from bag checkout
        if item_ids_str and bag_id:
            item_ids = [int(id) for id in item_ids_str.split(',') if id]
            if item_ids:
                try:
                    bag_items = BagItem.objects.filter(id__in=item_ids, bag_id=bag_id).select_related('product')
                    if bag_items.exists() and user_id:
                        # Get shipping details from Stripe session
                        shipping = session.get('shipping_details', {})
                        shipping_address = shipping.get('address', {}) if shipping else {}
                        customer = session.get('customer_details', {})

                        # Create Order
                        with transaction.atomic():
                            order = Order.objects.create(
                                user_id=user_id,
                                stripe_session_id=session.get('id', ''),
                                stripe_payment_intent_id=session.get('payment_intent', ''),
                                status='paid',
                                subtotal=session.get('amount_subtotal', 0) / 100,
                                shipping=session.get('total_details', {}).get('amount_shipping', 0) / 100,
                                tax=session.get('total_details', {}).get('amount_tax', 0) / 100,
                                total=session.get('amount_total', 0) / 100,
                                shipping_name=shipping.get('name', '') if shipping else customer.get('name', ''),
                                shipping_email=customer.get('email', ''),
                                shipping_address_line1=shipping_address.get('line1', ''),
                                shipping_address_line2=shipping_address.get('line2', '') or '',
                                shipping_city=shipping_address.get('city', ''),
                                shipping_state=shipping_address.get('state', ''),
                                shipping_zip=shipping_address.get('postal_code', ''),
                                shipping_country=shipping_address.get('country', 'US'),
                            )

                            # Create OrderItems from bag items
                            pod_items = []
                            for bag_item in bag_items:
                                order_item = OrderItem.objects.create(
                                    order=order,
                                    product=bag_item.product,
                                    product_name=bag_item.product.name,
                                    product_price=bag_item.product.price,
                                    selected_size=bag_item.selected_size or '',
                                    selected_color=bag_item.selected_color or '',
                                    quantity=bag_item.quantity,
                                    fulfillment_type=bag_item.product.fulfillment_type,
                                )

                                # Track POD items for Printify submission
                                if bag_item.product.is_pod:
                                    pod_items.append(order_item)

                                # Update stock for local products
                                if bag_item.product.manage_inventory:
                                    bag_item.product.stock_quantity = max(
                                        0, bag_item.product.stock_quantity - bag_item.quantity
                                    )
                                    bag_item.product.save()

                            # Submit POD items to Printify (if any)
                            if pod_items:
                                _submit_printify_order(order, pod_items)

                            logger.info(f"Order {order.order_number} created with {len(bag_items)} items ({len(pod_items)} POD)")

                except Exception as e:
                    logger.error(f"Error creating order: {e}")
                    # Don't fail the webhook - payment was still successful

                # Remove purchased items from bag
                BagItem.objects.filter(id__in=item_ids, bag_id=bag_id).delete()

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


def _submit_printify_order(order: Order, pod_items: list):
    """
    Submit POD items to Printify API.

    This creates an order in Printify that will be fulfilled and shipped
    directly to the customer. The order goes to "On Hold" status initially.
    """
    printify = get_printify_client()
    if not printify:
        logger.warning(f"Printify not configured, skipping order submission for {order.order_number}")
        return

    try:
        # Build line items for Printify
        line_items = []
        for item in pod_items:
            product = item.product
            if not product.printify_product_id or not product.printify_variant_id:
                logger.warning(f"Product {product.name} missing Printify IDs, skipping")
                continue

            line_items.append({
                'product_id': product.printify_product_id,
                'variant_id': int(product.printify_variant_id),
                'quantity': item.quantity,
            })

        if not line_items:
            logger.warning(f"No valid POD items for Printify order {order.order_number}")
            return

        # Build shipping address for Printify
        shipping_address = {
            'first_name': order.shipping_name.split()[0] if order.shipping_name else '',
            'last_name': ' '.join(order.shipping_name.split()[1:]) if order.shipping_name else '',
            'email': order.shipping_email,
            'address1': order.shipping_address_line1,
            'address2': order.shipping_address_line2 or '',
            'city': order.shipping_city,
            'region': order.shipping_state,
            'zip': order.shipping_zip,
            'country': order.shipping_country,
        }

        # Create Printify order
        printify_response = printify.create_order(
            line_items=line_items,
            shipping_address=shipping_address,
            external_id=order.order_number,
        )

        # Save Printify order ID
        order.printify_order_id = printify_response.get('id', '')
        order.save()

        # Update individual order items with Printify line item IDs
        printify_line_items = printify_response.get('line_items', [])
        for i, item in enumerate(pod_items):
            if i < len(printify_line_items):
                item.printify_line_item_id = printify_line_items[i].get('id', '')
                item.save()

        logger.info(f"Printify order created: {order.printify_order_id} for {order.order_number}")

    except PrintifyError as e:
        logger.error(f"Printify API error for {order.order_number}: {e}")
        # Order was still paid successfully, just log the error
        # Admin can manually submit to Printify if needed
    except Exception as e:
        logger.error(f"Unexpected error submitting to Printify for {order.order_number}: {e}")


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
@permission_classes([IsAuthenticated])
def get_user_orders(request):
    """
    Get all orders for the authenticated user.

    Returns a paginated list of orders with their items and tracking info.
    """
    orders = Order.objects.filter(user=request.user).prefetch_related('items', 'items__product')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


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


@api_view(['POST'])
@permission_classes([AllowAny])
def calculate_shipping(request):
    """
    Calculate shipping costs for bag items.

    Separates POD items (shipped via Printify) from local items (coach delivery).
    Returns shipping breakdown showing each fulfillment type's cost.

    Request body:
    {
        "item_ids": [1, 2, 3],  // Optional: specific bag items to calculate
        "address": {            // Optional: for accurate Printify rates
            "country": "US",
            "state": "NJ",
            "zip": "07030"
        }
    }
    """
    bag = get_or_create_bag(request)

    if bag.item_count == 0:
        return Response({
            'pod_shipping': 0,
            'local_shipping': 0,
            'total_shipping': 0,
            'breakdown': [],
        })

    item_ids = request.data.get('item_ids')
    address = request.data.get('address', {})

    # Get bag items
    bag_items = bag.items.select_related('product').all()
    if item_ids:
        bag_items = bag_items.filter(id__in=item_ids)

    # Separate by fulfillment type
    pod_items = []
    local_items = []

    for item in bag_items:
        if item.product.is_pod:
            pod_items.append(item)
        else:
            local_items.append(item)

    # Calculate shipping
    pod_shipping = 0
    local_shipping = 0
    breakdown = []

    # POD items - use Printify shipping rates or flat rate estimate
    if pod_items:
        # Try to get real Printify rates if address provided
        printify = get_printify_client()
        if printify and address.get('country'):
            try:
                # Build line items for Printify shipping calculation
                line_items = []
                for item in pod_items:
                    if item.product.printify_product_id and item.product.printify_variant_id:
                        line_items.append({
                            'product_id': item.product.printify_product_id,
                            'variant_id': int(item.product.printify_variant_id),
                            'quantity': item.quantity,
                        })

                if line_items:
                    shipping_result = printify.calculate_shipping(
                        line_items=line_items,
                        address={
                            'country': address.get('country', 'US'),
                            'region': address.get('state', ''),
                            'zip': address.get('zip', ''),
                        }
                    )
                    # Use standard shipping option
                    if shipping_result.get('standard'):
                        pod_shipping = float(shipping_result['standard']) / 100  # cents to dollars
            except Exception as e:
                logger.warning(f"Printify shipping calculation failed: {e}")
                # Fall back to flat rate estimate

        # Fallback: flat rate estimate for POD
        if pod_shipping == 0:
            # Typical Printify apparel: ~$4.50 first item, +$1.50 each additional
            total_pod_quantity = sum(item.quantity for item in pod_items)
            pod_shipping = 4.50 + max(0, total_pod_quantity - 1) * 1.50

        breakdown.append({
            'type': 'pod',
            'label': 'Print on Demand Shipping',
            'description': f'{len(pod_items)} item(s) via Printify',
            'amount': round(pod_shipping, 2),
        })

    # Local items - free coach delivery
    if local_items:
        local_shipping = 0
        breakdown.append({
            'type': 'local',
            'label': 'Coach Delivery',
            'description': f'{len(local_items)} item(s) at next practice',
            'amount': 0,
        })

    total_shipping = pod_shipping + local_shipping

    return Response({
        'pod_shipping': round(pod_shipping, 2),
        'local_shipping': round(local_shipping, 2),
        'total_shipping': round(total_shipping, 2),
        'breakdown': breakdown,
        'pod_item_count': len(pod_items),
        'local_item_count': len(local_items),
    })


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def printify_webhook(request):
    """
    Handle Printify webhook events for orders and products.

    Order Events:
    - order:created - Order received by Printify
    - order:sent-to-production - Order started production
    - order:shipment:created - Order shipped with tracking info
    - order:shipment:delivered - Order delivered
    - order:canceled - Order was canceled

    Product Events (Auto-Sync):
    - product:publish:started - Product published, auto-create and sync
    - product:deleted - Product deleted, mark as inactive

    Configure webhook in Printify Dashboard:
    Settings → Webhooks → Add endpoint
    URL: https://api.njstarselite.com/api/payments/webhook/printify/
    Events: Select all order events + product:publish:started + product:deleted
    """
    import hashlib
    import hmac
    from django.utils.text import slugify
    from .services.printify_sync import sync_product_variants
    from .services.printify_client import get_printify_client

    # Verify webhook signature (optional but recommended)
    webhook_secret = getattr(settings, 'PRINTIFY_WEBHOOK_SECRET', '')
    if webhook_secret:
        signature = request.headers.get('X-Printify-Signature', '')
        payload_bytes = request.body
        expected_signature = hmac.new(
            webhook_secret.encode('utf-8'),
            payload_bytes,
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(signature, expected_signature):
            logger.warning("Printify webhook signature verification failed")
            return HttpResponse(status=401)

    try:
        payload = request.data
        event_type = payload.get('type', '')
        resource = payload.get('resource', {})

        logger.info(f"Printify webhook received: {event_type}")

        # ============================================================
        # PRODUCT EVENTS - Auto-sync when products are published
        # ============================================================
        if event_type == 'product:publish:started':
            return _handle_product_publish(resource)

        elif event_type == 'product:deleted':
            return _handle_product_deleted(resource)

        # ============================================================
        # ORDER EVENTS - Update order status and tracking
        # ============================================================
        elif event_type.startswith('order:'):
            return _handle_order_event(event_type, resource)

        else:
            logger.info(f"Unhandled Printify webhook event: {event_type}")
            return HttpResponse(status=200)

    except Exception as e:
        logger.error(f"Error processing Printify webhook: {e}", exc_info=True)
        return HttpResponse(status=500)


def _handle_product_publish(resource: dict):
    """
    Handle product:publish:started webhook - auto-create product and sync variants.

    When a product is published in Printify, this:
    1. Creates a new Product record (or updates existing)
    2. Syncs all variants, prices, and images from Printify
    """
    from django.utils.text import slugify
    from .services.printify_sync import sync_product_variants
    from .services.printify_client import get_printify_client

    printify_product_id = resource.get('id', '')
    if not printify_product_id:
        logger.warning("Product webhook missing product ID")
        return HttpResponse(status=200)

    logger.info(f"Auto-syncing published Printify product: {printify_product_id}")

    try:
        # Fetch full product data from Printify API
        client = get_printify_client()
        if not client.is_configured:
            logger.error("Printify API not configured - cannot auto-sync product")
            return HttpResponse(status=200)

        printify_data = client.get_product(printify_product_id)

        title = printify_data.get('title', f'Product {printify_product_id}')
        description = printify_data.get('description', '')

        # Generate unique slug
        base_slug = slugify(title)
        slug = base_slug
        counter = 1
        while Product.objects.filter(slug=slug).exclude(printify_product_id=printify_product_id).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        # Get base price from first enabled variant (Printify prices are in cents)
        variants = printify_data.get('variants', [])
        base_price = 0
        for v in variants:
            if v.get('is_enabled') and v.get('price'):
                base_price = v['price'] / 100
                break

        # Create or update the product
        product, created = Product.objects.update_or_create(
            printify_product_id=printify_product_id,
            defaults={
                'name': title,
                'slug': slug,
                'description': description,
                'price': base_price,
                'fulfillment_type': 'pod',
                'is_active': True,
                'category': 'apparel',  # Default category, can be changed in admin
            }
        )

        action = "Created" if created else "Updated"
        logger.info(f"{action} product '{product.name}' from Printify webhook")

        # Sync variants, prices, and images
        sync_stats = sync_product_variants(product)

        logger.info(
            f"Product sync complete for '{product.name}': "
            f"variants({sync_stats['created']}+/{sync_stats['updated']}~), "
            f"images({sync_stats.get('images_created', 0)}+)"
        )

        return HttpResponse(status=200)

    except Exception as e:
        logger.error(f"Error auto-syncing Printify product {printify_product_id}: {e}", exc_info=True)
        return HttpResponse(status=200)  # Return 200 to avoid Printify retries


def _handle_product_deleted(resource: dict):
    """Handle product:deleted webhook - mark product as inactive."""
    printify_product_id = resource.get('id', '')
    if not printify_product_id:
        return HttpResponse(status=200)

    try:
        product = Product.objects.get(printify_product_id=printify_product_id)
        product.is_active = False
        product.save()
        logger.info(f"Deactivated product '{product.name}' (deleted in Printify)")
    except Product.DoesNotExist:
        logger.debug(f"Product not found for deleted Printify ID: {printify_product_id}")

    return HttpResponse(status=200)


def _handle_order_event(event_type: str, resource: dict):
    """Handle order-related webhook events."""
    printify_order_id = resource.get('id', '')
    if not printify_order_id:
        logger.warning("Order webhook missing order ID")
        return HttpResponse(status=200)

    try:
        order = Order.objects.get(printify_order_id=printify_order_id)
    except Order.DoesNotExist:
        # Try finding by external_id (our order number)
        external_id = resource.get('external_id', '')
        if external_id:
            try:
                order = Order.objects.get(order_number=external_id)
            except Order.DoesNotExist:
                logger.warning(f"Order not found for Printify ID {printify_order_id}")
                return HttpResponse(status=200)
        else:
            logger.warning(f"Order not found for Printify ID {printify_order_id}")
            return HttpResponse(status=200)

    # Handle different order event types
    if event_type == 'order:sent-to-production':
        order.status = 'processing'
        order.save()
        logger.info(f"Order {order.order_number} moved to processing")

    elif event_type == 'order:shipment:created':
        shipments = resource.get('shipments', [])
        if shipments:
            shipment = shipments[0]
            order.tracking_number = shipment.get('tracking_number', '')
            order.tracking_url = shipment.get('tracking_url', '')
            order.status = 'shipped'
            order.save()
            logger.info(f"Order {order.order_number} shipped: {order.tracking_number}")

    elif event_type == 'order:shipment:delivered':
        order.status = 'delivered'
        order.save()
        logger.info(f"Order {order.order_number} delivered")

    elif event_type == 'order:canceled':
        order.status = 'canceled'
        order.save()
        logger.info(f"Order {order.order_number} canceled in Printify")

    return HttpResponse(status=200)
