# Meeting Notes - December 9, 2025

> **Purpose:** Document additional platform requirements including custom products, coach payments, revenue sharing, and Instagram API integration
> **Attendees:** Abraham Pena (Developer, @pena_abraham), Kenny Andrade (Founder, @kenny_164)
> **Related:** [NEXT_STEPS.md](../NEXT_STEPS.md) | [Dec 8 Meeting Notes](./MEETING_NOTES_2025-12-08.md)

---

## Executive Summary

This meeting focused on monetization and revenue sharing for the platform. Kenny confirmed a 20% platform fee on all website revenue (camps, tournaments, events, merch, tryouts). Additionally, we discussed a custom products/services system for coaches to create one-off invoices for private training, and fair revenue splits for coach-generated business.

---

## Revenue Sharing Agreement

### Platform Revenue Split (20%)

Kenny has agreed to share **20% of all revenue** generated through the NJ Stars website with the developer. This applies to:

| Revenue Source | Platform Fee |
|----------------|--------------|
| Event registrations (camps, tournaments, tryouts) | 20% |
| Merch sales | 20% |
| Open gym fees | 20% |
| Team dues | 20% |
| Subscription payments | 20% |

**Exclusions:**
- Individual coaches' private lessons/clinics (separate agreement needed)
- Cash/Venmo/Zelle transactions outside the platform

### Coach Private Training Revenue (TBD)

For private training sessions booked through the platform, we need to establish a fair split that:
1. Incentivizes coaches to use the platform instead of cash/Venmo/Zelle
2. Provides value to coaches (payment processing, scheduling, legitimacy)
3. Compensates the platform fairly for the infrastructure

**Proposed Options:**

| Option | Platform Fee | Coach Receives | Rationale |
|--------|--------------|----------------|-----------|
| **A: Low Fee** | 5% | 95% | Encourages adoption, minimal friction |
| **B: Standard** | 10% | 90% | Covers processing + platform costs |
| **C: Full Service** | 15% | 85% | Includes scheduling, reminders, admin |

**Recommendation:** Start with **Option A (5%)** to encourage platform adoption. Coaches currently use DMs, Cash App, Venmo, Zelle - we need to offer a compelling reason to switch. Once volume increases, can revisit.

**Benefits for Coaches Using Platform:**
- Professional invoicing with NJ Stars branding
- Automatic payment tracking for taxes
- Client management and history
- Legitimacy and trust (credit card payments)
- No chasing payments - automatic collection
- Integration with potential future coach portal (earnings dashboard, calendar)

---

## New Feature Requirements

### 1. Custom Products/Services System 🔴 HIGH PRIORITY

**Use Case:**
A client wants something specific (custom training package, specialty clinic, extra sessions). Instead of handling payment through DMs/Cash App, the coach can:
1. Create a custom product/invoice on the platform
2. Share a link with the client
3. Client pays via Stripe
4. Coach gets paid through the platform's payout system

**Example Flow:**
```
1. Client DMs coach: "Can you do 5 private sessions for my son?"
2. Coach logs into platform → Creates custom service:
   - Title: "5-Session Training Package - [Player Name]"
   - Description: Custom details
   - Price: $200
   - Recipient email (optional - for invoice)
3. Platform generates shareable link: /pay/custom/abc123
4. Client clicks link → Sees professional invoice page → Pays with card
5. Money goes to platform Stripe
6. Coach sees earnings in dashboard
7. Payout to coach per schedule (minus agreed platform fee)
```

**Backend Requirements:**

