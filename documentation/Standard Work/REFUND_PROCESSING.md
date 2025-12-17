# How to Process a Refund

> **Last Updated:** December 2025
> **Applies To:** Merchandise Orders, Event Registrations

---

## Overview

Refunds are processed in **two steps**:
1. **Issue the refund** via Stripe Dashboard (actual money transfer)
2. **Update the status** in your admin panel (record keeping)

---

## When to Issue a Refund

### Merchandise Orders

| Situation | Refund Policy |
|-----------|---------------|
| **Order not shipped yet** | Full refund |
| **Item damaged in shipping** | Full refund or replacement |
| **Wrong item sent** | Full refund or exchange |
| **Customer changed mind** | Case-by-case (within 7 days) |
| **POD item (Printify)** | See special handling below |

### Event Registrations

| Situation | Refund Policy |
|-----------|---------------|
| **Event canceled by NJ Stars** | Full refund |
| **More than 7 days before event** | Full refund minus processing fee |
| **Less than 7 days before event** | 50% refund or credit |
| **No-show** | No refund (offer credit for next event) |
| **Medical emergency** | Full refund with documentation |

---

## Step-by-Step: Processing a Refund

### Step 1: Find the Payment in Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Click **Payments** in the left sidebar
3. Find the payment by:
   - Customer email
   - Order number (in metadata)
   - Date range
   - Amount

### Step 2: Issue the Refund in Stripe

1. Click on the payment to open details
2. Click **Refund** button (top right)
3. Choose refund amount:
   - **Full refund**: Leave amount as-is
   - **Partial refund**: Enter specific amount
4. Add a reason (for your records):
   - `requested_by_customer`
   - `duplicate`
   - `fraudulent`
5. Click **Refund**

**Important:** The refund will appear on the customer is statement within 5-10 business days.

### Step 3: Update Order Status in Admin

1. Go to `/cms-admin/`
2. Navigate to **Shop** -> **Orders**
3. Find the order by order number or customer email
4. Click to edit
5. Change **Status** to **Refunded**
6. Save

### Step 4: Notify the Customer

Send an email to the customer confirming:
- Refund amount
- Expected timeframe (5-10 business days)
- Reason (if appropriate)

**Template:**
```
Subject: Your NJ Stars Refund Has Been Processed

Hi [Name],

Your refund of $[Amount] has been processed and will appear on your
statement within 5-10 business days.

Refund Details:
- Order: #[Order Number]
- Amount: $[Amount]
- Date Processed: [Todays Date]

If you have any questions, please reply to this email.

Thank you,
NJ Stars Elite
```

---

## Special Case: Printify (POD) Orders

Print-on-demand items require extra consideration:

### If Order NOT Yet Submitted to Printify
- Full refund is straightforward
- Cancel the order in your system before Printify processes it

### If Order Already in Production
1. Check Printify order status at [printify.com](https://printify.com/app/orders)
2. If **not yet shipped**: Cancel in Printify first, then refund
3. If **already shipped**:
   - You will be charged by Printify regardless
   - Decide if customer returns item or keeps it
   - Issue refund based on your policy

### Printify Cancellation Steps
1. Go to [Printify Orders](https://printify.com/app/orders)
2. Find the order
3. Click **Cancel Order** (only available before shipping)
4. Then process refund in Stripe

---

## Processing Event Registration Refunds

### Step 1: Find Registration in Admin

1. Go to `/cms-admin/`
2. Navigate to **Events & Programs** -> **Registrations**
3. Filter by event or search by participant name/email

### Step 2: Issue Refund in Stripe

Same process as orders - find the payment in Stripe Dashboard and refund.

### Step 3: Update Registration Status

1. Edit the registration
2. Change **Payment Status** to **Refunded**
3. Save

### Step 4: Handle Waitlist (if applicable)

If the event was full:
1. Check if there is a waitlist
2. Contact next person on waitlist
3. Offer the now-available spot

---

## Partial Refunds

Sometimes you need to refund only part of an order:

| Scenario | How to Handle |
|----------|---------------|
| **One item in multi-item order** | Partial refund for that items cost |
| **Shipping only** | Refund shipping amount only |
| **Goodwill discount** | Refund a percentage as customer service |

In Stripe, simply enter the partial amount when processing the refund.

---

## Record Keeping

Always document refunds:

1. **In Stripe**: Use the "Reason" field and add notes
2. **In Admin**: Update status to "Refunded"
3. **In Your Records**: Keep a simple log if needed

### Refund Log Template (Optional)

| Date | Order/Reg # | Customer | Amount | Reason | Processed By |
|------|-------------|----------|--------|--------|--------------|
| 12/17/25 | ORD-001 | John D. | $45.00 | Item damaged | Admin |

---

## Common Questions

### Q: Customer says refund did not arrive?
- Refunds take 5-10 business days
- Check Stripe Dashboard to confirm it was processed
- If processed, ask customer to check with their bank

### Q: Can I refund to a different card?
- No, Stripe refunds go back to the original payment method
- For exceptions, you would need to send a manual payment (not recommended)

### Q: What if the customer disputes (chargeback) before I can refund?
- Respond to the dispute in Stripe Dashboard
- Provide evidence (order details, communications)
- If you were going to refund anyway, you can accept the dispute

### Q: Is there a time limit on refunds?
- Stripe allows refunds up to 180 days after payment
- After 180 days, you would need to send a separate payment

---

## Quick Reference

| Action | Where |
|--------|-------|
| Issue refund | [Stripe Dashboard](https://dashboard.stripe.com/payments) |
| Update order status | `/cms-admin/` -> Shop -> Orders |
| Update registration status | `/cms-admin/` -> Events & Programs -> Registrations |
| Check Printify status | [Printify Orders](https://printify.com/app/orders) |

---

## Need Help?

- **Stripe Support**: [support.stripe.com](https://support.stripe.com)
- **Printify Support**: [help.printify.com](https://help.printify.com)
- **Platform Support**: Contact your developer
