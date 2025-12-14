# Printify API Documentation (NJ Stars Integration)

> **Last Updated:** December 2025
> **API Version:** v1 (with v2 Catalog endpoints)
> **Official Docs:** https://developers.printify.com/

This documentation is tailored to the NJ Stars codebase with ready-to-use code snippets following our existing `PrintifyClient` patterns.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication & Rate Limits](#authentication--rate-limits)
3. [Integration Architecture](#integration-architecture)
4. [API Reference](#api-reference)
   - [Orders API](#orders-api)
   - [Products API](#products-api)
   - [Catalog/Blueprints API](#catalogblueprints-api)
   - [Uploads API](#uploads-api)
   - [Shipping API](#shipping-api)
   - [Shops API](#shops-api)
   - [Webhooks](#webhooks)
5. [Implemented Flows](#implemented-flows)
6. [Unimplemented Features](#unimplemented-features-with-examples)
7. [#TODO: Interactive HTML Reference](#todo-interactive-html-reference)

---

## Quick Start

### Environment Variables

```bash
# .env / Railway
PRINTIFY_API_KEY=your_personal_access_token
PRINTIFY_SHOP_ID=your_shop_id
PRINTIFY_WEBHOOK_SECRET=your_webhook_secret
PRINTIFY_DRY_RUN=true  # Dev only - skips real API calls
```

### Basic Usage

```python
from apps.payments.services import get_printify_client

client = get_printify_client()

# Check if configured
if client.is_configured:
    products = client.get_products()
```

### Where Code Lives

| Component | Location |
|-----------|----------|
| API Client | `backend/apps/payments/services/printify_client.py` |
| Sync Service | `backend/apps/payments/services/printify_sync.py` |
| Webhook Handler | `backend/apps/payments/views.py` → `printify_webhook()` |
| Admin Endpoints | `/api/payments/admin/printify/*` |
| Management Commands | `sync_printify_variants`, `import_printify_products` |
| Frontend Admin | `frontend/src/app/portal/admin/printify/page.tsx` |

---

## Authentication & Rate Limits

### Authentication

All requests require a Bearer token in the `Authorization` header:

```python
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json;charset=utf-8",
    "User-Agent": "NJStars/1.0",  # Recommended by Printify
}
```

### Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Global | 600 requests | per minute |
| Catalog endpoints | 100 requests | per minute |
| Product publishing | 200 requests | per 30 minutes |
| Error threshold | 5% of total traffic | - |

```python
# Example: Rate limit handler (not yet implemented)
from time import sleep

def rate_limited_request(client, method, *args, **kwargs):
    """Wrapper with exponential backoff for rate limits."""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            return getattr(client, method)(*args, **kwargs)
        except PrintifyError as e:
            if e.status_code == 429:
                wait_time = 2 ** attempt * 10  # 10s, 20s, 40s
                logger.warning(f"Rate limited, waiting {wait_time}s...")
                sleep(wait_time)
            else:
                raise
    raise PrintifyError("Max retries exceeded for rate limit")
```

---

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER CHECKOUT                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  1. Stripe Payment                                                   │
│     - Customer pays → funds go to YOUR Stripe account               │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. Order Submission (views.py → _submit_printify_order)            │
│     - Separate POD items from local-delivery items                  │
│     - Call client.create_order() with line items + address          │
│     - Store printify_order_id on Order model                        │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. Send to Production                                               │
│     - client.send_to_production(order_id)                           │
│     - Printify charges YOUR saved payment method                    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  4. Fulfillment & Webhooks                                          │
│     - order:sent-to-production → status = 'processing'              │
│     - order:shipment:created   → tracking info saved                │
│     - order:shipment:delivered → status = 'delivered'               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## API Reference

### Orders API

#### Create Order

```python
# POST /v1/shops/{shop_id}/orders.json
order = client.create_order(
    external_id="NJS-ABC123",  # Your Django order number
    line_items=[
        {
            "product_id": "693b573a9164dbdf170252cd",
            "variant_id": 87654,
            "quantity": 2
        }
    ],
    address={
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "phone": "555-123-4567",
        "address1": "123 Main St",
        "address2": "Apt 4B",  # Optional
        "city": "Newark",
        "zip": "07102",
        "country": "US",
        "region": "NJ",
    },
    shipping_method=1,  # 1=standard, 2=priority, 3=express, 4=economy
    send_shipping_notification=True,
)
# Returns: {"id": "printify_order_id", "status": "on-hold", ...}
```

#### Get Order Details

```python
# GET /v1/shops/{shop_id}/orders/{order_id}.json
order_data = client.get_order("64f8a7b123456789")

# Response includes:
# - status: on-hold, pending, in-production, fulfilled, canceled
# - shipments: [{tracking_number, tracking_url, carrier}]
# - costs: {subtotal, shipping, tax, total}  # YOUR costs, not retail
# - print_provider_id: Which fulfillment partner
```

#### List Orders

```python
# GET /v1/shops/{shop_id}/orders.json
orders = client.list_orders(
    status="fulfilled",  # Filter: on-hold, pending, fulfilled, canceled
    limit=50,
)
```

#### Send to Production

```python
# POST /v1/shops/{shop_id}/orders/{order_id}/send_to_production.json
# This CHARGES your Printify payment method
client.send_to_production("64f8a7b123456789")
```

#### Cancel Order

```python
# POST /v1/shops/{shop_id}/orders/{order_id}/cancel.json
# Only works for on-hold or payment-not-received status
client.cancel_order("64f8a7b123456789")
```

#### Order Status Values

| Status | Description |
|--------|-------------|
| `on-hold` | Created, awaiting send_to_production |
| `pending` | Payment processing |
| `sending-to-production` | Being sent to print provider |
| `in-production` | Being printed/manufactured |
| `has-issues` | Problem with order (check details) |
| `canceled` | Order canceled |
| `fulfilled` | All items shipped |
| `partially-fulfilled` | Some items shipped |

---

### Products API

#### List Products

```python
# GET /v1/shops/{shop_id}/products.json
products = client.list_products(limit=100)
# Returns: {"current_page": 1, "data": [...], "total": 50}
```

#### Get Single Product

```python
# GET /v1/shops/{shop_id}/products/{product_id}.json
product = client.get_product("693b573a9164dbdf170252cd")

# Response structure:
{
    "id": "693b573a9164dbdf170252cd",
    "title": "NJ Stars Jersey",
    "description": "...",
    "tags": ["basketball", "jersey"],
    "options": [
        {"name": "Colors", "type": "color", "values": [...]},
        {"name": "Sizes", "type": "size", "values": [...]}
    ],
    "variants": [
        {
            "id": 87654,
            "sku": "NJS-JERSEY-BLK-M",
            "cost": 1299,  # Your cost in cents ($12.99)
            "price": 2999,  # Retail price in cents ($29.99)
            "title": "Black / M",
            "options": [0, 1],  # Indexes into options arrays
            "is_enabled": True,
            "is_available": True,
        }
    ],
    "images": [
        {
            "src": "https://images.printify.com/...",
            "variant_ids": [87654, 87655],
            "position": "front",
            "is_default": True,
        }
    ],
    "print_provider_id": 99,
    "blueprint_id": 145,
    "visible": True,
}
```

#### Publish Product

```python
# POST /v1/shops/{shop_id}/products/{product_id}/publish.json
client.publish_product("693b573a9164dbdf170252cd")

# Request body (what we send):
{
    "title": True,
    "description": True,
    "images": True,
    "variants": True,
    "tags": True,
    "keyFeatures": True,
    "shipping_template": True,
}
```

#### Unpublish Product

```python
# POST /v1/shops/{shop_id}/products/{product_id}/unpublish.json
client.unpublish_product("693b573a9164dbdf170252cd")
```

#### Mark Publishing Succeeded/Failed

```python
# POST /v1/shops/{shop_id}/products/{product_id}/publishing_succeeded.json
# POST /v1/shops/{shop_id}/products/{product_id}/publishing_failed.json
# Used after receiving product:publish:started webhook
```

---

### Catalog/Blueprints API

The Catalog API lets you browse available product types (blueprints), print providers, and variants. **Note:** These are shop-agnostic endpoints that don't require a shop_id.

#### List All Blueprints

```python
# GET /v1/catalog/blueprints.json
def list_blueprints(self) -> list:
    """List all available product blueprints (t-shirts, hoodies, etc.)"""
    url = f"{self.BASE_URL}/catalog/blueprints.json"
    response = requests.get(url, headers=self.headers, timeout=30)
    return response.json()

# Response example:
[
    {
        "id": 145,
        "title": "Unisex Jersey Short Sleeve Tee",
        "description": "This classic unisex jersey short sleeve tee...",
        "brand": "Bella+Canvas",
        "model": "3001",
        "images": ["https://images.printify.com/..."]
    },
    ...
]
```

#### Get Blueprint Details

```python
# GET /v1/catalog/blueprints/{blueprint_id}.json
def get_blueprint(self, blueprint_id: int) -> dict:
    url = f"{self.BASE_URL}/catalog/blueprints/{blueprint_id}.json"
    response = requests.get(url, headers=self.headers, timeout=30)
    return response.json()
```

#### List Print Providers for Blueprint

```python
# GET /v1/catalog/blueprints/{blueprint_id}/print_providers.json
def get_blueprint_providers(self, blueprint_id: int) -> list:
    """Get available print providers for a specific blueprint."""
    url = f"{self.BASE_URL}/catalog/blueprints/{blueprint_id}/print_providers.json"
    response = requests.get(url, headers=self.headers, timeout=30)
    return response.json()

# Response:
[
    {
        "id": 99,
        "title": "Printify Choice",
        "location": {"country": "US", "region": "CA"}
    },
    {
        "id": 27,
        "title": "Monster Digital",
        "location": {"country": "US", "region": "TX"}
    }
]
```

#### Get Variants for Blueprint + Provider

```python
# GET /v1/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/variants.json
def get_provider_variants(self, blueprint_id: int, provider_id: int) -> dict:
    """Get available variants (sizes/colors) for a blueprint from a specific provider."""
    url = f"{self.BASE_URL}/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/variants.json"
    response = requests.get(url, headers=self.headers, timeout=30)
    return response.json()

# Response:
{
    "id": 99,
    "variants": [
        {
            "id": 17867,
            "title": "Athletic Heather / S",
            "options": {"color": "Athletic Heather", "size": "S"},
            "placeholders": [
                {"position": "front", "width": 3995, "height": 4421}
            ]
        }
    ]
}
```

#### Get Shipping Info for Blueprint + Provider

```python
# GET /v1/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/shipping.json
def get_provider_shipping(self, blueprint_id: int, provider_id: int) -> dict:
    """Get shipping costs for a blueprint from a specific provider."""
    url = f"{self.BASE_URL}/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/shipping.json"
    response = requests.get(url, headers=self.headers, timeout=30)
    return response.json()

# Response:
{
    "handling_time": {
        "value": 3,
        "unit": "day"
    },
    "profiles": [
        {
            "variant_ids": [17867, 17868, ...],
            "first_item": {"currency": "USD", "cost": 399},
            "additional_items": {"currency": "USD", "cost": 199},
            "countries": ["US"]
        }
    ]
}
```

---

### Uploads API

Upload images for use in product designs. **Note:** These are account-level endpoints (no shop_id).

#### Upload Image via URL

```python
# POST /v1/uploads/images.json
def upload_image_url(self, image_url: str, filename: str) -> dict:
    """Upload an image from a URL for use in product designs."""
    url = f"{self.BASE_URL}/uploads/images.json"
    data = {
        "file_name": filename,
        "url": image_url,
    }
    response = requests.post(url, headers=self.headers, json=data, timeout=60)
    return response.json()

# Response:
{
    "id": "5d15ca38b3a3c3000930b547",
    "file_name": "nj-stars-logo.png",
    "height": 2000,
    "width": 2000,
    "size": 524288,
    "mime_type": "image/png",
    "preview_url": "https://images.printify.com/...",
    "upload_time": "2024-01-15T10:30:00Z"
}
```

#### Upload Image via Base64

```python
# POST /v1/uploads/images.json
import base64

def upload_image_base64(self, file_path: str, filename: str) -> dict:
    """Upload an image from local file as base64."""
    with open(file_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")

    url = f"{self.BASE_URL}/uploads/images.json"
    data = {
        "file_name": filename,
        "contents": image_data,
    }
    response = requests.post(url, headers=self.headers, json=data, timeout=120)
    return response.json()
```

#### List Uploaded Images

```python
# GET /v1/uploads.json
def list_uploads(self, limit: int = 100) -> dict:
    """List all uploaded images."""
    url = f"{self.BASE_URL}/uploads.json"
    params = {"limit": limit}
    response = requests.get(url, headers=self.headers, params=params, timeout=30)
    return response.json()
```

#### Get Upload Details

```python
# GET /v1/uploads/{image_id}.json
def get_upload(self, image_id: str) -> dict:
    url = f"{self.BASE_URL}/uploads/{image_id}.json"
    response = requests.get(url, headers=self.headers, timeout=30)
    return response.json()
```

#### Archive Upload

```python
# POST /v1/uploads/{image_id}/archive.json
def archive_upload(self, image_id: str) -> dict:
    url = f"{self.BASE_URL}/uploads/{image_id}/archive.json"
    response = requests.post(url, headers=self.headers, timeout=30)
    return response.json()
```

---

### Shipping API

#### Calculate Shipping for Order

```python
# POST /v1/shops/{shop_id}/orders/shipping.json
quote = client.calculate_shipping(
    line_items=[
        {"product_id": "693b573a9164dbdf170252cd", "variant_id": 87654, "quantity": 2},
    ],
    address={
        "country": "US",
        "zip": "07102",
        "region": "NJ",  # Optional but improves accuracy
    },
)

# Response:
{
    "standard": 399,   # $3.99 in cents
    "express": 1299,   # $12.99 (if available)
}
```

#### V2 Shipping Methods (More Detail)

```python
# GET /v2/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/shipping.json
def get_shipping_methods_v2(self, blueprint_id: int, provider_id: int) -> dict:
    """Get detailed shipping method info from V2 API."""
    url = f"https://api.printify.com/v2/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/shipping.json"
    response = requests.get(url, headers=self.headers, timeout=30)
    return response.json()

# GET /v2/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/shipping/{type}.json
# type: standard, priority, express, economy
def get_shipping_type_v2(self, blueprint_id: int, provider_id: int, shipping_type: str) -> dict:
    url = f"https://api.printify.com/v2/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/shipping/{shipping_type}.json"
    response = requests.get(url, headers=self.headers, timeout=30)
    return response.json()
```

#### Shipping Method Codes

| Code | Method | Description |
|------|--------|-------------|
| 1 | Standard | Regular shipping (default) |
| 2 | Priority | Faster delivery |
| 3 | Printify Express | Same-day processing, fastest option |
| 4 | Economy | Cheapest, slower delivery |

---

### Shops API

#### List Shops

```python
# GET /v1/shops.json
def list_shops(self) -> list:
    """List all shops connected to this account."""
    url = f"{self.BASE_URL}/shops.json"
    response = requests.get(url, headers=self.headers, timeout=30)
    return response.json()

# Response:
[
    {
        "id": 12345,
        "title": "NJ Stars Elite",
        "sales_channel": "custom"
    }
]
```

#### Disconnect Shop

```python
# DELETE /v1/shops/{shop_id}/connection.json
def disconnect_shop(self, shop_id: str) -> dict:
    url = f"{self.BASE_URL}/shops/{shop_id}/connection.json"
    response = requests.delete(url, headers=self.headers, timeout=30)
    return response.json()
```

---

### Webhooks

#### Webhook Events

| Event | Description | Our Handler |
|-------|-------------|-------------|
| `product:publish:started` | Product publishing initiated | Auto-creates Product, syncs variants |
| `product:deleted` | Product removed from Printify | Marks product as inactive |
| `order:created` | Order created in Printify | (not currently used) |
| `order:sent-to-production` | Order sent to fulfillment | Status → 'processing' |
| `order:shipment:created` | Tracking info available | Saves tracking number/URL |
| `order:shipment:delivered` | Package delivered | Status → 'delivered' |
| `shop:disconnected` | Shop disconnected from account | (not implemented) |

#### Webhook Payload Structure

```json
{
    "type": "order:shipment:created",
    "resource": {
        "id": "64f8a7b123456789",
        "type": "order",
        "data": {
            "status": "fulfilled",
            "shipments": [
                {
                    "carrier": "USPS",
                    "number": "9400111899223456789012",
                    "url": "https://tools.usps.com/..."
                }
            ]
        }
    }
}
```

#### Signature Verification

```python
import hmac
import hashlib

def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:
    """Verify Printify webhook signature."""
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

# In webhook view:
signature = request.headers.get("X-Pfy-Signature") or request.headers.get("X-Printify-Signature")
if not verify_webhook(request.body, signature, settings.PRINTIFY_WEBHOOK_SECRET):
    logger.warning("Invalid webhook signature")
```

#### Register Webhook

```python
# POST /v1/shops/{shop_id}/webhooks.json
def create_webhook(self, topic: str, url: str) -> dict:
    """Register a webhook subscription."""
    endpoint = f"/webhooks.json"
    data = {
        "topic": topic,
        "url": url,
        "secret": settings.PRINTIFY_WEBHOOK_SECRET,
    }
    return self._request("POST", endpoint, data=data)

# Example:
client.create_webhook(
    topic="order:shipment:created",
    url="https://api.njstarselite.com/api/payments/webhook/printify/"
)
```

#### List/Delete Webhooks

```python
# GET /v1/shops/{shop_id}/webhooks.json
def list_webhooks(self) -> list:
    return self._request("GET", "/webhooks.json")

# DELETE /v1/shops/{shop_id}/webhooks/{webhook_id}.json
def delete_webhook(self, webhook_id: str) -> dict:
    return self._request("DELETE", f"/webhooks/{webhook_id}.json")
```

---

## Implemented Flows

These flows are already working in the codebase:

### 1. Checkout with POD Items

```python
# Location: backend/apps/payments/views.py → _submit_printify_order()

# After Stripe payment succeeds:
def _submit_printify_order(order, pod_items):
    client = get_printify_client()

    # Build line items from OrderItems
    line_items = [
        {
            "product_id": item.product.printify_product_id,
            "variant_id": item.variant.printify_variant_id,
            "quantity": item.quantity,
        }
        for item in pod_items
    ]

    # Submit to Printify
    result = client.create_order(
        external_id=order.order_number,
        line_items=line_items,
        address={...},
    )

    # Store Printify order ID
    order.printify_order_id = result["id"]
    order.save()

    # Auto-send to production (charges Printify account)
    client.send_to_production(result["id"])
```

### 2. Product Sync from Printify

```python
# Location: backend/apps/payments/services/printify_sync.py

from apps.payments.services.printify_sync import sync_product_variants, sync_product_images

# Sync a single product's variants
product = Product.objects.get(slug="nj-stars-jersey")
printify_data = client.get_product(product.printify_product_id)
stats = sync_product_variants(product)
sync_product_images(product, printify_data)

# CLI: python manage.py sync_printify_variants --product=nj-stars-jersey
```

### 3. Webhook Processing

```python
# Location: backend/apps/payments/views.py → printify_webhook()

# order:shipment:created webhook updates tracking:
order = Order.objects.get(printify_order_id=order_id)
order.tracking_number = shipment["number"]
order.tracking_url = shipment["url"]
order.status = "shipped"
order.save()
```

### 4. Admin Product Management

```python
# Endpoints:
# POST /api/payments/admin/printify/publish/   → Publish to Printify
# POST /api/payments/admin/printify/unpublish/ → Unpublish
# POST /api/payments/admin/printify/sync/      → Sync product to database
# GET  /api/payments/admin/printify/products/  → List all Printify products
```

---

## Unimplemented Features (with Examples)

These features are available in the Printify API but not yet integrated into NJ Stars:

### 1. Image Uploads API

Upload team logos and designs programmatically instead of through Printify dashboard.

```python
# Add to printify_client.py:

def upload_design(self, image_url: str, name: str) -> dict:
    """
    Upload a design image for use in products.

    Args:
        image_url: Public URL of the image
        name: Filename for the upload

    Returns:
        Upload data including the image ID for use in product creation
    """
    url = f"{self.BASE_URL}/uploads/images.json"
    data = {
        "file_name": name,
        "url": image_url,
    }
    response = requests.post(url, headers=self.headers, json=data, timeout=60)
    if response.status_code >= 400:
        raise PrintifyError(f"Upload failed: {response.text}", response.status_code)
    return response.json()

# Usage:
client = get_printify_client()
upload = client.upload_design(
    image_url="https://njstarselite.com/media/logos/team-logo-2024.png",
    name="nj-stars-2024-logo.png"
)
# upload["id"] can be used in product print_areas
```

**Use case:** When Kenneth uploads a new team logo, automatically push it to Printify for use in new product designs.

---

### 2. Catalog Browser / Product Discovery

Browse available product types to add new merch offerings.

```python
# Add to printify_client.py:

def browse_catalog(self, category: str = None) -> list:
    """
    List all available product blueprints.
    Filter by category like 't-shirts', 'hoodies', 'accessories'.
    """
    url = f"{self.BASE_URL}/catalog/blueprints.json"
    response = requests.get(url, headers=self.headers, timeout=30)
    blueprints = response.json()

    if category:
        # Filter by title/description containing category keyword
        blueprints = [b for b in blueprints if category.lower() in b["title"].lower()]

    return blueprints

def get_blueprint_details(self, blueprint_id: int) -> dict:
    """Get full details for a blueprint including available providers."""
    blueprint_url = f"{self.BASE_URL}/catalog/blueprints/{blueprint_id}.json"
    providers_url = f"{self.BASE_URL}/catalog/blueprints/{blueprint_id}/print_providers.json"

    blueprint = requests.get(blueprint_url, headers=self.headers, timeout=30).json()
    providers = requests.get(providers_url, headers=self.headers, timeout=30).json()

    blueprint["print_providers"] = providers
    return blueprint

# Usage - Find basketball-related products:
blueprints = client.browse_catalog("jersey")
for bp in blueprints[:5]:
    print(f"{bp['id']}: {bp['title']} by {bp['brand']}")
```

**Use case:** Admin UI to browse Printify catalog and add new product types without leaving the NJ Stars admin panel.

---

### 3. Express Orders (Faster Fulfillment)

Submit orders with express/priority shipping.

```python
# Modify create_order to support shipping method selection:

def create_order_with_shipping(
    self,
    external_id: str,
    line_items: list,
    address: dict,
    shipping_method: int = 1,  # 1=standard, 2=priority, 3=express, 4=economy
) -> dict:
    """
    Create an order with specific shipping method.

    Shipping methods:
        1 = Standard (default)
        2 = Priority
        3 = Printify Express (fastest, premium price)
        4 = Economy (cheapest, slowest)
    """
    data = {
        "external_id": external_id,
        "line_items": line_items,
        "shipping_method": shipping_method,
        "send_shipping_notification": True,
        "address_to": address,
    }
    return self._request("POST", "/orders.json", data=data)

# Express order endpoint (same-day handling):
# POST /v1/shops/{shop_id}/orders/express.json
def create_express_order(self, external_id: str, line_items: list, address: dict) -> dict:
    """Create order with Printify Express (fastest delivery)."""
    data = {
        "external_id": external_id,
        "line_items": line_items,
        "shipping_method": 3,  # Express
        "send_shipping_notification": True,
        "address_to": address,
    }
    return self._request("POST", "/orders/express.json", data=data)
```

**Use case:** Offer "Rush Delivery" option at checkout for customers who need items quickly (e.g., before a tournament).

---

### 4. Shipping Method Selection UI

Let customers choose their shipping speed at checkout.

```python
# Backend: Get available shipping options
def get_shipping_options(self, line_items: list, address: dict) -> list:
    """
    Get all available shipping options with prices.

    Returns:
        List of {method, name, price_cents, estimated_days}
    """
    quote = self.calculate_shipping(line_items, address)

    options = []
    method_info = {
        "standard": {"code": 1, "name": "Standard Shipping", "days": "5-8"},
        "express": {"code": 3, "name": "Express Shipping", "days": "2-4"},
        "economy": {"code": 4, "name": "Economy Shipping", "days": "10-14"},
    }

    for method, price in quote.items():
        if method in method_info:
            info = method_info[method]
            options.append({
                "method": info["code"],
                "name": info["name"],
                "price_cents": price,
                "estimated_days": info["days"],
            })

    return sorted(options, key=lambda x: x["price_cents"])

# Frontend: Display shipping options in checkout
# See: frontend/src/app/shop/checkout/page.tsx
```

```tsx
// Frontend component example:
interface ShippingOption {
  method: number;
  name: string;
  price_cents: number;
  estimated_days: string;
}

function ShippingSelector({ options, selected, onSelect }: {
  options: ShippingOption[];
  selected: number;
  onSelect: (method: number) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label key={opt.method} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
          <input
            type="radio"
            name="shipping"
            value={opt.method}
            checked={selected === opt.method}
            onChange={() => onSelect(opt.method)}
          />
          <div className="flex-1">
            <div className="font-medium">{opt.name}</div>
            <div className="text-sm text-muted-foreground">{opt.estimated_days} business days</div>
          </div>
          <div className="font-semibold">${(opt.price_cents / 100).toFixed(2)}</div>
        </label>
      ))}
    </div>
  );
}
```

**Use case:** During checkout, show Standard ($3.99, 5-8 days) vs Express ($12.99, 2-4 days) options.

---

### 5. Margin Analytics / Cost Tracking

Track actual costs vs retail prices for profit reporting.

```python
# Add fields to Order model:
class Order(models.Model):
    # ... existing fields ...
    printify_cost_subtotal = models.IntegerField(null=True, blank=True, help_text="Printify production cost in cents")
    printify_cost_shipping = models.IntegerField(null=True, blank=True, help_text="Printify shipping cost in cents")
    printify_cost_total = models.IntegerField(null=True, blank=True, help_text="Total Printify cost in cents")
    print_provider_id = models.IntegerField(null=True, blank=True, help_text="Which print provider fulfilled")

# Update webhook handler to capture costs:
def handle_order_costs(order_id: str):
    """Fetch and store Printify costs for margin calculation."""
    client = get_printify_client()
    printify_order = client.get_order(order_id)

    costs = printify_order.get("costs", {})

    order = Order.objects.get(printify_order_id=order_id)
    order.printify_cost_subtotal = costs.get("subtotal", 0)
    order.printify_cost_shipping = costs.get("shipping", 0)
    order.printify_cost_total = costs.get("total", 0)
    order.print_provider_id = printify_order.get("print_provider_id")
    order.save()

# Analytics query:
from django.db.models import Sum, F

def get_pod_margins(start_date, end_date):
    """Calculate POD profit margins for a date range."""
    orders = Order.objects.filter(
        created_at__range=(start_date, end_date),
        printify_order_id__isnull=False,
        printify_cost_total__isnull=False,
    ).aggregate(
        revenue=Sum("total"),
        printify_costs=Sum("printify_cost_total"),
    )

    revenue = orders["revenue"] or 0
    costs = orders["printify_costs"] or 0
    profit = revenue - costs
    margin = (profit / revenue * 100) if revenue > 0 else 0

    return {
        "revenue_cents": revenue,
        "printify_costs_cents": costs,
        "profit_cents": profit,
        "margin_percent": round(margin, 1),
    }
```

**Use case:** Dashboard showing "This month: $5,000 revenue, $2,500 Printify costs, $2,500 profit (50% margin)"

---

### 6. Auto-Retry Failed Orders

Queue system for orders that fail to submit to Printify.

```python
# Add to Order model:
class Order(models.Model):
    # ... existing fields ...
    printify_submit_attempts = models.IntegerField(default=0)
    printify_submit_error = models.TextField(blank=True)
    printify_submit_next_retry = models.DateTimeField(null=True, blank=True)

# Retry logic:
from datetime import timedelta
from django.utils import timezone

def submit_order_with_retry(order, pod_items, max_attempts=3):
    """Submit POD order with exponential backoff retry."""
    client = get_printify_client()

    order.printify_submit_attempts += 1

    try:
        result = client.create_order(...)
        order.printify_order_id = result["id"]
        order.printify_submit_error = ""
        order.printify_submit_next_retry = None
        order.save()

        client.send_to_production(result["id"])
        return True

    except PrintifyError as e:
        order.printify_submit_error = str(e)

        if order.printify_submit_attempts < max_attempts:
            # Exponential backoff: 5min, 20min, 80min
            delay_minutes = 5 * (4 ** (order.printify_submit_attempts - 1))
            order.printify_submit_next_retry = timezone.now() + timedelta(minutes=delay_minutes)
        else:
            order.printify_submit_next_retry = None  # Give up, needs manual intervention

        order.save()
        logger.error(f"Printify order submission failed: {e}")
        return False

# Celery task to retry failed orders:
@shared_task
def retry_failed_printify_orders():
    """Periodic task to retry failed POD order submissions."""
    failed_orders = Order.objects.filter(
        printify_order_id__isnull=True,
        printify_submit_next_retry__lte=timezone.now(),
        printify_submit_attempts__lt=3,
    )

    for order in failed_orders:
        pod_items = order.items.filter(product__fulfillment_type="pod")
        submit_order_with_retry(order, pod_items)
```

**Use case:** If Printify API is down during checkout, order still completes for customer and retries automatically.

---

### 7. Scheduled Catalog Sync

Nightly job to sync all products and detect changes.

```python
# Management command: sync_all_printify.py
from django.core.management.base import BaseCommand
from apps.payments.models import Product
from apps.payments.services import get_printify_client
from apps.payments.services.printify_sync import sync_product_variants, sync_product_images

class Command(BaseCommand):
    help = "Sync all POD products from Printify (run nightly)"

    def handle(self, *args, **options):
        client = get_printify_client()

        # Get all products from Printify
        printify_products = {p["id"]: p for p in client.get_products()}

        # Sync existing products
        for product in Product.objects.filter(fulfillment_type="pod"):
            if product.printify_product_id in printify_products:
                printify_data = printify_products[product.printify_product_id]
                sync_product_variants(product)
                sync_product_images(product, printify_data)
                self.stdout.write(f"✓ Synced: {product.name}")
            else:
                # Product deleted from Printify
                product.is_active = False
                product.save()
                self.stdout.write(self.style.WARNING(f"⚠ Deactivated (deleted in Printify): {product.name}"))

        # Detect new products not in our database
        our_printify_ids = set(Product.objects.filter(
            fulfillment_type="pod"
        ).values_list("printify_product_id", flat=True))

        new_ids = set(printify_products.keys()) - our_printify_ids
        if new_ids:
            self.stdout.write(self.style.NOTICE(f"\n📦 New products in Printify (not imported):"))
            for pid in new_ids:
                p = printify_products[pid]
                self.stdout.write(f"  - {p['title']} ({pid})")

# Cron: 0 3 * * * cd /app && python manage.py sync_all_printify
```

**Use case:** Keep local database in sync with Printify catalog, auto-disable products that Kenneth removes from Printify.

---

### 8. GPSR Safety Information (EU Compliance)

Required for selling in EU markets.

```python
# GET /v1/shops/{shop_id}/products/{product_id}/gpsr.json
def get_product_gpsr(self, product_id: str) -> dict:
    """Get General Product Safety Regulation info for EU compliance."""
    return self._request("GET", f"/products/{product_id}/gpsr.json")

# Response includes manufacturer info, materials, safety warnings
```

**Use case:** If expanding to EU sales, product pages need to display safety/compliance info.

---

## HTTP Status Codes Reference

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Resource created successfully |
| 202 | Accepted | Request queued (webhooks) |
| 204 | No Content | Success, no response body |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Check API key |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Resource doesn't exist |
| 413 | Payload Too Large | Image upload too big |
| 422 | Invalid Request | Validation error (check response) |
| 429 | Rate Limited | Wait and retry |
| 500+ | Server Error | Retry with backoff |

---

## #TODO: Interactive HTML Reference

> **Create a single-page HTML tool with functional working examples for all Printify API operations.**

### Requirements

1. **Standalone HTML file** that can be opened locally or served
2. **No build step** - uses CDN for Tailwind, vanilla JS
3. **Works with session cookies** (open from localhost while dev server running)
4. **Sections:**
   - Config (API base URL input)
   - Orders: Create, list, get details, send to production, cancel
   - Products: List, sync, publish/unpublish
   - Catalog: Browse blueprints, view providers, check variants
   - Uploads: Upload image via URL, list uploads
   - Shipping: Calculate rates, show method options
   - Webhooks: List, create, delete subscriptions

5. **Features:**
   - JSON response viewer with syntax highlighting
   - Copy-to-clipboard for responses
   - Request/response history log
   - Error display with status codes
   - Loading states on all buttons

6. **Implementation notes:**
   - Extend existing `documentation/PRINTIFY/printify-reference.html` pattern
   - Add new API endpoints as cards
   - Include helpful tooltips explaining each operation
   - Add "Try it" examples with pre-filled sample data

### File location
```
documentation/PRINTIFY/printify-interactive.html
```

### Estimated sections
- ~15 API operation cards
- ~500 lines HTML/JS
- Match existing NJ Stars admin styling (primary pink, surface cream)

---

## Related Files

| File | Purpose |
|------|---------|
| `backend/apps/payments/services/printify_client.py` | API client implementation |
| `backend/apps/payments/services/printify_sync.py` | Product/variant sync logic |
| `backend/apps/payments/views.py` | Webhook handler, admin endpoints |
| `backend/apps/payments/models.py` | Product, Order, Variant models |
| `frontend/src/app/portal/admin/printify/page.tsx` | Admin UI |
| `documentation/PRINTIFY/printify-reference.html` | Existing interactive tool |

---

*Generated for NJ Stars Elite AAU - Stryder Labs LLC*
