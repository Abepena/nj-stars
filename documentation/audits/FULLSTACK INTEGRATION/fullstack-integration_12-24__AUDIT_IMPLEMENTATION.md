# Full-Stack Integration Implementation Checklist

> **Generated:** December 9, 2024
> **Platform:** NJ Stars Elite AAU
> **Integration Health Score:** 78%

---

## Priority Legend

| Priority | Label | Description |
|----------|-------|-------------|
| 🔴 P0 | Critical | Blocking production launch - must fix immediately |
| 🟠 P1 | High | Core functionality gaps - fix before launch |
| 🟡 P2 | Medium | Important but has workarounds - fix in next sprint |
| 🟢 P3 | Low | Nice to have - can defer to Phase 2 |

---

## Executive Summary

| Category | Count | Status |
|----------|-------|--------|
| Fully Connected | 18 | Working end-to-end |
| Partial Integration | 2 | Needs completion |
| Missing Integration | 4 | Backend or frontend needed |
| UI Only | 11 | Display components (no API) |
| **Critical Bugs** | **0** | **All P0 items fixed!** |

> **Update (Dec 9, 2024):** All P0 (Critical) and P1 (High Priority) items have been completed. Product variants now work end-to-end from QuickView → Cart → Checkout. Dashboard stats now fetch from real API.

---

## Section 1: Critical Bugs (P0)

### 1.1 Product Variants Missing from Quick View

**Severity:** 🔴 Critical - Customers can't select size/color before adding to cart

**Issue:** ProductQuickView modal has no size/color selection. Users can only add products without specifying variants, leading to incorrect orders.

**Current State:**
- Product detail page (`/shop/[slug]`) has variant selectors (size, color)
- Quick View modal shows product but NO variant selection
- Most users will use Quick View → add items with wrong/default variants

**Files to Update:**

- [x] `frontend/src/components/product-quick-view.tsx` ✅ COMPLETED
  - Add size selector dropdown (if product category has sizes)
  - Add color selector swatches (if product has colors)
  - Update "Add to Bag" to pass selected variants
  - Reuse variant config from `VARIANT_CONFIGS` in `shop/[slug]/page.tsx`

**Implementation:**
```typescript
// In ProductQuickView component
const [selectedSize, setSelectedSize] = useState<string>('')
const [selectedColor, setSelectedColor] = useState<string>('')

// Get variants based on category
const variantConfig = VARIANT_CONFIGS[product.category] || {}
const sizes = variantConfig.sizes || []
const colors = variantConfig.colors || []

// In JSX - add before quantity selector
{sizes.length > 0 && (
  <div className="space-y-2">
    <Label>Size</Label>
    <Select value={selectedSize} onValueChange={setSelectedSize}>
      {sizes.map(size => <SelectItem key={size} value={size}>{size}</SelectItem>)}
    </Select>
  </div>
)}

// Update add to bag call
await addToBag(product.id, quantity, selectedSize, selectedColor)
```

**Estimated Effort:** 1-2 hours

---

### 1.2 Hardcoded API URLs

**Severity:** 🔴 Critical - Will break in production

**Issue:** Two files use hardcoded `http://localhost:8000` instead of environment variable.

**Files to Fix:**

- [x] `frontend/src/app/shop/page.tsx` (line ~223) ✅ ALREADY FIXED
  ```typescript
  // Already uses process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  ```

- [x] `frontend/src/components/checkout-button.tsx` (line ~30) ✅ ALREADY FIXED
  ```typescript
  // Already uses process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  ```

**Estimated Effort:** 15 minutes

---

## Section 2: High Priority Integration Gaps (P1)

### 2.1 Product Variants Not Persisted to Cart

**Severity:** 🟠 High - Customers can't order specific sizes/colors

**Current State:**
- UI allows size/color selection on product detail page
- Selected variants are NOT saved when adding to cart
- Cart items have no variant information

**Backend Changes:**

