# Portal MVP Implementation Checklist

## Overview
Parent/Player Portal MVP with Parent Dashboard as top priority. Mobile-first, clean UI.

**Target Launch:** TBD
**Status:** In Progress

---

## Phase 1: Backend Foundation

### Models (`apps/portal/models.py`)
- [ ] UserProfile (extends User with role, address, auto_pay, stripe_customer_id)
- [ ] Player (children/athletes with emergency contacts, medical notes)
- [ ] GuardianRelationship (M2M parent-child link)
- [ ] DuesAccount (per-player balance tracking)
- [ ] DuesTransaction (payment/charge history)
- [ ] SavedPaymentMethod (Stripe cards on file)
- [ ] PromoCredit (loyalty/referral credits)
- [ ] EventCheckIn (check-in status for registrations)

### Permissions (`apps/portal/permissions.py`)
- [ ] IsParentOrStaff
- [ ] IsPlayerOrGuardian
- [ ] IsStaffMember

### Serializers (`apps/portal/serializers.py`)
- [ ] UserProfileSerializer
- [ ] PlayerSummarySerializer / PlayerDetailSerializer
- [ ] GuardianRelationshipSerializer
- [ ] DuesAccountSerializer / DuesTransactionSerializer
- [ ] SavedPaymentMethodSerializer
- [ ] PromoCreditSerializer
- [ ] EventCheckInSerializer
- [ ] ParentDashboardSerializer

### Views (`apps/portal/views.py`)
- [ ] UserProfileViewSet
- [ ] PlayerViewSet (with schedule/dues actions)
- [ ] DuesAccountViewSet
- [ ] SavedPaymentMethodViewSet
- [ ] PromoCreditViewSet
- [ ] EventCheckInViewSet
- [ ] parent_dashboard view
- [ ] staff_dashboard view

### Admin (`apps/portal/admin.py`)
- [ ] UserProfileAdmin
- [ ] PlayerAdmin
- [ ] GuardianRelationshipAdmin
- [ ] DuesAccountAdmin
- [ ] EventCheckInAdmin

### Signals (`apps/portal/signals.py`)
- [ ] Auto-create UserProfile on User creation

---

## Phase 2: Frontend Portal

### Layout & Navigation
- [ ] Portal layout with sidebar (`/portal/dashboard/layout.tsx`)
- [ ] Mobile-responsive navigation
- [ ] Role-based nav items (parent vs staff)

### Parent Dashboard (`/portal/dashboard/page.tsx`)
- [ ] Welcome header with user name
- [ ] Quick stats row (Children, Events, Balance, Credits)
- [ ] Active check-ins alert card
- [ ] Children tabs with profiles
- [ ] Upcoming events list
- [ ] Quick actions grid

### Children Pages (`/portal/children/`)
- [ ] Children list/overview page
- [ ] Child profile detail page
- [ ] Child schedule page
- [ ] Child dues page
- [ ] Add child form

### Billing Pages (`/portal/billing/`)
- [ ] Billing overview with balance
- [ ] Payment methods management
- [ ] Payment history
- [ ] Auto-pay toggle

### Other Pages
- [ ] Orders page
- [ ] Order detail page
- [ ] Profile page with edit
- [ ] Promo credits page

### Staff Pages (`/portal/admin/`)
- [ ] Admin dashboard with stats
- [ ] Check-in management
- [ ] Roster view

---

## Phase 3: Integration

### API Client (`lib/api-client.ts`)
- [ ] getParentDashboard()
- [ ] getChildren() / getPlayer()
- [ ] createPlayer() / updatePlayer()
- [ ] getPlayerSchedule() / getPlayerDues()
- [ ] getPaymentMethods() / setDefaultPaymentMethod()
- [ ] getPromoCredits()
- [ ] updateProfile() / toggleAutoPay()

### Authentication
- [ ] Capture role from backend in NextAuth
- [ ] Role-based route protection
- [ ] Staff permission checks

---

## Phase 4: Polish & Testing

- [ ] Mobile responsiveness audit
- [ ] Loading states for all async operations
- [ ] Error handling with toast notifications
- [ ] Backend API tests
- [ ] Frontend component tests
- [ ] End-to-end flow testing

---

## Notes

- Parents are paying clients - UX is top priority
- 13+ players can have their own accounts (COPPA)
- Hybrid payment model: monthly dues + event fees
- Staff see same portal with additional admin tabs
