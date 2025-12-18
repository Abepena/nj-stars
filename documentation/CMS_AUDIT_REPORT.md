# CMS & Admin Audit Report

> **Generated:** December 16, 2025
> **Target:** Production-ready handoff to non-technical client
> **Platform:** LEAG / NJ Stars Elite AAU

---

## Executive Summary

This audit assesses the current Django Admin and Wagtail CMS configuration for readiness to hand off to a non-technical business owner. The platform has **strong foundational admin customizations** (particularly in Payments and Events), but requires **consolidation and workflow enhancements** before an owner can operate independently.

### Key Findings

| Area | Current Score | Target Score | Status |
|------|---------------|--------------|--------|
| Admin Discoverability | ~~2/5~~ **4/5** | 5/5 | ✅ Unified in Wagtail via ModelAdmin |
| Field Labeling | 4/5 | 5/5 | Minor improvements needed |
| Workflow Support | 2/5 | 4/5 | CRUD-only, no guided workflows |
| Error Prevention | 3/5 | 5/5 | Basic validation exists |
| Visual Hierarchy | ~~3/5~~ **4/5** | 5/5 | ✅ Consistent badges & groupings |
| Dashboard/Metrics | ~~0/5~~ **4/5** | 5/5 | ✅ Dashboard panel implemented |
| Reporting | ~~0/5~~ **4/5** | 4/5 | ✅ Financial reports complete |

**Overall Readiness: 70% → Target: 90%**

> **Last Status Update:** December 17, 2025

---

## Phase 1: Entity Inventory

### 1.1 Model Registry Overview

**31 models registered across Django Admin + Wagtail:**

| App | Models | Owner Relevance | Current UX Quality |
|-----|--------|-----------------|-------------------|
| **core** | Coach, InstagramPost, NewsletterSubscriber | High | Good (3.5/5) |
| **events** | Event, CalendarSource | High | Very Good (4/5) |
| **payments** | Product, Order, Subscription, Payment, etc. | Critical | Excellent (4.5/5) |
| **portal** | Player, UserProfile, DuesAccount, etc. | High | Good (3.5/5) |
| **registrations** | EventRegistration | Critical | Basic (2.5/5) |
| **cms** (Wagtail) | HomePage, BlogPage, TeamPage | Critical | Good (4/5 - Wagtail native) |

### 1.2 Detailed Entity Assessment

#### CRITICAL - Daily/Weekly Usage

| Model | Business Purpose | Owner Needs | Current State |
|-------|------------------|-------------|---------------|
| **Event** | Tryouts, camps, practices | Create, edit, view registrations | Well-organized fieldsets, sync actions |
| **EventRegistration** | Signups for events | View, approve, export | Basic - needs status workflow |
| **Product** | Merch store items | Add products, manage inventory | Excellent - bulk upload, variants |
| **Order** | Purchase records | View, fulfill, refund | Good - inline items |
| **BlogPage** | News/announcements | Write, publish, schedule | Wagtail native - good |
| **Coach** | Staff profiles | Update bios, photos | Well-organized |
| **Player** | Team roster | Manage roster, contacts | Good fieldsets |

#### HIGH - Weekly/Monthly Usage

| Model | Business Purpose | Owner Needs | Current State |
|-------|------------------|-------------|---------------|
| **HomePage** | Website hero, CTAs | Update messaging, toggles | Wagtail native - good |
| **NewsletterSubscriber** | Email list | View subscribers, export | Has fieldsets, actions |
| **DuesAccount** | Player balances | View balances, record payments | Has inline transactions |
| **SubscriptionPlan** | Membership tiers | Configure pricing | Basic but functional |

#### LOW/SYSTEM - Rarely Needed

| Model | Business Purpose | Owner Needs | Recommendation |
|-------|------------------|-------------|----------------|
| **InstagramPost** | Cached social posts | None (auto-synced) | Hide or read-only |
| **CalendarSource** | iCal sync config | One-time setup | Hide after setup |
| **Payment** | Payment records | View-only | Read-only admin |
| **Bag/BagItem** | Shopping carts | None (user-facing) | Hide from admin |
| **ProductImage** | Product gallery | Via Product inline | Already inline |
| **ProductVariant** | Size/color options | Via Product inline | Already inline |

