# PayPal Integration Guide — NJ Stars

> **Last Updated:** December 2025  
> **Status:** Implementation Guide (Not Yet Implemented)  
> **Purpose:** Add PayPal as an alternative checkout option alongside Stripe

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Decisions](#architecture-decisions)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Order Processing](#order-processing)
6. [Environment Configuration](#environment-configuration)
7. [Testing](#testing)
8. [Webhook Events](#webhook-events)

---

## Overview

Adding PayPal gives customers a trusted, widely-used payment option alongside Stripe.

> ⚠️ **Important:** Stripe's PayPal integration is **NOT available for US-based businesses**.
> Stripe can only manage PayPal as a payment method for businesses in the EEA, UK, Switzerland,
> Liechtenstein, and Norway. For NJ Stars (US-based), we must integrate PayPal directly as a
> separate payment provider.

### Why Add PayPal?

| Benefit               | Description                                    |
| --------------------- | ---------------------------------------------- |
| **Customer Trust**    | PayPal is widely recognized and trusted        |
| **Buyer Protection**  | Some customers prefer PayPal's dispute process |
| **Pay Later Options** | Access to PayPal Credit, Pay in 4              |
| **Venmo Integration** | Reach Venmo's 90M+ user base                   |
| **No Card Entry**     | Faster checkout for PayPal account holders     |

### Transaction Fees

| Provider | Rate                    |
| -------- | ----------------------- |
| Stripe   | 2.9% + $0.30            |
| PayPal   | 2.9% + $0.49 (standard) |

---

## Architecture Decisions

### Current Flow (Stripe Only)

```
Customer → Bag → Checkout Button → Stripe Checkout → Order Created
```

### New Flow (Dual Payment Providers)

```
Customer → Bag → [Pay with Card] or [Pay with PayPal]
                      ↓                    ↓
              Stripe Checkout       PayPal Checkout
                      ↓                    ↓
                 Order Created (same fulfillment flow)
```

### Key Design Principles

1. **Unified Order Model** — Both payment methods create identical `Order` records
2. **Shared Fulfillment** — Printify submission works the same regardless of payment method
3. **Consistent UX** — Success/failure pages handle both providers
4. **Independent Webhooks** — Each provider has its own webhook endpoint

---

## Backend Implementation

### PayPal SDK Overview

PayPal's REST API and JavaScript SDK provide:

- **PayPal Buttons** — Render branded checkout buttons
- **PayPal Orders API** — Create and capture orders server-side
- **PayPal Webhooks** — Receive async payment notifications
- **Pay Later** — Offer installment options to customers
- **Venmo** — Accept Venmo payments (US only)

### PayPal Service Client

Create a new service file:

```python
# backend/apps/payments/services/paypal_client.py
"""
PayPal API Client for Direct Integration

Uses PayPal Orders API v2:
https://developer.paypal.com/docs/api/orders/v2/
"""

import logging
import requests
from typing import Optional
from django.conf import settings
from decimal import Decimal

logger = logging.getLogger(__name__)


class PayPalError(Exception):
    """Exception for PayPal API errors"""
    def __init__(self, message: str, status_code: Optional[int] = None, details: Optional[dict] = None):
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)


class PayPalClient:
    """
    Client for PayPal REST API v2

    Usage:
        client = PayPalClient()
        order = client.create_order(amount=29.99, items=[...])
        capture = client.capture_order(order_id)
    """

    SANDBOX_URL = "https://api-m.sandbox.paypal.com"
    LIVE_URL = "https://api-m.paypal.com"

    def __init__(
        self,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        sandbox: bool = True
    ):
        self.client_id = client_id or getattr(settings, 'PAYPAL_CLIENT_ID', '')
        self.client_secret = client_secret or getattr(settings, 'PAYPAL_CLIENT_SECRET', '')
        self.sandbox = sandbox if sandbox else not getattr(settings, 'PAYPAL_LIVE', False)
        self.base_url = self.SANDBOX_URL if self.sandbox else self.LIVE_URL
        self._access_token = None

    @property
    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)

    def _get_access_token(self) -> str:
        """Get OAuth 2.0 access token from PayPal"""
        if self._access_token:
            return self._access_token

        response = requests.post(
            f"{self.base_url}/v1/oauth2/token",
            auth=(self.client_id, self.client_secret),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={"grant_type": "client_credentials"},
            timeout=30
        )

        if response.status_code != 200:
            raise PayPalError("Failed to get access token", response.status_code)

        self._access_token = response.json()["access_token"]
        return self._access_token

    @property
    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self._get_access_token()}",
            "Content-Type": "application/json",
        }

    def create_order(
        self,
        amount: Decimal,
        currency: str = "USD",
        items: Optional[list] = None,
        shipping: Optional[Decimal] = None,
        description: str = "NJ Stars Order",
        custom_id: Optional[str] = None,
        return_url: str = "",
        cancel_url: str = "",
    ) -> dict:
        """
        Create a PayPal order.

        Args:
            amount: Total order amount
            currency: Currency code (default USD)
            items: List of item dicts with name, quantity, unit_amount
            shipping: Shipping cost
            description: Order description
            custom_id: Your internal order reference
            return_url: URL to redirect after approval
            cancel_url: URL to redirect on cancel

        Returns:
            PayPal order object with 'id' and 'links'
        """
        # Build item breakdown
        item_total = amount - (shipping or Decimal('0'))

        purchase_unit = {
            "description": description,
            "custom_id": custom_id,
            "amount": {
                "currency_code": currency,
                "value": str(amount),
                "breakdown": {
                    "item_total": {
                        "currency_code": currency,
                        "value": str(item_total),
                    }
                }
            }
        }

        if shipping:
            purchase_unit["amount"]["breakdown"]["shipping"] = {
                "currency_code": currency,
                "value": str(shipping),
            }

        if items:
            purchase_unit["items"] = [
                {
                    "name": item["name"][:127],  # PayPal limit
                    "quantity": str(item["quantity"]),
                    "unit_amount": {
                        "currency_code": currency,
                        "value": str(item["unit_amount"]),
                    },
                    "category": "PHYSICAL_GOODS",
                }
                for item in items
            ]

        order_data = {
            "intent": "CAPTURE",
            "purchase_units": [purchase_unit],
            "application_context": {
                "brand_name": "NJ Stars",
                "landing_page": "BILLING",
                "shipping_preference": "GET_FROM_FILE",  # Use PayPal shipping
                "user_action": "PAY_NOW",
                "return_url": return_url,
                "cancel_url": cancel_url,
            }
        }

        response = requests.post(
            f"{self.base_url}/v2/checkout/orders",
            headers=self._headers,
            json=order_data,
            timeout=30
        )

        if response.status_code not in (200, 201):
            error_data = response.json() if response.content else {}
            raise PayPalError(
                error_data.get("message", f"HTTP {response.status_code}"),
                response.status_code,
                error_data
            )

        return response.json()

    def capture_order(self, order_id: str) -> dict:
        """
        Capture an approved PayPal order (collects payment).

        Args:
            order_id: PayPal order ID from create_order

        Returns:
            Captured order with payment details
        """
        response = requests.post(
            f"{self.base_url}/v2/checkout/orders/{order_id}/capture",
            headers=self._headers,
            timeout=30
        )

        if response.status_code not in (200, 201):
            error_data = response.json() if response.content else {}
            raise PayPalError(
                error_data.get("message", f"HTTP {response.status_code}"),
                response.status_code,
                error_data
            )

        return response.json()

    def get_order(self, order_id: str) -> dict:
        """Get order details by ID"""
        response = requests.get(
            f"{self.base_url}/v2/checkout/orders/{order_id}",
            headers=self._headers,
            timeout=30
        )

        if response.status_code != 200:
            raise PayPalError(f"Order not found: {order_id}", response.status_code)

        return response.json()

    @staticmethod
    def verify_webhook_signature(
        transmission_id: str,
        timestamp: str,
        webhook_id: str,
        event_body: str,
        cert_url: str,
        auth_algo: str,
        actual_signature: str,
    ) -> bool:
        """
        Verify PayPal webhook signature.

        Note: For production, implement full signature verification.
        This is a simplified version.
        """
        # In production, verify using PayPal's verification endpoint:
        # POST /v1/notifications/verify-webhook-signature
        return True  # Simplified for guide


# Singleton
_paypal_client: Optional[PayPalClient] = None


def get_paypal_client() -> PayPalClient:
    global _paypal_client
    if _paypal_client is None:
        _paypal_client = PayPalClient()
    return _paypal_client
```

### PayPal Checkout Views

Add new checkout endpoints for PayPal:

```python
# backend/apps/payments/views.py

from .services.paypal_client import get_paypal_client, PayPalError

@api_view(['POST'])
@permission_classes([AllowAny])
def paypal_create_order(request):
    """Create PayPal order for bag checkout"""
    try:
        paypal = get_paypal_client()
        if not paypal.is_configured:
            return Response(
                {"error": "PayPal is not configured"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        bag = get_or_create_bag(request)
        if bag.item_count == 0:
            return Response(
                {'error': 'Bag is empty'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return_url = request.data.get('return_url')
        cancel_url = request.data.get('cancel_url')
        item_ids = request.data.get('item_ids')

        if not return_url or not cancel_url:
            return Response(
                {'error': 'return_url and cancel_url are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get bag items
        bag_items = bag.items.select_related('product').all()
        if item_ids:
            bag_items = bag_items.filter(id__in=item_ids)

        # Build PayPal items
        items = []
        subtotal = Decimal('0')

        for item in bag_items:
            unit_price = item.unit_price
            items.append({
                "name": item.product.name,
                "quantity": item.quantity,
                "unit_amount": unit_price,
            })
            subtotal += unit_price * item.quantity

        # Create PayPal order
        # Note: Shipping calculated later or use flat rate
        paypal_order = paypal.create_order(
            amount=subtotal,
            items=items,
            description=f"NJ Stars Order - {len(items)} item(s)",
            custom_id=f"bag:{bag.id}|items:{','.join(str(i.id) for i in bag_items)}",
            return_url=return_url,
            cancel_url=cancel_url,
        )

        # Find approval URL
        approval_url = next(
            (link['href'] for link in paypal_order.get('links', [])
             if link['rel'] == 'approve'),
            None
        )

        return Response({
            'order_id': paypal_order['id'],
            'approval_url': approval_url,
        })

    except PayPalError as e:
        logger.error(f"PayPal create order error: {e.message}")
        return Response(
            {'error': e.message},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def paypal_capture_order(request):
    """Capture PayPal order after customer approval"""
    try:
        paypal_order_id = request.data.get('order_id')
        if not paypal_order_id:
            return Response(
                {'error': 'order_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        paypal = get_paypal_client()

        # Capture the payment
        captured = paypal.capture_order(paypal_order_id)

        if captured.get('status') != 'COMPLETED':
            return Response(
                {'error': 'Payment not completed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Extract order info from custom_id
        custom_id = captured['purchase_units'][0].get('custom_id', '')
        # Parse: "bag:123|items:1,2,3"
        bag_id = None
        item_ids = []
        for part in custom_id.split('|'):
            if part.startswith('bag:'):
                bag_id = int(part.split(':')[1])
            elif part.startswith('items:'):
                item_ids = [int(i) for i in part.split(':')[1].split(',')]

        if not bag_id:
            return Response(
                {'error': 'Invalid order reference'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get payment details
        capture = captured['purchase_units'][0]['payments']['captures'][0]

        # Process the order (reuse existing logic)
        bag = Bag.objects.get(id=bag_id)
        bag_items = bag.items.filter(id__in=item_ids)

        # Get shipping from PayPal
        shipping_info = captured['purchase_units'][0].get('shipping', {})
        address = shipping_info.get('address', {})

        with transaction.atomic():
            # Create Order (same structure as Stripe flow)
            order = Order.objects.create(
                user=bag.user,
                order_number=f"NJS-{uuid.uuid4().hex[:8].upper()}",
                status='paid',
                paypal_order_id=paypal_order_id,
                paypal_capture_id=capture['id'],
                # Shipping from PayPal
                shipping_name=shipping_info.get('name', {}).get('full_name', ''),
                shipping_address_line1=address.get('address_line_1', ''),
                shipping_address_line2=address.get('address_line_2', ''),
                shipping_city=address.get('admin_area_2', ''),
                shipping_state=address.get('admin_area_1', ''),
                shipping_zip=address.get('postal_code', ''),
                shipping_country=address.get('country_code', 'US'),
                # Totals
                subtotal=Decimal(capture['amount']['value']),
                total=Decimal(capture['amount']['value']),
            )

            # Create OrderItems (same as existing flow)
            pod_items = []
            for bag_item in bag_items:
                order_item = OrderItem.objects.create(
                    order=order,
                    product=bag_item.product,
                    product_name=bag_item.product.name,
                    product_price=bag_item.unit_price,
                    selected_size=bag_item.selected_size,
                    selected_color=bag_item.selected_color,
                    quantity=bag_item.quantity,
                    fulfillment_type=bag_item.product.fulfillment_type,
                )

                # Decrement stock for local products
                if bag_item.product.manage_inventory:
                    bag_item.product.stock_quantity -= bag_item.quantity
                    bag_item.product.save()

                # Track POD items
                if bag_item.product.is_pod:
                    pod_items.append(order_item)

            # Submit POD items to Printify
            if pod_items:
                _submit_printify_order(order, pod_items)

            # Clear bag items
            bag_items.delete()

        return Response({
            'success': True,
            'order_number': order.order_number,
            'order_id': order.id,
        })

    except PayPalError as e:
        logger.error(f"PayPal capture error: {e.message}")
        return Response(
            {'error': e.message},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

### URL Configuration

```python
# backend/apps/payments/urls.py

from .views import paypal_create_order, paypal_capture_order

urlpatterns = [
    # ... existing patterns ...

    # PayPal endpoints
    path('checkout/paypal/create/', paypal_create_order, name='paypal-create-order'),
    path('checkout/paypal/capture/', paypal_capture_order, name='paypal-capture-order'),
]
```

---

## Frontend Implementation

### Dual Button Checkout Component

```tsx
// frontend/src/components/checkout/payment-buttons.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PaymentButtonsProps {
  onStripeCheckout: () => Promise<void>;
  onPayPalCheckout: () => Promise<void>;
  disabled?: boolean;
}

export function PaymentButtons({
  onStripeCheckout,
  onPayPalCheckout,
  disabled,
}: PaymentButtonsProps) {
  const [loading, setLoading] = useState<"stripe" | "paypal" | null>(null);

  const handleStripe = async () => {
    setLoading("stripe");
    try {
      await onStripeCheckout();
    } finally {
      setLoading(null);
    }
  };

  const handlePayPal = async () => {
    setLoading("paypal");
    try {
      await onPayPalCheckout();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Stripe Button */}
      <Button
        onClick={handleStripe}
        disabled={disabled || loading !== null}
        className="w-full h-12 bg-[#635BFF] hover:bg-[#5851db] text-white"
      >
        {loading === "stripe" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <svg
              className="h-5 w-5 mr-2"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              {/* Stripe logo SVG */}
            </svg>
            Pay with Card
          </>
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      {/* PayPal Button */}
      <Button
        onClick={handlePayPal}
        disabled={disabled || loading !== null}
        variant="outline"
        className="w-full h-12 border-[#0070ba] text-[#0070ba] hover:bg-[#0070ba]/5"
      >
        {loading === "paypal" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <svg
              className="h-5 w-5 mr-2"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              {/* PayPal logo SVG */}
            </svg>
            Pay with PayPal
          </>
        )}
      </Button>
    </div>
  );
}
```

### Using PayPal JS SDK (Alternative)

For native PayPal buttons with better UX:

```tsx
// frontend/src/components/checkout/paypal-button.tsx
"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/toast";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: PayPalButtonConfig) => {
        render: (selector: string) => void;
      };
    };
  }
}

