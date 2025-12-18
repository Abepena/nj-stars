
## Platform Business Model

> **See full details:** [PLATFORM_FEE_STRUCTURE.md](./PLATFORM_FEE_STRUCTURE.md)

**Quick Reference:**
| Revenue Type | Starting Fee | At Scale (30+ tenants) |
|--------------|--------------|------------------------|
| Events | 20% | 5% + $0.30 |
| Dues | 10% | 5% + $0.30 |
| Shop | 10% | 5% + $0.30 |

Fees reduce by **0.5% per active platform tenant** until floor is reached.

---
# LEAG Platform TODOs

## Authentication & User Roles
- [ ] Create an API key for Google Auth
- [x] Create an API key for Google Maps ✅ (EventMap component working with coordinates)
- [ ] Review Facebook social auth instead of Apple for now (Apple will be implemented when a developer account is needed for the mobile app)
- [ ] **Player/Parent distinction on signup** - Registration should capture role (player vs parent/guardian)
  - Parent accounts can manage multiple player profiles
  - Player accounts are for older players managing themselves
  - Age-based logic to determine which flow to show
- [ ] **Hidden admin/coach signup route** - `/portal/register/staff?invite=<token>`
  - Invite-only registration for coaches and admins
  - Admin generates invite link from dashboard
  - Token validates role assignment (coach vs admin)

## Event Calendar Features
- [x] Add Google Map integration to the event calendar ✅ (EventMap component with markers, zoom, directions)
- [x] Make calendar the default view ✅ (Already set as default)
- [x] Implement list view as horizontal bars ✅ (EventCardHorizontal component)
  - ✅ Include event picture in the card header
  - ✅ Show location details
  - [x] Map integration with event selection ✅ (Map zooms to selected events)

## Forms & User Capture
- [ ] Create full functionality of the forms to sign up
- [x] Add an email capture form ✅ (Newsletter signup component on homepage)

## Automated Communications
- [ ] Set up transactional email service (SendGrid, Postmark, or AWS SES)
- [ ] Implement email notifications:
  - [ ] Welcome email on registration
  - [ ] Order confirmation emails
  - [ ] Event registration confirmation
  - [ ] Payment receipt emails
  - [ ] Password reset emails (already wired via dj-rest-auth, needs SMTP config)
- [ ] Implement SMS/text notifications (Twilio):
  - [ ] Event reminders (24h before)
  - [ ] Practice schedule changes
  - [ ] Payment due reminders
  - [ ] Tryout confirmation texts
- [ ] Create email templates with NJ Stars branding
- [ ] Set up newsletter/marketing email system (Mailchimp or Loops.so integration)

## Audits & Reviews
- [x] Design audit and fix ✅ (Critical items fixed: portal LayoutShell, ErrorMessage CSS vars)
- [x] CMS audit ✅ (Wagtail ModelAdmin setup complete, dashboard, reports)
- [ ] Fullstack implementation audit and fix
- [ ] Test coverage audit master prompt creation using TESTING.md
- [ ] Test coverage audit and fix
- [ ] Determine the benefits / drawbacks of leaving the DRF API and just creating dashboards for data in
- [ ] Review MVP criteria
- [ ] Review rebuild progress
- [ ] Revise project status and remove FastAPI mention
- [ ] Review Django rebuild plan and confirm as needed

## Testing & QA
- [ ] Get tests on the frontend / API routes that will be live that will stress test the app

