# Stripe Payment Methods Setup Guide

This guide explains how to enable additional payment methods (Google Pay, Apple Pay, PayPal, Klarna, etc.) for the NJ Stars checkout experience.

## Overview

Stripe Checkout supports multiple payment methods that can be enabled **without any code changes**. Most configuration happens in the Stripe Dashboard.

### Available Payment Methods

| Method | Availability | Setup Location |
|--------|-------------|----------------|
| Credit/Debit Cards | Default | Automatic |
| Apple Pay | Dashboard toggle | Stripe Dashboard |
| Google Pay | Dashboard toggle | Stripe Dashboard |
| PayPal | Dashboard toggle | Stripe Dashboard |
| Klarna (Buy Now, Pay Later) | Dashboard toggle | Stripe Dashboard |
| Affirm (Buy Now, Pay Later) | Dashboard toggle | Stripe Dashboard |
| Amazon Pay | Dashboard toggle | Stripe Dashboard |
| Link (Stripe's fast checkout) | Dashboard toggle | Stripe Dashboard |
| Shop Pay | **Not available** | Shopify-exclusive |

> **Note**: Shop Pay is exclusive to Shopify's ecosystem and cannot be added to Stripe Checkout directly.

---

## Step-by-Step Setup

### 1. Access Payment Methods Settings

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Settings** (gear icon in the top right)
3. Click **Payment methods** under the "Payments" section
4. Or go directly to: `https://dashboard.stripe.com/settings/payment_methods`

### 2. Enable Google Pay

1. In Payment methods settings, find **Google Pay**
2. Click the toggle to **Enable**
3. No additional configuration needed - it will appear automatically for supported browsers/devices

**Requirements:**
- Customer must be on a device/browser that supports Google Pay
- Works on Chrome, Android devices, and other compatible browsers

### 3. Enable Apple Pay

1. In Payment methods settings, find **Apple Pay**
2. Click the toggle to **Enable**
3. Verify your domain (if not already done):
   - Go to **Settings > Payment methods > Apple Pay**
   - Add your domain: `njstarselite.com`
   - Download the verification file and host it at:
     ```
     https://njstarselite.com/.well-known/apple-developer-merchantid-domain-association
     ```

**Requirements:**
- Customer must be on Safari (macOS/iOS) or another Apple Pay-enabled browser
- Domain must be verified with Apple

### 4. Enable PayPal

1. In Payment methods settings, find **PayPal**
2. Click **Enable**
3. You'll be prompted to connect your PayPal Business account
4. Follow the OAuth flow to link your PayPal account to Stripe
5. Once connected, PayPal will appear as an option in Checkout

**Requirements:**
- PayPal Business account required
- Available in supported countries (US, UK, EU, etc.)

### 5. Enable Klarna (Buy Now, Pay Later)

1. In Payment methods settings, find **Klarna**
2. Click **Enable**
3. Review and accept Klarna's terms
4. Klarna will appear for eligible transactions

**Requirements:**
- Minimum/maximum order amounts may apply
- Available in US, UK, and select EU countries
- Customer eligibility determined by Klarna

### 6. Enable Link (Stripe's Fast Checkout)

1. In Payment methods settings, find **Link**
2. Click **Enable**
3. Link allows returning customers to checkout with saved payment info

**Benefits:**
- Faster checkout for returning customers
- Automatically saves payment details (with consent)
- Reduces cart abandonment

---

## Code Reference

Our current checkout implementation in `/backend/apps/payments/views.py` uses:

```python
checkout_session = stripe.checkout.Session.create(
    payment_method_types=['card'],  # This can be removed!
    line_items=[...],
    mode='payment',
    ...
)
```

### Option A: Let Stripe Decide (Recommended)

Remove `payment_method_types` entirely to let Stripe show all enabled payment methods:

```python
checkout_session = stripe.checkout.Session.create(
    # payment_method_types removed - Stripe will use Dashboard settings
    line_items=[...],
    mode='payment',
    ...
)
```

### Option B: Explicitly Specify Methods

Or explicitly list desired methods:

```python
checkout_session = stripe.checkout.Session.create(
    payment_method_types=[
        'card',
        'paypal',
        'klarna',
        'affirm',
        # Note: apple_pay and google_pay are included in 'card'
    ],
    line_items=[...],
    mode='payment',
    ...
)
```

> **Important**: Apple Pay and Google Pay are automatically included when `card` is enabled. They don't need separate entries.

---

## Testing Payment Methods

### Test Mode
In Stripe's test mode, you can simulate different payment methods:

- **Cards**: Use test card numbers like `4242 4242 4242 4242`
- **PayPal**: Test mode shows a simulated PayPal flow
- **Google Pay**: May not appear in test mode on all devices
- **Apple Pay**: Requires real Apple device with Sandbox account

### Going Live
1. Switch Stripe to **Live mode** in the Dashboard
2. Ensure all payment methods are enabled in Live mode (settings are separate)
3. Update environment variables with Live API keys:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLIC_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## Recommended Configuration for NJ Stars

For an AAU basketball merch store, we recommend enabling:

1. **Cards** (default) - Credit/debit cards
2. **Apple Pay** - Popular with iOS users (many parents)
3. **Google Pay** - Popular with Android users
4. **Link** - Faster checkout for returning customers
5. **PayPal** - Trusted payment option, especially for online purchases

### Optional (Consider Your Audience)
- **Klarna/Affirm** - Buy Now Pay Later (useful for higher-priced items)
- **Amazon Pay** - If your customers frequently use Amazon

---

## Troubleshooting

### Payment method not appearing?

1. **Check Dashboard settings** - Ensure it's enabled in the correct mode (Test/Live)
2. **Check eligibility** - Some methods have country/currency restrictions
3. **Check device** - Apple Pay only shows on Apple devices, etc.
4. **Check code** - If using `payment_method_types`, ensure method is listed

### Apple Pay domain verification failed?

1. Ensure the verification file is accessible at the exact path
2. Check that HTTPS is properly configured
3. Verify no redirects are interfering with the verification URL

### PayPal connection issues?

1. Ensure you have a PayPal Business account (not Personal)
2. Try disconnecting and reconnecting the PayPal integration
3. Contact Stripe support if OAuth flow fails

---

## Resources

- [Stripe Payment Methods Settings](https://dashboard.stripe.com/settings/payment_methods)
- [Google Pay Documentation](https://docs.stripe.com/google-pay)
- [Apple Pay Documentation](https://docs.stripe.com/apple-pay)
- [PayPal via Stripe](https://docs.stripe.com/payments/paypal)
- [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element)

---

*Last updated: December 2025*
