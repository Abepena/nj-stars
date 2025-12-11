# Critical Things to Fix ASAP

> **Last Updated:** December 11, 2025

---

## MVP Launch Configuration (Jan 1, 2026)

### Printify POD Setup

**1. Railway Environment Variables:**
```bash
PRINTIFY_API_KEY=<from Printify Dashboard > Settings > API Keys>
PRINTIFY_SHOP_ID=<from Printify URL: /shops/{ID}>
PRINTIFY_WEBHOOK_SECRET=<create unique secret with: openssl rand -hex 32>
```

**2. Printify Dashboard Webhook Setup:**
1. Go to: Settings → Webhooks → Add endpoint
2. URL: `https://api.njstarselite.com/api/payments/webhook/printify/`
3. Select events:
   - **Product Events (Auto-Sync):**
     - `product:publish:started` ← Auto-creates product when you publish in Printify
     - `product:deleted` ← Deactivates product when deleted in Printify
   - **Order Events:**
     - `order:sent-to-production`
     - `order:shipment:created`
     - `order:shipment:delivered`
     - `order:canceled`
4. Set webhook secret (must match `PRINTIFY_WEBHOOK_SECRET`)

**3. Product Configuration:**
With auto-sync enabled, products are created automatically when you publish in Printify!

**Automatic Flow:**
1. Create & design product in Printify
2. Click "Publish" in Printify
3. Webhook fires → Product auto-created in Django with variants, prices & images
4. Product appears in shop (default category: "apparel")

**Manual Override (Optional):**
After auto-sync, you can edit in Django Admin (`/django-admin/payments/product/`):
- Change category (jersey, apparel, accessories, equipment)
- Update name/description
- Add tags (featured, best_seller, on_sale)
- Adjust pricing if needed

### Google Calendar Sync Setup

**1. Get Public iCal URL from Google Calendar:**
1. Open Google Calendar → Settings → Settings for "Master Schedule" calendar
2. Under "Integrate calendar", copy the "Public address in iCal format" URL
   - Format: `https://calendar.google.com/calendar/ical/...@group.calendar.google.com/public/basic.ics`

**2. Create CalendarSource in Django Admin:**
1. Go to: `/django-admin/events/calendarsource/add/`
2. Name: "Master Schedule"
3. iCal URL: paste the URL from step 1
4. Is Active: ✓
5. Default Event Type: practice (or appropriate type)
6. Auto Publish: ✓

**3. Sync Events:**
```bash
python manage.py sync_calendars
```

**4. Verify:** Check `/events` page shows synced events

### MVP Launch Checklist

- [ ] Printify API keys configured in Railway
- [ ] Printify webhook configured in Printify dashboard
- [ ] POD products set up with printify_product_id
- [ ] `sync_printify_variants` run successfully
- [ ] Google Calendar public iCal URL obtained
- [ ] CalendarSource created in Django admin
- [ ] `sync_calendars` run successfully
- [ ] End-to-end test: POD checkout → Printify order created
- [ ] End-to-end test: Calendar edit → appears on platform

---

## mobile nav
 - [x] underline text for navigation links not their container *(Fixed Dec 9 - wrapped text in span)*
 - [x] match sign in button styling from the site header *(Fixed Dec 9 - changed to ghost variant)*

---

## /privates (NEW - Not Started)
- [ ] Endpoint needs added where the user can book privates with each trainer
- [ ] Should offer individual private lesson at the coach's hourly rate
- [ ] Monthly package for 4 lessons per month at a slightly discounted rate
- [ ] Related to Custom Products feature (see MEETING_NOTES_2025-12-09.md)

---

## /shop (Mostly Fixed - Dec 8-9)

| Issue | Status | Notes |
|-------|--------|-------|
| Add to bag button functionality | **FIXED** | Bag context + useBag hook implemented |
| Shopping bag icon with qty badge | **FIXED** | Badge shows item count in header |
| Checkout from bag creates Stripe session | **FIXED** | Bag checkout endpoint working |
| Product detail route 404 | **FIXED** | `/shop/[slug]` page created Dec 9 |

