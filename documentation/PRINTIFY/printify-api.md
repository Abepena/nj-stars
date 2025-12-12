# Printify API Guide (NJ Stars Integration)

This doc is tailored to our current POD integration (Django backend + Next frontend). It summarizes what we already use, how to call Printify cleanly, and highlights **useful features not yet implemented** with repo-friendly examples.

## Where the integration lives
- Python client: `backend/apps/payments/services/printify_client.py`
- Sync helpers: `backend/apps/payments/services/printify_sync.py`
- Admin endpoints: `backend/apps/payments/urls.py` (`/api/payments/admin/printify/...`)
- Webhook handler: `printify_webhook` in `backend/apps/payments/views.py`
- Management command: `python manage.py sync_printify_variants --product=<slug>`
- Frontend admin page: `frontend/src/app/portal/admin/printify/page.tsx`

## Credentials & env
Add to `.env` / Railway:
```
PRINTIFY_API_KEY=...
PRINTIFY_SHOP_ID=...
PRINTIFY_WEBHOOK_SECRET=...
PRINTIFY_DRY_RUN=true   # dev only; skips real orders
```

## Common flows (implemented)

### Calculate shipping (used during checkout)
```python
from apps.payments.services import get_printify_client

client = get_printify_client()
quote = client.calculate_shipping(
    line_items=[
        {"product_id": "693b573a9164dbdf170252cd", "variant_id": 12345, "quantity": 2},
    ],
    address={"country": "US", "zip": "10001"},
)
# returns costs in cents
```

### Submit a POD order right after Stripe succeeds
```python
from apps.payments.services import get_printify_client

client = get_printify_client()
order = client.create_order(
    external_id=django_order.order_number,
    line_items=[
        {
            "product_id": item.product.printify_product_id,
            "variant_id": int(item.product.printify_variant_id),
            "quantity": item.quantity,
        }
        for item in pod_items
    ],
    address={
        "first_name": order.shipping_first_name,
        "last_name": order.shipping_last_name,
        "email": order.user.email,
        "phone": order.shipping_phone,
        "address1": order.shipping_address1,
        "city": order.shipping_city,
        "zip": order.shipping_zip,
        "country": order.shipping_country,
        "region": order.shipping_state,
    },
)
# order['id'] is stored on Order.printify_order_id
```

### Send to production (auto-charge your Printify payment method)
```python
client.send_to_production(order_id)
```

### Publish / unpublish a product from admin tools
```python
client.publish_product(printify_product_id)
client.unpublish_product(printify_product_id)
```

### Sync variants/images from Printify
- API admin endpoint: `POST /api/payments/admin/printify/sync/` with `{"product_id": "<printify_id>"}`
- CLI: `python manage.py sync_printify_variants --product=<slug>`

### Webhook verification
`printify_webhook` already checks `X-Pfy-Signature`/`X-Printify-Signature` using `PRINTIFY_WEBHOOK_SECRET`.

## Useful Printify features not wired up yet (with examples)

### 1) Order state polling & resend notifications
Use `get_order` to poll status or re-send shipping emails if webhook missed.
```python
order_data = client.get_order(order.printify_order_id)
status = order_data.get("status")  # on-hold, pending, fulfilled, canceled
```
Hook idea: nightly task compares statuses and updates our `Order.status`/tracking.

### 2) Cancel or hold before auto-approval
```python
client.cancel_order(order.printify_order_id)
# or skip send_to_production to keep on-hold until manual approval window closes
```
We currently auto-send; could add a `POD_AUTO_APPROVE` flag to delay.

### 3) Print provider & cost breakdown
Printify returns `print_provider_id` and costs in order responses. Persist them for margin analytics.
```python
order_data = client.get_order(order.printify_order_id)
costs = order_data.get("costs", {})
provider = order_data.get("print_provider_id")
```

### 4) Product catalog sync (scheduled)
`list_products` + `get_product` can backfill new designs or detect deletions.
```python
products = client.get_products()
for p in products:
    full = client.get_product(p["id"])
    # map tags → categories, store variants/images (reuse sync helpers)
```
Could run daily and compare to `Product.printify_product_id` set.

### 5) Shipping method choices (express vs standard)
`create_order` accepts `shipping_method` (default 1=standard). Expose a UI toggle and pass `shipping_method=2` when selected.

### 6) Mockup/preview refresh
Printify product payload includes `images` with `src` and `printify_variant_ids`. Schedule a refresh to replace stale mockups when designs change.
```python
from apps.payments.services.printify_sync import sync_product_images
sync_product_images(product, printify_data)
```

### 7) Webhook coverage audit
Ensure Printify dashboard has these events hitting `/api/payments/webhook/printify/`:
- `order:created`, `order:sent-to-production`, `order:shipped`, `order:delivered`, `order:canceled`
- `product:publish:started`, `product:deleted`
Missing events → add in Printify settings; we already verify signature.

### 8) Error handling & retries
Wrap client calls in a retry with exponential backoff and alerting when `PrintifyError.status_code >= 500`.

## Frontend considerations
- Product detail page (`/shop/[slug]`) already maps `printify_variant_ids` to size/color selectors; ensure variant sync keeps `printify_variant_id` populated.
- Admin portal page (`/portal/admin/printify`) can be extended to:
  - Show Printify order statuses for POD items
  - Trigger `send_to_production` / `cancel`
  - Show cost breakdown from `get_order`

## Testing tips
- Set `PRINTIFY_DRY_RUN=true` to avoid real charges. The server will generate mock IDs.
- Use a real US address to get accurate shipping rates; Printify requires `country` + `zip`.
- If webhooks aren’t arriving, check `X-Pfy-Signature` header is present and secret matches.

## HTML reference
- `documentation/PRINTIFY/printify-reference.html` is a static page that hits our admin endpoints (list/publish/unpublish/sync products, order lookup) using the same styling as `/portal/admin/printify`. Open via `http://localhost` so cookies are sent.
- TODO: Add send-to-production/cancel and shipping method toggles once those endpoints are exposed.