### 1.3 Data Volumes (Current)

```
Events:              9
Products:           13
Orders:              0
Players:             0
User Profiles:       1
Event Registrations: 0
Blog Posts:          0 (seed data available)
Coaches:             0 (seed data available)
```

**Note:** This is a fresh/development environment. Production will have significantly more data.

---

## Phase 2: Gap Analysis

### 2.1 Owner Capability Matrix

#### Tier 1: Daily Operations (MUST BE EFFORTLESS)

| Capability | Current State | Gap | Priority |
|------------|---------------|-----|----------|
| View today's schedule | ❌ No dashboard | Build dashboard widget | P0 |
| See recent registrations | ❌ Separate admin page | Dashboard + quick filters | P0 |
| See recent payments/orders | ✅ Order admin exists | Add to dashboard | P1 |
| Quick announcement | ❌ Must navigate to Wagtail | Quick-post widget | P1 |
| Dashboard metrics | ❌ None | Build metrics dashboard | P0 |

#### Tier 2: Weekly Management (SHOULD BE STRAIGHTFORWARD)

| Capability | Current State | Gap | Priority |
|------------|---------------|-----|----------|
| Create/edit events | ✅ Good fieldsets | Add preview | P2 |
| Manage registration settings | ✅ On Event model | Add guided workflow | P2 |
| Update team roster | ✅ Player admin | Add bulk import | P2 |
| Financial reports | ❌ None | Build report views | P1 |
| Publish blog posts | ✅ Wagtail works | Simplify access | P2 |

#### Tier 3: Periodic Configuration (CAN REQUIRE LEARNING)

| Capability | Current State | Gap | Priority |
|------------|---------------|-----|----------|
| Season/program setup | ⚠️ Manual via Events | Add season model | P3 |
| Email templates | ❌ Hardcoded | Template editor | P3 |
| Staff permissions | ✅ Django groups | Document for owner | P2 |
| Branding settings | ❌ Hardcoded | Settings model | P3 |

#### Tier 4: Rare/Advanced (CAN REQUIRE SUPPORT)

| Capability | Current State | Gap | Priority |
|------------|---------------|-----|----------|
| Domain configuration | ✅ Via hosting | Document | P4 |
| Integrations (Stripe, etc.) | ✅ Via .env | Document | P4 |
| Data import/export | ⚠️ Django commands | Add UI export | P3 |

### 2.2 Critical UX Gaps

#### Gap 1: Two Admin Panels (Highest Priority)

**Problem:** Non-technical users must navigate between:
- **Django Admin** (`/django-admin/`) - Events, Products, Orders, Users
- **Wagtail Admin** (`/cms-admin/`) - Pages, Blog, Images

**Impact:** Confusing, increases support requests, professional barrier.

**Solution Options:**
1. **Wagtail ModelAdmin** - Register Django models in Wagtail (unified UX)
2. **Custom Dashboard** - Build React portal linking both systems
3. **Django Admin Only** - Move blog to Django, lose Wagtail's page builder
4. **Document & Train** - Accept split, provide clear documentation

**Recommendation:** Option 1 (Wagtail ModelAdmin) for core entities, keeping Django Admin for advanced/system entities.

#### Gap 2: No Dashboard

**Problem:** No landing page showing business health at a glance.

**Required Widgets:**
- Upcoming events this week
- Recent registrations (pending/approved)
- Recent orders
- Revenue snapshot (today/week/month)
- Quick actions (New Event, New Post, View Messages)

#### Gap 3: No Guided Workflows

**Problem:** Everything is raw CRUD. Complex processes aren't guided.

**Missing Workflows:**
1. **Event → Registrations → Check-in** lifecycle
2. **Order → Fulfillment → Delivery** tracking
3. **Registration → Payment → Confirmation** flow