- [x] Update `CartItem` model in `backend/apps/payments/models.py` ✅ COMPLETED
  ```python
  class CartItem(models.Model):
      cart = models.ForeignKey(Cart, ...)
      product = models.ForeignKey(Product, ...)
      quantity = models.PositiveIntegerField(default=1)
      selected_size = models.CharField(max_length=20, blank=True, null=True)  # ADDED
      selected_color = models.CharField(max_length=50, blank=True, null=True)  # ADDED
      added_at = models.DateTimeField(auto_now_add=True)
  ```

- [x] Create migration: `python manage.py makemigrations payments` ✅ COMPLETED
- [x] Apply migration: `python manage.py migrate` ✅ COMPLETED

- [x] Update `CartItemSerializer` in `backend/apps/payments/serializers.py` ✅ COMPLETED
  ```python
  class CartItemSerializer(serializers.ModelSerializer):
      # ... existing fields
      selected_size = serializers.CharField(required=False, allow_null=True)
      selected_color = serializers.CharField(required=False, allow_null=True)
  ```

- [x] Update `AddToCartSerializer` to accept variant fields ✅ COMPLETED

**Frontend Changes:**

- [x] Update `BagItem` interface in `frontend/src/lib/bag.tsx` ✅ COMPLETED
  ```typescript
  export interface BagItem {
      // ... existing fields
      selected_size?: string
      selected_color?: string
  }
  ```

- [x] Update `addToBag` function to pass variants ✅ COMPLETED
  ```typescript
  const addToBag = async (productId: number, quantity = 1, size?: string, color?: string) => {
      body: JSON.stringify({ product_id: productId, quantity, selected_size: size, selected_color: color }),
  }
  ```

- [x] Update `frontend/src/app/shop/[slug]/page.tsx` to pass selected variants ✅ COMPLETED

- [x] Update `BagDrawer` to display selected variants on items ✅ COMPLETED

**Estimated Effort:** 2-3 hours

---

### 2.2 Portal Dashboard Mock Data

**Severity:** 🟠 High - Dashboard shows fake stats

**Current State:**
- Dashboard shows hardcoded "3 upcoming events", "5 unread announcements"
- No real user data fetched

**Backend Changes:**

- [x] Create dashboard stats endpoint in `backend/apps/core/views.py` ✅ COMPLETED
  ```python
  @api_view(['GET'])
  @permission_classes([IsAuthenticated])
  def dashboard_stats(request):
      user = request.user

      # Get upcoming events user is registered for
      upcoming_events = EventRegistration.objects.filter(
          user=user,
          event__start_datetime__gte=timezone.now()
      ).count()

      # Get recent orders
      recent_orders = Order.objects.filter(user=user).count()

      # Payment status (check for outstanding balance)
      has_outstanding = ... # your logic

      return Response({
          'upcoming_events': upcoming_events,
          'recent_orders': recent_orders,
          'payment_status': 'current' if not has_outstanding else 'outstanding',
          'unread_announcements': 0,  # Future feature
      })
  ```

- [x] Add URL in `backend/apps/core/urls.py` ✅ COMPLETED
  ```python
  path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
  ```

**Frontend Changes:**

- [x] Update `frontend/src/app/portal/dashboard/page.tsx` ✅ COMPLETED
  ```typescript
  const [stats, setStats] = useState({ upcoming_events: 0, recent_orders: 0, payment_status: 'current' })

  useEffect(() => {
      async function fetchStats() {
          const response = await fetch(`${API_BASE}/api/dashboard/stats/`, {
              headers: { Authorization: `Bearer ${session.accessToken}` }
          })
          if (response.ok) setStats(await response.json())
      }
      if (session) fetchStats()
  }, [session])
  ```

**Estimated Effort:** 2-3 hours

---

## Section 3: Medium Priority Integrations (P2)

### 3.1 Event Registration Flow ✅ COMPLETED

**Severity:** 🟡 Medium - Core feature missing frontend

**Current State:**
- Backend endpoint exists: `POST /api/events/registrations/`
- Events page shows "Register" buttons
- ✅ Registration modal implemented
- ✅ Modal wired to events page Register buttons (Dec 9, 2024)
- ✅ Waiver step added with check for existing waiver
- ✅ Stripe payment flow implemented for paid events

**Frontend Changes:**

