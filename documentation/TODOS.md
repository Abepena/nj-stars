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
- [ ] **Fallback to all upcoming events** - When homepage links filter events by type (e.g., `?event_type=tryout`) and none are found, default to showing all upcoming events instead of an empty state

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
- [x] Find pictures for the coaches ✅ (Coach photos saved to /public/brand/assets/images/coaches/)
- [ ] Announcements can be tied to events - if event is paid, a button to register should be on the announcements
- [ ] Review livestreaming to investigate complexity
- [ ] **Blog Post to Instagram Publishing** - Create blog posts from admin dashboard that auto-post to Instagram
  - Admin/staff can create blog posts with title, content, and thumbnail image
  - On publish, automatically create Instagram post with:
    - Thumbnail image
    - Summary text from blog post
    - Link to full blog post on website (in bio or via Linktree-style link)
  - **IMPORTANT: Deduplication logic needed** - When Instagram posts are fetched for the news feed:
    - Detect if an Instagram post is a "blog announcement" (e.g., via hashtag like #NJStarsBlog or URL in caption)
    - If so, show ONLY the blog post in the feed, NOT both the blog post AND the Instagram post referencing it
    - Prevents duplicate content appearing in "The Huddle" news feed
  - Consider adding `instagram_post_id` field to blog posts to track which posts have been syndicated
  - Future: Schedule posts for optimal engagement times

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

## Initial Rollout Plan (Trusted Beta)

> **Goal:** Launch to 5-10 trusted parents to validate core functionality before public release
> **Timeline:** 1-2 weeks of beta testing before wider rollout

### Phase 1: Pre-Rollout Checklist (Before Inviting Anyone)

#### Critical Path - Must Work
- [ ] **Authentication Flow**
  - [ ] Email/password registration works end-to-end
  - [ ] Google OAuth login functional
  - [ ] Password reset emails delivered
  - [ ] Session persistence (stay logged in)

- [ ] **Parent Portal Core**
  - [ ] Dashboard loads with real data
  - [ ] Can add/edit child profiles
  - [ ] Can view upcoming events
  - [ ] Can see billing/dues status

- [ ] **Event Registration**
  - [ ] Browse events on public page
  - [ ] Register for free events
  - [ ] Register for paid events (Stripe checkout works)
  - [ ] Confirmation email sent after registration
  - [ ] Registration shows in parent dashboard

- [ ] **Shop (If Including in Beta)**
  - [ ] Products display correctly
  - [ ] Add to bag works
  - [ ] Checkout completes
  - [ ] Order confirmation received

#### Nice-to-Have for Beta
- [ ] Check-in functionality for staff
- [ ] Waiver signing flow
- [ ] Calendar export (.ics download)
- [ ] Mobile responsiveness polished

---

### Phase 2: Beta User Selection

#### Selection Criteria
- **5-10 families** total for initial beta
- Mix of:
  - [ ] 2-3 tech-savvy parents (will find edge cases)
  - [ ] 2-3 average users (validates UX simplicity)
  - [ ] 1-2 parents with multiple children (tests multi-player flows)
  - [ ] 1-2 newer families (fresh perspective, no legacy expectations)

#### Ideal Beta Parents
- Active in the program (attend regularly)
- Responsive to communication
- Willing to provide honest feedback
- Won't panic if something breaks
- Diverse device usage (iPhone, Android, various browsers)

---

### Phase 3: Onboarding Process

#### Pre-Launch Communication
- [ ] **Personal outreach** (text/call, not mass email)
  - "We're building a new parent portal and would love your feedback"
  - Emphasize they're specially selected
  - Set expectations: "You may encounter bugs - that's why we need you!"

#### Day 1: Invite Email
- [ ] Create personalized invite email template with:
  - Welcome message explaining the beta
  - Direct link to registration page
  - Quick start guide (PDF or video)
  - Contact info for immediate help (your phone/text)
  - Feedback form link

#### Guided Tasks (First Week)
Ask beta users to complete these and report experience:
1. [ ] Create account and log in
2. [ ] Add their child(ren) to profile
3. [ ] Browse events page
4. [ ] Register for one upcoming event
5. [ ] View their dashboard
6. [ ] (Optional) Make a small shop purchase

---

### Phase 4: Feedback Collection

#### Feedback Channels
- [ ] **Quick Feedback Form** (Google Form or Typeform)
  - "What worked well?"
  - "What was confusing?"
  - "What's missing?"
  - "Rate your experience 1-5"
  - "Would you recommend to other parents?"

- [ ] **Direct Communication**
  - WhatsApp/text group for real-time bug reports
  - Weekly 5-min check-in call with 2-3 key testers
  - "Reply to this email with ANY feedback" in all communications

- [ ] **Passive Tracking**
  - [ ] Set up error tracking (Sentry) before beta
  - [ ] Review server logs for 500 errors
  - [ ] Monitor Stripe dashboard for failed payments

#### Feedback Review Cadence
- Daily: Check error logs and direct messages
- Every 2-3 days: Review feedback form responses
- Weekly: Summarize issues and prioritize fixes

---

### Phase 5: Success Metrics

#### Quantitative (Target)
- [ ] **Registration completion rate** > 80% (start to finish)
- [ ] **Event registration success** > 90% (no payment failures)
- [ ] **Zero critical bugs** blocking core flows
- [ ] **Page load time** < 3 seconds on mobile
- [ ] **Uptime** > 99% during beta period

#### Qualitative
- [ ] Parents find it easier than current process (email/paper)
- [ ] No one asks "how do I...?" for basic tasks
- [ ] Positive sentiment in feedback ("this is great", "finally!")
- [ ] Beta users willing to refer others

#### Red Flags (Pause & Fix)
- Multiple users can't complete registration
- Payment failures > 10%
- Confusion about same issue from 3+ users
- Any data loss or security concern

---

### Phase 6: Rollout Timeline

#### Week -1: Final Prep
- [ ] Complete pre-rollout checklist above
- [ ] Set up error tracking (Sentry/LogRocket)
- [ ] Prepare all email templates
- [ ] Create quick-start guide
- [ ] Test on multiple devices/browsers
- [ ] Seed realistic test data

#### Week 1: Soft Launch
- [ ] Day 1-2: Invite first 3 parents (most tech-savvy)
- [ ] Day 3-4: Address any critical issues found
- [ ] Day 5-7: Invite remaining 5-7 parents

#### Week 2: Stabilization
- [ ] Daily bug fixes based on feedback
- [ ] Mid-week check-in calls with testers
- [ ] End of week: Go/no-go decision for wider rollout

#### Week 3+: Gradual Expansion
- [ ] If green light: Announce to full team/program
- [ ] Stagger invites (don't invite everyone same day)
- [ ] Keep feedback channels open
- [ ] Plan for "launch day" announcement

---

### Phase 7: Communication Templates

#### Initial Outreach (Text/Call Script)
```
Hey [Name]! Quick question - we're building a new online portal
for NJ Stars where parents can register for events, manage their
kids' profiles, and handle payments. Would you be willing to be
one of our first testers? I'd really value your feedback.
No pressure if you're too busy!
```

#### Beta Invite Email (Subject: You're Invited to Test the New NJ Stars Portal!)
```
Hi [Name],

Thank you for agreeing to help us test the new NJ Stars parent portal!

Here's how to get started:
1. Click here to create your account: [LINK]
2. Add your child(ren) to your profile
3. Browse upcoming events

Please try registering for [SPECIFIC EVENT] this week and let me
know how it goes. Screenshots of any issues are super helpful!

Questions? Just reply to this email or text me at [PHONE].

Thanks for being part of this!
[Coach Name]
```

#### Weekly Check-in Email
```
Subject: Quick Check-in - How's the Portal Working?

Hi [Name],

Just checking in on your experience with the new portal this week.

- Any issues registering or logging in?
- Anything confusing or hard to find?
- What do you like so far?

Your feedback helps us make this better for everyone. Thanks!
```

---

### Post-Beta: Full Launch Prep
- [ ] Fix all critical/high-priority issues from beta
- [ ] Update FAQ based on common questions
- [ ] Create "What's New" announcement for full team
- [ ] Plan go-live date and communicate 1 week in advance
- [ ] Prepare support plan (who handles questions?)
- [ ] Sunset old registration process (paper/email)

---

## CMS Migration

### Migrate Away from Wagtail CMS Completely
- [ ] **Audit Wagtail usage** - Identify all pages/content currently managed by Wagtail
  - Homepage hero section
  - Blog posts
  - Team pages
- [ ] **Create Next.js admin pages** for content management
  - Blog post editor with TipTap or similar rich text editor
  - Homepage content editor
  - Coach/team profile management
- [ ] **Migrate data** from Wagtail models to simpler Django models
- [ ] **Remove Wagtail dependencies** from backend
  - Remove `wagtail` packages from requirements.txt
  - Remove `apps/cms/` app
  - Update URL configuration
- [ ] **Update frontend** to use new API endpoints instead of Wagtail API

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

- [ ] **Compare-at/Sale Pricing for POD Products** - Add strikethrough pricing support for print-on-demand items
  - Allow setting a `compare_at_price` on POD products synced from Printify
  - Display original price crossed out with sale price to show perceived value
  - Use case: Show "Was $35, Now $30" even for made-to-order items
  - Consider auto-calculating compare-at based on Printify retail suggestions

### Multi-Tenant Email System
- [ ] **Organization Email Configuration** - Allow each org to customize support communication
  - Add `Organization` model with `support_email`, `support_name` fields
  - Use org's support email as Reply-To header on all outbound emails
  - Include org branding (logo, name, colors) in email templates
  - Current behavior: Staff's personal email used as Reply-To, platform email as sender
  - Future: Org can optionally configure their own SMTP for full white-label sending
  - Consider email template customization per org (welcome messages, signatures)
  - Track email opens/clicks for org analytics dashboard

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

---

## Future Features: Instagram Integration

> **Status:** Research Complete - Implementation Pending
> **Priority:** Low (nice-to-have)
> **Complexity:** Medium-High (requires Meta app approval)

### Overview

Integrate Instagram Business Account features directly into the admin dashboard:
1. **DM Management** - Read and respond to Instagram DMs from dashboard
2. **Content Publishing** - Post images/carousels to Instagram from dashboard

### ✅ Feasibility: CONFIRMED

Both features are supported by Meta's official APIs:
- **Instagram Messaging API** (part of Messenger Platform) - for DMs
- **Instagram Content Publishing API** (part of Graph API) - for posting

### Requirements

| Requirement | Status |
|-------------|--------|
| Instagram Business or Creator Account | ✅ NJ Stars has this |
| Facebook Page linked to Instagram | ⚠️ Need to verify/set up |
| Meta Developer Account | ⚠️ Need to create |
| Facebook App with Meta approval | ❌ Not started |
| OAuth 2.0 implementation | ❌ Not started |

### API Permissions Needed

**For DM Access:**
- `instagram_manage_messages` - Read/send DMs
- `instagram_basic` - Basic profile info
- `pages_messaging` - Required for Messenger Platform

**For Posting:**
- `instagram_content_publish` - Publish content
- `instagram_basic` - Basic profile info
- `pages_read_engagement` - Page access
- `business_management` - Business account access

### Implementation Steps

#### Phase 1: Meta Developer Setup
- [ ] Create Meta Developer account at [developers.facebook.com](https://developers.facebook.com)
- [ ] Create new Facebook App (type: Business)
- [ ] Add Instagram Graph API product to app
- [ ] Add Messenger product to app (for DM access)
- [ ] Configure OAuth redirect URLs

#### Phase 2: Connect Instagram Account
- [ ] Ensure NJ Stars Instagram is Business/Creator type
- [ ] Link Instagram account to NJ Stars Facebook Page
- [ ] Generate long-lived access token
- [ ] Store token securely in environment variables
- [ ] Implement token refresh mechanism (tokens expire in 60 days)

#### Phase 3: Backend API Development
- [ ] Create `apps/social/` Django app
- [ ] Implement Instagram API client service
- [ ] **DM Endpoints:**
  - [ ] `GET /api/social/instagram/conversations/` - List DM threads
  - [ ] `GET /api/social/instagram/conversations/{id}/messages/` - Get messages
  - [ ] `POST /api/social/instagram/conversations/{id}/reply/` - Send reply
- [ ] **Posting Endpoints:**
  - [ ] `POST /api/social/instagram/posts/` - Create new post
  - [ ] `GET /api/social/instagram/posts/` - List recent posts
  - [ ] `POST /api/social/instagram/media/upload/` - Upload image for posting
- [ ] Implement webhook for incoming DM notifications

#### Phase 4: Frontend Dashboard
- [ ] Create `/portal/dashboard/admin/social/` page
- [ ] **DM Interface:**
  - [ ] Conversation list sidebar
  - [ ] Message thread view
  - [ ] Reply composer with send button
  - [ ] Unread message badge in nav
- [ ] **Posting Interface:**
  - [ ] Image upload with preview
  - [ ] Caption editor with character count
  - [ ] Hashtag suggestions
  - [ ] Schedule post option (future)

#### Phase 5: Meta App Review
- [ ] Prepare demo video showing app functionality
- [ ] Write detailed privacy policy
- [ ] Submit app for review with required permissions
- [ ] Address any feedback from Meta reviewers
- [ ] Launch after approval

### Technical Notes

**DM Limitations:**
- Only works for messages initiated by users (24-hour response window for some message types)
- Cannot send promotional content unprompted
- Must respond within 7 days or lose ability to reply

**Posting Limitations:**
- Max 25 posts per 24 hours per account
- Images must be JPEG format
- Carousels count as 1 post (max 10 images)
- No Instagram Live or IGTV support
- No shopping tags or branded content tags via API

**Webhook Setup:**
- Need public HTTPS endpoint for incoming DM notifications
- Configure webhook in Meta App settings
- Implement signature verification for security

### Resources

- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api/)
- [Instagram Messaging API](https://developers.facebook.com/docs/messenger-platform/instagram)
- [Content Publishing Guide](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [Meta App Review Process](https://developers.facebook.com/docs/app-review)