#### Gap 4: Technical Field Names

**Examples to Fix:**
- `stripe_price_id` → hidden or "Stripe Reference (auto-generated)"
- `printify_product_id` → hidden or "Printify ID"
- `external_uid` → hidden

#### Gap 5: Missing Quick Actions

**Needed Actions:**
- Bulk email registrants for an event
- Export roster to CSV
- Clone event (for recurring events)
- Mark orders as fulfilled/shipped

---

## Phase 3: Implementation Roadmap

### Architecture Decision

**Chosen Approach:** Hybrid Wagtail-Centric Admin

1. **Wagtail Admin** = Primary interface for owners
   - Move high-frequency Django models into Wagtail via `wagtail.contrib.modeladmin` (deprecated) or `wagtail_modeladmin` package
   - Keep Wagtail's native page/image/document management
   - Build custom dashboard as Wagtail admin home

2. **Django Admin** = Power-user/developer interface
   - System entities (users, permissions, payments audit)
   - Advanced debugging
   - Hide from regular owner navigation

### Implementation Phases

---

#### Phase A: Admin Consolidation ✅ COMPLETE
**Goal:** Single entry point, unified navigation

**Tasks:**

- [x] **A1.** Install `wagtail-modeladmin` package
  ```bash
  pip install wagtail-modeladmin  # ✅ Installed v2.2.0
  ```

- [x] **A2.** Register core models in Wagtail Admin:
  - ✅ Event (events app)
  - ✅ EventRegistration (registrations app)
  - ✅ Product (payments app)
  - ✅ Order (payments app)
  - ✅ Coach (core app)
  - ✅ Player (portal app)
  - ✅ DuesAccount (portal app) - bonus!
  - ✅ NewsletterSubscriber (core app) - bonus!

- [x] **A3.** Configure Wagtail menu groupings:
  ```
  📅 Events & Programs ✅
     └─ Events
     └─ Registrations

  🛒 Shop ✅
     └─ Products
     └─ Orders

  👥 Members ✅
     └─ Players
     └─ Dues Accounts

  👔 Staff ✅
     └─ Coaches

  📬 Communications ✅
     └─ Newsletter Subscribers

  📄 Content (native Wagtail)
     └─ Pages
     └─ Images
     └─ Documents
  ```

- [x] **A4.** Navigation URLs point to Wagtail admin (`/cms-admin/`)

- [ ] **A5.** Add "Advanced Admin" link to footer for Django admin access

**Deliverable:** ✅ Owner accesses one URL, sees all business functions organized logically.

---

#### Phase B: Dashboard ✅ MOSTLY COMPLETE
**Goal:** Business health at a glance

**Tasks:**

- [x] **B1.** Create custom Wagtail admin home panel
  - ✅ `DashboardPanel` component in `wagtail_hooks.py`
  - ✅ Template at `cms/admin/dashboard_panel.html`

- [x] **B2.** Build dashboard widgets:
  - ✅ **Upcoming Events** - Next 5 events
  - ✅ **Recent Registrations** - Last 5 with event links
  - ✅ **Recent Orders** - Last 5 with status
  - ✅ **Revenue Snapshot** - Monthly total
  - ✅ **Member Count** - Total active players
  - ✅ **Pending Registrations** - Count badge
  - ✅ **Unfulfilled Orders** - Count badge

- [ ] **B3.** Add quick action buttons:
  - "New Event" → Event creation form
  - "New Post" → Blog page creation
  - "View All Orders" → Order list
  - "Export Registrations" → CSV download

- [x] **B4.** Add notification badges for pending items:
  - ✅ Pending registrations count
  - ✅ Unfulfilled orders count
  - [ ] Low inventory alerts

**Deliverable:** ✅ Owner lands on dashboard showing business health at a glance.

---

#### Phase C: Entity Polish 🔄 IN PROGRESS
**Goal:** Each admin page feels intuitive

**Tasks:**

