# Multi-Shop Architecture Plan

**Status:** Post-MVP Feature
**Priority:** High (after MVP launch Jan 1, 2026)

**Goal:** Allow multiple Printify shops to sell on a combined catalog with Stripe Connect for split payments.

**User Decisions:**
- Payments: Stripe Connect (each shop has own Stripe account, platform takes fee)
- Display: Combined catalog on `/shop` with filter by shop
- Admin: Platform admin creates shop, invites owner to connect Printify/Stripe

---

## Phase 1: Data Models

### 1.1 Shop Model
**File:** `backend/apps/payments/models.py`

```python
class Shop(models.Model):
    # Basic Info
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='shops/logos/', blank=True, null=True)
    logo_url = models.URLField(max_length=500, blank=True)

    # Printify Integration
    printify_api_key = models.CharField(max_length=2000, blank=True)
    printify_shop_id = models.CharField(max_length=100, blank=True)
    printify_webhook_secret = models.CharField(max_length=255, blank=True)

    # Stripe Connect
    stripe_account_id = models.CharField(max_length=255, blank=True)
    stripe_onboarding_complete = models.BooleanField(default=False)
    stripe_charges_enabled = models.BooleanField(default=False)
    stripe_payouts_enabled = models.BooleanField(default=False)

    # Platform Fee
    platform_fee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=15.00)

    # Status
    is_active = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    contact_email = models.EmailField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_printify_configured(self):
        return bool(self.printify_api_key and self.printify_shop_id)

    @property
    def is_stripe_configured(self):
        return bool(self.stripe_account_id and self.stripe_charges_enabled)

    @property
    def can_accept_orders(self):
        return self.is_active and self.is_printify_configured and self.is_stripe_configured
```

### 1.2 ShopMembership Model
```python
class ShopMembership(models.Model):
    ROLE_CHOICES = [('owner', 'Owner'), ('admin', 'Administrator'), ('staff', 'Staff')]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shop_memberships')
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')
    invited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['user', 'shop']
```

### 1.3 ShopInvitation Model
```python
class ShopInvitation(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE)
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=ShopMembership.ROLE_CHOICES)
    token = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
```

### 1.4 Product & Order Updates
```python
# Add to existing Product model
shop = models.ForeignKey('Shop', on_delete=models.CASCADE, related_name='products', null=True)

# Add to existing Order model
shop = models.ForeignKey('Shop', on_delete=models.PROTECT, related_name='orders', null=True)
stripe_transfer_id = models.CharField(max_length=255, blank=True)
platform_fee_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True)
```

---

## Phase 2: Printify Refactoring

**File:** `backend/apps/payments/services/printify_client.py`

```python
class PrintifyClient:
    def __init__(self, api_key=None, shop_id=None, shop=None):
        if shop:
            self.api_key = shop.printify_api_key
            self.shop_id = shop.printify_shop_id
        else:
            self.api_key = api_key or settings.PRINTIFY_API_KEY
            self.shop_id = shop_id or settings.PRINTIFY_SHOP_ID

    @classmethod
    def for_shop(cls, shop):
        if not shop.is_printify_configured:
            raise PrintifyError(f"Shop '{shop.name}' not configured for Printify")
        return cls(shop=shop)
```

---

## Phase 3: Stripe Connect

**New File:** `backend/apps/payments/services/stripe_connect.py`

```python
class StripeConnectService:
    @staticmethod
    def create_connect_account(shop, user_email):
        account = stripe.Account.create(
            type='express',
            email=user_email,
            capabilities={'card_payments': {'requested': True}, 'transfers': {'requested': True}},
            metadata={'shop_id': str(shop.id)}
        )
        shop.stripe_account_id = account.id
        shop.save()
        return account

    @staticmethod
    def create_onboarding_link(shop):
        return stripe.AccountLink.create(
            account=shop.stripe_account_id,
            refresh_url=f"{settings.FRONTEND_URL}/shop/{shop.slug}/connect/refresh",
            return_url=f"{settings.FRONTEND_URL}/shop/{shop.slug}/connect/complete",
            type='account_onboarding'
        ).url

    @staticmethod
    def create_checkout_with_connect(shop, line_items, success_url, cancel_url, metadata=None):
        total_cents = sum(item['price_data']['unit_amount'] * item['quantity'] for item in line_items)
        platform_fee = int(total_cents * float(shop.platform_fee_percent) / 100)

        return stripe.checkout.Session.create(
            line_items=line_items,
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            payment_intent_data={
                'application_fee_amount': platform_fee,
                'transfer_data': {'destination': shop.stripe_account_id}
            },
            metadata={'shop_id': str(shop.id), **(metadata or {})}
        )
```

---

## Phase 4: Webhook Routing

- Route Stripe events by `shop_id` in metadata
- Route Printify events by `shop_id` in payload
- Verify signatures with shop-specific secrets
- Fall back to legacy handlers for backward compatibility

---

## Phase 5: API Updates

```python
class ShopSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = ['id', 'name', 'slug', 'description', 'logo_url', 'is_featured', 'product_count']

# Update ProductSerializer to include shop info
```

**New Routes:**
- `GET /api/payments/shops/` - List active shops
- `GET /api/payments/shops/<slug>/` - Shop detail
- `GET /api/payments/products/?shop=<slug>` - Filter by shop

---

## Phase 6: Frontend Updates

1. Add `selectedShops: string[]` state to shop page
2. Fetch shops from `/api/payments/shops/`
3. Add `ShopFilter` component to sidebar
4. Add shop badge to ProductCard

---

## Phase 7: Django Admin

```python
@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'printify_status', 'stripe_status', 'platform_fee_percent']
    prepopulated_fields = {'slug': ('name',)}
    actions = ['sync_all_products', 'create_stripe_connect_link']
```

---

## Migration Strategy

1. Create models with nullable `shop` FK
2. Run migrations
3. Create default "NJ Stars Elite" shop with existing Printify credentials
4. Link all existing products to default shop
5. (Optional) Make shop FK required later

---

## Files to Modify

| File | Changes |
|------|---------|
| `backend/apps/payments/models.py` | Add Shop, ShopMembership, ShopInvitation; add shop FK to Product, Order |
| `backend/apps/payments/services/printify_client.py` | Add `for_shop()` factory |
| `backend/apps/payments/services/printify_sync.py` | Use shop-specific client |
| `backend/apps/payments/services/stripe_connect.py` | **NEW** - Stripe Connect service |
| `backend/apps/payments/views.py` | Update checkout, webhooks, add shop views |
| `backend/apps/payments/serializers.py` | Add ShopSerializer, update ProductSerializer |
| `backend/apps/payments/urls.py` | Add shop routes |
| `backend/apps/payments/admin.py` | Add ShopAdmin |
| `frontend/src/app/shop/page.tsx` | Add shop filter, shop badge |

---

## Implementation Order

1. **Phase 1** - Create models, run migrations, migrate existing data
2. **Phase 2** - Refactor PrintifyClient for shop-specific credentials
3. **Phase 3** - Implement Stripe Connect service
4. **Phase 4** - Update webhook handlers for multi-shop routing
5. **Phase 5** - Add shop API endpoints and serializers
6. **Phase 6** - Update frontend with shop filter
7. **Phase 7** - Build Django admin interface
