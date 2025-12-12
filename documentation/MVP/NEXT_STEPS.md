# NJ Stars Platform - Next Steps & Roadmap

> **Purpose:** Clear action items and roadmap for production deployment and future enhancements
> **Last Updated:** December 10, 2025
>
> **Related Documents:**
> - [Meeting Notes - Dec 9, 2025](./meeting%20notes/MEETING_NOTES_2025-12-09.md) - Custom products, revenue sharing, Instagram API
> - [Meeting Notes - Dec 8, 2025](./meeting%20notes/MEETING_NOTES_2025-12-08.md) - Stakeholder meeting deliverables

This document outlines the steps needed to take the NJ Stars platform from development to production, plus optional enhancements for future phases.

---

## 📸 Instagram Graph API Setup Guide

**Prerequisites:** Access to NJ Stars Instagram account credentials

### Quick Reference

| Step | Action | URL/Command |
|------|--------|-------------|
| 1 | Convert Instagram to Business/Creator | Instagram App → Settings → Account → Switch to Professional |
| 2 | Create/link Facebook Page | [facebook.com/pages/create](https://facebook.com/pages/create) |
| 3 | Login to Meta for Developers | [developers.facebook.com](https://developers.facebook.com) |
| 4 | Create App → Business type | My Apps → Create App |
| 5 | Add Instagram Graph API product | App Dashboard → Add Product |
| 6 | Get Business Account ID | Graph API Explorer or Instagram settings |
| 7 | Generate User Access Token | Graph API Explorer with `instagram_basic`, `pages_read_engagement` |
| 8 | Extend token to 60 days | See token exchange command below |
| 9 | Add credentials to `.env` | `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID` |
| 10 | Run sync command | `docker exec njstars-backend python manage.py sync_instagram` |

### Detailed Steps

#### Step 1-2: Instagram Business Account Setup
1. Log into Instagram as NJ Stars
2. Go to **Settings → Account → Switch to Professional Account**
3. Choose **Business** (recommended for organizations)
4. Connect to a Facebook Page (create one if needed at [facebook.com/pages/create](https://facebook.com/pages/create))

#### Step 3-5: Create Meta Developer App
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Log in with the Facebook account connected to the NJ Stars Page
3. **My Apps → Create App → Business type**
4. Add the **Instagram Graph API** product from the dashboard

#### Step 6-7: Get Credentials
1. Use the [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app and generate a User Access Token
3. Required permissions: `instagram_basic`, `pages_read_engagement`
4. Get your Instagram Business Account ID:
   ```
   GET /me/accounts?fields=instagram_business_account
   ```

#### Step 8: Extend Token (Important!)
Short-lived tokens expire in 1 hour. Exchange for a 60-day token:
```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?\
grant_type=fb_exchange_token&\
client_id={app-id}&\
client_secret={app-secret}&\
fb_exchange_token={short-lived-token}"
```

#### Step 9: Environment Variables
```bash
# backend/.env
INSTAGRAM_ACCESS_TOKEN=your-long-lived-token-here
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841400000000000
META_APP_ID=your-app-id
META_APP_SECRET=your-app-secret
```

#### Step 10: Sync Posts
```bash
# Fetch latest posts from Instagram
docker exec njstars-backend python manage.py sync_instagram

# Optional: limit number of posts
docker exec njstars-backend python manage.py sync_instagram --limit 10
```

### Token Refresh (Every 60 Days)
Long-lived tokens need refreshing before expiration:
```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?\
grant_type=fb_exchange_token&\
client_id={app-id}&\
client_secret={app-secret}&\
fb_exchange_token={current-long-lived-token}"
```

> **Tip:** Set a calendar reminder for 55 days to refresh the token before it expires.

---

## 🔥 IMMEDIATE PRIORITIES (Dec 10, 2025)

### Revenue Sharing Agreement
Kenny has agreed to **20% platform fee** on all website revenue (events, merch, tryouts, camps).
Coach private training: **5% platform fee** (to incentivize platform use over DMs/CashApp).

### High Priority Tasks

| Task | Priority | Status | Section |
|------|----------|--------|---------|
| **Printify POD Integration** | 🔴 Critical | ✅ Complete | [4.12](#412-printify-pod-integration--critical-added-dec-10) |
| Instagram API Integration | 🔴 Critical | Pending | [4.8](#48-multi-instagram-huddle--medium-added-dec-8) |
| Custom Products/Invoice System | 🔴 Critical | Pending | [4.10](#410-custom-products-system--critical-added-dec-9) |
| Coach Payout System | 🔴 High | Pending | [4.7](#47-coach-payout-system--medium-added-dec-8) |
| Tryout Registration Form | 🔴 High | Pending | [4.2](#42-tryout-registration-form--high-updated-dec-8) |

### Completed Today (Dec 10)
- [x] **Printify POD Integration**:
  - Added `fulfillment_type` field to Product model (POD vs Local)
  - Created Printify API client service (`services/printify_client.py`)
  - Updated admin interface with fulfillment badges and improved fieldsets
  - Added fulfillment info to frontend (shop page, product detail, quick view)
  - Integrated Printify order submission in Stripe webhook
  - Added Printify webhook handler for tracking updates
  - Created shipping calculator endpoint
  - Built order history page in portal (`/portal/orders`)
  - See: [Plan](/Users/abe/.claude/plans/mutable-waddling-book.md)

### Completed Earlier (Dec 10)
- [x] **Authentication System (dj-rest-auth)**:
  - Added `dj-rest-auth` package for REST API authentication
  - Created custom registration serializer with first_name, last_name, phone fields
  - Added password reset workflow with email notifications
  - Created frontend pages: `/portal/forgot-password`, `/portal/reset-password/[uid]/[token]`, `/portal/register`
- [x] **Login Page Redesign**:
  - Split-pane layout with branding panel (desktop) and form panel
  - Animated shooting stars background
  - Reusable `ThemeLogo` component for theme-aware logos
  - Mobile-first responsive design

### Completed (Dec 9)
- [x] Sticky sidebar filters for Shop page (reusable component)
- [x] Product cards: click = QuickView (no buttons)
- [x] Updated product names (removed "NJ Stars" prefix)
- [x] Better product images from Unsplash
- [x] Coach model, admin, API, seed data
- [x] CoachCard component and CoachesSection on homepage

---

## 🚀 MVP WEEKEND LAUNCH CHECKLIST

**Goal:** Get a working site live on a domain by Sunday night

### Day 1 (Saturday) - Infrastructure Setup

#### Morning: Hosting & Database (2-3 hours)
- [ ] **Choose hosting platform** (Recommended: Railway for simplicity)
  - Railway: Backend + PostgreSQL in one platform
  - Vercel: Frontend (free tier, built for Next.js)
- [ ] **Create Railway account** → [railway.app](https://railway.app)
- [ ] **Create Vercel account** → [vercel.com](https://vercel.com)
- [ ] **Provision PostgreSQL database** on Railway
  - Copy `DATABASE_URL` connection string
- [ ] **Deploy Django backend** to Railway
  - Connect GitHub repo → select `backend/` folder
  - Add environment variables (see checklist below)
  - Run initial migrations: `python manage.py migrate`
  - Create superuser: `python manage.py createsuperuser`

#### Afternoon: Frontend & Domain (2-3 hours)
- [ ] **Deploy Next.js frontend** to Vercel
  - Connect GitHub repo → select `frontend/` folder
  - Add environment variables (see checklist below)
- [ ] **Purchase/configure domain** (if not owned)
  - Option A: Use Vercel subdomain temporarily (free)
  - Option B: Configure custom domain in Vercel
- [ ] **Update CORS settings** in backend for production domain
- [ ] **Test basic pages load** (home, shop, events)

### Day 2 (Sunday) - Stripe & Content

#### Morning: Stripe Live Mode (1-2 hours)
- [ ] **Enable Stripe live mode** at [dashboard.stripe.com](https://dashboard.stripe.com)
- [ ] **Copy live API keys**:
  - `pk_live_...` → Frontend `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `sk_live_...` → Backend `STRIPE_SECRET_KEY`
- [ ] **Create webhook endpoint** in Stripe dashboard
  - URL: `https://your-backend-url.railway.app/api/v1/webhooks/stripe`
  - Events: `checkout.session.completed`, `checkout.session.expired`
  - Copy signing secret → Backend `STRIPE_WEBHOOK_SECRET`
- [ ] **Test checkout flow** with a real $1 product

#### Afternoon: Content & Launch (2-3 hours)
- [ ] **Add real content via Wagtail CMS** (`/cms-admin/`)
  - Homepage hero text and images
  - 2-3 blog posts for news feed
  - Team roster (if available)
- [ ] **Add products via Django admin** (`/django-admin/`)
  - At least 3-5 merch items with images
  - Set real prices
- [ ] **Final smoke test**:
  - [ ] Homepage loads
  - [ ] Shop page shows products
  - [ ] Events page works
  - [ ] Light/dark mode toggle works
  - [ ] Mobile responsive
  - [ ] Checkout flow works
- [ ] **🚀 LAUNCH!** Share link with team

---

### Environment Variables Checklist

#### Backend (Railway)
```bash
# Required
DATABASE_URL=postgresql://...              # From Railway
SECRET_KEY=$(openssl rand -hex 32)         # Generate new
DJANGO_SETTINGS_MODULE=config.settings.production
ALLOWED_HOSTS=your-app.railway.app,yourdomain.com
FRONTEND_URL=https://yourdomain.vercel.app

# Stripe (Live)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional (can add later)
INSTAGRAM_ACCESS_TOKEN=...
INSTAGRAM_USER_ID=...
```

#### Frontend (Vercel)
```bash
# Required
NEXT_PUBLIC_API_URL=https://your-app.railway.app
NEXTAUTH_URL=https://yourdomain.vercel.app
NEXTAUTH_SECRET=$(openssl rand -hex 32)

# Stripe (Live)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Optional (can add later)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

### Post-Launch (Next Week)
- [ ] Set up error monitoring (Sentry - free tier)
- [ ] Set up uptime monitoring (UptimeRobot - free)
- [ ] Add Google Analytics
- [ ] Connect Instagram API for live posts
- [ ] Set up Google OAuth for social login

---

## 🎯 Quick Reference

| Phase | Timeline | Priority | Status |
|-------|----------|----------|--------|
| **Phase 1:** Production Setup | 1-2 weeks | 🔴 Critical | Pending |
| **Phase 2:** Content & Testing | 1 week | 🔴 Critical | Pending |
| **Phase 3:** Launch & Monitoring | 1 week | 🟠 High | Pending |
| **Phase 4:** Enhancements | 4-8 weeks | 🟡 Medium | In Progress |
| **Phase 5:** Mobile App | 6-8 weeks | 🟡 Medium | Future |

**Total Time to Launch:** ~3-4 weeks

### Dec 8, 2025 Meeting - New Priority Items

| Feature | Priority | Effort | Section |
|---------|----------|--------|---------|
| Shopping Cart | 🔴 Critical | 3-5 days | [4.4](#44-shopping-cart-system--critical-added-dec-8) |
| Shop UX (Card = QuickView) | 🔴 High | 2-3 days | [4.5](#45-shop-ux-improvements--high-added-dec-8) |
| Tryout Registration Form | 🔴 High | 2-3 days | [4.2](#42-tryout-registration-form--high-updated-dec-8) |
| Coach Management | 🔴 High | 2-3 days | [4.6](#46-coach-management-system--high-added-dec-8) |
| Coach Payouts | 🟠 Medium | 1-2 weeks | [4.7](#47-coach-payout-system--medium-added-dec-8) |
| Multi-Instagram Huddle | 🟠 Medium | 1 week | [4.8](#48-multi-instagram-huddle--medium-added-dec-8) |
| Hero Video | 🟡 Medium | 1-2 days | [4.9](#49-hero-video-integration--medium-added-dec-8) |

> **Full Meeting Notes:** [MEETING_NOTES_2025-12-08.md](./meeting%20notes/MEETING_NOTES_2025-12-08.md)

---

## Phase 1: Production Setup (Week 1-2)

### ⚠️ IMPORTANT: Development Superuser Account

**Current superuser email:** `pena.abe@gmail.com` (for development only)

**TODO BEFORE PRODUCTION:**
- [ ] Change superuser email back to production admin email
- [ ] Update in Django admin or run: `python manage.py shell` then update the User model
- [ ] Recommended production email: `admin@njstarselite.com`

---

### 1.1 Third-Party Service Accounts 🔴 CRITICAL

#### Stripe (Payment Processing)
**Time:** 1-2 hours

**Steps:**
1. Log into [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to **Live mode** (toggle in top-right)
3. Get your **live API keys**:
   - Navigate to: Developers → API Keys
   - Copy `Publishable key` (starts with `pk_live_`)
   - Copy `Secret key` (starts with `sk_live_`)
   - Store in password manager ⚠️ Never commit these

4. Create **products** in Stripe:
   - Navigate to: Products → Add Product
   - Create each merch item (jerseys, hoodies, etc.)
   - Note the **Price ID** for each (starts with `price_`)
   - Update `backend/seed_data.py` with real price IDs

5. Set up **webhook endpoint**:
   - Navigate to: Developers → Webhooks → Add endpoint
   - URL: `https://yourdomain.com/api/v1/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `charge.refunded`
   - Copy **Signing secret** (starts with `whsec_`)

**Environment Variables:**
```bash
# Backend
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

#### Google OAuth (Social Login)
**Time:** 30 minutes (optional but recommended)

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Navigate to: APIs & Services → Credentials
5. Create **OAuth 2.0 Client ID**:
   - Application type: Web application
   - Name: "NJ Stars Platform"
   - Authorized redirect URIs:
     - `https://yourdomain.com/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google` (for testing)
6. Copy **Client ID** and **Client Secret**

**Environment Variables:**
```bash
# Frontend only
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

**Note:** Skip this if you only want email/password login initially.

---

#### Instagram Basic Display API (News Feed)
**Time:** 1-2 hours (optional - mock data available)

**Steps:**
1. Create a [Facebook App](https://developers.facebook.com/apps)
2. Add **Instagram Basic Display** product
3. Configure Instagram settings:
   - Add test users
   - Generate access token
   - Note: Requires Instagram Business/Creator account
4. Get **User Access Token** and **User ID**

**Environment Variables:**
```bash
# Backend only
INSTAGRAM_ACCESS_TOKEN=your-token
INSTAGRAM_USER_ID=your-user-id
```

**Note:** Platform works fine with mock Instagram data. This can be added later.

---

### 1.2 Database Setup 🔴 CRITICAL

#### Production PostgreSQL
**Time:** 30 minutes - 1 hour

**Options:**

**Option A: Managed Database (Recommended)**
- [Railway.app](https://railway.app) - $5/month
- [Supabase](https://supabase.com) - Free tier available
- [DigitalOcean Managed PostgreSQL](https://www.digitalocean.com/products/managed-databases) - $15/month
- [AWS RDS](https://aws.amazon.com/rds/) - Pay as you go

**Option B: Self-Hosted**
- Use included Docker setup
- Requires server management

**Steps:**
1. Create PostgreSQL database (version 14+)
2. Note connection details:
   - Host
   - Port
   - Database name
   - Username
   - Password
3. Construct `DATABASE_URL`:
   ```
   postgresql://username:password@host:port/database
   ```

**Environment Variables:**
```bash
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/njstars
```

---

### 1.3 Deployment Setup 🔴 CRITICAL

#### Backend Deployment
**Time:** 1-2 hours

**Recommended Platforms:**

**Option A: Railway.app (Easiest)**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway link
railway up

# Set environment variables in Railway dashboard
```

**Option B: Heroku**
```bash
# Install Heroku CLI
brew install heroku/brew/heroku

# Login and create app
heroku login
heroku create njstars-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Deploy
git subtree push --prefix backend heroku main
```

**Option C: DigitalOcean App Platform**
1. Connect GitHub repository
2. Select `backend` folder as source
3. Set build command: `pip install -r requirements.txt`
4. Set run command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables

**Option D: Docker (Self-Hosted)**
```bash
# Use included docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d
```

**Required Environment Variables:**
- All variables from `backend/.env.example`
- See section 1.1 for API keys

---

#### Frontend Deployment
**Time:** 30 minutes - 1 hour

**Recommended Platforms:**

**Option A: Vercel (Easiest - Built for Next.js)**
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Select `frontend` as root directory
4. Framework preset: Next.js
5. Add environment variables (from `.env.example`)
6. Deploy

**Option B: Netlify**
1. Go to [netlify.com](https://netlify.com)
2. Connect GitHub repository
3. Build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Add environment variables
5. Deploy

**Option C: Docker (Self-Hosted)**
```bash
# Use included docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d
```

**Required Environment Variables:**
- All variables from `frontend/.env.example`
- Update `NEXT_PUBLIC_API_URL` with backend URL
- Update `NEXTAUTH_URL` with frontend URL

---

### 1.4 Domain & SSL 🔴 CRITICAL

**Time:** 30 minutes - 2 hours (DNS propagation)

**Steps:**
1. **Purchase domain** (if not owned):
   - Namecheap, Google Domains, Cloudflare
   - Suggestion: `njstarsbasketball.com`

2. **Configure DNS:**
   - Point domain to frontend deployment
   - Point subdomain to backend (e.g., `api.njstarsbasketball.com`)
   - Or use reverse proxy (Nginx) to route `/api` to backend

3. **SSL Certificates:**
   - Vercel/Netlify: Automatic SSL
   - Self-hosted: Use [Let's Encrypt](https://letsencrypt.org) (free)
   - Cloudflare: Free SSL + CDN

4. **Update Environment Variables:**
   ```bash
   # Backend
   FRONTEND_URL=https://njstarsbasketball.com

   # Frontend
   NEXT_PUBLIC_API_URL=https://api.njstarsbasketball.com
   NEXTAUTH_URL=https://njstarsbasketball.com
   ```

---

### 1.5 Environment Variables Checklist ✅

Use this checklist to ensure all variables are set:

#### Backend Production Variables
```bash
# Database
✅ DATABASE_URL=postgresql://...

# Security
✅ SECRET_KEY=<generate-with-openssl>
✅ ALGORITHM=HS256
✅ ACCESS_TOKEN_EXPIRE_MINUTES=30

# Stripe
✅ STRIPE_SECRET_KEY=sk_live_...
✅ STRIPE_WEBHOOK_SECRET=whsec_...

# Instagram (optional)
⬜ INSTAGRAM_ACCESS_TOKEN=...
⬜ INSTAGRAM_USER_ID=...

# CORS
✅ FRONTEND_URL=https://yourdomain.com
```

#### Frontend Production Variables
```bash
# API
✅ NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# NextAuth
✅ NEXTAUTH_URL=https://yourdomain.com
✅ NEXTAUTH_SECRET=<generate-with-openssl>

# Google OAuth (optional)
⬜ GOOGLE_CLIENT_ID=...
⬜ GOOGLE_CLIENT_SECRET=...

# Stripe
✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Generate secure keys:**
```bash
# For SECRET_KEY and NEXTAUTH_SECRET
openssl rand -hex 32
```

---

## Phase 2: Content & Testing (Week 3)

### 2.1 Content Creation 🟠 HIGH

**Time:** 3-5 days

#### Real Content to Add
- [ ] **Blog posts** - Write 5-10 initial articles
- [ ] **Product images** - Professional photos of merch
- [ ] **Product descriptions** - Write compelling copy
- [ ] **Event details** - Add real upcoming events
- [ ] **Team roster** - Add current team members
- [ ] **About page content** - Team mission, history, coaches
- [ ] **Contact information** - Real email, phone, address
- [ ] **Social media links** - Instagram, Twitter, Facebook

#### Update These Files:
- Database: Remove seed data, add real data
- Frontend: Update text, images, links in components
- `frontend/public/`: Add real images/logos

---

### 2.2 User Acceptance Testing 🟠 HIGH

**Time:** 2-3 days

#### Test Scenarios
- [ ] **User Registration & Login**
  - Email/password signup
  - Google OAuth (if enabled)
  - Password reset (if implemented)

- [ ] **Shopping Flow**
  - Browse products
  - Add to cart
  - Checkout with Stripe (use test mode)
  - Receive confirmation
  - Admin: View order in dashboard

- [ ] **News Feed**
  - View blog posts
  - Load Instagram posts
  - Pagination/loading

- [ ] **Events**
  - View upcoming events
  - Filter by type
  - RSVP functionality (if implemented)

- [ ] **Protected Portal**
  - Admin dashboard access
  - Parent view (schedules, payments)
  - Player view (stats, schedule)
  - Role-based restrictions

- [ ] **Mobile Responsiveness**
  - Test on iPhone (Safari)
  - Test on Android (Chrome)
  - Test on tablet

#### Test with Real Users
- [ ] Get 3-5 parents to test
- [ ] Get 2-3 admins to test
- [ ] Collect feedback
- [ ] Fix critical issues

---

### 2.3 Performance & Security 🟠 HIGH

**Time:** 1-2 days

#### Performance Checklist
- [ ] Run Lighthouse audit (target 90+ score)
- [ ] Optimize images (compress, use WebP)
- [ ] Enable caching headers
- [ ] Test load times on mobile network
- [ ] Check database query performance
- [ ] Enable gzip compression
- [ ] Consider CDN for static assets

#### Security Checklist
- [ ] ✅ Webhook signature verification (done)
- [ ] ✅ Password hashing (done)
- [ ] ✅ JWT token validation (done)
- [ ] ✅ CORS configuration (done)
- [ ] ✅ SQL injection protection (done)
- [ ] Audit environment variables (no secrets exposed)
- [ ] Enable HTTPS only (no HTTP)
- [ ] Set up security headers (CSP, X-Frame-Options)
- [ ] Review API rate limiting
- [ ] Test with OWASP ZAP or similar

---

## Phase 3: Launch & Monitoring (Week 4)

### 3.1 Pre-Launch Checklist 🔴 CRITICAL

**Time:** 1 day

- [ ] All environment variables set correctly
- [ ] Database backed up
- [ ] Stripe in live mode with real products
- [ ] Webhook endpoint verified and tested
- [ ] Domain and SSL working
- [ ] Google OAuth tested (if enabled)
- [ ] All test data removed from production
- [ ] Admin accounts created
- [ ] Contact forms sending to correct emails
- [ ] Error tracking set up (Sentry, LogRocket)
- [ ] Analytics installed (Google Analytics)
- [ ] Privacy policy & terms of service added
- [ ] 404/500 error pages customized
- [ ] Favicon and meta images added

---

### 3.2 Launch Day 🚀

**Time:** 1 day

#### Morning
1. Final smoke test of all features
2. Announce "soft launch" to small group
3. Monitor for issues

#### Afternoon
4. Broader announcement to team/parents
5. Share on social media
6. Send email newsletter

#### Evening
7. Monitor error logs
8. Check Stripe webhooks
9. Review analytics
10. Respond to feedback

---

### 3.3 Monitoring & Maintenance 🟠 HIGH

**Time:** Ongoing

#### Set Up Monitoring
- [ ] **Error Tracking:** [Sentry](https://sentry.io) (free tier)
  ```bash
  npm install @sentry/nextjs
  ```

- [ ] **Analytics:** [Google Analytics 4](https://analytics.google.com)
  ```bash
  npm install @next/third-parties
  ```

- [ ] **Uptime Monitoring:** [UptimeRobot](https://uptimerobot.com) (free)
  - Monitor: Frontend homepage
  - Monitor: Backend `/health` endpoint
  - Alert: Email/SMS on downtime

- [ ] **Performance:** [Vercel Analytics](https://vercel.com/analytics) (if on Vercel)

#### Weekly Tasks
- [ ] Review error logs
- [ ] Check Stripe orders
- [ ] Monitor server resources
- [ ] Review analytics (traffic, conversions)
- [ ] Backup database

---

## Phase 4: Enhancements (Weeks 5-12)

### 4.1 Priority Enhancements 🟡 MEDIUM

#### Email Notifications
**Time:** 2-3 days

**Services:**
- [SendGrid](https://sendgrid.com) - 100 emails/day free
- [Mailgun](https://www.mailgun.com) - 5,000 emails/month free
- [Amazon SES](https://aws.amazon.com/ses/) - Pay as you go

**Email Types:**
- Welcome email (new user)
- Order confirmation
- Event reminders
- Newsletter
- Password reset

**Implementation:**
```bash
# Backend
pip install sendgrid

# Add to backend/app/services/email.py
# Create email templates
```

---

#### Advanced Search & Filtering
**Time:** 3-5 days

**Features:**
- Full-text search for blog posts
- Product filtering (size, color, price range)
- Event search by date/location
- Player/roster search

**Implementation:**
- Simple: Add more query parameters to existing endpoints
- Advanced: Add Elasticsearch or Algolia

---

#### Admin CMS Improvements
**Time:** 5-7 days

**Features:**
- [ ] Rich text editor for blog posts
- [ ] Image upload for products
- [ ] Event creation form
- [ ] Roster management (add/edit players)
- [ ] Order management (view, refund)
- [ ] Analytics dashboard
- [ ] Bulk operations

**Consider:**
- Build custom admin panel
- Or integrate: [Payload CMS](https://payloadcms.com), [Strapi](https://strapi.io)

---

#### Real-time Features
**Time:** 5-7 days

**Features:**
- Live score updates during games
- Real-time notifications
- Chat/messaging for team

**Technology:**
- WebSockets (Socket.io)
- Server-Sent Events (SSE)
- Firebase Realtime Database

---

### 4.2 Tryout Registration Form 🔴 HIGH (Updated Dec 8)

**Time:** 2-3 days

**Reference:** [Current Google Form](https://docs.google.com/forms/d/1i00gs-lvsGbOgTvJCAVqy1emsd1oF0hkdU1tQwaoIUQ/viewform)

**Goal:** Replace the external Google Form with an integrated tryout signup form that matches the NJ Stars UI styling and stores registrations in the database.

> **Dec 8 Meeting Update:** Form should be modal-based, auto-populate for logged-in users, and support multi-child registration. See [Meeting Notes](./meeting%20notes/MEETING_NOTES_2025-12-08.md#5-tryout-registration-form-) for full requirements.

**Form Fields (All Required):**

| Field | Type | Options/Notes |
|-------|------|---------------|
| Player's Full Name | Text input | Required |
| Player's D.O.B. | Date picker | MM/DD/YYYY format |
| Player's Grade | Dropdown | 3, 4, 5, 6, 7, 8 |
| Player's Jersey Size | Dropdown | Youth Medium, Youth Large, Adult Small, Adult Medium, Adult Large, Adult XL |
| Guardian's Full Name | Text input | Required |
| Guardian's Email | Email input | Required, use for confirmation |
| Guardian's Phone Number | Phone input | Required |

**Auto-Population Feature:**
- If user is logged in, auto-populate relevant fields from their profile:
  - Guardian's name, email, phone from user account
  - Player info if they have a linked player profile
- Show pre-filled fields as editable (user can still modify)
- For returning users, consider storing player info for quick re-registration

**Implementation Notes:**
- [ ] Create `TryoutRegistration` model in Django (`apps/registrations/`)
- [ ] Add DRF endpoint `POST /api/registrations/tryouts/`
- [ ] Build form component in Next.js with shadcn/ui form elements
- [ ] Add form validation (client-side and server-side)
- [ ] Send confirmation email to guardian on submission
- [ ] Admin view in Django to see/export registrations
- [ ] Fetch user profile data on mount to pre-fill form fields
- [ ] Consider adding: event/date selection if multiple tryout dates
- [ ] Link form to specific tryout event announcements on the site

**UI Considerations:**
- Use existing shadcn/ui form components (`Input`, `Select`, `DatePicker`, `Button`)
- Match the card-based styling used elsewhere on the site
- Include success/error states with toast notifications
- Mobile responsive design
- Visual indicator for auto-filled fields (e.g., subtle highlight or "from your profile" label)

---

### 4.3 Parent & Player Portals 🟡 MEDIUM

**Time:** 1-2 weeks

**Goal:** Create dedicated dashboard experiences for parents/guardians and players with role-specific features and streamlined workflows.

---

#### Parent/Guardian Portal

**Core Features:**

| Feature | Description |
|---------|-------------|
| **Multi-Player Management** | Link multiple children/players to a single parent account. View all linked players from one dashboard. |
| **Bulk Event Registration** | Sign up multiple children for the same event from a single form. Select which players to register, auto-fill their info. |
| **Payment Management** | View and manage payments for all linked players. Pay outstanding balances, view payment history, set up recurring payments. |
| **Schedule View** | Consolidated calendar showing all linked players' practices, games, and events. Color-coded by player. |
| **Player Profiles** | View/edit each child's profile (contact info, jersey size, grade, medical info). |

**Data Model:**
```
ParentProfile
├── user (FK to User)
├── phone_number
├── secondary_email (optional)
└── players (M2M to PlayerProfile)

PlayerProfile
├── full_name
├── date_of_birth
├── grade
├── jersey_size
├── team (FK to Team, nullable)
├── guardian (FK to ParentProfile)
└── medical_notes (optional, encrypted)
```

**Implementation Notes:**
- [ ] Create `ParentProfile` and `PlayerProfile` models in `apps/core/`
- [ ] Add parent-player linking API endpoints
- [ ] Build parent dashboard page at `/portal/parent/`
- [ ] Create bulk registration flow component
- [ ] Consolidated calendar view with player filtering
- [ ] Payment history and management views (integrate with Stripe customer portal)

---

#### Player Portal

**Core Features:**

| Feature | Description |
|---------|-------------|
| **My Schedule** | Personal calendar with practices, games, and events |
| **Team Roster** | View teammates and coaches |
| **My Stats** | Personal statistics and performance tracking (future) |
| **Announcements** | Team-specific news and updates |

**Implementation Notes:**
- [ ] Build player dashboard page at `/portal/player/`
- [ ] Personal schedule component
- [ ] Team roster view with contact info (coach approved)
- [ ] Stats display (placeholder for future tracking)

---

#### 🎓 Report Card Rewards Program (Nice-to-Have)

**Concept:** Incentivize academic excellence by offering discounts on merch and private training sessions for players who submit report cards showing good grades.

**How It Works:**
1. Player/parent uploads photo of report card via portal
2. Admin reviews and approves submission
3. System generates discount code based on grade tier:
   - **Honor Roll (A/B average):** 15% off merch, $10 off private session
   - **High Honors (A average):** 25% off merch, $20 off private session
   - **Principal's List:** 30% off merch, free private session
4. Discount code tied to player's account, valid for set period (e.g., one semester)

**Data Model:**
```
ReportCardSubmission
├── player (FK to PlayerProfile)
├── image (ImageField)
├── submitted_at
├── grade_period (e.g., "Fall 2025")
├── status (pending, approved, rejected)
├── approved_tier (honor_roll, high_honors, principals_list)
├── discount_code (generated on approval)
└── admin_notes
```

**Implementation Notes:**
- [ ] Add image upload to player portal
- [ ] Admin review queue in Django admin
- [ ] Auto-generate unique discount codes on approval
- [ ] Integrate discount codes with Stripe checkout
- [ ] Notification to parent when code is ready
- [ ] Track redemption history

**UI Considerations:**
- Celebration animation on approval notification
- Display active discounts prominently on parent dashboard
- Show "Submit Report Card" CTA during report card season

---

### 4.4 Shopping Cart System 🔴 CRITICAL (Added Dec 8)

**Time:** 3-5 days

**Current State:** No cart - direct Stripe checkout only

**Goal:** Implement a full shopping cart system to improve UX and enable multi-item purchases.

> **Full Requirements:** See [Meeting Notes](./meeting%20notes/MEETING_NOTES_2025-12-08.md#7-shopping-cart-functionality-)

**Backend Implementation:**
- [ ] Create `Cart` model in `apps/payments/models.py`
- [ ] Create `CartItem` model with product/variant FK
- [ ] DRF endpoints: `GET/POST /api/cart/`, `PATCH/DELETE /api/cart/items/{id}/`
- [ ] Cart merging on user login (guest → authenticated)
- [ ] Cart expiration/cleanup for abandoned carts

**Frontend Implementation:**
- [ ] Cart state management (React Context or Zustand)
- [ ] `useCart()` hook for add/remove/update operations
- [ ] Cart icon in header with item count badge
- [ ] Cart drawer/modal component (slide-in from right)
- [ ] Quantity adjustment (+/- buttons)
- [ ] Remove item functionality
- [ ] Subtotal calculation display
- [ ] "Continue Shopping" and "Checkout" CTAs

**Guest Cart Persistence:**
- [ ] Use localStorage for guest carts
- [ ] Merge localStorage cart into DB cart on login
- [ ] Cart survives browser refresh

---

### 4.5 Shop UX Improvements 🔴 HIGH (Added Dec 8)

**Time:** 2-3 days

**Goal:** Simplify product cards for better mobile UX - make entire card clickable as quick view trigger.

> **Full Requirements:** See [Meeting Notes](./meeting%20notes/MEETING_NOTES_2025-12-08.md#6-shop-ux-improvements-)

**Changes Required:**
- [ ] Remove all buttons from product cards (no "Add to Cart", "Quick View", etc.)
- [ ] Make entire card clickable → opens Quick View modal
- [ ] Add color/variant swatches below product image (apparel only)
- [ ] Quick View modal contains:
  - Size/color selector
  - "Add to Cart" button
  - "View Details" link to full product page
- [ ] Update hover states for card (subtle scale/shadow)

**Component Updates:**
- [ ] Refactor `ProductCard` component
- [ ] Update `ProductQuickView` modal with cart integration
- [ ] Add variant selector component (reusable)

---

### 4.6 Coach Management System 🔴 HIGH (Added Dec 8)

**Time:** 2-3 days

**Goal:** Add coaching staff to the platform with admin management and public profiles.

> **Full Requirements:** See [Meeting Notes](./meeting%20notes/MEETING_NOTES_2025-12-08.md#1-coach-management-system-)

**Initial Coaches:**
| Name | Role | Instagram |
|------|------|-----------|
| Trajan "Tray" Chapman | Head Coach & Trainer | @traygotbounce |
| Chris Morales | Skills Clinic Coach | @coach.cee |
| Kenneth Andrade | Founder (Coach K) | @kenny_164 |

**Backend Implementation:**
- [ ] Create `Coach` model in `apps/core/models.py`:
  - name, display_name, role, bio, photo
  - instagram_handle, email, phone
  - specialties, is_active
- [ ] Register in Django admin
- [ ] DRF endpoint: `GET /api/coaches/`
- [ ] Optional: Link coaches to events

**Frontend Implementation:**
- [ ] Create `CoachCard` component
- [ ] Add coaches section to About page (or dedicated `/coaches` page)
- [ ] Display photo, name, role, brief bio
- [ ] Link to Instagram profile

**Content Source:** Permission granted to use content from njstarseliteaau.com and @njstarselite_aau Instagram.

---

### 4.7 Coach Payout System 🟠 MEDIUM (Added Dec 8)

**Time:** 1-2 weeks

**Goal:** Enable coaches to receive payouts from platform revenue (training sessions, events, etc.)

> **Full Requirements:** See [Meeting Notes](./meeting%20notes/MEETING_NOTES_2025-12-08.md#2-coach-payout-system-)

**Prerequisites:**
- Coach Management System (4.6)
- Stripe Connect account setup

**Backend Implementation:**
- [ ] Create `CoachProfile` model (extends Coach with payment info)
- [ ] Create `CoachEarning` model (tracks revenue per coach)
- [ ] Create `Payout` model (tracks payout status)
- [ ] Integrate Stripe Connect for automated payouts
- [ ] Admin interface for payout management
- [ ] DRF endpoints for coach earnings dashboard

**Frontend Implementation:**
- [ ] Coach dashboard page (`/portal/coach/`)
- [ ] Earnings summary widget
- [ ] Payout history table
- [ ] Upcoming sessions/events

---

### 4.8 Multi-Instagram Huddle 🟠 MEDIUM (Added Dec 8)

**Time:** 1 week

**Goal:** Connect multiple coach Instagram accounts and merge posts into unified news feed ("The Huddle").

> **Full Requirements:** See [Meeting Notes](./meeting%20notes/MEETING_NOTES_2025-12-08.md#3-instagram-huddle-enhancement-)

**Backend Implementation:**
- [ ] Create `InstagramAccount` model:
  - account_name, handle, access_token, user_id
  - is_active (toggle for fetching)
  - linked_coach (optional FK to Coach)
- [ ] Update `InstagramPost` model with source_account FK
- [ ] Modify fetch logic to pull from all active accounts
- [ ] Admin interface to manage connected accounts
- [ ] Scheduled task for auto-fetching (Celery/APScheduler)

**Frontend Implementation:**
- [ ] Display coach name/handle on each post in feed
- [ ] Filter posts by coach (optional)
- [ ] Unified feed sorting by date

**Accounts to Connect:**
- @njstarselite_aau (team account)
- @traygotbounce (Tray)
- @coach.cee (Coach Cee)
- @kenny_164 (Coach K)

---

### 4.9 Hero Video Integration 🟡 MEDIUM (Added Dec 8)

**Time:** 1-2 days

**Goal:** Display highlight videos from Instagram in hero section with opaque overlay.

> **Full Requirements:** See [Meeting Notes](./meeting%20notes/MEETING_NOTES_2025-12-08.md#4-hero-section-video-integration-)

**Implementation:**
- [ ] Add `hero_video_url` field to Wagtail `HomePage` model
- [ ] Update `Hero` component to detect video vs image
- [ ] Use HTML5 `<video>` tag with autoplay, muted, loop
- [ ] Add dark overlay (rgba(0,0,0,0.5) or similar)
- [ ] Fallback to static image if video unavailable
- [ ] Mobile: Consider showing image instead (bandwidth)
- [ ] Lazy load video for performance

**Video Sources:**
- Pull from @njstarselite_aau Instagram
- Consider hosting on Cloudinary/S3 for reliability

---

### 4.10 Custom Products System 🔴 CRITICAL (Added Dec 9)

**Time:** 3-5 days

**Goal:** Allow coaches to create one-off custom products/invoices for private training, custom packages, etc.

> **Full Requirements:** See [Meeting Notes](./meeting%20notes/MEETING_NOTES_2025-12-09.md#1-custom-productsservices-system--high-priority)

**Use Case:**
Client DMs coach for custom training → Coach creates invoice on platform → Client pays via Stripe → Coach gets paid (minus 5% platform fee)

**Backend Implementation:**
- [ ] Create `CustomProduct` model in `apps/payments/models.py`:
  - coach (FK), title, description, price
  - recipient_email, recipient_name (optional)
  - slug (unique shareable code)
  - status (active, paid, expired, cancelled)
  - stripe_payment_intent_id, paid_at
- [ ] Create `CustomProductPayment` model for payment records
- [ ] DRF endpoints:
  - `POST /api/custom-products/` (create - coach only)
  - `GET /api/custom-products/` (list coach's products)
  - `GET /api/custom-products/{slug}/` (public invoice data)
  - `POST /api/custom-products/{slug}/checkout/` (Stripe session)
- [ ] Webhook handler for custom product payments
- [ ] Admin interface for viewing all custom products

**Frontend Implementation:**
- [ ] Public invoice page at `/pay/[slug]`:
  - Coach photo and name
  - Service title and description
  - Price and Pay Now button
  - Stripe Checkout integration
- [ ] Success/cancelled redirect pages
- [ ] (Future) Coach dashboard for creating invoices

**Revenue Split:**
- Platform: 5% of custom product sales
- Coach: 95% of custom product sales

---

### 4.12 Printify POD Integration 🔴 CRITICAL (Added Dec 10) ✅ COMPLETE

**Time:** 5-7 days

**Goal:** Support two fulfillment types for products:
1. **POD (Print on Demand):** Fulfilled via Printify API (t-shirts, hoodies, accessories)
2. **Local:** Coach hand-delivery at practice (game jerseys, shoes, vendor products)

**What Was Implemented:**

#### Backend Changes
- **Product Model:** Added `fulfillment_type` field with choices: `pod`, `local`
  - Helper properties: `is_pod`, `is_local`, `shipping_estimate`, `fulfillment_display`
- **OrderItem Model:** Added `selected_size`, `selected_color`, `fulfillment_type` fields
- **Printify Client:** New service at `apps/payments/services/printify_client.py`
  - Methods: `create_order()`, `get_order()`, `send_to_production()`, `calculate_shipping()`
- **Stripe Webhook Update:** Creates Order + OrderItems, submits POD items to Printify
- **Printify Webhook:** New endpoint `POST /api/payments/webhook/printify/`
  - Handles: `order:sent-to-production`, `order:shipment:created`, `order:shipment:delivered`
- **Shipping Calculator:** New endpoint `POST /api/payments/bag/shipping/`
- **User Orders API:** New endpoint `GET /api/payments/orders/`

#### Frontend Changes
- **Shop Page:** Added fulfillment badges (Made to Order / Coach Delivery)
- **Product Detail:** POD info banner, shipping estimate, updated stock display
- **Quick View Modal:** Shipping estimate, POD-aware stock indicator
- **Order History Page:** New page at `/portal/orders` with tracking support

#### Admin Changes
- Fulfillment badge column in product list
- Improved fieldsets showing fulfillment type prominently
- Stock display shows "∞ POD" for print-on-demand products

#### Environment Variables Required
```bash
# backend/.env
PRINTIFY_API_KEY=your-api-key
PRINTIFY_SHOP_ID=your-shop-id
PRINTIFY_WEBHOOK_SECRET=optional-webhook-secret
```

#### Product Setup Workflow
**For POD Products:**
1. Create product in Printify dashboard
2. Copy Product ID and Variant ID
3. In Django admin: Create product, set `fulfillment_type = 'pod'`
4. Paste Printify IDs
5. Set `manage_inventory = False`

**For Local Products:**
1. Create product in Django admin
2. Set `fulfillment_type = 'local'`
3. Set `manage_inventory = True`
4. Set initial `stock_quantity`

#### Printify Webhook Setup
1. Go to Printify Dashboard → Settings → Webhooks
2. Add endpoint: `https://api.njstarselite.com/api/payments/webhook/printify/`
3. Select events: shipment:created, order status changes

---

### 4.11 Nice-to-Have Features 🟢 LOW

#### Social Features
- Comment system on blog posts
- Player profiles with stats/highlights
- Photo galleries
- Video highlights
- Social sharing buttons

#### Enhanced E-commerce
- Discount codes
- Bundle deals
- Size/color variants
- Inventory alerts (low stock)
- Wishlist
- Gift cards

#### 🎉 Checkout Success Celebration

**Goal:** Add a fun, celebratory animation when a user successfully completes a merch purchase to create a positive emotional moment.

**Implementation Options:**

| Option | Library | Notes |
|--------|---------|-------|
| **Confetti Burst** | `canvas-confetti` | Lightweight (~3KB), no deps, easy to trigger |
| **Lottie Animation** | `lottie-react` | More customizable, can use custom animations |
| **CSS Keyframes** | Native | Zero deps, simple star/sparkle burst |

**Recommended: Canvas Confetti**
```bash
npm install canvas-confetti
```

**Trigger Points:**
- On `/checkout/success` page load (after Stripe redirect)
- On successful order confirmation modal
- On report card reward approval (tie into existing celebration mention)

**UX Guidelines:**
- Keep it brief (1-2 seconds max)
- Don't block content - animation should overlay
- Respect `prefers-reduced-motion` media query for accessibility
- Use team colors (black/white/hot pink confetti) for brand consistency
- Optional: Add a subtle sound effect (with user preference toggle)

**Example Usage:**
```typescript
// On success page mount
import confetti from 'canvas-confetti';

useEffect(() => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#000000', '#FFFFFF', '#FF69B4'] // NJ Stars colors: black, white, hot pink
  });
}, []);
```

**Implementation Notes:**
- [ ] Install `canvas-confetti` package
- [ ] Create reusable `useCelebration` hook
- [ ] Add to checkout success page
- [ ] Add reduced motion check
- [ ] Consider adding to other success moments (event registration, tryout signup)

#### Team Management
- Practice attendance tracking
- Player statistics dashboard
- Coach notes/feedback
- Parent communication log
- Document sharing (waivers, forms)

#### Integrations
- Mailchimp (email marketing)
- Google Calendar (event sync)
- Teamsnap (team management)
- YouTube (video embeds)

---

## Phase 5: Mobile App (Weeks 13-20)

### 5.1 Mobile App Development 📱

**Time:** 6-8 weeks
**See:** `MOBILE_APP.md` for complete guide

#### Quick Overview

**Week 1-2: Setup & Authentication**
- Set up React Native project
- Replicate API client from `frontend/src/lib/api-client.ts`
- Implement login/registration screens
- Set up secure token storage

**Week 3-4: Core Features**
- Home/news feed
- Events calendar
- Shop (product browsing)
- User profile

**Week 5-6: Advanced Features**
- Stripe integration (in-app payments)
- Push notifications
- Offline support
- Image caching

**Week 7: Testing**
- Unit tests
- Integration tests
- TestFlight (iOS) / Internal testing (Android)

**Week 8: Launch**
- App Store submission
- Google Play submission
- Marketing materials

---

## 📋 Quick Action Items Summary

### Immediate (This Week)
1. ✅ Review `PROJECT_STATUS.md` to understand current state
2. ✅ Stripe test integration working (checkout sessions, webhooks)
3. ✅ Wagtail CMS fully integrated with Next.js frontend
4. ✅ News feed merges blog posts with Instagram
5. ✅ Shop page with multi-select filters and product tags
6. ✅ Product Quick View modal implemented
7. ✅ Hero section with CMS control
8. ✅ **Authentication System** - dj-rest-auth integration with password reset and registration
9. 🔴 **Shopping Cart functionality** (see [Meeting Notes](./meeting%20notes/MEETING_NOTES_2025-12-08.md#7-shopping-cart-functionality-))
10. 🔴 **Shop UX: Card = Quick View** (remove buttons from cards)
11. 🔴 Set up Stripe live mode API keys for production
12. 🟠 **Configure production email** (SendGrid/Mailgun) for password reset emails

### This Month
11. 🔴 **Tryout Registration Form Modal** (replace Google Form)
12. 🔴 **Coach Management System** (add Tray, Coach Cee, Coach K)
13. 🔴 Deploy backend to production
14. 🔴 Deploy frontend to production
15. 🔴 Configure Stripe webhooks for production
16. 🟠 Add real content (products, blog posts, events) via Wagtail CMS
17. 🟠 User acceptance testing
18. 🚀 Launch!

### Next Month
19. 🟠 **Coach Payout System** (Stripe Connect integration)
20. 🟠 **Multi-Instagram Huddle** (connect multiple coach accounts)
21. 🟡 **Hero Video Integration** (pull from Instagram)
22. 🟡 Set up monitoring and analytics (Sentry, Google Analytics)
23. 🟡 Implement email notifications (newsletter integration)
24. 🟡 Add advanced admin features
25. 🟡 Collect user feedback and iterate

### Quarter 2
26. 📱 Start mobile app development
27. 🟢 Parent/Child Portal with multi-player management
28. 🟢 Add nice-to-have features
29. 🟢 Marketing and growth

---

## 🆘 Getting Help

### Technical Issues
- Check `DOCKER.md` for Docker issues
- Check `TESTING.md` for test failures
- Check `README.md` for general setup
- Review error logs (Sentry if set up)

### Deployment Issues
- **Vercel:** [Vercel Docs](https://vercel.com/docs)
- **Railway:** [Railway Docs](https://docs.railway.app)
- **Heroku:** [Heroku Dev Center](https://devcenter.heroku.com)

### API Services
- **Stripe:** [Stripe Docs](https://stripe.com/docs)
- **Google OAuth:** [Google Identity](https://developers.google.com/identity)
- **Instagram:** [Instagram API](https://developers.facebook.com/docs/instagram-basic-display-api)

---

## 🎯 Success Metrics

### Launch Metrics
- [ ] Platform accessible 24/7
- [ ] All core features working
- [ ] No critical bugs
- [ ] Payment processing working
- [ ] Mobile responsive

### Month 1 Goals
- [ ] 50+ registered users
- [ ] 10+ orders processed
- [ ] <2 second page load times
- [ ] 99.9% uptime

### Quarter 1 Goals
- [ ] 200+ registered users
- [ ] 50+ orders processed
- [ ] Active blog (2 posts/week)
- [ ] Mobile app in beta

---

## 📞 Support & Questions

For any questions while following this roadmap:
1. Review relevant documentation (`DOCKER.md`, `MOBILE_APP.md`, etc.)
2. Check error logs and monitoring tools
3. Search provider documentation (Stripe, Vercel, etc.)
4. Create GitHub issue with details

---

**Ready to launch?** Start with **Phase 1** and work through each section systematically. Good luck! 🚀