```python
# New models in apps/payments/models.py

class CustomProduct(models.Model):
    """One-off custom products/services created by coaches"""

    # Creator
    coach = models.ForeignKey('core.Coach', on_delete=models.CASCADE, related_name='custom_products')

    # Product details
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    # Recipient (optional - for targeted invoices)
    recipient_email = models.EmailField(blank=True)
    recipient_name = models.CharField(max_length=100, blank=True)

    # URL
    slug = models.SlugField(unique=True)  # Auto-generated short code

    # Status
    status = models.CharField(max_length=20, choices=[
        ('active', 'Active'),
        ('paid', 'Paid'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ], default='active')

    # Payment tracking
    stripe_payment_intent_id = models.CharField(max_length=100, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    # Expiration (optional)
    expires_at = models.DateTimeField(null=True, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']


class CustomProductPayment(models.Model):
    """Record of payment for custom product"""

    custom_product = models.OneToOneField(CustomProduct, on_delete=models.CASCADE, related_name='payment')

    # Payer info
    payer_email = models.EmailField()
    payer_name = models.CharField(max_length=100)

    # Payment details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    platform_fee = models.DecimalField(max_digits=10, decimal_places=2)
    coach_earnings = models.DecimalField(max_digits=10, decimal_places=2)

    # Stripe
    stripe_payment_intent_id = models.CharField(max_length=100)
    stripe_charge_id = models.CharField(max_length=100, blank=True)

    # Timing
    paid_at = models.DateTimeField(auto_now_add=True)
```

**API Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/custom-products/` | POST | Create custom product (coach only) |
| `/api/custom-products/` | GET | List coach's custom products |
| `/api/custom-products/{slug}/` | GET | Get public invoice page data |
| `/api/custom-products/{slug}/checkout/` | POST | Create Stripe checkout session |
| `/api/custom-products/{slug}/cancel/` | POST | Cancel custom product |

**Frontend Requirements:**

1. **Coach Dashboard (Future):**
   - "Create Custom Invoice" button
   - Form: title, description, price, optional recipient email
   - List of created invoices with status
   - Copy link button

2. **Public Invoice Page (`/pay/[slug]`):**
   - Professional branded page
   - Coach name/photo
   - Service title and description
   - Price
   - Pay Now button → Stripe Checkout
   - Success/cancelled pages

**UI Mockup - Invoice Page:**
```
┌─────────────────────────────────────────────┐
│            NJ Stars Elite                   │
│                                             │
│  ┌────────┐                                 │
│  │ [Photo]│  Coach Tray                     │
│  └────────┘  @traygotbounce                 │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  5-Session Training Package                 │
│                                             │
│  Custom training package for [Player].      │
│  Includes ball handling, shooting, and      │
│  game IQ development.                       │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  Amount Due:                     $200.00    │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │           Pay Now                    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Secure payment powered by Stripe           │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 2. Coach Payout Infrastructure 🔴 HIGH PRIORITY

Building on Dec 8 requirements, we now have clarity on revenue splits:

**Platform Fee Structure:**

| Source | Total | Platform | Coach |
|--------|-------|----------|-------|
| Custom products/private training | 100% | 5% | 95% |
| Coach-led events/clinics | 100% | 20% | 80% |
| Team events (camps, tournaments) | 100% | 20% | 0% (team) |
| Merch sales | 100% | 20% | N/A |

**Stripe Connect Setup:**
- Each coach needs a Stripe Connect Express account
- Platform fee deducted automatically on payout
- Weekly or bi-weekly payouts (configurable)

**Implementation Priority:**
1. First: Get custom products working with manual payouts
2. Second: Integrate Stripe Connect for automated payouts
3. Third: Build coach dashboard with earnings tracking

---

### 3. Instagram API Integration 🟠 MEDIUM PRIORITY

**Goal:** Access thumbnails and media from NJ Stars Instagram for website assets.

**⚠️ IMPORTANT: API Deprecation Notice**
The Instagram Basic Display API was **deprecated on December 4, 2024**. As of 2025, all Instagram integrations must use the **Instagram Graph API**, which requires:
- Business or Creator account (not personal)
- Connected Facebook Page
- Facebook Developer App approval

**Accounts to Connect:**
| Account | Handle | Type Needed | Status |
|---------|--------|-------------|--------|
| Team | @njstarselite_aau | Business/Creator | TBD |
| Tray | @traygotbounce | Business/Creator | TBD |
| Coach Cee | @coach.cee | Business/Creator | TBD |
| Kenny | @kenny_164 | Business/Creator | TBD |
| **Developer** | **@pena_abraham** | Business/Creator | **Initial Setup** |

