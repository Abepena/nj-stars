from rest_framework import viewsets, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
import stripe

from .models import Product, SubscriptionPlan, Payment
from .serializers import ProductSerializer, SubscriptionPlanSerializer

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

        # TODO: Update event registration or order status based on metadata

    return HttpResponse(status=200)
