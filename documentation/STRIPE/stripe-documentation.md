# Stripe API Documentation for NJ Stars Platform

> **Last Updated:** December 12, 2025
> **Purpose:** Comprehensive Stripe integration documentation tailored for the NJ Stars Youth Sports Organization Platform
> **Stripe API Version:** 2024-12-18.acacia (recommended latest)

---

## 🤝 Account Ownership & Access Model

**The Stripe account is managed by Abe Pena (platform developer/technical lead).**

Kenny and I are building this together as partners. I'm handling the Stripe account simply because I'm more familiar with the technical side — webhooks, API keys, integrations, etc. Kenny has full visibility into everything as a Team Member.

### Partner Access (NJ Stars - Kenny Andrade)

Kenny Andrade (NJ Stars founder) is added as a **Stripe Team Member** with the following access:

| Permission                   | Access Level |
| ---------------------------- | ------------ |
| View payments & transactions | ✅ Yes       |
| View customers               | ✅ Yes       |
| View reports & analytics     | ✅ Yes       |
| View payouts                 | ✅ Yes       |
| Manage disputes              | ⚙️ Optional  |
| Manage API keys              | ❌ No        |
| Manage webhooks              | ❌ No        |
| Invite team members          | ❌ No        |

### Revenue Distribution

**Payouts go directly to NJ Stars.** Kenny's business receives 100% of revenue from Stripe, then pays Leag/Stryder the platform fee separately. This keeps the accounting clean — it's NJ Stars' business income, and the platform fee is a business expense.

| Party                   | Receives | Method                                      |
| ----------------------- | -------- | ------------------------------------------- |
| NJ Stars (Kenny)        | 100%     | Direct Stripe payout to NJ Stars bank       |
| Platform (Leag/Stryder) | 20%/5%   | Invoiced monthly or transferred by NJ Stars |

### Platform Fee Structure

The platform fee varies by revenue type to account for different profit margins:

| Revenue Type              | Platform Fee | Applied To                             | NJ Stars Net |
| ------------------------- | ------------ | -------------------------------------- | ------------ |
| Events, camps, tryouts    | 20%          | Gross revenue (after Stripe fees)      | ~77%         |
| Team dues / Subscriptions | 20%          | Gross revenue (after Stripe fees)      | ~77%         |
| Merch / POD products      | 20%          | **Profit** (after Printify + shipping) | Varies       |
| Coach private training    | 5%           | Gross revenue (after Stripe fees)      | ~92%         |

> **Why profit-based for merch?** POD products have significant costs (Printify production + shipping). Charging 20% of gross on a $35 hoodie with $22 in costs would leave NJ Stars with almost nothing. Charging 20% of the ~$12 profit is fairer.

**Example — Merch Hoodie ($35):**

- Customer pays: $35.00
- Stripe fee: $1.32
- Printify cost: $22.00
- Profit: $11.68
- Platform fee (20% of profit): $2.34
- NJ Stars keeps: $9.34

> **Future Enhancement:** Consider Stripe Connect for automated revenue splitting when additional tenants are onboarded.

---

## Table of Contents