**Initial API Setup:** Abraham (@pena_abraham) will connect his account first to test the Graph API integration and establish the developer app. Once verified working, coach accounts can be added.

**Action Required:** Verify all coach Instagram accounts are Business or Creator accounts. If not, they need to convert (free, done in Instagram settings).

**API Options (2025):**

| API | Access Level | Requirements |
|-----|--------------|--------------|
| **Instagram Graph API** | Business/Creator accounts | Facebook Page connection, App approval |
| **oEmbed** | Public posts only | Just a URL, limited data (embeds only) |
| ~~Basic Display API~~ | ~~Deprecated~~ | ~~No longer available~~ |

**Recommended Approach:**

1. **Immediate:** Use oEmbed for embedding posts (no API key needed, limited)
2. **This Week:** Set up Instagram Graph API:
   - Create Facebook Developer App
   - Connect team Instagram to Facebook Page
   - Request `instagram_basic` and `instagram_content_publish` permissions
   - Generate long-lived access tokens
3. **Ongoing:** Auto-refresh tokens (60-day expiry)

**Instagram Graph API Setup Steps:**
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create new app → Select "Business" type
3. Add "Instagram Graph API" product
4. Connect Instagram Business account
5. Generate access token with permissions:
   - `instagram_basic` - Read profile and media
   - `instagram_manage_insights` - Analytics (optional)
6. Test with Graph API Explorer

**API Endpoints:**
```
GET /me/media - List user's media
GET /{media-id}?fields=id,media_type,media_url,thumbnail_url,caption,timestamp
```

**oEmbed Fallback (No Auth):**
```javascript
// For embedding public posts only
const response = await fetch(
  `https://graph.facebook.com/v18.0/instagram_oembed?url=${postUrl}&access_token=${appToken}`
);
// Returns: thumbnail_url, html (embed code), author_name
```

**Resources:**
- [Instagram Graph API Guide 2025](https://elfsight.com/blog/instagram-graph-api-complete-developer-guide-for-2025/)
- [Meta Developer Docs](https://developers.facebook.com/docs/instagram-api/)

---

## UI/UX Updates (Completed Today)

### Shop Page Improvements

- [x] **Sticky sidebar filters** - Categories now in left sidebar, sticky on scroll
- [x] **Card click = QuickView** - Entire product card is clickable, no buttons
- [x] **Removed "NJ Stars" from product names** - Implied by context
- [x] **Updated product images** - Better basketball/apparel photos from Unsplash
- [x] **Product tags** - Featured, Best Seller, Sale badges on cards

### Coach Management (Completed)

- [x] Coach model with full profile fields
- [x] Django admin interface
- [x] API endpoint `/api/coaches/`
- [x] Seeded with Tray, Coach Cee, Coach K
- [x] CoachCard component
- [x] CoachesSection on homepage

---

## Action Items

### Immediate (This Week)

1. [ ] **Instagram API setup** - Get Basic Display API access
2. [ ] Document revenue sharing agreement formally
3. [ ] Begin CustomProduct model implementation

### Short-term (Next 2 Weeks)

4. [ ] Build custom invoice creation flow
5. [ ] Create public invoice page
6. [ ] Stripe checkout integration for custom products
7. [ ] Manual payout tracking in admin

### Medium-term (Month 1)

8. [ ] Stripe Connect integration
9. [ ] Coach dashboard with earnings
10. [ ] Automated payout scheduling
11. [ ] Multi-Instagram account management

---

## Notes

- Kenny is flexible on platform fees - priority is getting coaches to use the platform
- Consider offering first month free for coaches to encourage adoption
- Custom products could also be used for merchandise customization requests (custom jerseys, etc.)
- Keep track of all platform revenue for quarterly reconciliation with Kenny

---

*Next meeting: TBD - Review custom products implementation progress*
