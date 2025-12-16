"""
Printify API Client for Print-on-Demand Integration

This client handles communication with Printify's REST API for:
- Creating orders after Stripe payment
- Calculating shipping costs
- Checking order status
- Receiving webhook events for tracking updates

API Documentation: https://developers.printify.com/

Payment Flow:
1. Customer pays via Stripe → funds go to your account
2. Order is submitted to Printify via this API
3. Printify charges YOUR saved payment method for production + shipping
4. Printify fulfills and ships the order
5. Webhooks update order status with tracking info
"""

import logging
import requests
from typing import Optional, Any
from django.conf import settings

logger = logging.getLogger(__name__)


class PrintifyError(Exception):
    """Base exception for Printify API errors"""

    def __init__(self, message: str, status_code: Optional[int] = None, response: Optional[dict] = None):
        self.message = message
        self.status_code = status_code
        self.response = response
        super().__init__(self.message)


class PrintifyClient:
    """
    Client for Printify REST API v1

    Usage:
        client = PrintifyClient()
        shipping = client.calculate_shipping(line_items, address)
        order = client.create_order(external_id, line_items, address)
    """

    BASE_URL = "https://api.printify.com/v1"

    def __init__(self, api_key: Optional[str] = None, shop_id: Optional[str] = None):
        """
        Initialize the Printify client.

        Args:
            api_key: Printify API key (defaults to settings.PRINTIFY_API_KEY)
            shop_id: Printify shop ID (defaults to settings.PRINTIFY_SHOP_ID)
        """
        self.api_key = api_key or getattr(settings, 'PRINTIFY_API_KEY', '')
        self.shop_id = shop_id or getattr(settings, 'PRINTIFY_SHOP_ID', '')

        if not self.api_key:
            logger.warning("PRINTIFY_API_KEY not configured")
        if not self.shop_id:
            logger.warning("PRINTIFY_SHOP_ID not configured")

    @property
    def headers(self) -> dict:
        """Get headers for API requests"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json;charset=utf-8",
            "Accept": "application/json",
        }

    @property
    def is_configured(self) -> bool:
        """Check if the client is properly configured"""
        return bool(self.api_key and self.shop_id)

    def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[dict] = None,
        params: Optional[dict] = None,
    ) -> dict:
        """
        Make a request to the Printify API.

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint (e.g., /orders.json)
            data: JSON body data
            params: Query parameters

        Returns:
            Response JSON as dict

        Raises:
            PrintifyError: If the request fails
        """
        if not self.is_configured:
            raise PrintifyError("Printify API not configured. Set PRINTIFY_API_KEY and PRINTIFY_SHOP_ID.")

        url = f"{self.BASE_URL}/shops/{self.shop_id}{endpoint}"

        try:
            response = requests.request(
                method=method,
                url=url,
                headers=self.headers,
                json=data,
                params=params,
                timeout=30,
            )

            # Log the request (without sensitive data)
            logger.info(f"Printify API {method} {endpoint} - Status: {response.status_code}")

            # Handle error responses
            if response.status_code >= 400:
                error_data = response.json() if response.content else {}
                error_message = error_data.get('message', f"HTTP {response.status_code}")
                logger.error(f"Printify API error: {error_message}")
                raise PrintifyError(
                    message=error_message,
                    status_code=response.status_code,
                    response=error_data,
                )

            return response.json() if response.content else {}

        except requests.RequestException as e:
            logger.error(f"Printify API request failed: {str(e)}")
            raise PrintifyError(f"Request failed: {str(e)}")

    # -------------------------------------------------------------------------
    # Order Methods
    # -------------------------------------------------------------------------

    def create_order(
        self,
        external_id: str,
        line_items: list[dict],
        address: dict,
        shipping_method: int = 1,
        send_shipping_notification: bool = True,
    ) -> dict:
        """
        Create an order in Printify.

        The order will be placed in "on-hold" status by default.
        Call send_to_production() to start fulfillment.

        Args:
            external_id: Your unique order identifier (e.g., Django Order ID)
            line_items: List of items to order, each with:
                - product_id: Printify product ID
                - variant_id: Printify variant ID
                - quantity: Number of items
            address: Shipping address with:
                - first_name, last_name, email, phone
                - address1, address2 (optional), city, zip, country, region
            shipping_method: Shipping method ID (1 = standard)
            send_shipping_notification: Email customer when shipped

        Returns:
            Order data from Printify including order ID

        Example:
            order = client.create_order(
                external_id="NJS-ABC123",
                line_items=[
                    {"product_id": "abc123", "variant_id": 12345, "quantity": 2}
                ],
                address={
                    "first_name": "John",
                    "last_name": "Doe",
                    "email": "john@example.com",
                    "phone": "555-1234",
                    "address1": "123 Main St",
                    "city": "Newark",
                    "zip": "07102",
                    "country": "US",
                    "region": "NJ",
                }
            )
        """
        data = {
            "external_id": external_id,
            "line_items": line_items,
            "shipping_method": shipping_method,
            "send_shipping_notification": send_shipping_notification,
            "address_to": address,
        }

        logger.info(f"Creating Printify order for external_id: {external_id}")
        return self._request("POST", "/orders.json", data=data)

    def get_order(self, order_id: str) -> dict:
        """
        Get details for a specific order.

        Args:
            order_id: Printify order ID

        Returns:
            Order data including status, tracking info, etc.
        """
        return self._request("GET", f"/orders/{order_id}.json")

    def list_orders(self, status: Optional[str] = None, limit: int = 10) -> dict:
        """
        List orders from the shop.

        Args:
            status: Filter by status (on-hold, pending, fulfilled, canceled)
            limit: Number of orders to return

        Returns:
            List of orders
        """
        params = {"limit": limit}
        if status:
            params["status"] = status
        return self._request("GET", "/orders.json", params=params)

    def send_to_production(self, order_id: str) -> dict:
        """
        Send an order to production (starts fulfillment).

        This triggers Printify to charge your payment method.

        Args:
            order_id: Printify order ID

        Returns:
            Updated order data
        """
        logger.info(f"Sending order {order_id} to production")
        return self._request("POST", f"/orders/{order_id}/send_to_production.json")

    def cancel_order(self, order_id: str) -> dict:
        """
        Cancel an order (only works for on-hold or payment-not-received status).

        Args:
            order_id: Printify order ID

        Returns:
            Canceled order data
        """
        logger.info(f"Canceling order {order_id}")
        return self._request("POST", f"/orders/{order_id}/cancel.json")

    # -------------------------------------------------------------------------
    # Shipping Methods
    # -------------------------------------------------------------------------

    def calculate_shipping(
        self,
        line_items: list[dict],
        address: dict,
    ) -> dict:
        """
        Calculate shipping costs for an order.

        Args:
            line_items: List of items, each with:
                - product_id: Printify product ID
                - variant_id: Printify variant ID
                - quantity: Number of items
            address: Destination address with at minimum:
                - country (2-letter code, e.g., "US")
                - zip (postal code)

        Returns:
            Shipping options with costs in cents, e.g.:
            {
                "standard": 399,  # $3.99
                "express": 799,   # $7.99
            }
        """
        data = {
            "line_items": line_items,
            "address_to": address,
        }

        logger.info(f"Calculating shipping to {address.get('country', 'unknown')}")
        return self._request("POST", "/orders/shipping.json", data=data)

    # -------------------------------------------------------------------------
    # Product Methods (for future catalog sync)
    # -------------------------------------------------------------------------

    def get_product(self, product_id: str) -> dict:
        """
        Get details for a specific product.

        Args:
            product_id: Printify product ID

        Returns:
            Product data including variants, images, etc.
        """
        return self._request("GET", f"/products/{product_id}.json")

    def list_products(self, limit: int = 50) -> dict:
        """
        List all products in the shop.

        Args:
            limit: Number of products to return

        Returns:
            List of products
        """
        return self._request("GET", "/products.json", params={"limit": limit})

    def get_products(self) -> list:
        """
        Get all products from the shop.

        Returns:
            List of product data
        """
        result = self.list_products(limit=50)
        return result.get('data', [])

    def publish_product(self, product_id: str) -> dict:
        """
        Publish a product to the shop.

        This makes the product available for ordering via API.

        Args:
            product_id: Printify product ID

        Returns:
            Empty dict on success

        Note:
            The publish endpoint triggers the product:publish:started webhook
            which will auto-sync the product to our database.
        """
        data = {
            'title': True,
            'description': True,
            'images': True,
            'variants': True,
            'tags': True,
            'keyFeatures': True,
            'shipping_template': True,
        }

        logger.info(f"Publishing Printify product: {product_id}")
        return self._request("POST", f"/products/{product_id}/publish.json", data=data)

    def unpublish_product(self, product_id: str) -> dict:
        """
        Unpublish a product from the shop.

        Args:
            product_id: Printify product ID

        Returns:
            Empty dict on success
        """
        logger.info(f"Unpublishing Printify product: {product_id}")
        return self._request("POST", f"/products/{product_id}/unpublish.json")

    # -------------------------------------------------------------------------
    # Webhook Verification (for future webhook handling)
    # -------------------------------------------------------------------------

    @staticmethod
    def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
        """
        Verify a webhook signature from Printify.

        Note: Printify uses a simple shared secret for webhook verification.
        The signature is typically sent in the X-Printify-Signature header.

        Args:
            payload: Raw request body
            signature: Signature from header
            secret: Your webhook secret from Printify dashboard

        Returns:
            True if signature is valid
        """
        import hmac
        import hashlib

        expected = hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected, signature)


# Singleton instance for easy access
_client: Optional[PrintifyClient] = None


def get_printify_client() -> PrintifyClient:
    """
    Get the singleton Printify client instance.

    Usage:
        from apps.payments.services import get_printify_client
        client = get_printify_client()
        shipping = client.calculate_shipping(...)
    """
    global _client
    if _client is None:
        _client = PrintifyClient()
    return _client