### Remaining Shop Issues:
- [x] **DONE** - Product variants (size/color selection) mockup added to `/shop/[slug]` detail page. Size and color selectors with visual feedback. Requires selection before add-to-bag. Will be connected to Printify API later.
- [x] **DONE Dec 11** - Removed mock colors from shop listing page. Now uses `available_colors` from API (synced via Printify).
- [ ] *Note:* Some products will be POD from printify, some will be shipped from local inventory that NJ stars already has suppliers for. The shop page should be adaptable to create records for local inventory (shipping from njstars or hand delivery from coach) and create invoices / receipts for parents if shopify doesn't already do that.
- [x] **DONE** - Stock messaging updated. Detail page now shows "Almost Gone!" and "Limited Drop" without exact quantities. Marketing-friendly urgency messaging.
- [ ] A countdown to live for the merch store should be created to create hype for the players / parents images from the pro photo shoots should be used to generate interest
- [x] **DONE** - Tag badges (Featured, Sale, Best Seller) on product cards are now clickable and filter products. They share toggle state with sidebar - clicking a badge activates the sidebar filter and shows a ring indicator on all matching badges.
- [x] **DONE** - Category badges on product cards filter the page when clicked. Same toggle state as sidebar buttons with visual ring indicator when active.
---

## Other Critical Items

### Instagram API (Dec 9)
- [ ] Set up Instagram Graph API (Basic Display API deprecated)
- [ ] Connect @pena_abraham account first for testing
- [ ] Requires Business/Creator account type

### Registrations
- [ ] Registrations / Tryouts should have easily shareable link with minimal steps to sign up and pay, gaurdians should only have to confirm details and select which child(ren) they are signing up and the form should auto-populate with profile details to save them time.
- [ ] waivers should be acknowledged before signing up

### Events Calendar Sync (Dec 9) ✅ IMPLEMENTED
- [x] **Calendar export feature for "My Events"** - Allow users to sync their registered events to external calendars
  - [x] Generate iCalendar (.ics) feed URL for user's registered events
  - [x] "Add to Google Calendar" button using Google Calendar URL scheme (no API key needed)
  - [x] "Download .ics file" for Apple Calendar / any calendar app
  - [x] Feed auto-updates when user registers/cancels events
  - [x] Include event details: title, datetime, location, description, event URL
- **Implementation Details:**
  - Backend: `/api/events/registrations/calendar.ics` - generates iCalendar feed (authenticated)
  - Backend: `/api/events/registrations/my_event_ids/` - returns event IDs for frontend filtering
  - Frontend: `lib/calendar-utils.ts` - utility functions for calendar links
  - Frontend: Events page sidebar shows "Sync Calendar" section when viewing "My Events"
  - Frontend: Event cards have calendar button on hover with Google Calendar / .ics options
  - Google Calendar URL scheme (no API key): `https://calendar.google.com/calendar/render?action=TEMPLATE&...`
  - iCalendar format follows RFC 5545 standard (no external dependencies) 

### Custom Products/Invoices (Dec 9)
- [ ] Coach-created custom invoices for private training
- [ ] Shareable payment links
- [ ] 5% platform fee on coach services

---

## Completed Items (Archive)

### Dec 8-9, 2025
- [x] Shopping bag backend (Cart, CartItem models in DB)
- [x] Shopping bag frontend (useBag hook, BagProvider)
- [x] Bag drawer component with quantity controls
- [x] Bag icon with badge in header
- [x] Stripe checkout integration for bag
- [x] Product cards refactored (click = QuickView, no buttons)
- [x] Sticky sidebar filters for shop
- [x] Coach model, admin, API, seed data
- [x] CoachCard and CoachesSection components
- [x] Product detail page `/shop/[slug]` with image gallery, quantity selector, add to bag
- [x] Master prompt for design audits saved to documentation/master-prompts/
