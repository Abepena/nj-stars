# Next Meeting Prep — Kenny Andrade (NJ STARS ELITE)

> **Purpose:** Collect business data and finalize decisions for production launch
> **Related:** [Dec 9 Meeting Notes](./MEETING_NOTES_2025-12-09.md) | [Dec 8 Meeting Notes](./MEETING_NOTES_2025-12-08.md)

---

## Meeting Goals

1. Capture business details for Stripe billing/accounting setup
2. Gather Instagram credentials to enable Graph API news feed
3. Finalize subscription products, pricing, and discount policies
4. Confirm revenue sharing agreement (20% platform / 5% coach)
5. Discuss launch timeline and initial content
6. Clarify admin roles and ongoing responsibilities

---

## 1. Revenue Sharing Confirmation

> 📝 **From Dec 9 Meeting:** Kenny agreed to 20% platform fee on all website revenue and 5% on coach private training.

### Platform Fee Structure

The platform fee is calculated differently depending on the revenue type to account for varying profit margins:

| Revenue Type              | Platform Fee | Applied To                             | Rationale                |
| ------------------------- | ------------ | -------------------------------------- | ------------------------ |
| Events, camps, tryouts    | 20%          | **Gross revenue**                      | High margin (~90%+)      |
| Team dues / Subscriptions | 20%          | **Gross revenue**                      | High margin (~95%+)      |
| Merch / POD products      | 20%          | **Profit** (after Printify + shipping) | Low margin (~30-50%)     |
| Coach private training    | 5%           | **Gross revenue** (after Stripe fees)  | Incentivize platform use |

> ⚠️ **All fees are calculated AFTER Stripe's transaction fee (2.9% + $0.30) is deducted.**

### Examples

**Event Registration ($50):**

- Stripe fee: $1.75
- Net revenue: $48.25
- Platform fee (20%): $9.65
- NJ Stars keeps: $38.60

**Merch Hoodie ($35):**

- Stripe fee: $1.32
- Printify cost: $22.00 (production + shipping to customer)
- Profit: $11.68
- Platform fee (20% of profit): $2.34
- NJ Stars keeps: $9.34

**Coach Private Training ($100):**

- Stripe fee: $3.20
- Net revenue: $96.80
- Platform fee (5%): $4.84
- Coach receives: $91.96

### Confirm

- [ ] Confirm 20% on gross for: events, dues, subscriptions, camps, tryouts
- [ ] Confirm 20% on **profit** for: merch/POD (after Printify costs)
- [ ] Confirm 5% on gross for: coach private training
- [ ] Discuss: Should this be formalized in a written agreement/contract?
- [ ] Any exclusions beyond cash/Venmo/Zelle transactions?

---

## 2. Stripe / Billing Setup

> 🤝 **Partnership Model — Abe as Technical Lead**
>
> Since I'm more familiar with Stripe and the technical integration, the Stripe account will remain under my control for easier management and troubleshooting. Kenny will be added as a **Team Member** with full visibility — this is just about having the right person handle the technical side, not about oversight. We're partners in this.
>
> Kenny's access includes:
>
> - View all transactions and payouts
> - Access reports and analytics
> - Receive payout notifications
> - Handle customer disputes (if desired)

### Adding Kenny as Stripe Team Member

- [ ] Add Kenny as Team Member in Stripe Dashboard → Settings → Team
- [ ] Assign role: **Analyst** (view-only) or **Developer** (limited actions)
- [ ] Kenny provides email for Stripe team invite
- [ ] Confirm which permissions Kenny needs:
  - [ ] View payments and balance
  - [ ] View customers
  - [ ] View reports
  - [ ] Manage disputes (optional)
  - [ ] View payouts

### Business Details Needed (For Account Records)

- [ ] Legal business name: NJ Stars Elite AAU (confirm exact name)
- [ ] EIN / Tax ID (for 1099 reporting if needed)
- [ ] Business address
- [ ] Business phone
- [ ] Support email (for customer inquiries)
- [ ] Statement descriptor (what appears on customer bank statements, e.g., "NJ STARS ELITE")

### Payout Configuration

> **Revenue Model:** Stripe payouts go directly to NJ Stars' bank account. NJ Stars then pays Leag/Stryder the 20% platform fee separately (monthly invoice or transfer). This keeps accounting clean — the revenue is NJ Stars' business income.

- [ ] Kenny provides NJ Stars bank account details for Stripe payouts
- [ ] Confirm payout cadence: daily, weekly, or monthly?
- [ ] Agree on platform fee payment schedule (monthly invoice? automatic transfer?)
- [ ] Discuss: Should Abe invoice NJ Stars monthly for the 20%, or set up automatic transfer?

### Tax Settings

- [ ] Which states/locations to collect sales tax?
- [ ] Use Stripe Tax automatic calculation? (Recommended)
- [ ] Any existing tax IDs to register?

### Policies

- [ ] Refund policy wording (how many days? full/partial?)
- [ ] Dispute/chargeback contact — who handles these?

---

## 3. Instagram / Graph API Setup

