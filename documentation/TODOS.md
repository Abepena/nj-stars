# LEAG Platform TODOs

## Authentication & APIs
- [ ] Create an API key for Google Auth
- [ ] Create an API key for Google Maps
- [ ] Review Facebook social auth instead of Apple for now (Apple will be implemented when a developer account is needed for the mobile app)

## Event Calendar Features
- [ ] Add Google Map integration to the event calendar
- [x] Make calendar the default view ✅ (Already set as default)
- [ ] Implement list view as horizontal bars (like under the calendar when you click a date)
  - Include event picture in the card header
  - Show location details
  - Add expandable map on card expansion

## Forms & User Capture
- [ ] Create full functionality of the forms to sign up
- [ ] Add an email capture form to start collecting emails to reach out to upon launching the site

## Audits & Reviews
- [x] Design audit and fix ✅ (Critical items fixed: portal LayoutShell, ErrorMessage CSS vars)
- [ ] Fullstack implementation audit and fix
- [ ] Test coverage audit master prompt creation using TESTING.md
- [ ] Test coverage audit and fix
- [ ] Determine the benefits / drawbacks of leaving the DRF API and just creating dashboards for data in
- [ ] Review MVP criteria
- [ ] Review rebuild progress
- [ ] Revise project status and remove FastAPI mention
- [ ] Review Django rebuild plan and confirm as needed

## Infrastructure & Setup
- [ ] Remove Oracle Cloud dev setup

## Testing & QA
- [ ] Get tests on the frontend / API routes that will be live that will stress test the app

## Portal & Routes
- [ ] Wire all missing routes regarding the current portal
- [ ] Check functionality of publish / unpublish on Printify page, refactor it to take the entire shop URL rather than the ID

## Content & Media
- [ ] Evaluate whether the news feed should be announcements or Instagram (founder not responding - can't let Instagram credentials hold this up)
- [ ] Find pictures for the coaches
- [ ] Announcements can be tied to events - if event is paid, a button to register should be on the announcements
- [ ] Review livestreaming to investigate complexity

## Launch Prep
- [ ] Create MVP comprehensive implementation plan for launch this week
- [ ] **IMPORTANT:** Evaluate the CTA buttons in the hero that would be most appropriate (or wire the tryouts to the next tryout - dynamic on age/grade)

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