## Portal & Routes
- [x] Wire all missing routes regarding the current portal ✅ (Admin pages at /portal/dashboard/admin/*)
- [x] Check functionality of publish / unpublish on Printify page ✅ (Printify admin page working)

## Content & Media
- [ ] Evaluate whether the news feed should be announcements or Instagram (founder not responding - can't let Instagram credentials hold this up)
- [ ] Find pictures for the coaches
- [ ] Announcements can be tied to events - if event is paid, a button to register should be on the announcements
- [ ] Review livestreaming to investigate complexity

## Launch Prep
- [ ] Create MVP comprehensive implementation plan for launch this week
- [x] **IMPORTANT:** Evaluate the CTA buttons in the hero that would be most appropriate ✅

---

## Admin Panel Migration (Next.js)

> **Goal:** Replace Wagtail CMS admin with client-side admin at `/portal/admin/`
> **Reference:** See `documentation/NEXTJS_ADMIN_ROADMAP.md` for full technical plan

### Phase 1: API Foundation
- [ ] Create admin permission decorator (`IsOrgAdmin`)
- [ ] Add CRUD endpoints for Events (POST, PUT, DELETE)
- [ ] Add CRUD endpoints for Registrations
- [ ] Add CRUD endpoints for Players
- [ ] Add CRUD endpoints for Coaches
- [ ] Add export endpoints (CSV/XLSX)

### Phase 2: Core Admin UI
- [ ] Set up React Query (TanStack Query)
- [ ] Build shared DataTable component with shadcn/ui
- [ ] Build admin layout with sidebar navigation
- [ ] Create Events management page (list + CRUD)
- [ ] Create Registrations management page (list + export)
- [ ] Create Orders management page (list + status)

### Phase 3: Full Admin Feature Parity
- [ ] Products management (with image upload)
- [ ] Players management (with dues tracking)
- [ ] Coaches management
- [ ] Blog/content management (TipTap editor)
- [ ] Media library
- [ ] Financial reports dashboard

---

## V2 - Post-Launch Polish

### Design System Refinements
- [ ] **Filter Standardization**: Refactor Events and News pages to use shared FilterSidebar component
  - Currently: Shop uses FilterSidebar, Events/News have custom CollapsibleSection implementations
  - Goal: Unified filter UX across all filterable pages
  - Files: `/app/events/page.tsx`, `/app/news/page.tsx`, `/components/filter-sidebar.tsx`
- [ ] Standardize spacing scheme (py-6, py-8, py-12, py-16, py-24) across all sections
- [ ] Consolidate icon sizing (w-4 h-4 default, w-5 h-5 medium, w-6 h-6 large)
- [ ] Add consistent loading animations across portal pages
- [ ] Replace hardcoded colors in billing page with semantic color variables
### Shop Pricing Options
- [ ] **At-Cost Pricing Mode** - Allow organizers to sell products without markup
  - Use case: Friendly leagues or non-profit groups that don't want to profit from merch
  - Product price = Printify base cost + LEAG platform fee only
  - LEAG platform fee should be at least 5% above payment processing fees to remain sustainable
  - Example: $15 Printify cost + ~3% Stripe fee + 5% LEAG fee = ~$16.20 final price
  - Toggle per-product or org-wide setting in admin
  - Clearly show "At Cost" badge on products using this mode
### In-Person Payment Collection (Research)
- [ ] **Investigate tap-to-pay & QR code solutions for on-site payment collection**
  
  #### Use Cases
  
  **1. Drop-In Event Payments**
  - Parent/player shows up to open gym, tryout, or event without pre-registering
  - Owner collects payment on the spot via tap-to-pay or QR scan
  - System creates registration record linked to player
  
  **2. Product Handoff Confirmation (Pre-Paid Orders)**
  - Parent pre-ordered merch online via Stripe checkout
  - At pickup: Owner hands over item → Parent pays small handling fee OR confirms receipt
  - In-person payment/scan = delivery confirmation in system
  - Order status auto-updates to "Delivered"
  
  **3. Coach-Delivered Products (Skip Online Checkout)**
  - Coach brings product directly to parent at practice/game
  - NO online Stripe checkout needed
  - Payment collected in-person = order creation + payment + delivery confirmation in ONE step
  - Simplifies flow for impulse buys or "I'll take one of those" requests
  
  #### Requirements
  - Works on owner's iPhone (tap to pay via NFC)
  - QR code that parents can scan to pay specific amounts
  - Integrates with existing Stripe account for unified revenue tracking
  - Real-time confirmation / receipt (text or email)
  - Links payment to player/event/order in our database
  - Admin can see all in-person payments in portal
  
  #### Options to Research
  - **Stripe Terminal** (tap to pay on iPhone) - requires Stripe Terminal SDK
  - **Stripe Payment Links + QR codes** - generate per-event or custom amount, no SDK
  - **Square Reader + Square POS** - alternative ecosystem, very polished mobile app
  - **PayPal Zettle** - tap to pay + QR alternative
  
  #### Questions to Answer
  - Can we auto-create registration/order records from in-person payments?
  - What are the transaction fees for each option?
  - Does Stripe Tap to Pay on iPhone work without additional hardware?
  - Can we build a simple "collect payment" screen in our admin portal?
  - How do we handle refunds for in-person payments?
  
  #### Platform Fee Structure
  
  > **See full details:** [`PLATFORM_FEE_STRUCTURE.md`](./PLATFORM_FEE_STRUCTURE.md)
  
  **Quick Reference:**
  | Revenue Type | Starting Fee | At Scale (34+ users) |
  |--------------|--------------|----------------------|
  | Events | 20% | 5% + $0.30 |
  | Dues | 10% | 5% + $0.30 |
  | Shop | 10% | 5% + $0.30 |
  
  Fees reduce by **0.5% per active user** until floor is reached.


