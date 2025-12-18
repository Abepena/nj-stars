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
from django.utils import timezone
from .serializers import (
    ProductSerializer,
    SubscriptionPlanSerializer,
    BagSerializer,
    BagItemSerializer,
    AddToBagSerializer,
    UpdateBagItemSerializer,
    OrderSerializer,
    HandoffItemSerializer,
    HandoffUpdateSerializer,
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

    Special parameter:
    - fill_to: When used with featured=true, fills up to this number
               with random non-featured products if there aren't enough
               featured products. Useful for homepage displays.
    """
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'featured']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'created_at']
    ordering = ['name']

    def list(self, request, *args, **kwargs):
        """
        Override list to handle fill_to parameter for featured products.
        """
        fill_to = request.query_params.get('fill_to')
        featured = request.query_params.get('featured')

        # Only apply fill logic when both featured=true and fill_to are specified
        if featured and featured.lower() == 'true' and fill_to:
            try:
                fill_to = int(fill_to)
            except ValueError:
                fill_to = None

            if fill_to and fill_to > 0:
                # Get featured products
                featured_products = list(
                    Product.objects.filter(is_active=True, featured=True)
                )
                featured_count = len(featured_products)

                # If we have fewer than fill_to, add random non-featured products
                if featured_count < fill_to:
                    needed = fill_to - featured_count
                    featured_ids = [p.id for p in featured_products]

                    # Get random non-featured products (excluding already-featured ones)
                    random_products = list(
                        Product.objects.filter(is_active=True, featured=False)
                        .exclude(id__in=featured_ids)
                        .order_by('?')[:needed]
                    )

                    # Combine: featured first, then random fillers
                    all_products = featured_products + random_products
                else:
                    all_products = featured_products[:fill_to]

                # Serialize and return
                serializer = self.get_serializer(all_products, many=True)
                return Response({'results': serializer.data})

        # Default behavior for all other cases
        return super().list(request, *args, **kwargs)


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
                        # Prefer primary image (supports Printify variant images)
                        'images': [product.primary_image_url] if product.primary_image_url else [],
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
@permission_classes([AllowAny])
def create_event_checkout(request):
    """Create Stripe checkout session for event registration (supports guests)"""
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
        participant_email = request.data.get('participant_email')  # For guest verification
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

        # Registration is required for checkout
        if not registration_id:
            return Response(
                {'error': 'Registration ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify registration - different logic for authenticated vs guest
        try:
            if request.user.is_authenticated:
                # Authenticated user: verify registration belongs to them
                registration = EventRegistration.objects.get(
                    id=registration_id,
                    user=request.user,
                    event=event,
                    payment_status='pending'
                )
            else:
                # Guest user: verify registration by ID + email match
                if not participant_email:
                    return Response(
                        {'error': 'Email is required for guest checkout'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                registration = EventRegistration.objects.get(
                    id=registration_id,
                    user__isnull=True,  # Must be a guest registration
                    event=event,
                    participant_email=participant_email,
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
            'type': 'event_registration',
            'registration_id': str(registration_id),
        }
        if request.user.is_authenticated:
            metadata['user_id'] = str(request.user.id)

        # Determine customer email for Stripe
        customer_email = (
            request.user.email if request.user.is_authenticated
            else registration.participant_email
        )

        # Create Stripe checkout session
        # Note: payment_method_types is omitted to use Dashboard-configured methods
        checkout_session = stripe.checkout.Session.create(
            customer_email=customer_email,
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
            client_reference_id=f"event_{event.id}_reg_{registration_id}",
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_subscription_checkout(request):
    """
    Create Stripe Checkout session for subscription plans.
    
    Supports both recurring subscriptions (monthly, seasonal, annual) 
    and one-time team dues payments.
    
    Request body:
    - plan_id: SubscriptionPlan ID (required)
    - player_id: Optional player ID to associate subscription with
    - success_url: URL to redirect after successful payment
    - cancel_url: URL to redirect if user cancels
    """
    try:
        if not _stripe_key_configured():
            return Response(
                {"error": "Stripe is not configured"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        plan_id = request.data.get('plan_id')
        player_id = request.data.get('player_id')
        success_url = request.data.get('success_url')
        cancel_url = request.data.get('cancel_url')

        if not plan_id:
            return Response(
                {'error': 'plan_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not success_url or not cancel_url:
            return Response(
                {'error': 'success_url and cancel_url are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get subscription plan
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {'error': 'Subscription plan not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validate Stripe IDs exist
        if not plan.stripe_price_id:
            return Response(
                {'error': 'Plan not configured for payments'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get or create Stripe customer
        user = request.user
        stripe_customer_id = None

        # Check if user has existing Stripe customer ID
        from apps.portal.models import UserProfile
        try:
            profile = user.profile
            stripe_customer_id = profile.stripe_customer_id
        except UserProfile.DoesNotExist:
            pass

        if not stripe_customer_id:
            # Create Stripe customer
            customer = stripe.Customer.create(
                email=user.email,
                name=f"{user.first_name} {user.last_name}".strip() or user.email,
                metadata={'user_id': str(user.id)}
            )
            stripe_customer_id = customer.id
            
            # Save to profile
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.stripe_customer_id = stripe_customer_id
            profile.save()

        # Build metadata
        metadata = {
            'plan_id': str(plan.id),
            'user_id': str(user.id),
            'type': 'subscription',
        }
        if player_id:
            metadata['player_id'] = str(player_id)

        # Determine mode based on billing period
        if plan.billing_period == 'one_time':
            mode = 'payment'
        else:
            mode = 'subscription'

        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            line_items=[{
                'price': plan.stripe_price_id,
                'quantity': 1,
            }],
            mode=mode,
            success_url=success_url,
            cancel_url=cancel_url,
            client_reference_id=f"subscription_{plan.id}_{user.id}",
            metadata=metadata,
        )

        return Response({
            'session_id': checkout_session.id,
            'url': checkout_session.url,
        })

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating subscription checkout: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error creating subscription checkout: {e}")
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

    In development (PRINTIFY_DRY_RUN=true), generates mock order IDs without
    calling the actual Printify API.
    """
    import uuid

    # DEV MODE: Skip actual Printify API call, generate mock IDs
    if getattr(settings, 'PRINTIFY_DRY_RUN', False):
        mock_order_id = f"mock-{uuid.uuid4().hex[:12]}"
        order.printify_order_id = mock_order_id
        order.save()

        # Generate mock line item IDs for each POD item
        for i, item in enumerate(pod_items):
            item.printify_line_item_id = f"mock-line-{i+1}"
            item.save()

        logger.info(f"[DRY RUN] Mock Printify order created: {mock_order_id} for {order.order_number}")
        return mock_order_id

    # PRODUCTION MODE: Call actual Printify API
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

        def _variant_for_item(item):
            """Find matching variant for selected size/color (if any)."""
            if item.selected_size or item.selected_color:
                return item.product.variants.filter(
                    size=item.selected_size or '',
                    color=item.selected_color or '',
                    is_enabled=True
                ).first()
            return None

        def _make_absolute_url(url):
            """Convert relative URL to absolute URL for Stripe."""
            if not url:
                return None
            # Already absolute
            if url.startswith('http://') or url.startswith('https://'):
                return url
            # Relative URL - prepend backend URL
            backend_url = getattr(settings, 'BACKEND_URL', 'http://localhost:8000').rstrip('/')
            return f"{backend_url}{url}"

        def _image_for_item(item):
            """
            Choose the most accurate image for Stripe:
            - If variant has Printify variant ID, use the first image that contains that ID.
            - Fallback to product primary image.
            Returns absolute URL (Stripe requires absolute URLs).
            """
            variant = _variant_for_item(item)
            if variant and variant.printify_variant_id:
                variant_image = item.product.images.filter(
                    printify_variant_ids__contains=[variant.printify_variant_id]
                ).first()
                if variant_image and variant_image.url:
                    return _make_absolute_url(variant_image.url)
            return _make_absolute_url(item.product.primary_image_url)

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
                    'unit_amount': int(item.unit_price * 100),  # Use variant price, converted to cents
                    'product_data': {
                        'name': product_name,
                        'description': item.product.description[:500] if item.product.description else '',
                        'images': [
                            img for img in [_image_for_item(item)] if img
                        ],
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
    # Note: Printify sends signature in X-Pfy-Signature header as hex-encoded HMAC-SHA256
    webhook_secret = getattr(settings, 'PRINTIFY_WEBHOOK_SECRET', '')
    if webhook_secret:
        # Printify uses X-Pfy-Signature header (not X-Printify-Signature)
        signature = request.headers.get('X-Pfy-Signature', '')
        if not signature:
            # Fallback to alternate header names
            signature = request.headers.get('X-Printify-Signature', '')

        if signature:
            payload_bytes = request.body
            expected_signature = hmac.new(
                webhook_secret.encode('utf-8'),
                payload_bytes,
                hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(signature, expected_signature):
                logger.warning(
                    f"Printify webhook signature mismatch. "
                    f"Received: {signature[:20]}..., Expected: {expected_signature[:20]}..."
                )
                # Continue processing but log the warning (signature may be misconfigured)
        else:
            logger.info("Printify webhook received without signature header")

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


def _detect_category_from_tags(tags: list) -> str:
    """
    Detect product category from Printify tags.
    Maps Printify's tag system to our categories.
    """
    tags_lower = [t.lower() for t in tags]
    tags_str = ' '.join(tags_lower)

    # Map Printify tags to our categories (check most specific first)
    if 'hoodies' in tags_lower or 'hoodie' in tags_str:
        return 'hoodie'
    if 't-shirts' in tags_lower or 'tee' in tags_str:
        return 'tee'
    if 'long sleeve' in tags_str:
        return 'longsleeve'
    if 'sweater' in tags_str or 'sweatshirt' in tags_str:
        return 'sweater'
    if 'tank tops' in tags_lower or 'jersey' in tags_str:
        return 'jersey'
    if 'shorts' in tags_lower:
        return 'shorts'
    if 'hats' in tags_lower or 'caps' in tags_lower or 'hat' in tags_str or 'beanie' in tags_str:
        return 'hat'
    if 'bags' in tags_lower or 'backpack' in tags_str:
        return 'bag'

    # Default fallback
    return 'apparel'


def _handle_product_publish(resource: dict):
    """
    Handle product:publish:started webhook - auto-create product and sync variants.

    When a product is published in Printify, this:
    1. Creates a new Product record (or updates existing)
    2. Syncs all variants, prices, and images from Printify
    """
    import html
    import re
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

        # Clean HTML tags and decode entities from description
        if description:
            description = re.sub(r'<[^>]+>', '', description)
            description = html.unescape(description)  # Decode &#39; → '

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

        # Detect category from Printify tags
        tags = printify_data.get('tags', [])
        category = _detect_category_from_tags(tags)

        # Create or update the product
        product, created = Product.objects.update_or_create(
            printify_product_id=printify_product_id,
            defaults={
                'name': title,
                'slug': slug,
                'description': description,
                'price': base_price,
                'fulfillment_type': 'pod',
                'manage_inventory': False,  # POD products are always in stock
                'is_active': True,
                'category': category,
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


# =============================================================================
# HANDOFF MANAGEMENT (Local Product Delivery)
# =============================================================================

class HandoffListView(APIView):
    """
    List local items pending handoff (staff only).

    GET /api/payments/handoffs/?status=pending
    Query params:
        - status: pending (default), ready, delivered, all
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Require staff access
        if not request.user.is_staff:
            return Response(
                {'error': 'Staff access required'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get status filter
        status_filter = request.query_params.get('status', 'pending')

        # Query local delivery items from paid orders
        items = OrderItem.objects.filter(
            fulfillment_type='local',
            order__status__in=['paid', 'processing', 'shipped'],  # Active orders
        )

        # Apply status filter
        if status_filter != 'all':
            items = items.filter(handoff_status=status_filter)

        # Order by oldest first
        items = items.select_related('order', 'handoff_completed_by').order_by('order__created_at')

        serializer = HandoffItemSerializer(items, many=True)
        return Response(serializer.data)


class HandoffUpdateView(APIView):
    """
    Update handoff status for a local delivery item (staff only).

    PATCH /api/payments/handoffs/<item_id>/
    Body: { "status": "delivered", "notes": "Picked up at practice" }
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, item_id):
        # Require staff access
        if not request.user.is_staff:
            return Response(
                {'error': 'Staff access required'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get the item
        try:
            item = OrderItem.objects.select_related('order').get(
                pk=item_id,
                fulfillment_type='local'
            )
        except OrderItem.DoesNotExist:
            return Response(
                {'error': 'Item not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validate request data
        serializer = HandoffUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Update handoff status
        new_status = serializer.validated_data['status']
        item.handoff_status = new_status
        item.handoff_notes = serializer.validated_data.get('notes', '')

        if new_status == 'delivered':
            item.handoff_completed_at = timezone.now()
            item.handoff_completed_by = request.user
        elif new_status in ['pending', 'ready']:
            # Reset completion fields if moving back to non-delivered status
            item.handoff_completed_at = None
            item.handoff_completed_by = None

        item.save()

        # Check if all local items in order are delivered
        self._update_order_status_if_complete(item.order)

        return Response(HandoffItemSerializer(item).data)

    def _update_order_status_if_complete(self, order):
        """Update order status to delivered if all items are fulfilled."""
        local_items = order.items.filter(fulfillment_type='local')
        pod_items = order.items.filter(fulfillment_type='pod')

        # Check if all local items are delivered
        all_local_delivered = all(
            i.handoff_status == 'delivered' for i in local_items
        ) if local_items.exists() else True

        # Check if POD items are shipped/delivered (or none exist)
        all_pod_fulfilled = (
            not pod_items.exists() or
            order.status in ['shipped', 'delivered']
        )

        # If everything is complete, mark order as delivered
        if all_local_delivered and all_pod_fulfilled:
            order.status = 'delivered'
            order.save()
            logger.info(f"Order {order.order_number} fully delivered (all items handed off)")


# =============================================================================
# PRINTIFY ADMIN ENDPOINTS (Superuser only)
# =============================================================================

class PrintifyAdminView(APIView):
    """
    Admin endpoints for Printify management (superuser only).
    """
    permission_classes = [IsAuthenticated]

    def _require_superuser(self, request):
        if not request.user.is_superuser:
            return Response(
                {'error': 'Superuser access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        return None


class PrintifyPublishView(PrintifyAdminView):
    """
    Publish a Printify product.

    POST /api/payments/admin/printify/publish/
    Body: { "product_id": "693b573a9164dbdf170252cd" }
    """

    def post(self, request):
        # Check superuser
        error = self._require_superuser(request)
        if error:
            return error

        product_id = request.data.get('product_id')
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        client = get_printify_client()
        if not client or not client.is_configured:
            return Response(
                {'error': 'Printify API not configured'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            # Publish the product
            result = client.publish_product(product_id)
            return Response({
                'success': True,
                'message': f'Product {product_id} published successfully',
                'product_id': product_id
            })
        except PrintifyError as e:
            logger.error(f"Failed to publish Printify product {product_id}: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error publishing Printify product: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to publish product'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PrintifyUnpublishView(PrintifyAdminView):
    """
    Unpublish a Printify product.

    POST /api/payments/admin/printify/unpublish/
    Body: { "product_id": "693b573a9164dbdf170252cd" }
    """

    def post(self, request):
        # Check superuser
        error = self._require_superuser(request)
        if error:
            return error

        product_id = request.data.get('product_id')
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        client = get_printify_client()
        if not client or not client.is_configured:
            return Response(
                {'error': 'Printify API not configured'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            # Unpublish the product
            result = client.unpublish_product(product_id)
            return Response({
                'success': True,
                'message': f'Product {product_id} unpublished successfully',
                'product_id': product_id
            })
        except PrintifyError as e:
            logger.error(f"Failed to unpublish Printify product {product_id}: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error unpublishing Printify product: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to unpublish product'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PrintifyProductsView(PrintifyAdminView):
    """
    List all Printify products (for admin dashboard).

    GET /api/payments/admin/printify/products/

    Returns products with sync status showing if they exist in local DB.
    """

    def get(self, request):
        # Check superuser
        error = self._require_superuser(request)
        if error:
            return error

        client = get_printify_client()
        if not client or not client.is_configured:
            return Response(
                {'error': 'Printify API not configured'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            products = client.get_products()

            # Get all synced Printify product IDs from local DB
            synced_products = Product.objects.filter(
                printify_product_id__isnull=False
            ).values('printify_product_id', 'slug', 'name')
            synced_map = {
                p['printify_product_id']: {'slug': p['slug'], 'name': p['name']}
                for p in synced_products
            }

            # Return simplified product list with sync status
            simplified = []
            for p in products:
                product_id = p.get('id')
                local_info = synced_map.get(product_id)
                simplified.append({
                    'id': product_id,
                    'title': p.get('title'),
                    'is_locked': p.get('is_locked', False),
                    'visible': p.get('visible', False),
                    'created_at': p.get('created_at'),
                    'images': p.get('images', [])[:1],  # Just first image
                    'synced': local_info is not None,
                    'local_slug': local_info['slug'] if local_info else None,
                    'local_name': local_info['name'] if local_info else None,
                })
            return Response({'products': simplified})
        except PrintifyError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class PrintifySyncView(PrintifyAdminView):
    """
    Manually sync a Printify product to local database.

    POST /api/payments/admin/printify/sync/
    Body: { "product_id": "693b573a9164dbdf170252cd" }
    """

    def post(self, request):
        from .services.printify_sync import sync_product_variants

        # Check superuser
        error = self._require_superuser(request)
        if error:
            return error

        product_id = request.data.get('product_id')
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        client = get_printify_client()
        if not client or not client.is_configured:
            return Response(
                {'error': 'Printify API not configured'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            # Fetch product from Printify
            printify_data = client.get_product(product_id)

            # Use the webhook handler logic to create/update the product
            import html
            import re
            from django.utils.text import slugify

            title = printify_data.get('title', f'Product {product_id}')
            description = printify_data.get('description', '')

            if description:
                description = re.sub(r'<[^>]+>', '', description)
                description = html.unescape(description)

            base_slug = slugify(title)
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(printify_product_id=product_id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            variants = printify_data.get('variants', [])
            base_price = 0
            for v in variants:
                if v.get('is_enabled') and v.get('price'):
                    base_price = v['price'] / 100
                    break

            tags = printify_data.get('tags', [])
            category = _detect_category_from_tags(tags)

            product, created = Product.objects.update_or_create(
                printify_product_id=product_id,
                defaults={
                    'name': title,
                    'slug': slug,
                    'description': description,
                    'price': base_price,
                    'fulfillment_type': 'pod',
                    'manage_inventory': False,
                    'is_active': True,
                    'category': category,
                }
            )

            sync_stats = sync_product_variants(product)

            return Response({
                'success': True,
                'created': created,
                'product': {
                    'id': product.id,
                    'name': product.name,
                    'slug': product.slug,
                    'category': product.category,
                },
                'sync_stats': sync_stats
            })

        except PrintifyError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error syncing Printify product: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to sync product'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PrintifySyncAndUnpublishView(PrintifyAdminView):
    """
    Sync a Printify product to local database AND unpublish from Printify.

    This is useful for products that exist in Printify but aren't yet in our
    local database. After syncing, the product is unpublished from Printify
    so it won't be visible until explicitly re-published.

    POST /api/payments/admin/printify/sync-and-unpublish/
    Body: { "product_id": "693b573a9164dbdf170252cd" }
    """

    def post(self, request):
        from .services.printify_sync import sync_product_variants

        # Check superuser
        error = self._require_superuser(request)
        if error:
            return error

        product_id = request.data.get('product_id')
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        client = get_printify_client()
        if not client or not client.is_configured:
            return Response(
                {'error': 'Printify API not configured'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            # Step 1: Fetch product from Printify
            printify_data = client.get_product(product_id)

            # Step 2: Sync to local database (same logic as PrintifySyncView)
            import html
            import re
            from django.utils.text import slugify

            title = printify_data.get('title', f'Product {product_id}')
            description = printify_data.get('description', '')

            if description:
                description = re.sub(r'<[^>]+>', '', description)
                description = html.unescape(description)

            base_slug = slugify(title)
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(printify_product_id=product_id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            variants = printify_data.get('variants', [])
            base_price = 0
            for v in variants:
                if v.get('is_enabled') and v.get('price'):
                    base_price = v['price'] / 100
                    break

            tags = printify_data.get('tags', [])
            category = _detect_category_from_tags(tags)

            product, created = Product.objects.update_or_create(
                printify_product_id=product_id,
                defaults={
                    'name': title,
                    'slug': slug,
                    'description': description,
                    'price': base_price,
                    'fulfillment_type': 'pod',
                    'manage_inventory': False,
                    'is_active': True,
                    'category': category,
                }
            )

            sync_stats = sync_product_variants(product)

            # Step 3: Unpublish from Printify
            unpublish_success = False
            unpublish_error = None
            try:
                client.unpublish_product(product_id)
                unpublish_success = True
            except PrintifyError as e:
                unpublish_error = str(e)
                logger.warning(f"Failed to unpublish product {product_id} after sync: {e}")

            return Response({
                'success': True,
                'created': created,
                'product': {
                    'id': product.id,
                    'name': product.name,
                    'slug': product.slug,
                    'category': product.category,
                },
                'sync_stats': sync_stats,
                'unpublished': unpublish_success,
                'unpublish_error': unpublish_error,
            })

        except PrintifyError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error in sync-and-unpublish: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to sync and unpublish product'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PrintifyDeleteLocalView(PrintifyAdminView):
    """
    Delete a product from local database that no longer exists in Printify.

    This is a cleanup endpoint for when products are deleted from Printify
    but still exist in the local database.

    DELETE /api/payments/admin/printify/delete-local/
    Body: { "product_id": "693b573a9164dbdf170252cd" }
    """

    def delete(self, request):
        # Check superuser
        error = self._require_superuser(request)
        if error:
            return error

        product_id = request.data.get('product_id')
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Find the local product
            product = Product.objects.filter(printify_product_id=product_id).first()
            if not product:
                return Response(
                    {'error': f'No local product found with Printify ID {product_id}'},
                    status=status.HTTP_404_NOT_FOUND
                )

            product_name = product.name
            product_slug = product.slug

            # Delete the product
            product.delete()

            return Response({
                'success': True,
                'message': f'Product "{product_name}" deleted from local database',
                'deleted_product': {
                    'printify_id': product_id,
                    'name': product_name,
                    'slug': product_slug,
                }
            })

        except Exception as e:
            logger.error(f"Error deleting local product: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to delete product'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PrintifyUnlockView(PrintifyAdminView):
    """
    Unlock a product that is locked in Printify.

    When products are published, Printify locks them until the external
    store confirms the publish succeeded or failed. This endpoint calls
    the publishing_failed endpoint to unlock the product, allowing it
    to be edited or unpublished.

    POST /api/payments/admin/printify/unlock/
    Body: { "product_id": "693b573a9164dbdf170252cd" }
    """

    def post(self, request):
        # Check superuser
        error = self._require_superuser(request)
        if error:
            return error

        product_id = request.data.get('product_id')
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        client = get_printify_client()
        if not client or not client.is_configured:
            return Response(
                {'error': 'Printify API not configured'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            # Use publishing_failed to unlock the product
            # This tells Printify the external publish workflow did not complete
            client.set_publish_failed(
                product_id=product_id,
                reason="Unlocked via admin panel for manual management"
            )

            return Response({
                'success': True,
                'message': f'Product {product_id} unlocked successfully',
            })

        except PrintifyError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error unlocking Printify product: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to unlock product'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PrintifyDeleteProductView(PrintifyAdminView):
    """
    Delete a product from Printify entirely.
    
    WARNING: This permanently removes the product from Printify.
    Also removes the corresponding local product if it exists.

    DELETE /api/payments/admin/printify/delete-product/
    Body: { "product_id": "693b573a9164dbdf170252cd" }
    """

    def delete(self, request):
        # Check superuser
        error = self._require_superuser(request)
        if error:
            return error

        product_id = request.data.get('product_id')
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        client = get_printify_client()
        if not client or not client.is_configured:
            return Response(
                {'error': 'Printify API not configured'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            # Delete from Printify
            client.delete_product(product_id)

            # Also delete from local DB if exists
            local_product = Product.objects.filter(printify_product_id=product_id).first()
            local_deleted = False
            if local_product:
                local_product.delete()
                local_deleted = True

            return Response({
                'success': True,
                'message': f'Product {product_id} deleted from Printify',
                'local_deleted': local_deleted,
            })

        except PrintifyError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error deleting Printify product: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to delete product'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============================================================================
# Cash Payment Views
# ============================================================================

from .models import CashPayment
from .serializers import (
    CashPaymentSerializer,
    CollectCashSerializer,
    CashHandoffSerializer,
    CashByStaffSerializer,
)
from django.db.models import Sum, Count, Q
from apps.events.models import Event


def can_collect_cash(user):
    """Check if user has permission to collect cash (staff, coach, or admin)"""
    if user.is_superuser or user.is_staff:
        return True
    if hasattr(user, 'profile'):
        return user.profile.role in ['admin', 'staff', 'coach']
    return False


def is_admin_user(user):
    """Check if user is an admin"""
    if user.is_superuser or user.is_staff:
        return True
    if hasattr(user, 'profile'):
        return user.profile.role == 'admin'
    return False


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def collect_cash(request):
    """
    Record a cash payment collected by staff.

    Staff/coaches can collect cash for:
    - Event registrations (payment_for=registration)
    - Product orders (payment_for=product)
    - Dues payments (payment_for=dues)

    The amount is automatically determined from the linked item.
    """
    # Check permission
    if not can_collect_cash(request.user):
        return Response(
            {"error": "You don't have permission to collect cash payments"},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = CollectCashSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    # Create the cash payment record
    cash_payment = CashPayment.objects.create(
        collected_by=request.user,
        payment_for=data['payment_for'],
        amount=data['_amount'],
        notes=data.get('notes', ''),
    )

    # Link to the appropriate item and update its payment status
    if data['payment_for'] == 'registration':
        reg = data['_registration']
        cash_payment.event_registration = reg
        cash_payment.event = reg.event
        # Update registration payment status
        reg.payment_status = 'completed'
        reg.payment_method = 'cash'
        reg.amount_paid = data['_amount']
        reg.save()

    elif data['payment_for'] == 'product':
        order = data['_order']
        cash_payment.order = order
        # Update order status
        order.status = 'paid'
        order.payment_method = 'cash'
        order.collected_by = request.user
        order.save()

    elif data['payment_for'] == 'dues':
        dues = data['_dues_account']
        cash_payment.dues_account = dues
        # Update dues balance
        from apps.portal.models import DuesTransaction
        DuesTransaction.objects.create(
            dues_account=dues,
            amount=-data['_amount'],  # Negative = payment
            transaction_type='payment',
            description='Cash payment',
            processed_by=request.user,
        )
        dues.balance = max(0, dues.balance - data['_amount'])
        dues.last_payment_date = timezone.now()
        dues.save()

    # Set event context if provided
    if data.get('event_id'):
        try:
            cash_payment.event = Event.objects.get(pk=data['event_id'])
        except Event.DoesNotExist:
            pass

    cash_payment.save()

    return Response(
        CashPaymentSerializer(cash_payment).data,
        status=status.HTTP_201_CREATED
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_cash(request):
    """
    Get pending cash payments (not yet handed off).

    Admin: See all pending cash
    Staff/Coach: See only their own pending cash
    """
    if not can_collect_cash(request.user):
        return Response(
            {"error": "You don't have permission to view cash payments"},
            status=status.HTTP_403_FORBIDDEN
        )

    queryset = CashPayment.objects.filter(status='collected')

    # Filter by staff if not admin
    if not is_admin_user(request.user):
        queryset = queryset.filter(collected_by=request.user)

    # Optional filters
    event_id = request.query_params.get('event')
    if event_id:
        queryset = queryset.filter(event_id=event_id)

    date_from = request.query_params.get('date_from')
    if date_from:
        queryset = queryset.filter(collected_at__date__gte=date_from)

    date_to = request.query_params.get('date_to')
    if date_to:
        queryset = queryset.filter(collected_at__date__lte=date_to)

    serializer = CashPaymentSerializer(queryset, many=True)
    return Response({
        'results': serializer.data,
        'total_pending': queryset.aggregate(total=Sum('amount'))['total'] or 0,
        'count': queryset.count(),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cash_handoff(request, cash_id):
    """
    Mark cash as handed off to admin.

    Only the staff member who collected the cash can initiate handoff.
    Admin must confirm receipt (separate endpoint).
    """
    try:
        cash_payment = CashPayment.objects.get(pk=cash_id)
    except CashPayment.DoesNotExist:
        return Response(
            {"error": "Cash payment not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Only collector or admin can initiate handoff
    if cash_payment.collected_by != request.user and not is_admin_user(request.user):
        return Response(
            {"error": "You can only hand off cash you collected"},
            status=status.HTTP_403_FORBIDDEN
        )

    if cash_payment.status != 'collected':
        return Response(
            {"error": f"Cash is already {cash_payment.status}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = CashHandoffSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    # Update status
    cash_payment.status = 'handed_off'
    cash_payment.handed_off_at = timezone.now()
    # For now, mark as handed off to the requesting admin, or leave null if staff initiated
    if is_admin_user(request.user):
        cash_payment.handed_off_to = request.user
    if serializer.validated_data.get('notes'):
        cash_payment.notes += f"\n[Handoff] {serializer.validated_data['notes']}"
    cash_payment.save()

    return Response(CashPaymentSerializer(cash_payment).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cash_undo_handoff(request, cash_id):
    """
    Undo a cash handoff, moving it back to collected status.
    
    Admin only - allows reverting a handoff if done in error.
    """
    if not is_admin_user(request.user):
        return Response(
            {"error": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        cash_payment = CashPayment.objects.get(pk=cash_id)
    except CashPayment.DoesNotExist:
        return Response(
            {"error": "Cash payment not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    if cash_payment.status != 'handed_off':
        return Response(
            {"error": f"Can only undo handoff for handed_off items, current status: {cash_payment.status}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Revert to collected status
    cash_payment.status = 'collected'
    cash_payment.handed_off_at = None
    cash_payment.handed_off_to = None
    cash_payment.notes += f"\n[Undo Handoff] Reverted by {request.user.email} at {timezone.now().strftime('%Y-%m-%d %H:%M')}"
    cash_payment.save()

    return Response(CashPaymentSerializer(cash_payment).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cash_by_staff(request):
    """
    Get cash totals grouped by staff member.

    Admin only endpoint for reconciliation dashboard.
    """
    if not is_admin_user(request.user):
        return Response(
            {"error": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN
        )

    # Get aggregated data per staff member
    staff_data = CashPayment.objects.values(
        'collected_by__id',
        'collected_by__email',
        'collected_by__first_name',
        'collected_by__last_name',
    ).annotate(
        total_collected=Sum('amount'),
        total_handed_off=Sum('amount', filter=Q(status='handed_off')),
        pending_amount=Sum('amount', filter=Q(status='collected')),
        pending_count=Count('id', filter=Q(status='collected')),
    ).order_by('-pending_amount')

    results = []
    for item in staff_data:
        name = f"{item['collected_by__first_name']} {item['collected_by__last_name']}".strip()
        results.append({
            'staff_id': item['collected_by__id'],
            'staff_name': name or item['collected_by__email'],
            'staff_email': item['collected_by__email'],
            'total_collected': item['total_collected'] or 0,
            'total_handed_off': item['total_handed_off'] or 0,
            'pending_amount': item['pending_amount'] or 0,
            'pending_count': item['pending_count'] or 0,
        })

    return Response({'results': results})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cash_history(request):
    """
    Get cash payment history with filters.

    Admin: All cash payments
    Staff/Coach: Only their own
    """
    if not can_collect_cash(request.user):
        return Response(
            {"error": "You don't have permission to view cash payments"},
            status=status.HTTP_403_FORBIDDEN
        )

    queryset = CashPayment.objects.all()

    # Filter by staff if not admin
    if not is_admin_user(request.user):
        queryset = queryset.filter(collected_by=request.user)

    # Filters
    status_filter = request.query_params.get('status')
    if status_filter:
        queryset = queryset.filter(status=status_filter)

    event_id = request.query_params.get('event')
    if event_id:
        queryset = queryset.filter(event_id=event_id)

    staff_id = request.query_params.get('staff')
    if staff_id and is_admin_user(request.user):
        queryset = queryset.filter(collected_by_id=staff_id)

    date_from = request.query_params.get('date_from')
    if date_from:
        queryset = queryset.filter(collected_at__date__gte=date_from)

    date_to = request.query_params.get('date_to')
    if date_to:
        queryset = queryset.filter(collected_at__date__lte=date_to)

    # Pagination
    page_size = int(request.query_params.get('page_size', 50))
    page = int(request.query_params.get('page', 1))
    offset = (page - 1) * page_size

    total_count = queryset.count()
    queryset = queryset[offset:offset + page_size]

    serializer = CashPaymentSerializer(queryset, many=True)
    return Response({
        'results': serializer.data,
        'count': total_count,
        'page': page,
        'page_size': page_size,
        'total_pages': (total_count + page_size - 1) // page_size,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cash_export(request):
    """
    Export cash payments as JSON for Google Sheets/CSV export.

    Admin only.
    """
    if not is_admin_user(request.user):
        return Response(
            {"error": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN
        )

    queryset = CashPayment.objects.all()

    # Same filters as cash_history
    status_filter = request.query_params.get('status')
    if status_filter:
        queryset = queryset.filter(status=status_filter)

    event_id = request.query_params.get('event')
    if event_id:
        queryset = queryset.filter(event_id=event_id)

    staff_id = request.query_params.get('staff')
    if staff_id:
        queryset = queryset.filter(collected_by_id=staff_id)

    date_from = request.query_params.get('date_from')
    if date_from:
        queryset = queryset.filter(collected_at__date__gte=date_from)

    date_to = request.query_params.get('date_to')
    if date_to:
        queryset = queryset.filter(collected_at__date__lte=date_to)

    # Build export data
    export_data = []
    for cash in queryset:
        export_data.append({
            'Date': cash.collected_at.strftime('%Y-%m-%d %H:%M'),
            'Collected By': cash.collected_by.get_full_name() or cash.collected_by.email,
            'Type': cash.get_payment_for_display(),
            'Description': cash.linked_item_description,
            'Amount': float(cash.amount),
            'Status': cash.get_status_display(),
            'Handed Off To': cash.handed_off_to.get_full_name() if cash.handed_off_to else '',
            'Handed Off At': cash.handed_off_at.strftime('%Y-%m-%d %H:%M') if cash.handed_off_at else '',
            'Notes': cash.notes,
        })

    return Response({
        'data': export_data,
        'columns': [
            {'key': 'Date', 'label': 'Date'},
            {'key': 'Collected By', 'label': 'Collected By'},
            {'key': 'Type', 'label': 'Type'},
            {'key': 'Description', 'label': 'Description'},
            {'key': 'Amount', 'label': 'Amount'},
            {'key': 'Status', 'label': 'Status'},
            {'key': 'Handed Off To', 'label': 'Handed Off To'},
            {'key': 'Handed Off At', 'label': 'Handed Off At'},
            {'key': 'Notes', 'label': 'Notes'},
        ],
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fetch_stripe_price(request):
    """
    Fetch price details from Stripe API.
    
    Used by admin UI to validate Stripe IDs and auto-populate price info
    before creating a subscription plan.
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if not _stripe_key_configured():
        return Response(
            {'error': 'Stripe is not configured'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    price_id = request.data.get('price_id')
    if not price_id:
        return Response(
            {'error': 'price_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Fetch price from Stripe
        price = stripe.Price.retrieve(price_id, expand=['product'])
        product = price.product
        
        # Determine billing period
        billing_period = 'one_time'
        if price.type == 'recurring':
            interval = price.recurring.interval
            interval_count = price.recurring.interval_count
            if interval == 'month' and interval_count == 1:
                billing_period = 'monthly'
            elif interval == 'month' and interval_count == 3:
                billing_period = 'seasonal'
            elif interval == 'year':
                billing_period = 'annual'
        
        return Response({
            'price_id': price.id,
            'product_id': product.id if hasattr(product, 'id') else product,
            'product_name': product.name if hasattr(product, 'name') else '',
            'product_description': product.description if hasattr(product, 'description') else '',
            'amount': price.unit_amount / 100,  # Convert from cents
            'currency': price.currency.upper(),
            'billing_period': billing_period,
            'interval': price.recurring.interval if price.recurring else None,
            'interval_count': price.recurring.interval_count if price.recurring else None,
        })
    
    except stripe.error.InvalidRequestError as e:
        return Response(
            {'error': f'Invalid Stripe ID: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error fetching Stripe price: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_subscription_plan(request):
    """
    Create a new subscription plan from Stripe IDs.
    
    Validates the Stripe IDs and creates a local SubscriptionPlan record.
    Price is fetched from Stripe API.
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if not _stripe_key_configured():
        return Response(
            {'error': 'Stripe is not configured'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    price_id = request.data.get('stripe_price_id')
    name = request.data.get('name')
    description = request.data.get('description', '')
    features = request.data.get('features', [])
    is_team_dues = request.data.get('is_team_dues', False)
    
    if not price_id:
        return Response(
            {'error': 'stripe_price_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if plan with this price_id already exists
    if SubscriptionPlan.objects.filter(stripe_price_id=price_id).exists():
        return Response(
            {'error': 'A plan with this Stripe Price ID already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Fetch price from Stripe
        price = stripe.Price.retrieve(price_id, expand=['product'])
        product = price.product
        
        # Determine billing period
        billing_period = 'one_time'
        if price.type == 'recurring':
            interval = price.recurring.interval
            interval_count = price.recurring.interval_count
            if interval == 'month' and interval_count == 1:
                billing_period = 'monthly'
            elif interval == 'month' and interval_count == 3:
                billing_period = 'seasonal'
            elif interval == 'year':
                billing_period = 'annual'
        
        # Use provided name or fall back to Stripe product name
        plan_name = name or (product.name if hasattr(product, 'name') else 'Subscription Plan')
        plan_description = description or (product.description if hasattr(product, 'description') else '')
        
        # Create the subscription plan
        plan = SubscriptionPlan.objects.create(
            name=plan_name,
            description=plan_description,
            price=price.unit_amount / 100,
            billing_period=billing_period,
            stripe_price_id=price_id,
            stripe_product_id=product.id if hasattr(product, 'id') else product,
            features=features if features else [],
            is_team_dues=is_team_dues,
            is_active=True,
        )
        
        return Response({
            'id': plan.id,
            'name': plan.name,
            'slug': plan.slug,
            'price': str(plan.price),
            'billing_period': plan.billing_period,
            'stripe_price_id': plan.stripe_price_id,
            'stripe_product_id': plan.stripe_product_id,
            'message': 'Subscription plan created successfully',
        }, status=status.HTTP_201_CREATED)
    
    except stripe.error.InvalidRequestError as e:
        return Response(
            {'error': f'Invalid Stripe ID: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error creating subscription plan: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_subscription_plans_admin(request):
    """
    List all subscription plans for admin management.
    Includes inactive plans (unlike the public endpoint).
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    plans = SubscriptionPlan.objects.all().order_by('price')
    data = []
    for plan in plans:
        data.append({
            'id': plan.id,
            'name': plan.name,
            'slug': plan.slug,
            'description': plan.description,
            'price': str(plan.price),
            'billing_period': plan.billing_period,
            'is_team_dues': plan.is_team_dues,
            'is_active': plan.is_active,
            'stripe_price_id': plan.stripe_price_id,
            'stripe_product_id': plan.stripe_product_id,
            'features': plan.features,
            'created_at': plan.created_at.isoformat(),
        })
    
    return Response({'results': data})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_subscription_plan(request, plan_id):
    """Update a subscription plan (name, description, features, active status)."""
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        plan = SubscriptionPlan.objects.get(id=plan_id)
    except SubscriptionPlan.DoesNotExist:
        return Response(
            {'error': 'Plan not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Update allowed fields
    if 'name' in request.data:
        plan.name = request.data['name']
    if 'description' in request.data:
        plan.description = request.data['description']
    if 'features' in request.data:
        plan.features = request.data['features']
    if 'is_active' in request.data:
        plan.is_active = request.data['is_active']
    if 'is_team_dues' in request.data:
        plan.is_team_dues = request.data['is_team_dues']
    
    plan.save()
    
    return Response({
        'id': plan.id,
        'name': plan.name,
        'is_active': plan.is_active,
        'message': 'Plan updated successfully',
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_subscription_plan(request, plan_id):
    """Delete a subscription plan (only if no active subscriptions)."""
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        plan = SubscriptionPlan.objects.get(id=plan_id)
    except SubscriptionPlan.DoesNotExist:
        return Response(
            {'error': 'Plan not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check for active subscriptions
    from .models import Subscription
    active_subs = Subscription.objects.filter(plan=plan, status='active').count()
    if active_subs > 0:
        return Response(
            {'error': f'Cannot delete plan with {active_subs} active subscription(s). Deactivate the plan instead.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    plan_name = plan.name
    plan.delete()
    
    return Response({
        'message': f'Plan "{plan_name}" deleted successfully',
    })


# ============================================================================
# Payment Link Generation
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_payment_link(request):
    """
    Generate a Stripe Payment Link for products, events, or custom payments.

    Staff, coaches, and admins can generate payment links.
    """
    # Check permission
    if not can_collect_cash(request.user):
        return Response(
            {"error": "You don't have permission to generate payment links"},
            status=status.HTTP_403_FORBIDDEN
        )

    link_type = request.data.get('type')

    if not _stripe_key_configured():
        return Response(
            {"error": "Stripe is not configured"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    try:
        if link_type == 'product':
            product_id = request.data.get('product_id')
            if not product_id:
                return Response(
                    {"error": "product_id is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                product = Product.objects.get(pk=product_id, is_active=True)
            except Product.DoesNotExist:
                return Response(
                    {"error": "Product not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Create Stripe Payment Link
            payment_link = stripe.PaymentLink.create(
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'unit_amount': int(product.price * 100),
                        'product_data': {
                            'name': product.name,
                            'description': product.description[:500] if product.description else None,
                            'images': [product.primary_image_url] if product.primary_image_url else [],
                        },
                    },
                    'quantity': 1,
                }],
                metadata={
                    'type': 'product',
                    'product_id': str(product.id),
                    'generated_by': str(request.user.id),
                },
            )

            return Response({
                'url': payment_link.url,
                'id': payment_link.id,
            })

        elif link_type == 'event':
            event_id = request.data.get('event_id')
            if not event_id:
                return Response(
                    {"error": "event_id is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            from apps.events.models import Event
            try:
                event = Event.objects.get(pk=event_id, is_public=True)
            except Event.DoesNotExist:
                return Response(
                    {"error": "Event not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            if not event.price:
                return Response(
                    {"error": "Event does not have a price"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create Stripe Payment Link
            payment_link = stripe.PaymentLink.create(
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'unit_amount': int(event.price * 100),
                        'product_data': {
                            'name': f"{event.title} - Registration",
                            'description': event.description[:500] if event.description else None,
                        },
                    },
                    'quantity': 1,
                }],
                metadata={
                    'type': 'event',
                    'event_id': str(event.id),
                    'generated_by': str(request.user.id),
                },
            )

            return Response({
                'url': payment_link.url,
                'id': payment_link.id,
            })

        elif link_type == 'custom':
            title = request.data.get('title')
            description = request.data.get('description', '')
            amount = request.data.get('amount')

            if not title or not amount:
                return Response(
                    {"error": "title and amount are required for custom payments"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                amount = float(amount)
                if amount <= 0:
                    raise ValueError("Amount must be positive")
            except (ValueError, TypeError):
                return Response(
                    {"error": "Invalid amount"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create Stripe Payment Link
            payment_link = stripe.PaymentLink.create(
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'unit_amount': int(amount * 100),
                        'product_data': {
                            'name': title,
                            'description': description[:500] if description else None,
                        },
                    },
                    'quantity': 1,
                }],
                metadata={
                    'type': 'custom',
                    'title': title,
                    'generated_by': str(request.user.id),
                },
            )

            return Response({
                'url': payment_link.url,
                'id': payment_link.id,
            })

        else:
            return Response(
                {"error": "Invalid type. Must be 'product', 'event', or 'custom'"},
                status=status.HTTP_400_BAD_REQUEST
            )

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error generating payment link: {e}")
        return Response(
            {"error": f"Stripe error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Error generating payment link: {e}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
