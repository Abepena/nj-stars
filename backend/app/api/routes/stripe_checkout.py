from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import stripe
from typing import Optional
from app.core.config import settings
from app.core.database import get_db
from app.models import Product, StripeOrder, OrderStatus

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter()


class CheckoutRequest(BaseModel):
    product_id: int
    quantity: int = 1
    success_url: str
    cancel_url: str


@router.post("/checkout/create-session")
async def create_checkout_session(
    checkout: CheckoutRequest,
    db: Session = Depends(get_db)
):
    """
    Create a Stripe Checkout Session for product purchase.

    Returns the session URL for frontend redirect.
    """
    # Validate product
    product = db.query(Product).filter(
        Product.id == checkout.product_id,
        Product.is_active == True
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.stock_quantity < checkout.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    try:
        # Create Stripe checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "unit_amount": int(product.price * 100),  # Convert to cents
                        "product_data": {
                            "name": product.name,
                            "description": product.description,
                            "images": [product.image_url] if product.image_url else [],
                        },
                    },
                    "quantity": checkout.quantity,
                },
            ],
            mode="payment",
            success_url=checkout.success_url,
            cancel_url=checkout.cancel_url,
            metadata={
                "product_id": str(product.id),
                "quantity": str(checkout.quantity),
            }
        )

        # Create pending order in database
        order = StripeOrder(
            session_id=session.id,
            status=OrderStatus.PENDING,
            amount_total=product.price * checkout.quantity,
            metadata=f'{{"product_id": {product.id}, "quantity": {checkout.quantity}}}'
        )
        db.add(order)
        db.commit()

        return {
            "session_id": session.id,
            "url": session.url
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
