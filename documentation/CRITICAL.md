# Critical Things to Fix ASAP

> **Last Updated:** December 9, 2025

## mobile nav
 - [ ] underline text for navigation links not their container
 - [ ] match sign in button styling from the site header

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
- [ ] Critical - Product variants (size/color selection) should be done as a mockup for now and made functional after researching printify API  + stripe checkout implementation instructions
- [ ] *Note:* Some products will be POD from printify, some will be shipped from local inventory that NJ stars already has suppliers for. The shop page should be adaptable to create records for local inventory (shipping from njstars or hand delivery from coach) and create invoices / receipts for parents if shopify doesn't already do that.
- [ ] Products dont need to have their actual stock on the quick view / detail page, rather they should say "Limited drop" or "Almost gone!" for items / designs beign sold for a limited time or have limited qty left and similar tags commonly used on e-commerce sites. I like the little cube Icon and styling of that section but we should make edits.
- [ ] A countdown to live for the merch store should be created to create hype for the players / parents images from the pro photo shoots should be used to generate interest
- [ ] The Featured, Sale, Best Seller Categories on the product images dont have any fucntionalilty. I'd like those badge components to be filter the products when clicked and be included in the category badges in the sidebar filters. they should always share the same toggle state as the associated category button in the sidebar
- [ ] The Category Badges on the product cards should filter the page when clicked similar to the sidebar buttons, they should share the same toggle state as the sidebar
---

## Other Critical Items

### Instagram API (Dec 9)
- [ ] Set up Instagram Graph API (Basic Display API deprecated)
- [ ] Connect @pena_abraham account first for testing
- [ ] Requires Business/Creator account type

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
