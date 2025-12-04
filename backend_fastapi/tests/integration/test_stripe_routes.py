"""
Integration tests for Stripe API routes
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, Mock
from app.models import Product, StripeOrder, OrderStatus


@pytest.mark.integration
@pytest.mark.stripe
class TestStripeCheckoutRoutes:
    """Tests for Stripe checkout endpoints"""

    @patch("app.api.routes.stripe_checkout.stripe.checkout.Session.create")
    def test_create_checkout_session_success(self, mock_stripe_create, client: TestClient, sample_product: Product):
        """Test successfully creating a Stripe checkout session"""
        mock_session = Mock()
        mock_session.id = "cs_test_123"
        mock_session.url = "https://checkout.stripe.com/test"
        mock_stripe_create.return_value = mock_session

        payload = {
            "product_id": sample_product.id,
            "quantity": 1,
            "success_url": "http://localhost:3000/success",
            "cancel_url": "http://localhost:3000/cancel",
        }

        response = client.post("/api/v1/stripe/checkout/create-session", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == "cs_test_123"
        assert data["url"] == "https://checkout.stripe.com/test"

    def test_create_checkout_session_product_not_found(self, client: TestClient, db: Session):
        """Test checkout with non-existent product"""
        payload = {
            "product_id": 9999,
            "quantity": 1,
            "success_url": "http://localhost:3000/success",
            "cancel_url": "http://localhost:3000/cancel",
        }

        response = client.post("/api/v1/stripe/checkout/create-session", json=payload)

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_create_checkout_session_insufficient_stock(self, client: TestClient, out_of_stock_product: Product):
        """Test checkout with insufficient stock"""
        payload = {
            "product_id": out_of_stock_product.id,
            "quantity": 1,
            "success_url": "http://localhost:3000/success",
            "cancel_url": "http://localhost:3000/cancel",
        }

        response = client.post("/api/v1/stripe/checkout/create-session", json=payload)

        assert response.status_code == 400
        assert "stock" in response.json()["detail"].lower()

    @patch("app.api.routes.stripe_checkout.stripe.checkout.Session.create")
    def test_create_checkout_creates_pending_order(
        self, mock_stripe_create, client: TestClient, db: Session, sample_product: Product
    ):
        """Test that creating checkout creates a pending order in database"""
        mock_session = Mock()
        mock_session.id = "cs_test_pending"
        mock_session.url = "https://checkout.stripe.com/test"
        mock_stripe_create.return_value = mock_session

        payload = {
            "product_id": sample_product.id,
            "quantity": 2,
            "success_url": "http://localhost:3000/success",
            "cancel_url": "http://localhost:3000/cancel",
        }

        response = client.post("/api/v1/stripe/checkout/create-session", json=payload)

        assert response.status_code == 200

        # Check order was created
        order = db.query(StripeOrder).filter(StripeOrder.session_id == "cs_test_pending").first()
        assert order is not None
        assert order.status == OrderStatus.PENDING
        assert order.amount_total == sample_product.price * 2


@pytest.mark.integration
@pytest.mark.stripe
class TestStripeWebhookRoutes:
    """Tests for Stripe webhook endpoints"""

    def test_webhook_missing_signature(self, client: TestClient):
        """Test webhook rejects requests without signature"""
        response = client.post("/api/v1/webhooks/stripe", json={})

        assert response.status_code == 400
        assert "signature" in response.json()["detail"].lower()

    @patch("app.api.routes.stripe_webhook.stripe.Webhook.construct_event")
    def test_webhook_invalid_signature(self, mock_construct, client: TestClient):
        """Test webhook rejects invalid signatures"""
        from stripe.error import SignatureVerificationError

        mock_construct.side_effect = SignatureVerificationError("Invalid signature", "sig_header")

        response = client.post(
            "/api/v1/webhooks/stripe", json={}, headers={"stripe-signature": "invalid_sig"}
        )

        assert response.status_code == 400

    @patch("app.api.routes.stripe_webhook.stripe.Webhook.construct_event")
    def test_webhook_checkout_completed(self, mock_construct, client: TestClient, db: Session, sample_product: Product):
        """Test webhook handling checkout.session.completed event"""
        # Create a pending order first
        order = StripeOrder(
            session_id="cs_test_webhook",
            status=OrderStatus.PENDING,
            amount_total=49.99,
            currency="usd",
            metadata=f'{{"product_id": {sample_product.id}, "quantity": 1}}',
        )
        db.add(order)
        db.commit()

        initial_stock = sample_product.stock_quantity

        # Mock Stripe event
        mock_event = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_webhook",
                    "amount_total": 4999,
                    "customer_details": {"email": "webhook@test.com"},
                    "payment_intent": "pi_test_webhook",
                    "metadata": {"product_id": str(sample_product.id), "quantity": "1"},
                }
            },
        }
        mock_construct.return_value = mock_event

        response = client.post(
            "/api/v1/webhooks/stripe", json={}, headers={"stripe-signature": "valid_sig"}
        )

        assert response.status_code == 200
        assert response.json()["status"] == "success"

        # Verify order was updated
        db.refresh(order)
        assert order.status == OrderStatus.COMPLETED
        assert order.customer_email == "webhook@test.com"
        assert order.payment_intent == "pi_test_webhook"

        # Verify inventory was updated
        db.refresh(sample_product)
        assert sample_product.stock_quantity == initial_stock - 1

    @patch("app.api.routes.stripe_webhook.stripe.Webhook.construct_event")
    def test_webhook_checkout_expired(self, mock_construct, client: TestClient, db: Session):
        """Test webhook handling checkout.session.expired event"""
        order = StripeOrder(
            session_id="cs_test_expired",
            status=OrderStatus.PENDING,
            amount_total=49.99,
            currency="usd",
        )
        db.add(order)
        db.commit()

        mock_event = {
            "type": "checkout.session.expired",
            "data": {"object": {"id": "cs_test_expired"}},
        }
        mock_construct.return_value = mock_event

        response = client.post(
            "/api/v1/webhooks/stripe", json={}, headers={"stripe-signature": "valid_sig"}
        )

        assert response.status_code == 200

        db.refresh(order)
        assert order.status == OrderStatus.FAILED

    @patch("app.api.routes.stripe_webhook.stripe.Webhook.construct_event")
    def test_webhook_charge_refunded(self, mock_construct, client: TestClient, db: Session, completed_order: StripeOrder):
        """Test webhook handling charge.refunded event"""
        mock_event = {
            "type": "charge.refunded",
            "data": {"object": {"payment_intent": completed_order.payment_intent}},
        }
        mock_construct.return_value = mock_event

        response = client.post(
            "/api/v1/webhooks/stripe", json={}, headers={"stripe-signature": "valid_sig"}
        )

        assert response.status_code == 200

        db.refresh(completed_order)
        assert completed_order.status == OrderStatus.REFUNDED

    @patch("app.api.routes.stripe_webhook.stripe.Webhook.construct_event")
    def test_webhook_unhandled_event_type(self, mock_construct, client: TestClient):
        """Test webhook handles unknown event types gracefully"""
        mock_event = {
            "type": "customer.created",
            "data": {"object": {}},
        }
        mock_construct.return_value = mock_event

        response = client.post(
            "/api/v1/webhooks/stripe", json={}, headers={"stripe-signature": "valid_sig"}
        )

        assert response.status_code == 200
        assert response.json()["status"] == "success"
