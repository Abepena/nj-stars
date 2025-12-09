# Meeting Notes - December 8, 2025

> **Purpose:** Document deliverables and requirements from stakeholder meeting
> **Attendees:** Development Team, NJ Stars Leadership
> **Related:** [NEXT_STEPS.md](../NEXT_STEPS.md)

---

## Executive Summary

This meeting defined key platform deliverables including coach management with payouts, enhanced Instagram integration ("The Huddle"), tryout registration system, shop UX improvements, and shopping cart functionality. All features should prioritize DRY code principles and componentization.

---

## Team Personnel

### Coaching Staff (To Be Added to Platform)

| Name | Role | Instagram | Notes |
|------|------|-----------|-------|
| **Trajan "Tray" Chapman** | Head Coach & Trainer | [@traygotbounce](https://instagram.com/traygotbounce) | Primary training coach |
| **Chris Morales** | Skills Clinic Coach | [@coach.cee](https://instagram.com/coach.cee) | Runs skills clinics |
| **Kenneth Andrade** | Founder (Coach K) | [@kenny_164](https://instagram.com/kenny_164) | Organization founder |

**Content Permission:** Kenneth Andrade has given full permission to use all images and information from:
- Current website: https://www.njstarseliteaau.com/
- Instagram: @njstarselite_aau

**Bio Sources:**
- About page: https://www.njstarseliteaau.com/about
- Individual Instagram profiles (for photos, highlights, training videos)

---

## New Feature Requirements

### 1. Coach Management System 🔴 HIGH PRIORITY

**Backend Requirements:**
- [ ] Create `Coach` model with fields:
  - Full name, nickname/display name
  - Role/title (Head Coach, Skills Coach, Assistant, Trainer)
  - Bio (rich text)
  - Profile photo
  - Instagram handle (for integration)
  - Email, phone (admin only)
  - Specialties/certifications
  - Active status
- [ ] Superuser/admin can add, edit, deactivate coaches
- [ ] Link coaches to events they're running
- [ ] Coach profile API endpoint for public display

**Frontend Requirements:**
- [ ] Coaches section on About page or dedicated Coaches page
- [ ] Coach cards with photo, name, role, brief bio
- [ ] Link to individual Instagram profiles

---

### 2. Coach Payout System 🔴 HIGH PRIORITY

**Requirements:**
- [ ] Coaches can receive payouts from the platform
- [ ] Track coach earnings from:
  - Private training sessions
  - Event/clinic fees (percentage or flat rate)
  - Future: subscription revenue share
- [ ] Payout management in admin panel
- [ ] Integration with Stripe Connect for automated payouts
- [ ] Coach dashboard showing:
  - Pending earnings
  - Payout history
  - Upcoming sessions

**Data Model Considerations:**
```
CoachProfile
├── user (FK to User - coaches need accounts)
├── coach_details (name, bio, photo, etc.)
├── stripe_connect_account_id
├── payout_schedule (weekly, bi-weekly, monthly)
└── commission_rate (percentage of session fees)

CoachEarning
├── coach (FK to CoachProfile)
├── source_type (session, event, subscription)
├── source_id (FK to related object)
├── amount
├── status (pending, paid, cancelled)
└── payout (FK to Payout, nullable)

Payout
├── coach (FK to CoachProfile)
├── amount
├── status (pending, processing, completed, failed)
├── stripe_transfer_id
└── processed_at
```

---

### 3. Instagram "Huddle" Enhancement 🟠 MEDIUM PRIORITY

**Current State:** Single Instagram account integration

**New Requirements:**
- [ ] Connect multiple coach Instagram accounts on backend
- [ ] Admin toggle to enable/disable fetching from each account
- [ ] Merge posts from all enabled accounts into unified feed
- [ ] Display coach name/handle on each post in the Huddle
- [ ] Pull videos from @njstarselite_aau for hero section (see #7)

**Admin Interface:**
```
Instagram Accounts
├── @njstarselite_aau (team) - ✅ Enabled
├── @traygotbounce (Tray) - ✅ Enabled
├── @coach.cee (Coach Cee) - ⬜ Disabled
└── @kenny_164 (Coach K) - ✅ Enabled
```

**API Changes:**
- [ ] New `InstagramAccount` model to store multiple accounts
- [ ] `is_active` toggle per account
- [ ] Modified fetch to pull from all active accounts
- [ ] Posts tagged with source account for display

---

### 4. Hero Section Video Integration 🟡 MEDIUM PRIORITY

**Requirements:**
- [ ] Pull highlight videos from @njstarselite_aau Instagram
- [ ] Display as hero background with opaque overlay
- [ ] Fallback to static image if video unavailable
- [ ] Video should autoplay, muted, loop
- [ ] Performance: lazy load, don't block page render
- [ ] Mobile: consider bandwidth, may show image instead

**Implementation Notes:**
- Use Instagram Graph API to fetch video posts
- Cache video URLs locally
- Consider hosting videos on Cloudinary/S3 for reliability
- Overlay should match brand (dark with slight transparency)

---

### 5. Tryout Registration Form 🔴 HIGH PRIORITY

**Reference:** [Google Form](https://docs.google.com/forms/d/1i00gs-lvsGbOgTvJCAVqy1emsd1oF0hkdU1tQwaoIUQ/viewform)

**Form Fields (All Required):**
| Field | Type | Options |
|-------|------|---------|
| Player's Full Name | Text | - |
| Player's D.O.B. | Date | MM/DD/YYYY |
| Player's Grade | Select | 3, 4, 5, 6, 7, 8 |
| Player's Jersey Size | Select | Youth M, Youth L, Adult S, Adult M, Adult L, Adult XL |
| Guardian's Full Name | Text | - |
| Guardian's Email | Email | - |
| Guardian's Phone | Phone | - |

**User Flow Requirements:**

```
┌─────────────────────────────────────────────────────────────┐
│                    TRYOUT REGISTRATION                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  IF user is logged in:                                       │
│  ├── Auto-populate guardian info from profile               │
│  ├── Show saved children (if any) with "Select Child" dropdown│
│  └── Allow registering multiple children in one form        │
│                                                              │
│  IF user is NOT logged in:                                   │
│  ├── Show full form                                          │
│  └── After submission, prompt:                               │
│      ├── "Create account with this info?" → Sign up flow    │
│      ├── "Already have an account?" → Login → auto-associate│
│      └── "Continue as guest" → Just submit                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Multi-Child Registration:**
- [ ] Parents can select from saved children profiles
- [ ] "Add another player" button for multiple registrations
- [ ] Single form submission for all children
- [ ] Summary before submit showing all players

**Technical Requirements:**
- [ ] Modal-based form (triggered from events page or CTA)
- [ ] Form validation (client + server side)
- [ ] `TryoutRegistration` model in `apps/registrations/`
- [ ] Email confirmation to guardian
- [ ] Admin export to CSV/Excel

---

### 6. Shop UX Improvements 🔴 HIGH PRIORITY

**Current Issues:**
- Cards have too many buttons cluttering the view
- Users have to navigate to multiple pages to browse
- Poor mobile experience

**New Design Requirements:**

```
┌─────────────────────────────────┐
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │      PRODUCT IMAGE        │  │
│  │                           │  │
│  │   (entire card clickable  │  │
│  │    opens quick view)      │  │
│  │                           │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ ⚫ ⚪ 🔴  (color options)  │  │ ← Only for apparel
│  └───────────────────────────┘  │
│  Product Name                   │
│  $XX.XX                         │
│                                 │
│  [NO BUTTONS ON CARD]           │
└─────────────────────────────────┘
```

**Requirements:**
- [ ] **Card = Quick View trigger** - Clicking anywhere on card opens quick view modal
- [ ] **Remove all buttons from cards** - No "Add to Cart", "Quick View", "Buy Now" on cards
- [ ] **Color/variant swatches** - Show under image for apparel items only
- [ ] **Quick View modal** contains:
  - Full product details
  - Size/color selection
  - Add to Cart button
  - "View Details" link to full product page
- [ ] **Mobile optimized** - Single tap opens quick view, easy to browse

**Rationale:** Reduces visual clutter, improves mobile UX, keeps browsing fast

---

### 7. Shopping Cart Functionality 🔴 CRITICAL

**Current State:** No cart - direct checkout only

**Requirements:**

**Cart Features:**
- [ ] Add to cart from quick view modal
- [ ] Cart icon in header with item count badge
- [ ] Cart drawer/modal (not full page) for quick access
- [ ] Quantity adjustment (+/-)
- [ ] Remove item
- [ ] Size/color display per item
- [ ] Subtotal calculation
- [ ] "Continue Shopping" and "Checkout" buttons

**Persistence:**
- [ ] Logged in users: Cart saved to database
- [ ] Guest users: Cart in localStorage
- [ ] Merge carts on login (localStorage → database)

**Checkout Flow:**
```
Quick View → Add to Cart → Cart Drawer → Checkout (Stripe) → Success
```

**Data Model:**
```
Cart
├── user (FK, nullable for guests)
├── session_key (for guest carts)
├── created_at
└── updated_at

CartItem
├── cart (FK)
├── product (FK)
├── variant (FK, nullable) - for size/color
├── quantity
└── added_at
```

---

## Code Architecture Guidelines

### DRY Principles

- **Componentize repeated UI patterns:**
  - Product cards (shop, featured, related products)
  - Form inputs (tryout form, registration, checkout)
  - Modal containers (quick view, cart, tryout form)
  - Coach cards (about page, team page)

- **Shared hooks:**
  - `useCart()` - cart state management
  - `useAuth()` - authentication state
  - `useInstagram()` - Instagram feed data
  - `useForm()` - form validation and submission

- **API utilities:**
  - Centralized API client with error handling
  - Type-safe response interfaces
  - Caching strategies for Instagram, products

### Suggested Component Structure

```
frontend/src/components/
├── cards/
│   ├── ProductCard.tsx      (clickable → quick view)
│   ├── CoachCard.tsx        (about page)
│   └── EventCard.tsx        (events page)
├── modals/
│   ├── QuickViewModal.tsx   (product details)
│   ├── CartDrawer.tsx       (slide-in cart)
│   └── TryoutFormModal.tsx  (registration)
├── forms/
│   ├── TryoutForm.tsx       (reusable form)
│   ├── PlayerSelector.tsx   (multi-child select)
│   └── FormField.tsx        (DRY input wrapper)
└── layout/
    ├── Hero.tsx             (with video support)
    └── Header.tsx           (with cart icon)
```

---

## Implementation Priority

| Priority | Feature | Effort | Dependencies |
|----------|---------|--------|--------------|
| 🔴 1 | Shopping Cart | 3-5 days | None |
| 🔴 2 | Shop UX (Card = QuickView) | 2-3 days | None |
| 🔴 3 | Tryout Form Modal | 2-3 days | Parent/Child profiles |
| 🔴 4 | Coach Management | 2-3 days | None |
| 🟠 5 | Coach Payouts | 1-2 weeks | Coach Management, Stripe Connect |
| 🟠 6 | Multi-Instagram Huddle | 1 week | Instagram API |
| 🟡 7 | Hero Video Integration | 1-2 days | Instagram API |

---

## Action Items

- [ ] Create `MEETING_NOTES_2025-12-08.md` (this document)
- [ ] Update `NEXT_STEPS.md` with new requirements
- [ ] Check off already-implemented items in NEXT_STEPS.md
- [ ] Begin implementation per priority order

---

## Notes

- **Content Source:** All coach bios, photos, and videos can be pulled from existing njstarseliteaau.com and Instagram
- **Polish Allowed:** Dev team has permission to polish/adapt content to match new site aesthetic
- **Future Consideration:** Report Card Rewards program (mentioned in NEXT_STEPS.md) ties into parent/child portal

---

*Document created: December 8, 2025*
*Next review: TBD*