- [x] **C1.** Event Admin Enhancements (partial):
  - [ ] Add "Clone Event" action
  - ✅ Add registration count column (`spots_display`)
  - [ ] Add "Send Reminder" bulk action
  - ✅ Add event status badge (`event_type_badge`, `registration_status`)
  - ✅ Auto-geocoding for map locations
  - [ ] Preview button showing public event page

- [x] **C2.** Product Admin Enhancements:
  - ✅ Stock status display (`stock_status` method)
  - ✅ Fulfillment badge (POD vs Local)
  - [ ] Add "Low Stock" filter
  - [ ] Add "Sync from Printify" button prominently

- [x] **C3.** Order Admin Enhancements (partial):
  - ✅ Status badges (`status_badge` method)
  - ✅ Customer display
  - ✅ Export enabled (CSV/XLSX)
  - ✅ Inspect view enabled
  - [ ] Add fulfillment workflow buttons (Mark Shipped, etc.)
  - [ ] Add tracking number field
  - [ ] Add customer contact link

- [x] **C4.** Registration Admin Enhancements (partial):
  - ✅ Payment status badge
  - ✅ Export enabled (CSV/XLSX) with all fields
  - ✅ Inspect view enabled
  - ✅ Technical fields hidden (`stripe_payment_intent_id`)
  - [ ] Add status workflow (Pending → Approved → Paid → Checked-In)
  - [ ] Add bulk approval action
  - [ ] Add "Contact Registrant" button

- [ ] **C5.** Player Admin Enhancements:
  - ✅ Export enabled (CSV/XLSX)
  - [ ] Add bulk import from CSV
  - [ ] Add "Send to All Guardians" action
  - [ ] Add medical info visibility toggle (privacy)

- [x] **C6.** Hide Technical Fields:
  - ✅ `form_fields_exclude` for stripe_payment_intent_id
  - [ ] Move Stripe/Printify IDs to collapsed "Developer" sections
  - [ ] Add tooltips explaining purpose of complex fields

**Deliverable:** 🔄 Mostly complete - entity admins have good visuals, missing workflow actions.

---

#### Phase D: Reporting ✅ COMPLETE
**Goal:** Business insights without SQL

**Tasks:**

- [x] **D1.** Create Reports section in Wagtail admin
  - ✅ Menu item registered via `register_admin_menu_item` hook
  - ✅ URL registered via `register_admin_urls` hook
  - ✅ Financial reports view at `/cms-admin/reports/`

- [x] **D2.** Build report views:
  - ✅ **Revenue by Event** - Shows registration revenue per event
  - ✅ **Revenue by Product Category** - Order revenue breakdown
  - ✅ **Outstanding Dues** - Players with balance, sorted by amount
  - ✅ **Summary Cards** - Total revenue, this month, outstanding dues

- [x] **D3.** Add export functionality:
  - ✅ CSV/XLSX export on EventRegistration, Order, Player, Newsletter lists
  - [ ] PDF export for financial reports (nice-to-have)

- [x] **D4.** Date range implicit in reports
  - ✅ "This Month" vs "All Time" breakdowns
  - ✅ Last 6 months trend data

- [x] **D5.** Add simple charts:
  - ✅ Monthly Order Revenue bar chart
  - ✅ Monthly Registration Revenue bar chart

**Deliverable:** ✅ Owner can view financial health and trends at `/cms-admin/reports/`

---

#### Phase E: Communication Tools ❌ NOT STARTED
**Goal:** Owner can message members directly

**Tasks:**

- [ ] **E1.** Add email composition interface:
  - Select audience (all members, event registrants, team)
  - Compose message with rich text
  - Preview before sending

- [ ] **E2.** Add bulk email actions:
  - "Email selected registrants" on Registration list
  - "Email all attendees" on Event detail

- [ ] **E3.** Add email templates:
  - Registration confirmation
  - Payment receipt
  - Event reminder
  - Custom announcement

- [x] **E4.** Add newsletter integration:
  - ✅ View subscriber list (NewsletterSubscriberModelAdmin)
  - ✅ Export for external email service (CSV/XLSX export enabled)