- [x] Create `EventRegistrationModal` component ✅ COMPLETED
  - Participant info form (name, email, phone, emergency contact)
  - Shows event details and price
  - Submits to `/api/events/registrations/`
  - Multi-step flow: confirm → waiver → details → payment → success

- [x] Update Events page to open modal on "Register" click ✅ COMPLETED (Dec 9, 2024)
  - Register buttons now show/hide based on registration status
  - "Registered" indicator shows for already-registered events
  - Works in both list and calendar views

- [x] Registration success shown in modal ✅ COMPLETED

- [x] Waiver System ✅ COMPLETED (Dec 9, 2024)
  - Backend: `GET /api/portal/waiver/status/` - Check waiver status
  - Backend: `POST /api/portal/waiver/sign/` - Sign waiver
  - UserProfile model has waiver fields (waiver_signed_at, waiver_version, waiver_signer_name)
  - Waiver step appears only for first-time registrations (or when version updates)
  - Once signed, waiver covers all future registrations

- [x] Payment Flow ✅ COMPLETED (Dec 9, 2024)
  - Uses existing `POST /api/payments/event-checkout/` endpoint
  - Enhanced to accept registration_id for tracking
  - Stripe webhook updated to mark registration as paid
  - Frontend redirects to Stripe checkout for paid events

**Files Created/Updated:**
- `frontend/src/components/event-registration-modal.tsx` ✅
- `frontend/src/app/events/page.tsx` ✅ (wiring)
- `backend/apps/portal/views.py` ✅ (waiver endpoints)
- `backend/apps/portal/serializers.py` ✅ (waiver serializers)
- `backend/apps/portal/urls.py` ✅ (waiver routes)
- `backend/apps/payments/views.py` ✅ (enhanced checkout, webhook)

**Estimated Effort:** 4-6 hours

---

### 3.2 Newsletter Subscription ✅ COMPLETED

**Severity:** 🟡 Medium - Marketing feature not functional

**Current State:**
- `NewsletterSignup` component exists
- ✅ Backend endpoint created and connected

**Backend Changes:**

- [x] Create `NewsletterSubscriber` model in `backend/apps/core/models.py` ✅ COMPLETED
  ```python
  class NewsletterSubscriber(models.Model):
      email = models.EmailField(unique=True)
      first_name = models.CharField(max_length=100, blank=True)
      status = models.CharField(...)  # active, unsubscribed, bounced
      subscribe_events = models.BooleanField(default=True)
      subscribe_news = models.BooleanField(default=True)
      subscribe_promotions = models.BooleanField(default=True)
      subscribed_at = models.DateTimeField(auto_now_add=True)
      source = models.CharField(...)  # website, checkout, portal
  ```

- [x] Create serializer and view ✅ COMPLETED
- [x] Add URL: `path('newsletter/subscribe/', ...)` ✅ COMPLETED
- [x] Add unsubscribe endpoint ✅ COMPLETED

**Frontend Changes:**

- [x] Update `NewsletterSignup` component to call API ✅ COMPLETED
- [x] Error message display ✅ COMPLETED

**Estimated Effort:** 1-2 hours

---

### 3.3 API Client Consistency

**Severity:** 🟡 Medium - Code maintainability issue

**Current State:**
- Centralized `api-client.ts` exists with methods
- Most components make direct `fetch()` calls instead

**Recommendation:** Refactor components to use `apiClient` singleton for:
- Consistent error handling
- Automatic token management
- Single source of truth for base URL

**Files to Update:**
- [ ] `frontend/src/app/shop/page.tsx` - use `apiClient.getProducts()`
- [ ] `frontend/src/app/events/page.tsx` - use `apiClient.getEvents()`
- [ ] `frontend/src/components/news-feed.tsx` - use `apiClient.getBlogPosts()`
- [ ] `frontend/src/components/coaches-section.tsx` - use `apiClient.getCoaches()`

**Estimated Effort:** 2-3 hours (incremental)

---

## Section 4: Low Priority / Future Features (P3)

### 4.1 Team Page Integration

**Backend Status:** ✅ Complete (TeamPage, PlayerProfile models)
**Frontend Status:** ❌ Not built