- [ ] Log into Instagram together to authorize Graph API (or provide credentials)
- [ ] Which account(s) to pull posts from:
  - [ ] @njstarselite_aau (main)
  - [ ] @traygotbounce (Coach Tray)?
  - [ ] @coach.cee (Coach Chris)?
  - [ ] @kenny_164 (Kenny)?
- [ ] Posting cadence expectations for "The Huddle" news feed
- [ ] Any brand guidelines for how posts appear?

---

## 4. Subscription & Dues Pricing

### Products to Price

| Product             | Price     | Billing Cycle |
| ------------------- | --------- | ------------- |
| Monthly Membership  | $\_\_\_\_ | Monthly       |
| Seasonal Membership | $\_\_\_\_ | Per season    |
| Annual Membership   | $\_\_\_\_ | Yearly        |
| One-Time Team Dues  | $\_\_\_\_ | Once          |

### Discounts to Configure

| Discount Type        | Amount/% | Stackable? | Recurring? |
| -------------------- | -------- | ---------- | ---------- |
| Friends & Family     | \_\_\_%  | Y/N        | Y/N        |
| Multi-Child          | \_\_\_%  | Y/N        | Y/N        |
| Early Bird / Loyalty | \_\_\_%  | Y/N        | Y/N        |
| Coaches / Employees  | \_\_\_%  | Y/N        | Y/N        |
| Promo Codes          | Varies   | Y/N        | Y/N        |

### Billing Rules

- [ ] Proration: What happens for mid-cycle signup/upgrade/downgrade?
- [ ] Grace period for failed payments?
- [ ] Auto-charge vs send invoice for approval?

---

## 5. Content & Branding

### Brand Assets Needed

- [ ] High-resolution logo files (PNG with transparency, SVG if available)
- [ ] Logo variations (light/dark backgrounds)
- [ ] Confirm brand colors: Gold (#FFD700?) and Black?
- [ ] Any other brand guidelines?

### Content Responsibilities

- [ ] Who uploads content to CMS? (Kenny, Abe, or both?)
- [ ] Who writes blog posts for "The Huddle"?
- [ ] Who manages product listings in the shop?

---

## 6. Initial Product Catalog (Merch Shop)

- [ ] Which Printify designs to launch with? (List specific items)
- [ ] Are there existing products to migrate from current site?
- [ ] Who approves POD designs before they go live?
- [ ] **Decision:** Auto-submit Printify orders or hold for manual review?
- [ ] **Decision:** Subscribe to Printify Premium upfront (20% production discount) — cost vs expected merch volume and payback period.

---

## 7. Events & Registrations

### Immediate Events to Add

- [ ] Winter tryout dates — confirmed dates and times?
- [ ] Upcoming camps or clinics?
- [ ] Open gym schedule?
- [ ] Any other events for the next 1-2 months?

### Tryout Registration Form

- [ ] What player info is needed? (Name, DOB, height, position, school, experience, etc.)
- [ ] Parent/guardian info required?
- [ ] Emergency contact?
- [ ] Waivers/liability forms — does Kenny have existing ones to use?
- [ ] Age group breakdowns (e.g., U10, U12, U14, etc.)
- [ ] Team structure — how many teams per age group?

---

## 8. User Roles & Admin Access

- [ ] Who gets admin access besides Kenny?
- [ ] Do any coaches need logins at launch?
- [ ] Do parents need accounts at launch, or just for portal later?
- [ ] Confirm superuser email: `admin@njstarselite.com` (or different?)

---

## 9. Communication & Notifications

- [ ] Email for order notifications (new purchases)?
- [ ] Email for new event registrations?
- [ ] Customer support/contact email (public-facing)?
- [ ] Phone number for support (if any)?

---

## 10. Launch Timeline

- [ ] When does Kenny want to go live?
- [ ] Soft launch (limited audience) vs full public launch?
- [ ] Any hard deadlines? (season start, registration window, etc.)
- [ ] Plan for announcing the new site (social media, email blast?)

---

## 11. Legal & Terms

- [ ] Does NJ Stars have existing Terms of Service?
- [ ] Existing Privacy Policy?
- [ ] Refund policy wording for the website footer/checkout
- [ ] Any specific disclaimers for tryouts/events (injury waivers, etc.)?

---

## 12. Future Roadmap (Quick Discussion)

- [ ] Mobile app still on the roadmap? Timeline expectations?
- [ ] PayPal as payment option — is this desired?
- [ ] Coach portal for tracking earnings — priority?
- [ ] Any other features Kenny is expecting?

---

## Summary Checklist

### Data Kenny Needs to Provide

- [ ] Business legal info (name, EIN, address, phone)
- [ ] Banking details (routing/account)
- [ ] Instagram login or token authorization
- [ ] Pricing grid for all subscription/dues products
- [ ] Discount policy details
- [ ] Logo files and brand assets
- [ ] Event dates for calendar
- [ ] Tryout registration field requirements
- [ ] Waiver/liability form (if existing)

### Decisions to Finalize

- [ ] Revenue sharing percentages (confirm 20% / 5%)
- [ ] Final price points for all products
- [ ] Discount rules (stackable, recurring, eligibility)
- [ ] Auto-approve POD orders vs manual review
- [ ] Refund/grace period policy
- [ ] Launch date target
- [ ] Content ownership (who uploads what)
