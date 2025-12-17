# Checkout & Payment Flow Documentation

> **Last Updated:** December 16, 2025
> **Purpose:** Document the complete checkout pipeline for local products, POD (Printify) products, and mixed bags.

---

## Table of Contents

1. [Overview](#overview)
2. [Product Types](#product-types)
3. [Bag Management](#bag-management)
4. [Checkout Flow](#checkout-flow)
5. [Stripe Webhook Processing](#stripe-webhook-processing)
6. [Order Creation](#order-creation)
7. [Printify Order Submission](#printify-order-submission)
8. [Printify Pricing & Payment Model](#printify-pricing--payment-model)
9. [Order Fulfillment Tracking](#order-fulfillment-tracking)
10. [Local Product Handoff](#local-product-handoff)
11. [Development vs Production](#development-vs-production)
12. [API Reference](#api-reference)
13. [Sequence Diagrams](#sequence-diagrams)

---

## Overview

The NJ Stars platform supports two fulfillment types:

| Type                      | Description                    | Fulfillment                            | Shipping                              |
| ------------------------- | ------------------------------ | -------------------------------------- | ------------------------------------- |
| **POD (Print on Demand)** | Products fulfilled by Printify | Printify handles production & shipping | Shipped to customer's address         |
| **Local**                 | Products managed by coaches    | Coach hands off to customer in person  | No shipping (pickup at practice/game) |

A shopping bag can contain:

- Only local products
- Only POD products
- **Mixed** (both local and POD products)

---

## Product Types

### POD Products (`fulfillment_type = 'pod'`)

```python
# Product model fields for POD
fulfillment_type = 'pod'
printify_product_id = '693b573a9164dbdf170252cd'  # Printify's product ID
printify_variant_id = '87234'  # Default variant ID
manage_inventory = False  # Always "in stock" (Printify manages availability)
```

**Characteristics:**

- Synced from Printify via webhooks or manual import
- Has variants (size/color combinations) stored in `ProductVariant` model
- Images linked to specific variants via `printify_variant_ids`
- Price can vary by variant
- Always considered "in stock" (Printify handles availability per-variant)

### Local Products (`fulfillment_type = 'local'`)

```python
# Product model fields for local
fulfillment_type = 'local'
printify_product_id = ''  # Empty - not from Printify
manage_inventory = True  # We track stock
stock_quantity = 50  # Current inventory count
```

**Characteristics:**

- Created directly in Django admin
- May have simple variants (sizes) or no variants
- Inventory is tracked locally (`stock_quantity` decremented on purchase)
- Requires coach handoff for delivery

---

## Bag Management

### Bag Model

```python
class Bag(models.Model):
    user = models.OneToOneField(User, null=True, blank=True)  # Authenticated user
    session_key = models.CharField(max_length=40, blank=True)  # Guest session
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### BagItem Model

```python
class BagItem(models.Model):
    bag = models.ForeignKey(Bag, related_name='items')
    product = models.ForeignKey(Product)
    quantity = models.IntegerField(default=1)
    selected_size = models.CharField(max_length=50, blank=True)
    selected_color = models.CharField(max_length=50, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)
```

### Guest vs Authenticated Users

| User Type         | Bag Identification                           | Persistence                |
| ----------------- | -------------------------------------------- | -------------------------- |
| **Authenticated** | `bag.user = request.user`                    | Permanent (until checkout) |
| **Guest**         | `bag.session_key` via `X-Bag-Session` header | Stored in localStorage     |

**Bag Merge:** When a guest logs in, their session bag can be merged with their user bag via `POST /api/payments/bag/merge/`.

---

## Checkout Flow

### Step 1: User Initiates Checkout

**Frontend Action:**

```typescript
// In bag.tsx
const checkout = async (itemIds?: number[]) => {
  const response = await fetch(`${API_BASE}/api/payments/checkout/bag/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Bag-Session": sessionKey, // For guest users
    },
    body: JSON.stringify({
      success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop/cancel`,
      item_ids: selectedItemIds, // Optional: specific items to checkout
    }),
  });
  return response.json(); // { url: string, session_id: string }
};
```

### Step 2: Backend Creates Stripe Session

**File:** `backend/apps/payments/views.py` - `bag_checkout()`

```python
@api_view(['POST'])
@permission_classes([AllowAny])
def bag_checkout(request):
    # 1. Get the user's bag
    bag = get_or_create_bag(request)

    # 2. Get items to checkout (all or selected)
    item_ids = request.data.get('item_ids')
    if item_ids:
        bag_items = bag.items.filter(id__in=item_ids)
    else:
        bag_items = bag.items.all()

    # 3. Validate items (stock, availability)
    for item in bag_items:
        if item.product.manage_inventory:
            if item.quantity > item.product.stock_quantity:
                return Response({'error': f'Not enough stock for {item.product.name}'})

    # 4. Build Stripe line items
    line_items = []
    for item in bag_items:
        # Get variant-specific price if applicable
        unit_price = item.unit_price  # Uses variant price or base price

        line_items.append({
            'price_data': {
                'currency': 'usd',
                'unit_amount': int(unit_price * 100),  # Stripe uses cents
                'product_data': {
                    'name': item.product.name,
                    'description': f'{item.selected_color} / {item.selected_size}',
                },
            },
            'quantity': item.quantity,
        })

    # 5. Create Stripe Checkout Session
    session = stripe.checkout.Session.create(
        line_items=line_items,
        mode='payment',
        success_url=request.data['success_url'],
        cancel_url=request.data['cancel_url'],
        shipping_address_collection={'allowed_countries': ['US']},
        metadata={
            'bag_id': str(bag.id),
            'user_id': str(request.user.id) if request.user.is_authenticated else '',
            'session_key': bag.session_key or '',
            'item_ids': ','.join(str(i.id) for i in bag_items),
        },
    )

    return Response({'url': session.url, 'session_id': session.id})
```

### Step 3: User Completes Payment on Stripe

User is redirected to Stripe's hosted checkout page where they:

1. Enter/confirm shipping address
2. Enter payment details
3. Complete payment

### Step 4: Stripe Sends Webhook

After successful payment, Stripe sends a `checkout.session.completed` webhook to:

```
POST /api/payments/webhook/stripe/
```

---

## Stripe Webhook Processing

**File:** `backend/apps/payments/views.py` - `stripe_webhook()`

```python
@csrf_exempt
def stripe_webhook(request):
    # 1. Verify webhook signature
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)

    # 2. Handle checkout.session.completed
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']

        # 3. Create Payment record
        Payment.objects.create(
            amount=Decimal(session['amount_total']) / 100,
            currency=session['currency'],
            status='completed',
            stripe_payment_intent_id=session.get('payment_intent'),
        )

        # 4. Check if this is a bag purchase (vs event registration)
        if session['metadata'].get('bag_id'):
            _process_bag_purchase(session)

    return HttpResponse(status=200)
```

---

## Order Creation

**Function:** `_process_bag_purchase(session)`

This function handles the critical order creation logic:

```python
def _process_bag_purchase(session):
    metadata = session['metadata']
    bag_id = metadata.get('bag_id')
    item_ids = metadata.get('item_ids', '').split(',')

    # Get the bag and items
    bag = Bag.objects.get(id=bag_id)
    bag_items = bag.items.filter(id__in=item_ids)

    with transaction.atomic():
        # 1. CREATE ORDER
        order = Order.objects.create(
            user=bag.user,
            order_number=f"NJS-{uuid.uuid4().hex[:8].upper()}",
            status='paid',
            stripe_session_id=session['id'],
            stripe_payment_intent_id=session.get('payment_intent'),
            # Shipping address from Stripe
            shipping_name=session['shipping_details']['name'],
            shipping_email=session['customer_details']['email'],
            shipping_address_line1=session['shipping_details']['address']['line1'],
            shipping_address_line2=session['shipping_details']['address'].get('line2', ''),
            shipping_city=session['shipping_details']['address']['city'],
            shipping_state=session['shipping_details']['address']['state'],
            shipping_zip=session['shipping_details']['address']['postal_code'],
            shipping_country=session['shipping_details']['address']['country'],
            # Totals from Stripe
            subtotal=Decimal(session['amount_subtotal']) / 100,
            shipping=Decimal(session.get('total_details', {}).get('amount_shipping', 0)) / 100,
            tax=Decimal(session.get('total_details', {}).get('amount_tax', 0)) / 100,
            total=Decimal(session['amount_total']) / 100,
        )

        # 2. CREATE ORDER ITEMS
        pod_items = []  # Collect POD items for Printify submission

        for bag_item in bag_items:
            product = bag_item.product

            # Create OrderItem (snapshot of product at purchase time)
            order_item = OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                product_price=bag_item.unit_price,
                selected_size=bag_item.selected_size,
                selected_color=bag_item.selected_color,
                quantity=bag_item.quantity,
                fulfillment_type=product.fulfillment_type,
            )

            # 3. HANDLE INVENTORY (Local products only)
            if product.fulfillment_type == 'local' and product.manage_inventory:
                product.stock_quantity -= bag_item.quantity
                product.save()

            # 4. COLLECT POD ITEMS
            if product.fulfillment_type == 'pod':
                pod_items.append(order_item)

        # 5. SUBMIT POD ITEMS TO PRINTIFY
        if pod_items:
            _submit_printify_order(order, pod_items)

        # 6. REMOVE ITEMS FROM BAG
        bag_items.delete()
```

---

## Printify Order Submission

**Function:** `_submit_printify_order(order, pod_items)`

```python
def _submit_printify_order(order, pod_items):
    import uuid

    # ========================================
    # DEVELOPMENT MODE: Skip real API calls
    # ========================================
    if getattr(settings, 'PRINTIFY_DRY_RUN', False):
        # Generate mock Printify order ID
        mock_order_id = f"mock-{uuid.uuid4().hex[:12]}"
        order.printify_order_id = mock_order_id
        order.save()

        # Generate mock line item IDs
        for i, item in enumerate(pod_items):
            item.printify_line_item_id = f"mock-line-{i+1}"
            item.save()

        logger.info(f"[DRY RUN] Mock Printify order: {mock_order_id}")
        return mock_order_id

    # ========================================
    # PRODUCTION MODE: Call Printify API
    # ========================================
    printify = get_printify_client()

    # Build line items for Printify
    line_items = []
    for item in pod_items:
        product = item.product

        # Find the correct variant ID based on size/color
        variant = product.variants.filter(
            size=item.selected_size,
            color=item.selected_color,
            is_enabled=True
        ).first()

        line_items.append({
            'product_id': product.printify_product_id,
            'variant_id': variant.printify_variant_id if variant else product.printify_variant_id,
            'quantity': item.quantity,
        })

    # Build shipping address
    shipping_address = {
        'first_name': order.shipping_name.split()[0],
        'last_name': ' '.join(order.shipping_name.split()[1:]),
        'email': order.shipping_email,
        'address1': order.shipping_address_line1,
        'address2': order.shipping_address_line2,
        'city': order.shipping_city,
        'region': order.shipping_state,
        'zip': order.shipping_zip,
        'country': order.shipping_country,
    }

    # Create Printify order
    response = printify.create_order(
        line_items=line_items,
        shipping_address=shipping_address,
        external_id=order.order_number,  # Links Printify order to our order
    )

    # Save Printify order ID
    order.printify_order_id = response['id']
    order.save()

    # Save line item IDs
    for i, item in enumerate(pod_items):
        if i < len(response.get('line_items', [])):
            item.printify_line_item_id = response['line_items'][i]['id']
            item.save()
```

### Printify Order States

| State           | Description                                              |
| --------------- | -------------------------------------------------------- |
| `on-hold`       | Initial state - waiting for manual approval or auto-send |
| `pending`       | Order accepted, waiting for production                   |
| `in-production` | Print provider is producing the item                     |
| `shipped`       | Item has been shipped                                    |
| `delivered`     | Item delivered to customer                               |
| `canceled`      | Order was canceled                                       |

**Important:** Printify orders start in `on-hold` status. They must be sent to production either:

- Manually via Printify dashboard
- Via API call to `send_to_production`
- Automatically after 24 hours (if auto-approval enabled in Printify settings)

---

## Order Fulfillment Tracking

### Printify Webhooks

Printify sends webhooks to `/api/payments/webhook/printify/` for order status updates:

```python
def printify_webhook(request):
    event_type = request.data.get('type')
    resource = request.data.get('resource', {})

    # Find our order by Printify order ID or external_id
    printify_order_id = resource.get('id')
    order = Order.objects.filter(
        Q(printify_order_id=printify_order_id) |
        Q(order_number=resource.get('external_id'))
    ).first()

    if event_type == 'order:sent-to-production':
        order.status = 'processing'
        order.save()

    elif event_type == 'order:shipment:created':
        shipment = resource.get('shipments', [{}])[0]
        order.tracking_number = shipment.get('tracking_number')
        order.tracking_url = shipment.get('tracking_url')
        order.status = 'shipped'
        order.save()

    elif event_type == 'order:shipment:delivered':
        order.status = 'delivered'
        order.save()

    elif event_type == 'order:canceled':
        order.status = 'canceled'
        order.save()
```

### Order Status Flow

```
                    ┌─────────────────────────────────────────────┐
                    │                 ORDER CREATED               │
                    │              status = 'paid'                │
                    └─────────────────┬───────────────────────────┘
                                      │
                    ┌─────────────────┴───────────────────────────┐
                    │                                             │
              POD Items                                    Local Items
                    │                                             │
                    ▼                                             ▼
        ┌───────────────────┐                         ┌───────────────────┐
        │ Printify Webhook: │                         │  Coach marks as   │
        │ sent-to-production│                         │  "Ready" or       │
        │ status='processing'│                        │  "Delivered"      │
        └─────────┬─────────┘                         └─────────┬─────────┘
                  │                                             │
                  ▼                                             │
        ┌───────────────────┐                                   │
        │ Printify Webhook: │                                   │
        │ shipment:created  │                                   │
        │ status='shipped'  │                                   │
        │ + tracking info   │                                   │
        └─────────┬─────────┘                                   │
                  │                                             │
                  ▼                                             ▼
        ┌───────────────────────────────────────────────────────┐
        │            ALL ITEMS FULFILLED?                       │
        │  (POD shipped/delivered AND local handed off)         │
        │                status = 'delivered'                   │
        └───────────────────────────────────────────────────────┘
```

---

## Local Product Handoff

For local products, coaches use the `/portal/deliveries` page to track handoffs.

### OrderItem Handoff Fields

```python
class OrderItem(models.Model):
    # ... other fields ...

    # Handoff tracking (local products only)
    handoff_status = models.CharField(
        choices=[
            ('pending', 'Pending Pickup'),
            ('ready', 'Ready for Pickup'),
            ('delivered', 'Delivered'),
        ],
        default='pending'
    )
    handoff_completed_at = models.DateTimeField(null=True)
    handoff_completed_by = models.ForeignKey(User, null=True)
    handoff_notes = models.TextField(blank=True)
```

### Handoff API Endpoints

```
GET  /api/payments/handoffs/?status=pending    # List pending handoffs
GET  /api/payments/handoffs/?status=delivered  # List completed handoffs
GET  /api/payments/handoffs/?status=all        # List all handoffs

PATCH /api/payments/handoffs/{item_id}/
Body: { "status": "delivered", "notes": "Picked up at practice" }
```

### Handoff Workflow

1. **Customer orders local product** → `handoff_status = 'pending'`
2. **Coach gets product ready** → Coach marks as `'ready'` (optional)
3. **Customer picks up** → Coach marks as `'delivered'`
4. **System checks** → If all items delivered, order `status = 'delivered'`

---

## Development vs Production

### Environment Variable

```bash
# In .env.backend.development
PRINTIFY_DRY_RUN=true

# In production (Railway)
PRINTIFY_DRY_RUN=false  # Or simply don't set it
```

### Behavior Differences

| Aspect            | Development (`DRY_RUN=true`)   | Production                  |
| ----------------- | ------------------------------ | --------------------------- |
| Printify orders   | Mock IDs generated             | Real orders created         |
| Printify webhooks | Won't receive (no real orders) | Real status updates         |
| Stripe            | Use test keys (`pk_test_*`)    | Use live keys (`pk_live_*`) |
| Shipping          | Collected but not used         | Used for Printify shipping  |

### Switching to Production

1. Remove `PRINTIFY_DRY_RUN=true` from environment
2. Ensure Stripe live keys are configured
3. Verify Printify webhooks are registered
4. Test with a real order (can cancel in Printify if needed)

---

## API Reference

### Bag Endpoints

| Method   | Endpoint                        | Auth     | Description          |
| -------- | ------------------------------- | -------- | -------------------- |
| `GET`    | `/api/payments/bag/`            | Optional | Get current bag      |
| `POST`   | `/api/payments/bag/`            | Optional | Add item to bag      |
| `DELETE` | `/api/payments/bag/`            | Optional | Clear bag            |
| `PATCH`  | `/api/payments/bag/items/{id}/` | Optional | Update item quantity |
| `DELETE` | `/api/payments/bag/items/{id}/` | Optional | Remove item          |
| `POST`   | `/api/payments/bag/merge/`      | Required | Merge guest bag      |

### Checkout Endpoints

| Method | Endpoint                               | Auth     | Description            |
| ------ | -------------------------------------- | -------- | ---------------------- |
| `POST` | `/api/payments/checkout/bag/`          | Optional | Create Stripe checkout |
| `GET`  | `/api/payments/checkout/session/{id}/` | Optional | Get session details    |

### Order Endpoints

| Method | Endpoint                         | Auth     | Description        |
| ------ | -------------------------------- | -------- | ------------------ |
| `GET`  | `/api/payments/orders/`          | Required | List user's orders |
| `GET`  | `/api/payments/orders/{number}/` | Public   | Get order details  |

### Handoff Endpoints (Staff Only)

| Method  | Endpoint                       | Auth  | Description           |
| ------- | ------------------------------ | ----- | --------------------- |
| `GET`   | `/api/payments/handoffs/`      | Staff | List handoff items    |
| `PATCH` | `/api/payments/handoffs/{id}/` | Staff | Update handoff status |

### Webhook Endpoints

| Method | Endpoint                          | Auth      | Description       |
| ------ | --------------------------------- | --------- | ----------------- |
| `POST` | `/api/payments/webhook/stripe/`   | Signature | Stripe webhooks   |
| `POST` | `/api/payments/webhook/printify/` | Signature | Printify webhooks |

---

## Sequence Diagrams

### Scenario 1: Local Products Only

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │     │ Frontend │     │ Backend  │     │  Stripe  │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ Click Checkout │                │                │
     │───────────────>│                │                │
     │                │ POST /checkout/bag/            │
     │                │───────────────>│                │
     │                │                │ Create Session │
     │                │                │───────────────>│
     │                │                │<───────────────│
     │                │ { url, session_id }            │
     │                │<───────────────│                │
     │ Redirect to Stripe              │                │
     │<───────────────│                │                │
     │                │                │                │
     │ Complete Payment                │                │
     │────────────────────────────────────────────────>│
     │                │                │                │
     │                │                │ Webhook        │
     │                │                │<───────────────│
     │                │                │                │
     │                │                │ Create Order   │
     │                │                │ (status='paid')│
     │                │                │                │
     │                │                │ Decrement Stock│
     │                │                │                │
     │                │                │ Delete Bag Items
     │                │                │                │
     │ Redirect to /success            │                │
     │<────────────────────────────────────────────────│
     │                │                │                │
```

**Post-Checkout for Local Products:**

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Coach   │     │ Frontend │     │ Backend  │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     │ View /portal/deliveries         │
     │───────────────>│                │
     │                │ GET /handoffs/?status=pending
     │                │───────────────>│
     │                │<───────────────│
     │ See pending items               │
     │<───────────────│                │
     │                │                │
     │ Mark as Delivered               │
     │───────────────>│                │
     │                │ PATCH /handoffs/{id}/
     │                │ { status: 'delivered' }
     │                │───────────────>│
     │                │                │
     │                │                │ Update OrderItem
     │                │                │ Check if all delivered
     │                │                │ Update Order status
     │                │<───────────────│
     │ Success!       │                │
     │<───────────────│                │
```

### Scenario 2: POD Products Only

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │     │ Frontend │     │ Backend  │     │  Stripe  │     │ Printify │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │                │
     │ Click Checkout │                │                │                │
     │───────────────>│                │                │                │
     │                │ POST /checkout/bag/            │                │
     │                │───────────────>│                │                │
     │                │                │ Create Session │                │
     │                │                │───────────────>│                │
     │                │<───────────────│<───────────────│                │
     │ Redirect to Stripe              │                │                │
     │<───────────────│                │                │                │
     │                │                │                │                │
     │ Complete Payment                │                │                │
     │────────────────────────────────────────────────>│                │
     │                │                │                │                │
     │                │                │ Webhook        │                │
     │                │                │<───────────────│                │
     │                │                │                │                │
     │                │                │ Create Order   │                │
     │                │                │                │                │
     │                │                │ Submit to Printify              │
     │                │                │───────────────────────────────>│
     │                │                │ { order_id }   │                │
     │                │                │<───────────────────────────────│
     │                │                │                │                │
     │ Redirect to /success            │                │                │
     │<────────────────────────────────────────────────│                │
     │                │                │                │                │
     │                │                │                │ (Later)        │
     │                │                │                │ Webhook:       │
     │                │                │                │ shipment:created
     │                │                │<───────────────────────────────│
     │                │                │                │                │
     │                │                │ Update Order   │                │
     │                │                │ status='shipped'               │
     │                │                │ + tracking info│                │
```

### Scenario 3: Mixed Bag (POD + Local)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │     │ Frontend │     │ Backend  │     │  Stripe  │     │ Printify │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │                │
     │ Checkout (hoodie + jersey)      │                │                │
     │───────────────>│                │                │                │
     │                │───────────────>│                │                │
     │                │                │───────────────>│                │
     │<────────────────────────────────│<───────────────│                │
     │                │                │                │                │
     │ Complete Payment                │                │                │
     │────────────────────────────────────────────────>│                │
     │                │                │                │                │
     │                │                │ Webhook        │                │
     │                │                │<───────────────│                │
     │                │                │                │                │
     │                │                │ ┌────────────────────────────┐ │
     │                │                │ │ For each item:             │ │
     │                │                │ │ - POD → add to pod_items   │ │
     │                │                │ │ - Local → decrement stock  │ │
     │                │                │ └────────────────────────────┘ │
     │                │                │                │                │
     │                │                │ Submit POD items to Printify   │
     │                │                │───────────────────────────────>│
     │                │                │<───────────────────────────────│
     │                │                │                │                │
     │                │                │                │                │
```

**Fulfillment for Mixed Bag:**

```
Order created (status='paid')
├── POD Item (hoodie)
│   └── handoff_status: N/A (Printify handles)
│       Printify webhook → status='shipped' → tracking info
│       Printify webhook → status='delivered'
│
└── Local Item (jersey)
    └── handoff_status: 'pending'
        Coach marks 'delivered' → handoff_completed_at set

When BOTH are fulfilled:
├── POD: shipped/delivered (via Printify webhook)
└── Local: handoff_status='delivered' (via coach)

    → Order status = 'delivered'
```

---

## Key Files Reference

| File                                                | Purpose                                        |
| --------------------------------------------------- | ---------------------------------------------- |
| `backend/apps/payments/models.py`                   | Order, OrderItem, Bag, BagItem, Product models |
| `backend/apps/payments/views.py`                    | Checkout, webhooks, handoff endpoints          |
| `backend/apps/payments/serializers.py`              | API serializers                                |
| `backend/apps/payments/services/printify_client.py` | Printify API client                            |
| `frontend/src/lib/bag.tsx`                          | Bag context and API calls                      |
| `frontend/src/app/shop/success/page.tsx`            | Order confirmation page                        |
| `frontend/src/app/portal/orders/page.tsx`           | Order history (customer)                       |
| `frontend/src/app/portal/deliveries/page.tsx`       | Handoff management (staff)                     |

---

## Troubleshooting

### Order not created after payment

1. Check Stripe webhook logs in Stripe Dashboard
2. Verify webhook signature secret matches
3. Check Django logs for errors in `stripe_webhook()`

### Printify order not submitted

1. Check if `PRINTIFY_DRY_RUN=true` (expected in dev)
2. Verify Printify API credentials
3. Check if product has `printify_product_id`
4. Check Django logs for `PrintifyError`

### Handoff items not appearing

1. Verify order has `status='paid'`
2. Verify item has `fulfillment_type='local'`
3. Check user has `is_staff=True`

### Stock not decremented

1. Verify product has `manage_inventory=True`
2. Verify product has `fulfillment_type='local'`
3. Check for transaction errors in logs

---

_Document maintained by the development team. Questions? Check the codebase or reach out to developers@leag.app._

## Printify Pricing & Payment Model

> **Added:** December 16, 2025

Understanding how money flows between customers, your platform, and Printify is essential for managing your merch business.

### Pricing Independence

**Your site prices do NOT affect Printify.** They are completely separate:

| Price Type | Set By | Example | Where It Lives |
|------------|--------|---------|----------------|
| **Base Cost** | Printify | $12.50 | Printify dashboard |
| **Retail Price** | You | $35.00 | Your Django admin / Product model |
| **Your Profit** | Calculated | $21.45* | Retail - Base - Fees |

*After ~3% Stripe processing fee

If you change a product price from $35 → $40 on your site:
- Printify doesn't know or care
- Printify still charges you the same base cost ($12.50)
- Your profit margin increases

### Payment Flow Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  CUSTOMER   │         │   STRIPE    │         │ YOUR STRIPE │
│             │  $35.00 │             │  $33.95 │   ACCOUNT   │
│   Orders    │────────>│  Processes  │────────>│   Receives  │
│   Hoodie    │         │   Payment   │         │   Payment   │
└─────────────┘         └─────────────┘         └──────┬──────┘
                                                       │
                                                       │ Order created
                                                       │ via webhook
                                                       ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  PRINTIFY   │         │ YOUR CARD   │         │   DJANGO    │
│             │  $12.50 │  (on file   │ <────── │   BACKEND   │
│  Produces & │<────────│  with       │  Order  │   Creates   │
│  Ships      │         │  Printify)  │  API    │   Order     │
└──────┬──────┘         └─────────────┘         └─────────────┘
       │
       │ Ships directly
       │ to customer
       ▼
┌─────────────┐
│  CUSTOMER   │
│  Receives   │
│  Package    │
└─────────────┘
```

### Payment Summary

| Step | Who Pays | Who Receives | Amount | Notes |
|------|----------|--------------|--------|-------|
| 1 | Customer | Stripe | $35.00 | Full retail price |
| 2 | Stripe | Your Stripe Account | $33.95 | Minus ~3% processing fee |
| 3 | Your Card | Printify | $12.50 | Base cost (charged to card on file) |
| 4 | — | **Your Profit** | **$21.45** | Retail - Stripe Fee - Base Cost |

### Key Points

1. **Customer never interacts with Printify** - They pay you via Stripe, receive a package (can have your branding)

2. **You need a payment method in Printify** - Credit card or PayPal on file. Printify auto-charges this when orders are created via API

3. **Printify doesn't see your retail prices** - They only know their base cost. Your markup is your business

4. **Shipping costs** - Printify calculates shipping based on destination. You can either:
   - Pass shipping cost to customer (add to checkout)
   - Absorb it in your retail price (offer "free shipping")
   - Mark up shipping for additional profit

5. **Profit varies by product** - Each product type (t-shirt, hoodie, mug) has different base costs. Check Printify's catalog for current pricing

### Example Profit Calculation

```
Product: Unisex Heavyweight T-Shirt

Printify Base Cost:     $12.50
Printify Shipping:      $ 4.69 (to US)
────────────────────────────────
Your Cost:              $17.19

Your Retail Price:      $35.00
Stripe Fee (3%):        -$ 1.05
────────────────────────────────
You Receive:            $33.95

YOUR PROFIT:            $33.95 - $17.19 = $16.76 per shirt
```

### Printify Account Setup Checklist

Before going live with POD products:

- [ ] Create Printify account at [printify.com](https://printify.com)
- [ ] Add payment method (credit card or PayPal)
- [ ] Connect your store via API (already done in this codebase)
- [ ] Set up shipping profiles
- [ ] Optional: Configure branded packing slips
- [ ] Optional: Enable auto-send to production (or manually approve each order)

---