1. [Overview](#overview)
2. [Current Implementation](#current-implementation)
3. [Stripe Products & Their Usage](#stripe-products--their-usage)
4. [API Integration Reference](#api-integration-reference)
5. [Webhook Events](#webhook-events)
6. [Environment Configuration](#environment-configuration)
7. [Testing & Development](#testing--development)
8. [Future Features & Recommendations](#future-features--recommendations)
9. [Security Best Practices](#security-best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The NJ Stars platform uses Stripe for all payment processing across multiple revenue streams. As a youth sports organization platform designed for multi-tenancy, Stripe handles:

| Payment Type              | Current Status | Stripe Product                    |
| ------------------------- | -------------- | --------------------------------- |
| **Merchandise Sales**     | ✅ Implemented | Checkout Sessions                 |
| **Event Registrations**   | ✅ Implemented | Checkout Sessions                 |
| **Team Dues**             | ✅ Model Ready | Subscriptions / One-Time Payments |
| **Season Passes**         | ✅ Model Ready | Subscriptions                     |
| **Recurring Memberships** | ✅ Model Ready | Billing/Subscriptions             |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                          │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │   Shop      │  │   Events   │  │   Portal    │                │
│  │  Checkout   │  │ Registration│  │  Payments   │                │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                │
│         │                │                │                        │
│         └────────────────┼────────────────┘                        │
│                          ▼                                         │
│              Stripe Checkout (Redirect)                            │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       BACKEND (Django)                              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              apps/payments/                                   │  │
│  │  ├── views.py         (Checkout session creation)           │  │
│  │  ├── models.py        (Orders, Subscriptions, Payments)     │  │
│  │  └── services/        (Stripe helpers)                      │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                          │                                         │
│                          ▼                                         │
│              Stripe Webhook Handler                                │
│              POST /api/payments/webhook/stripe/                    │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       STRIPE SERVICES                               │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Checkout   │  │   Billing    │  │   Webhooks   │             │
│  │   Sessions   │  │ Subscriptions│  │              │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Products   │  │   Customers  │  │   Payments   │             │
│  │    Prices    │  │              │  │              │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Current Implementation

### 1. Stripe Checkout Sessions (Primary Payment Flow)

The platform uses **Stripe Checkout Sessions** with hosted checkout pages for:

- Product purchases (local & POD merchandise)
- Event registrations with payment

#### Backend Implementation

**File:** `backend/apps/payments/views.py`

```python
# Create Checkout Session for bag/cart
@api_view(['POST'])
@permission_classes([AllowAny])
def bag_checkout(request):
    """Create Stripe checkout session for shopping bag purchase"""

    # Build line items from bag
    line_items = []
    for item in bag_items:
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

    # Create session with shipping collection
    session = stripe.checkout.Session.create(
        line_items=line_items,
        mode='payment',
        success_url=request.data['success_url'],
        cancel_url=request.data['cancel_url'],
        shipping_address_collection={'allowed_countries': ['US']},
        metadata={
            'bag_id': str(bag.id),
            'user_id': str(request.user.id) if request.user.is_authenticated else '',
            'item_ids': ','.join(str(i.id) for i in bag_items),
        },
    )
    return Response({'url': session.url, 'session_id': session.id})
```

#### Checkout Session Modes

| Mode           | Use Case               | NJ Stars Implementation          |
| -------------- | ---------------------- | -------------------------------- |
| `payment`      | One-time payments      | Merchandise, event registrations |
| `subscription` | Recurring payments     | Team dues, season passes         |
| `setup`        | Save payment for later | Parent portal saved cards        |

### 2. Stripe Products & Prices

Products are synced to Stripe for local merchandise:

**File:** `backend/apps/payments/models.py`

```python
class Product(models.Model):
    # Stripe fields
    stripe_price_id = models.CharField(max_length=255, blank=True)
    stripe_product_id = models.CharField(max_length=255, blank=True)

    def _sync_to_stripe(self):
        """Create or update Stripe product and price"""
        # Create Stripe Product
        stripe_product = stripe.Product.create(
            name=self.name,
            description=self.description[:500],
            metadata={'django_product_id': str(self.pk)},
        )

        # Create Stripe Price (immutable - archive old, create new if changed)
        stripe_price = stripe.Price.create(
            product=self.stripe_product_id,
            unit_amount=int(self.price * 100),
            currency='usd',
        )
```

### 3. Webhook Handler

**Endpoint:** `POST /api/payments/webhook/stripe/`

**File:** `backend/apps/payments/views.py`

```python
@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    # Verify webhook signature
    event = stripe.Webhook.construct_event(
        payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
    )

    # Handle events
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        _process_bag_purchase(session)  # Create Order, fulfill products

    return HttpResponse(status=200)
```

### 4. Subscription Plans (Models Ready)

**File:** `backend/apps/payments/models.py`

```python
class SubscriptionPlan(models.Model):
    """Subscription plans for recurring memberships

    Typical Bergen County AAU Basketball Pricing (2024-2025):
    - Monthly: $175/month
    - Seasonal: $475 for 3-month season
    - Annual: $1,800/year
    - Team Dues (one-time): $950 per season
    """
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    billing_period = models.CharField(
        max_length=20,
        choices=[
            ('monthly', 'Monthly'),
            ('seasonal', 'Seasonal'),
            ('annual', 'Annual'),
            ('one_time', 'One-Time (Team Dues)'),
        ]
    )
    is_team_dues = models.BooleanField(default=False)
    payment_deadline = models.DateField(null=True, blank=True)
    stripe_price_id = models.CharField(max_length=255)
    stripe_product_id = models.CharField(max_length=255)
```

---

## Stripe Products & Their Usage

### For Youth Sports Organizations

| Stripe Product            | Platform Use Case            | Implementation Priority  |
| ------------------------- | ---------------------------- | ------------------------ |
| **Checkout**              | All purchases                | ✅ Implemented           |
| **Billing/Subscriptions** | Monthly/seasonal dues        | 🔄 Ready for activation  |
| **Customer Portal**       | Parents manage subscriptions | 📋 Recommended           |
| **Payment Links**         | Quick signup links           | 📋 Recommended           |
| **Connect**               | Multi-org platform           | 🔮 Future (multi-tenant) |
| **Tax**                   | Automatic tax calculation    | 📋 Optional              |
| **Radar**                 | Fraud prevention             | ✅ Enabled by default    |

---

## API Integration Reference

### Core Stripe APIs Used

#### 1. Checkout Sessions API

**Create Session:**

```python
stripe.checkout.Session.create(
    mode='payment',  # or 'subscription', 'setup'
    line_items=[{
        'price_data': {
            'currency': 'usd',
            'unit_amount': 2500,  # $25.00 in cents
            'product_data': {
                'name': 'NJ Stars Practice Jersey',
                'description': 'Blue / Large',
                'images': ['https://example.com/jersey.jpg'],
            },
        },
        'quantity': 1,
    }],
    success_url='https://njstarselite.com/shop/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url='https://njstarselite.com/shop/cancel',
    shipping_address_collection={'allowed_countries': ['US']},
    customer_email='parent@example.com',
    metadata={
        'order_type': 'merchandise',
        'product_ids': '123,456',
    },
)
```

**Retrieve Session:**

```python
session = stripe.checkout.Session.retrieve(
    'cs_test_xxx',
    expand=['line_items', 'customer']
)
```

#### 2. Payment Intents API

**Retrieve Payment Details:**

```python
payment_intent = stripe.PaymentIntent.retrieve('pi_xxx')

# Access payment details
payment_intent.amount  # Amount in cents
payment_intent.status  # 'succeeded', 'requires_payment_method', etc.
payment_intent.latest_charge  # Charge ID for refunds
```

#### 3. Customers API

**Create/Update Customer:**

```python
# Create customer with Stripe
customer = stripe.Customer.create(
    email='parent@example.com',
    name='John Doe',
    metadata={
        'user_id': '123',
        'role': 'parent',
    }
)

# Store in UserProfile
profile.stripe_customer_id = customer.id
profile.save()
```

#### 4. Subscriptions API (For Team Dues)

**Create Subscription:**

```python
subscription = stripe.Subscription.create(
    customer='cus_xxx',
    items=[{'price': 'price_monthly_dues'}],
    payment_behavior='default_incomplete',
    payment_settings={
        'save_default_payment_method': 'on_subscription',
    },
    expand=['latest_invoice.payment_intent'],
)
```

**Subscription Statuses:**
| Status | Meaning | Action |
|--------|---------|--------|
| `trialing` | Free trial period | Allow access |
| `active` | Paid and current | Allow access |
| `past_due` | Payment failed, retrying | Notify parent |
| `unpaid` | All retries failed | Restrict access |
| `canceled` | Subscription ended | Remove from team |
| `incomplete` | First payment pending | Wait for payment |

#### 5. Refunds API

**Issue Refund:**

```python
refund = stripe.Refund.create(
    payment_intent='pi_xxx',
    amount=1500,  # Partial refund of $15.00
    reason='requested_by_customer',
)
```

---

## Webhook Events

### Critical Events to Handle

| Event                           | When Triggered              | Platform Action                |
| ------------------------------- | --------------------------- | ------------------------------ |
| `checkout.session.completed`    | Payment successful          | Create Order, fulfill products |
| `payment_intent.succeeded`      | Direct payment successful   | Record Payment                 |
| `payment_intent.payment_failed` | Payment declined            | Notify user, retry             |
| `customer.subscription.created` | New subscription            | Activate membership            |
| `customer.subscription.updated` | Plan changed                | Update access level            |
| `customer.subscription.deleted` | Subscription canceled       | Revoke access                  |
| `invoice.paid`                  | Subscription invoice paid   | Renew membership               |
| `invoice.payment_failed`        | Subscription payment failed | Notify parent                  |

### Webhook Implementation Best Practices

```python
@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

    # 1. VERIFY SIGNATURE (Critical for security)
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError:
        return HttpResponse(status=400)  # Invalid payload
    except stripe.error.SignatureVerificationError:
        return HttpResponse(status=400)  # Invalid signature

    # 2. RETURN 200 QUICKLY (prevents timeout retries)
    # Process asynchronously if possible

    # 3. HANDLE IDEMPOTENTLY (webhooks can be sent multiple times)
    event_id = event['id']
    if ProcessedWebhook.objects.filter(stripe_event_id=event_id).exists():
        return HttpResponse(status=200)  # Already processed

    # 4. PROCESS EVENT
    if event['type'] == 'checkout.session.completed':
        handle_checkout_completed(event['data']['object'])
    elif event['type'] == 'customer.subscription.updated':
        handle_subscription_updated(event['data']['object'])

    # 5. MARK AS PROCESSED
    ProcessedWebhook.objects.create(stripe_event_id=event_id)

    return HttpResponse(status=200)
```

---

## Environment Configuration

### Required Environment Variables

```bash
# .env / Railway / Vercel Environment

# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_xxx          # Backend only
STRIPE_PUBLISHABLE_KEY=pk_test_xxx     # Frontend accessible

# Webhook Secret (from Stripe Dashboard > Developers > Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Optional: Stripe Connect (for multi-tenant)
STRIPE_CLIENT_ID=ca_xxx
```

### Django Settings

**File:** `backend/config/settings/base.py`

```python
# Stripe Configuration
STRIPE_SECRET_KEY = env('STRIPE_SECRET_KEY', default='')
STRIPE_PUBLISHABLE_KEY = env('STRIPE_PUBLISHABLE_KEY', default='')
STRIPE_WEBHOOK_SECRET = env('STRIPE_WEBHOOK_SECRET', default='')

# Validate Stripe keys on startup
def _validate_stripe_key(key):
    if not key or 'dummy' in key or '*' in key:
        return False
    return True
```

### Frontend Configuration

**File:** `frontend/.env.local`

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

---

## Testing & Development

### Test Mode

Stripe provides a complete test environment with test API keys (`sk_test_...`, `pk_test_...`).

### Test Card Numbers

| Card Number        | Scenario                          |
| ------------------ | --------------------------------- |
| `4242424242424242` | Successful payment                |
| `4000000000000002` | Card declined                     |
| `4000002500003155` | Requires 3D Secure authentication |
| `4000000000009995` | Insufficient funds                |
| `4000000000000341` | Attach fails with `card_declined` |

**Expiry:** Any future date (e.g., `12/34`)
**CVC:** Any 3 digits (e.g., `123`)
**ZIP:** Any 5 digits (e.g., `12345`)

### Local Webhook Testing

**Using Stripe CLI:**

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:8000/api/payments/webhook/stripe/

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

### Dry Run Mode (POD Products)

For Printify integration testing without real API calls:

```python
# settings/development.py
PRINTIFY_DRY_RUN = True  # Mock Printify orders
```

---

## Future Features & Recommendations

### Phase 2: Subscription Management

**Priority: HIGH** - Essential for team dues

1. **Stripe Customer Portal Integration**

   - Allow parents to manage payment methods
   - Update subscription plans
   - View billing history

   ```python
   session = stripe.billing_portal.Session.create(
       customer=profile.stripe_customer_id,
       return_url='https://njstarselite.com/portal/billing',
   )
   return redirect(session.url)
   ```

2. **Automated Dues Collection**
   - Monthly recurring billing for team memberships
   - Seasonal billing with deadlines
   - Grace period management
3. **Dunning Management**
   - Automatic retry for failed payments
   - Email notifications for parents
   - Status webhooks: `invoice.payment_failed`, `customer.subscription.past_due`

### Phase 3: Stripe Connect (Multi-Tenant Platform)

**Priority: FUTURE** - For scaling to multiple organizations

#### Fee Structure

> ⚠️ **Important:** Platform fees are charged ON TOP OF Stripe's transaction fees (2.9% + $0.30).

| Revenue Type                  | Stripe Fee   | Platform Fee | Recipient Net |
| ----------------------------- | ------------ | ------------ | ------------- |
| Events, merch, tryouts, camps | 2.9% + $0.30 | 20%          | Tenant: ~77%  |
| Coach private training        | 2.9% + $0.30 | 5%           | Coach: ~92%   |

**Example - $100 Coach Private Training Session:**

- Customer pays: $100.00
- Stripe takes: $3.20 (2.9% + $0.30)
- Platform takes: $5.00 (5% of $100)
- Coach receives: $91.80

```
┌──────────────────────────────────────────────────────────────┐
│                    STRYDER LABS PLATFORM                     │
│                    (Connect Platform Account)                │
└───────────────┬────────────────────────────────┬─────────────┘
                │                                │
        ┌───────▼───────┐                ┌───────▼───────┐
        │   NJ STARS    │                │  OTHER ORG    │
        │ (Connected    │                │ (Connected    │
        │  Account)     │                │  Account)     │
        │               │                │               │
        │ Gets ~77-92%  │                │ Gets ~77-92%  │
        │ (after fees)  │                │ (after fees)  │
        └───────────────┘                └───────────────┘
                │                                │
        ┌───────▼───────┐                ┌───────▼───────┐
        │   Parents     │                │   Parents     │
        │  (Customers)  │                │  (Customers)  │
        └───────────────┘                └───────────────┘
```

**Implementation:**

```python
# Create connected account for new organization
account = stripe.Account.create(
    type='express',  # or 'standard', 'custom'
    country='US',
    email='admin@neworg.com',
    capabilities={
        'card_payments': {'requested': True},
        'transfers': {'requested': True},
    },
)

# Create checkout with application fee
session = stripe.checkout.Session.create(
    mode='payment',
    line_items=[...],
    payment_intent_data={
        'application_fee_amount': 100,  # $1.00 platform fee
    },
    stripe_account=connected_account_id,  # Org's Stripe account
)
```

### Recommended Future Features

#### 1. Payment Links (Quick Signup)

Generate shareable links for quick event registration:

```python
payment_link = stripe.PaymentLink.create(
    line_items=[{
        'price': 'price_winter_tryouts',
        'quantity': 1,
    }],
    after_completion={
        'type': 'redirect',
        'redirect': {'url': 'https://njstarselite.com/registration/success'},
    },
)
# Share: payment_link.url
```

#### 2. Saved Payment Methods (Parent Portal)

Allow parents to save cards for faster checkout:

```python
# Create SetupIntent to save card
setup_intent = stripe.SetupIntent.create(
    customer=profile.stripe_customer_id,
    payment_method_types=['card'],
)

# Later, charge saved card
payment_intent = stripe.PaymentIntent.create(
    amount=9500,  # $95.00
    currency='usd',
    customer=profile.stripe_customer_id,
    payment_method=saved_payment_method_id,
    off_session=True,
    confirm=True,
)
```

#### 3. Automatic Tax Calculation

```python
session = stripe.checkout.Session.create(
    mode='payment',
    line_items=[...],
    automatic_tax={'enabled': True},
    shipping_address_collection={'allowed_countries': ['US']},
)
```

#### 4. Discounts & Coupons

```python
# Create coupon for multi-child discount
coupon = stripe.Coupon.create(
    percent_off=10,
    duration='once',
    name='Sibling Discount',
)

# Apply to checkout
session = stripe.checkout.Session.create(
    mode='payment',
    line_items=[...],
    discounts=[{'coupon': coupon.id}],
)
```

#### 5. Invoicing for Schools/Organizations

For team sponsorships or bulk registrations:

```python
invoice = stripe.Invoice.create(
    customer='cus_school',
    collection_method='send_invoice',
    days_until_due=30,
)

# Add items
stripe.InvoiceItem.create(
    customer='cus_school',
    invoice=invoice.id,
    price='price_team_sponsorship',
)

# Send invoice
stripe.Invoice.finalize_invoice(invoice.id)
stripe.Invoice.send_invoice(invoice.id)
```

#### 6. Installment Plans (Payment Schedules)

For large team dues, allow parents to pay in installments:

```python
# Create subscription schedule for payment plan
schedule = stripe.SubscriptionSchedule.create(
    customer='cus_parent',
    start_date='now',
    phases=[{
        'items': [{'price': 'price_dues_installment', 'quantity': 1}],
        'iterations': 4,  # 4 monthly payments
    }],
)
```

### Platform-Specific Feature Ideas

Based on the codebase analysis, here are youth sports-specific features Stripe can enable:

| Feature                    | Description                              | Stripe Product                    |
| -------------------------- | ---------------------------------------- | --------------------------------- |
| **Sibling Discounts**      | Automatic discount for multiple children | Coupons/Promotion Codes           |
| **Early Bird Pricing**     | Time-limited registration discounts      | Prices with active dates          |
| **Payment Plans**          | Split team dues into monthly payments    | Subscription Schedules            |
| **Fundraising**            | Accept donations for travel teams        | Checkout with custom amounts      |
| **Sponsor Invoicing**      | Bill local businesses for sponsorships   | Invoicing API                     |
| **Scholarship Management** | Apply partial credits to registrations   | Customer Balance                  |
| **Refund Automation**      | Weather cancellation refunds             | Refunds API with metadata         |
| **Multi-Player Checkout**  | Register multiple children at once       | Line items per player             |
| **Waitlist Payments**      | Charge when spot opens                   | Payment Intents (delayed capture) |
| **Season Deposits**        | Secure spots with partial payment        | Checkout with deposit pricing     |

---

## Security Best Practices

### 1. API Key Security

```python
# ❌ Never do this
STRIPE_SECRET_KEY = 'sk_live_xxx'  # Hardcoded

# ✅ Always use environment variables
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')
```

### 2. Webhook Signature Verification

**Always verify webhook signatures:**

```python
try:
    event = stripe.Webhook.construct_event(
        payload, sig_header, endpoint_secret
    )
except stripe.error.SignatureVerificationError:
    return HttpResponse(status=400)  # Reject
```

### 3. PCI Compliance

The platform uses **Stripe Checkout** (hosted pages) which means:

- Card data never touches your servers
- You're eligible for **SAQ A** (simplest PCI compliance)
- Stripe handles all card storage and processing

### 4. Idempotency

Always use idempotency keys for create operations:

```python
stripe.PaymentIntent.create(
    amount=1000,
    currency='usd',
    idempotency_key=f'order_{order.id}_payment',
)
```

### 5. HTTPS Only

- All Stripe communication must be over HTTPS
- Webhook endpoints must be HTTPS in production
- SSL certificates must be valid (not self-signed)

---

## Troubleshooting

### Common Issues

#### 1. "Stripe secret key is not configured"

**Cause:** Missing or invalid `STRIPE_SECRET_KEY` environment variable.

**Fix:** Set the environment variable in Railway/Vercel or `.env`:

```bash
STRIPE_SECRET_KEY=sk_test_your_actual_key
```

#### 2. Webhook Signature Verification Failed

**Cause:** Wrong webhook secret or request body modification.

**Fix:**

1. Verify `STRIPE_WEBHOOK_SECRET` matches the endpoint secret in Stripe Dashboard
2. Ensure middleware isn't modifying the request body
3. Use raw body for verification:
   ```python
   payload = request.body  # Not request.data
   ```

#### 3. "No such customer" Error

**Cause:** Customer ID stored in database doesn't exist in Stripe.

**Fix:** Always verify customer exists before operations:

```python
try:
    customer = stripe.Customer.retrieve(profile.stripe_customer_id)
except stripe.error.InvalidRequestError:
    # Create new customer
    customer = stripe.Customer.create(email=user.email)
    profile.stripe_customer_id = customer.id
    profile.save()
```

#### 4. Subscription Status Out of Sync

**Cause:** Missed webhook events.

**Fix:** Implement a sync job that periodically verifies subscription status:

```python
# Management command: sync_stripe_subscriptions
for sub in Subscription.objects.filter(status='active'):
    stripe_sub = stripe.Subscription.retrieve(sub.stripe_subscription_id)
    if stripe_sub.status != sub.status:
        sub.status = stripe_sub.status
        sub.save()
```

### Stripe Dashboard Locations

| Task                    | Dashboard Location                               |
| ----------------------- | ------------------------------------------------ |
| View API keys           | Developers > API keys                            |
| Create webhook endpoint | Developers > Webhooks                            |
| View webhook logs       | Developers > Webhooks > Select endpoint > Events |
| View payment history    | Payments                                         |
| Manage products         | Products                                         |
| View customers          | Customers                                        |
| Create coupons          | Products > Coupons                               |

---

## API Rate Limits

Stripe has generous rate limits for most operations:

| API Category       | Rate Limit          |
| ------------------ | ------------------- |
| Read operations    | 100 requests/second |
| Write operations   | 100 requests/second |
| Webhook deliveries | Unlimited           |

For high-volume operations (like bulk imports), use batch operations or implement exponential backoff.

---

## Related Documentation

### Official Stripe Docs

- [Stripe API Reference](https://docs.stripe.com/api)
- [Checkout Quickstart](https://docs.stripe.com/checkout/quickstart)
- [Webhooks Guide](https://docs.stripe.com/webhooks)
- [Subscriptions Overview](https://docs.stripe.com/billing/subscriptions/overview)
- [Connect Platform Guide](https://docs.stripe.com/connect)

### Platform Documentation

- [CHECKOUT_FLOW.md](../CHECKOUT_FLOW.md) - Complete checkout pipeline documentation
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture overview
- [PRINTIFY/printify-api.md](../PRINTIFY/printify-api.md) - POD integration details

---

## Changelog

| Date       | Change                                      |
| ---------- | ------------------------------------------- |
| 2025-12-12 | Initial comprehensive documentation created |

---

_This documentation is tailored for the NJ Stars Youth Sports Organization Platform by Stryder Labs LLC. For general Stripe documentation, visit [docs.stripe.com](https://docs.stripe.com)._