**Deliverable:** ❌ Not started - owner relies on external email tools for now.

---

#### Phase F: Help & Documentation ❌ NOT STARTED
**Goal:** Self-service support

**Tasks:**

- [ ] **F1.** Add contextual help tooltips throughout admin

- [ ] **F2.** Create in-app help documentation:
  - Getting started guide
  - "How to create an event" walkthrough
  - "How to add products" walkthrough
  - "How to manage registrations" walkthrough

- [ ] **F3.** Add empty state guidance:
  - When no events exist: "Create your first event →"
  - When no products exist: "Add products from Printify →"

- [ ] **F4.** Create owner onboarding checklist:
  - [ ] Update homepage hero
  - [ ] Add first event
  - [ ] Add first product
  - [ ] Invite staff members

- [ ] **F5.** Add "Get Help" button linking to documentation/support

**Deliverable:** ❌ Not started - owner needs live training for now.

---

## Phase 4: Priority Matrix

### P0 - Launch Blockers ✅ COMPLETE

| Task | Effort | Impact | Status |
|------|--------|--------|--------|
| A1-A3: Wagtail ModelAdmin setup | Medium | High | ✅ Done |
| B1-B2: Basic dashboard | Medium | High | ✅ Done |
| C6: Hide technical fields | Low | Medium | ✅ Done |

### P1 - High Value 🔄 IN PROGRESS

| Task | Effort | Impact | Status |
|------|--------|--------|--------|
| B3-B4: Quick actions & alerts | Low | High | ⏳ Partial (badges done, buttons pending) |
| C4: Registration workflow | Medium | High | ⏳ Partial (badges done, workflow pending) |
| D1-D3: Basic reports | Medium | High | ✅ Done |

### P2 - Nice to Have (Do Later)

| Task | Effort | Impact | Status |
|------|--------|--------|--------|
| C1-C3: Entity polish | Medium | Medium | ✅ Mostly done |
| E1-E2: Email composition | High | Medium | ❌ Not started |
| F1-F5: Help system | Medium | Medium | ❌ Not started |

### P3 - Future Enhancements

| Task | Effort | Impact | Status |
|------|--------|--------|--------|
| E3-E4: Email templates | High | Medium | ❌ Not started |
| D4-D5: Advanced reports | Medium | Low | ✅ Done (charts implemented) |
| Branding settings UI | High | Low | ❌ Not started |

---

## Appendix A: Current Admin Configurations

### A.1 Payments Admin (Excellent - 4.5/5)

**Strengths:**
- ProductAdmin has bulk image upload
- Fieldsets well-organized with descriptions
- Custom display methods (fulfillment_badge, stock_display)
- Inline variants with validation
- Actions for Stripe/Printify sync

**Minor Improvements:**
- Add Printify sync button to list view
- Add low stock filter

### A.2 Events Admin (Very Good - 4/5)

**Strengths:**
- Good fieldsets with descriptions
- Calendar sync integration
- "Locally modified" flag for sync protection

**Improvements Needed:**
- Add registration count to list
- Add "Clone Event" action
- Add status badges

### A.3 Portal Admin (Good - 3.5/5)

**Strengths:**
- Player admin has good fieldsets
- Guardian relationships inline
- Dues accounts with transaction history

**Improvements Needed:**
- Add bulk import for players
- Add profile completeness to list
- Hide medical info by default

### A.4 Core Admin (Good - 3.5/5)

**Strengths:**
- Coach admin well-organized
- Newsletter has actions for bulk status changes

**Improvements Needed:**
- Hide Instagram from main menu (auto-synced)

### A.5 Registrations Admin (Basic - 2.5/5)

**Weaknesses:**
- No fieldsets
- No workflow actions
- No status indicators

**Needs:**
- Complete restructure with workflow support

### A.6 CMS/Wagtail (Good - 4/5)

**Strengths:**
- Native Wagtail UX is polished
- Page models have good panel organization
- StreamField for flexible content

