# Critical Things to Fix ASAP

> **Last Updated:** December 9, 2025

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
| Add to cart button functionality | **FIXED** | Cart context + useCart hook implemented |
| Shopping cart icon with qty badge | **FIXED** | Badge shows item count in header |
| Checkout from cart creates Stripe session | **FIXED** | Cart checkout endpoint working |
| Product detail route 404 | **FIXED** | `/shop/[slug]` page created Dec 9 |

### Remaining Shop Issues:
- [x] **DONE** - Product variants (size/color selection) mockup added to `/shop/[slug]` detail page. Size and color selectors with visual feedback. Requires selection before add-to-cart. Will be connected to Printify API later.
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

### Events Calendar Sync (Dec 9)
- [ ] **Calendar export feature for "My Events"** - Allow users to sync their registered events to external calendars
  - [ ] Generate iCalendar (.ics) feed URL for user's registered events
  - [ ] "Add to Google Calendar" button using Google Calendar API links
  - [ ] "Add to Apple Calendar" button (webcal:// protocol for iCal subscription)
  - [ ] Consider django-ical package for generating .ics feeds
  - [ ] Feed should auto-update when user registers/cancels events
  - [ ] Include event details: title, datetime, location, description
- **Implementation Notes:**
  - Google Calendar: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=EVENT_TITLE&dates=START/END&location=LOCATION&details=DESC`
  - iCalendar feed: Serve .ics file from `/api/events/registrations/calendar.ics` (authenticated)
  - Consider per-user unique calendar URL with token for subscription feeds 

### Custom Products/Invoices (Dec 9)
- [ ] Coach-created custom invoices for private training
- [ ] Shareable payment links
- [ ] 5% platform fee on coach services

---

## Completed Items (Archive)

### Dec 8-9, 2025
- [x] Shopping cart backend (Cart, CartItem models)
- [x] Shopping cart frontend (useCart hook, CartProvider)
- [x] Cart drawer component with quantity controls
- [x] Cart icon with badge in header
- [x] Stripe checkout integration for cart
- [x] Product cards refactored (click = QuickView, no buttons)
- [x] Sticky sidebar filters for shop
- [x] Coach model, admin, API, seed data
- [x] CoachCard and CoachesSection components
- [x] Product detail page `/shop/[slug]` with image gallery, quantity selector, add to cart
- [x] Master prompt for design audits saved to documentation/master-prompts/
