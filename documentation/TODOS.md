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
  
  #### Platform Fee Structure (LEAG/TRNY Revenue Model)
  
  | Revenue Type | Platform Fee | Notes |
  |--------------|--------------|-------|
  | Event Registrations | **20%** | Tryouts, camps, tournaments, open gyms |
  | Dues / Subscriptions | **10%** | Monthly/seasonal membership fees |
  | Third-Party Shop Products | **10%** | Merch from other designers/suppliers |
  | NJ Stars Printify Products | **10%** | Custom merch (see designer royalty below) |
  
  ##### Designer Royalty Model (Custom Printify Merch)
  - **$1,000 upfront** paid to designer per merch drop (payment floor)
  - Owner receives **100% of revenue** until $1,000 recovered
  - After recovery: **5% royalty** to designer per sale
  - Platform fee (10%) applies throughout
  - Example flow for $40 hoodie ($14 profit margin):
    - Sales 1-71: Owner keeps $14/sale → recovers $1,000
    - Sale 72+: Owner keeps $9.10, Designer gets $2 (5%), Platform gets $4 (10%)
  
  ##### Profit Margins
  - Shop products listed at **35-40% profit margin** on cost
  - Ensures healthy margins after platform fees + Stripe fees
  
  ##### Fee Reduction Opportunities
  - **Referral credit**: Lower fees for referring other teams/orgs to LEAG platform
  - **Payout threshold**: Reduced rates after platform reaches specific revenue milestone
  - Rates negotiable as partnership evolves
  
  > **Note**: NJ Stars is a founding partner receiving custom platform development 
  > in exchange for revenue sharing. This model funds ongoing development and 
  > support while giving the partner a fully-featured system at no upfront cost.