interface PayPalButtonConfig {
  style?: { layout?: string; color?: string; shape?: string; label?: string };
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string }) => Promise<void>;
  onError?: (err: Error) => void;
  onCancel?: () => void;
}

interface PayPalButtonProps {
  bagItems: number[];
  onSuccess: (orderNumber: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function PayPalButton({ bagItems, onSuccess }: PayPalButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    // Load PayPal SDK
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    script.onload = () => {
      if (window.paypal && containerRef.current) {
        window.paypal
          .Buttons({
            style: {
              layout: "vertical",
              color: "gold",
              shape: "rect",
              label: "paypal",
            },
            createOrder: async () => {
              const response = await fetch(
                `${API_BASE}/api/payments/checkout/paypal/create/`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    item_ids: bagItems,
                    return_url: `${window.location.origin}/shop/success`,
                    cancel_url: `${window.location.origin}/shop/bag`,
                  }),
                }
              );
              const data = await response.json();
              if (!response.ok) throw new Error(data.error);
              return data.order_id;
            },
            onApprove: async (data) => {
              const response = await fetch(
                `${API_BASE}/api/payments/checkout/paypal/capture/`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ order_id: data.orderID }),
                }
              );
              const result = await response.json();
              if (!response.ok) throw new Error(result.error);

              onSuccess(result.order_number);
            },
            onError: (err) => {
              console.error("PayPal error:", err);
              toast.error("Payment failed. Please try again.");
            },
            onCancel: () => {
              toast.info("Payment cancelled.");
            },
          })
          .render(containerRef.current);
      }
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [bagItems, onSuccess, toast]);

  return <div ref={containerRef} className="w-full" />;
}
```

### Updated Bag Page

```tsx
// frontend/src/app/shop/bag/page.tsx (excerpt)