**Improvements Needed:**
- Consolidate with Django admin entities

---

## Appendix B: Technical Implementation Notes

### B.1 Wagtail ModelAdmin Setup

```python
# wagtail_hooks.py
from wagtail_modeladmin.options import ModelAdmin, ModelAdminGroup, modeladmin_register
from apps.events.models import Event
from apps.registrations.models import EventRegistration

class EventAdmin(ModelAdmin):
    model = Event
    menu_label = 'Events'
    menu_icon = 'date'
    list_display = ['title', 'event_type', 'start_datetime', 'registration_count']
    list_filter = ['event_type', 'registration_open']
    search_fields = ['title', 'description']

class EventRegistrationAdmin(ModelAdmin):
    model = EventRegistration
    menu_label = 'Registrations'
    menu_icon = 'user'
    list_display = ['participant_name', 'event', 'payment_status', 'registered_at']
    list_filter = ['payment_status', 'event']

class EventsGroup(ModelAdminGroup):
    menu_label = 'Events & Programs'
    menu_icon = 'date'
    items = (EventAdmin, EventRegistrationAdmin)

modeladmin_register(EventsGroup)
```

### B.2 Dashboard Implementation

```python
# admin_dashboard.py
from wagtail.admin.panels import Panel
from wagtail import hooks

class DashboardPanel(Panel):
    template = 'admin/dashboard_panel.html'

    def get_context_data(self, parent_context=None):
        context = super().get_context_data(parent_context)
        context['upcoming_events'] = Event.objects.filter(
            start_datetime__gte=timezone.now()
        ).order_by('start_datetime')[:5]
        context['recent_registrations'] = EventRegistration.objects.order_by(
            '-registered_at'
        )[:10]
        context['recent_orders'] = Order.objects.order_by('-created_at')[:10]
        return context

@hooks.register('construct_homepage_panels')
def add_dashboard_panel(request, panels):
    panels.append(DashboardPanel())
```

---

## Appendix C: Testing Checklist

Before owner handoff, verify:

- [ ] Owner can log in via single URL (`/cms-admin/`)
- [ ] Dashboard loads in under 2 seconds
- [ ] All menu items lead to correct pages
- [ ] Event creation works end-to-end
- [ ] Product creation works with image upload
- [ ] Registration list shows all required info
- [ ] Order list shows fulfillment status
- [ ] No technical jargon visible on main screens
- [ ] Export functions produce valid files
- [ ] Help tooltips appear where expected
- [ ] Mobile view is usable (basic functionality)
- [ ] Error messages are human-readable

---

## Conclusion

### Current Status: 70% Complete ✅

The NJ Stars platform has made **excellent progress** toward a unified admin experience:

| Phase | Status | Notes |
|-------|--------|-------|
| **A: Admin Consolidation** | ✅ Complete | All models in Wagtail, organized menu groups |
| **B: Dashboard** | ✅ Mostly Complete | Widgets done, quick actions pending |
| **C: Entity Polish** | 🔄 In Progress | Good visuals, workflow actions pending |
| **D: Reporting** | ✅ Complete | Financial reports with charts |
| **E: Communication** | ❌ Not Started | Owner uses external email |
| **F: Help Docs** | ❌ Not Started | Requires live training |

### Remaining Work for MVP Handoff

1. **Quick Action Buttons (B3):** Add "New Event", "New Post" shortcuts to dashboard
2. **Registration Workflow (C4):** Add status progression and bulk actions
3. *(Optional)* Clone Event action, Low Stock filter

### What's Working Now

- ✅ Single admin URL (`/cms-admin/`) for all operations
- ✅ Dashboard with business metrics at a glance
- ✅ Financial reports at `/cms-admin/reports/`
- ✅ CSV/XLSX export on registrations, orders, players
- ✅ Visual badges for status fields across all entities
- ✅ Auto-geocoding for event locations

**Estimated remaining work:** 1-2 days for P1 completion, then ready for owner training.

**Success metric:** Owner completes "day in the life" workflow without asking for help.
