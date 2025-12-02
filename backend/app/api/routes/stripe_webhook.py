from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
import stripe
import logging
from app.core.config import settings
from app.core.database import get_db
from app.models import StripeOrder, OrderStatus, Product

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle Stripe webhook events with signature verification.

    This endpoint listens for checkout.session.completed events
    to update order status and inventory.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        logger.error("Missing Stripe signature header")
        raise HTTPException(status_code=400, detail="Missing signature")

    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=sig_header,
            secret=settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        logger.error(f"Invalid payload: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        logger.error(f"Invalid signature: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]

        # Extract session details
        session_id = session.get("id")
        amount_total = session.get("amount_total", 0) / 100  # Convert cents to dollars
        customer_email = session.get("customer_details", {}).get("email")
        payment_intent = session.get("payment_intent")
        metadata = session.get("metadata", {})

        logger.info(f"Payment succeeded for session: {session_id}")

        # Find or create order
        order = db.query(StripeOrder).filter(StripeOrder.session_id == session_id).first()

        if order:
            # Update existing order
            order.status = OrderStatus.COMPLETED
            order.customer_email = customer_email
            order.payment_intent = payment_intent
        else:
            # Create new order
            order = StripeOrder(
                session_id=session_id,
                status=OrderStatus.COMPLETED,
                amount_total=amount_total,
                customer_email=customer_email,
                payment_intent=payment_intent,
                metadata=str(metadata)
            )
            db.add(order)

        # Update inventory if product_id is in metadata
        product_id = metadata.get("product_id")
        quantity = int(metadata.get("quantity", 1))

        if product_id:
            product = db.query(Product).filter(Product.id == int(product_id)).first()
            if product:
                product.stock_quantity -= quantity
                logger.info(f"Updated inventory for product {product_id}: -{quantity}")

        db.commit()
        logger.info(f"Order {session_id} marked as completed")

    elif event["type"] == "checkout.session.expired":
        session = event["data"]["object"]
        session_id = session.get("id")

        # Mark order as failed
        order = db.query(StripeOrder).filter(StripeOrder.session_id == session_id).first()
        if order:
            order.status = OrderStatus.FAILED
            db.commit()
            logger.info(f"Order {session_id} marked as failed (expired)")

    elif event["type"] == "charge.refunded":
        charge = event["data"]["object"]
        payment_intent = charge.get("payment_intent")

        # Mark order as refunded
        order = db.query(StripeOrder).filter(
            StripeOrder.payment_intent == payment_intent
        ).first()
        if order:
            order.status = OrderStatus.REFUNDED
            db.commit()
            logger.info(f"Order for payment_intent {payment_intent} marked as refunded")

    else:
        logger.info(f"Unhandled event type: {event['type']}")

    return {"status": "success"}