import { PaymentButtons } from "@/components/checkout/payment-buttons";
// or
import { PayPalButton } from "@/components/checkout/paypal-button";

export default function BagPage() {
  const [bagItems, setBagItems] = useState([]);
  const router = useRouter();

  const handleStripeCheckout = async () => {
    const response = await fetch(`${API_BASE}/api/payments/checkout/bag/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/shop/bag`,
      }),
    });
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  const handlePayPalCheckout = async () => {
    const response = await fetch(
      `${API_BASE}/api/payments/checkout/paypal/create/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          return_url: `${origin}/shop/paypal-return`,
          cancel_url: `${origin}/shop/bag`,
        }),
      }
    );
    const data = await response.json();
    if (data.approval_url) {
      window.location.href = data.approval_url;
    }
  };

  return (
    <div>
      {/* Bag items list */}

      {/* Payment options */}
      <PaymentButtons
        onStripeCheckout={handleStripeCheckout}
        onPayPalCheckout={handlePayPalCheckout}
        disabled={bagItems.length === 0}
      />

      {/* Or use native PayPal button */}
      {/* <PayPalButton 
        bagItems={bagItems.map(i => i.id)} 
        onSuccess={(orderNum) => router.push(`/shop/success?order=${orderNum}`)}
      /> */}
    </div>
  );
}
```

---

## Order Processing

Both payment methods should create identical `Order` records. Add PayPal fields to the model:

```python
# backend/apps/payments/models.py

class Order(models.Model):
    # Existing fields...

    # Payment provider tracking
    payment_provider = models.CharField(
        max_length=20,
        choices=[('stripe', 'Stripe'), ('paypal', 'PayPal')],
        default='stripe'
    )

    # Stripe fields (existing)
    stripe_session_id = models.CharField(max_length=255, blank=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)

    # PayPal fields (new)
    paypal_order_id = models.CharField(max_length=255, blank=True)
    paypal_capture_id = models.CharField(max_length=255, blank=True)
```

---

## Environment Configuration

```bash
# .env

# PayPal Sandbox (Development)
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_LIVE=false

# PayPal Live (Production)
# PAYPAL_CLIENT_ID=your_live_client_id
# PAYPAL_CLIENT_SECRET=your_live_client_secret
# PAYPAL_LIVE=true

# Frontend
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_client_id
```

### Getting PayPal Credentials

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Create a **Sandbox** app for testing
3. Copy Client ID and Secret
4. For production, create a **Live** app

---

## Testing

### Sandbox Test Accounts

PayPal provides sandbox buyer/seller accounts:

1. Go to Developer Dashboard → Sandbox → Accounts
2. Use the "Personal" account email to test purchases
3. Default password: usually shown in account details

### Test Credit Cards

In sandbox, use these test cards:

- **Visa:** 4111111111111111
- **MasterCard:** 5555555555554444
- **Amex:** 378282246310005

---

## Summary

### Implementation Checklist

- [ ] PayPal Developer account created
- [ ] Sandbox app created for testing
- [ ] Environment variables configured (both backend and frontend)
- [ ] `PayPalClient` service implemented
- [ ] Create/capture endpoints added and tested
- [ ] Order model updated with PayPal fields
- [ ] Frontend payment buttons render correctly
- [ ] PayPal popup flow works end-to-end
- [ ] Order created successfully after capture
- [ ] Printify submission works for POD items
- [ ] Inventory decremented for local items
- [ ] Success page shows correct order info
- [ ] PayPal webhook endpoint configured (optional but recommended)

### Maintenance Considerations

With dual payment providers, you'll need to:

1. **Monitor two dashboards** — Stripe Dashboard + PayPal Business
2. **Handle two refund flows** — Each has different processes
3. **Reconcile separately** — Export reports from both for accounting
4. **Update two SDKs** — Keep both client libraries current

---

## Webhook Events

Configure webhooks at: `https://your-domain.com/api/payments/webhook/paypal/`

| Event                       | Description                   | Action                    |
| --------------------------- | ----------------------------- | ------------------------- |
| `PAYMENT.CAPTURE.COMPLETED` | Payment captured successfully | Confirm order status      |
| `PAYMENT.CAPTURE.DENIED`    | Payment was denied            | Cancel/flag order         |
| `PAYMENT.CAPTURE.REFUNDED`  | Payment was refunded          | Update order status       |
| `CHECKOUT.ORDER.APPROVED`   | Order approved by customer    | (Handled in capture flow) |

Implement a `paypal_webhook` view similar to `stripe_webhook` to handle these events for order status updates and refund processing.