- [ ] Create `/team` or `/roster` page
- [ ] Fetch from `/api/v2/pages/?type=cms.TeamPage`
- [ ] Display player profiles with headshots

**Estimated Effort:** 3-4 hours

---

### 4.2 Subscription Plans

**Backend Status:** ✅ Complete (SubscriptionPlan model, API)
**Frontend Status:** ❌ Not built

- [ ] Create `/membership` or `/plans` page
- [ ] Display subscription options
- [ ] Integrate with Stripe subscription checkout

**Estimated Effort:** 4-6 hours

---

### 4.3 Order History

**Backend Status:** ⚠️ Model exists, no API
**Frontend Status:** ❌ Not built

- [ ] Create `OrderSerializer` and `OrderViewSet`
- [ ] Create `/portal/orders` page
- [ ] Show past purchases with status

**Estimated Effort:** 3-4 hours

---

### 4.4 User Profile Management

**Backend Status:** ⚠️ User model exists
**Frontend Status:** ❌ Not built

- [ ] Create profile update API endpoint
- [ ] Create `/portal/profile` page
- [ ] Allow name, phone, address updates

**Estimated Effort:** 2-3 hours

---

## Section 5: Unused Backend Endpoints

These endpoints are fully implemented but have no frontend consumer:

| Endpoint | Description | Recommendation |
|----------|-------------|----------------|
| `GET /api/coaches/{slug}/` | Single coach detail | Build coach detail page |
| `GET /api/events/{slug}/` | Single event detail | Build event detail modal/page |
| `GET /api/events/registrations/` | List user's registrations | Show in portal dashboard |
| `GET /api/events/registrations/upcoming/` | Upcoming registered events | Show in portal dashboard |
| `GET /api/events/registrations/past/` | Past registered events | Show in portal dashboard |
| `GET /api/payments/subscription-plans/` | Membership plans | Build membership page |
| `GET /api/v2/pages/?type=cms.TeamPage` | Team roster | Build team/roster page |
| `GET /api/v2/pages/?type=cms.BlogIndexPage` | Blog index | Build dedicated blog page |

---

## Recommended Implementation Order

### Week 1: Critical Fixes
1. **Day 1:** Fix hardcoded API URLs (P0) - 15 min
2. **Day 1-2:** Implement product variants (P1) - 2-3 hours
3. **Day 3:** Dashboard real data (P1) - 2-3 hours

### Week 2: Core Features
4. **Day 1-2:** Event registration flow (P2) - 4-6 hours
5. **Day 3:** Newsletter subscription (P2) - 1-2 hours
6. **Day 4-5:** API client refactor (P2) - 2-3 hours

### Week 3-4: Enhancements
7. Team page integration (P3)
8. Subscription plans page (P3)
9. Order history (P3)
10. User profile management (P3)

---

## Testing Checklist

### Before Production Launch
- [ ] All P0 bugs fixed
- [ ] All P1 integrations complete
- [ ] Test checkout flow end-to-end
- [ ] Test on mobile devices
- [ ] Test with real Stripe test cards
- [ ] Verify all environment variables set

### After Each Integration
- [ ] Unit tests for new API endpoints
- [ ] Component tests for new React components
- [ ] Manual smoke test of affected features
- [ ] Check error handling and edge cases

---

## Environment Variables Required

### Frontend (Vercel/Netlify)
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXTAUTH_URL=https://your-frontend.vercel.app
NEXTAUTH_SECRET=<generate-with-openssl>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Backend (Railway/Heroku)
```bash
DATABASE_URL=postgresql://...
SECRET_KEY=<generate-with-openssl>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://your-frontend.vercel.app
DJANGO_SETTINGS_MODULE=config.settings.production
```

---

## Related Documentation

- [Visual Audit Report](./fullstack-integration_12-24__audit.html)
- [Rebuild Progress](../REBUILD_PROGRESS.md)
- [Next Steps Roadmap](../NEXT_STEPS.md)
- [Architecture Overview](../ARCHITECTURE.md)

---

*Generated by Claude Code Full-Stack Integration Audit*
