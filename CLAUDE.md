# CLAUDE.md

> **Purpose:** Provide Claude Code with comprehensive context for working with this codebase.
> **Last Updated:** December 10, 2025

---

## Ownership & Licensing

**This platform and all associated technology is proprietary to Stryder Labs LLC.**

- All source code, design systems, and architectural patterns are owned by Stryder Labs LLC
- NJ Stars Elite AAU is the first tenant/client using this platform
- The platform is designed to be licensed to other youth sports organizations as a SaaS product

---

## Project Vision

**NJ Stars Elite AAU Basketball** is the **proof-of-concept MVP** for **LEAG** , a multi-tenant youth sports platform owned by Stryder Labs LLC.

### Platform Overview

| | |
|---|---|
| **Platform Name** | LEAG |
| **Platform Domains** | `leag.app` |
| **First Tenant** | NJ Stars Elite AAU Basketball |
| **Tenant Domain** | `njstarselite.com` (primary), `njstarsbasketball.com` (secondary) |

### Vision

LEAG will be a SaaS platform serving AAU teams, youth sports leagues, travel teams, and athletic organizations. Each tenant gets:
- Branded public website with CMS
- E-commerce merch store
- Event management & registration
- Member portal (parents, players, coaches)
- Payment processing with revenue sharing

**Key Architectural Principle:** All features should be designed with multi-tenancy in mind. Avoid hard-coding NJ Stars-specific logic—use configuration and tenant-scoped data models instead.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Django 5.0 + Wagtail CMS 7.2.1 |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| **Database** | PostgreSQL 14+ |
| **Auth** | django-allauth + dj-rest-auth (backend), NextAuth.js v5 (frontend) |
| **Payments** | Stripe (checkout, subscriptions, webhooks) |
| **Deployment** | Railway (backend + DB), Vercel (frontend) |
| **Containerization** | Docker + Docker Compose |

---

## Directory Structure

```
nj-stars/
├── backend/                    # Django + Wagtail API
│   ├── apps/
│   │   ├── core/              # Coaches, Instagram, Newsletter
│   │   ├── events/            # Events + iCal sync
│   │   ├── registrations/     # Event registration
│   │   ├── payments/          # Stripe, Products, Orders, Bag, Subscriptions
│   │   ├── portal/            # User profiles, Players, Dues, Waivers, Check-ins
│   │   └── cms/               # Wagtail pages (Home, Blog, Team)
│   ├── config/
│   │   ├── settings/          # base.py, development.py, production.py
│   │   └── urls.py            # Main URL router
│   └── manage.py
├── frontend/                   # Next.js application
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── (public)/      # Homepage, shop, events, news
│   │   │   ├── portal/        # Protected member portal
│   │   │   └── shop/          # E-commerce pages
│   │   ├── components/        # React components
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   └── skeletons/     # Loading states
│   │   ├── lib/               # Utilities
│   │   │   ├── api-client.ts  # Django REST API client
│   │   │   ├── wagtail-client.ts  # Wagtail CMS client
│   │   │   └── bag.tsx        # Shopping bag context
│   │   └── types/             # TypeScript definitions
│   └── public/                # Static assets
├── documentation/             # Project docs, meeting notes, audits
├── docker-compose.yml         # Development containers
├── docker-compose.prod.yml    # Production containers
└── Makefile                   # Docker shortcuts
```

---

## Development Commands

### Docker (Recommended)

```bash
# Core commands
make build              # Build all containers
make up                 # Start all services (detached)
make down               # Stop all services
make restart            # Restart all services
make logs               # View logs from all services
make status             # Show container status

# Database
make seed               # Seed DB with test data (runs seed_data + seed_wagtail)
make db-shell           # Open PostgreSQL shell
make db-reset           # Reset database (WARNING: deletes all data)

# Testing
make test               # Run all tests (backend + frontend)
make test-backend       # Backend tests with coverage
make test-frontend      # Frontend tests

# Shell access
make shell-backend      # Bash shell in backend container
make shell-frontend     # Shell in frontend container

# Individual service management
make restart-backend    # Restart just the backend
make restart-frontend   # Restart just the frontend
make logs-backend       # View only backend logs
make logs-frontend      # View only frontend logs

# Production
make prod-build         # Build production images
make prod-up            # Start production services
make prod-down          # Stop production services
```

### Local Development (Without Docker) - Not Recommended

> **Note:** Docker is the recommended development environment. Only use local development if Docker is unavailable or having issues.

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data           # Seed test data
python manage.py seed_wagtail        # Seed CMS content
python manage.py runserver           # http://localhost:8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev                          # http://localhost:3000
npm run build                        # Production build
npm run lint                         # ESLint check
npm test                             # Jest tests
```

### Stripe Webhook Testing
```bash
# Install Stripe CLI, then:
stripe listen --forward-to localhost:8000/api/payments/webhook/stripe/
```

---

## API Reference

### Django REST Framework Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/events/` | List events (filter: `?event_type=tryout`) |
| `GET` | `/api/events/{slug}/` | Single event details |
| `GET` | `/api/coaches/` | List all coaches |
| `GET` | `/api/instagram/` | Cached Instagram posts |
| `POST` | `/api/newsletter/subscribe/` | Newsletter signup |
| `GET` | `/api/payments/products/` | List products (filter: `?category=jersey&featured=true`) |
| `GET` | `/api/payments/products/{slug}/` | Single product |
| `GET` | `/api/payments/subscription-plans/` | Subscription tiers |
| `GET` | `/api/payments/bag/` | Get user's shopping bag |
| `POST` | `/api/payments/bag/items/` | Add item to bag |
| `POST` | `/api/payments/checkout/bag/` | Create Stripe checkout for bag |
| `POST` | `/api/payments/webhook/stripe/` | Stripe webhook handler |
| `GET` | `/api/portal/profile/` | User profile |
| `GET` | `/api/portal/players/` | User's linked players |
| `GET` | `/api/portal/dashboard/` | Parent dashboard data |
| `POST` | `/api/portal/waiver/sign/` | Sign waiver |

### Wagtail CMS API (v2)

| Endpoint | Description |
|----------|-------------|
| `GET /api/v2/pages/` | All CMS pages |
| `GET /api/v2/pages/?type=cms.HomePage&fields=*` | Homepage content |
| `GET /api/v2/pages/?type=cms.BlogPage&fields=date,intro,featured_image,category&order=-date` | Blog posts |
| `GET /api/v2/pages/?type=cms.TeamPage&fields=*` | Team roster |

### Authentication (dj-rest-auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login/` | Token login |
| `POST` | `/api/auth/logout/` | Logout |
| `POST` | `/api/auth/registration/` | Register new user |
| `POST` | `/api/auth/password/reset/` | Request password reset |
| `POST` | `/api/auth/password/reset/confirm/` | Confirm password reset |
| `GET` | `/api/auth/user/` | Current user details |

### Admin Panels

- **Wagtail CMS:** `/cms-admin/` - Content management (pages, images, documents)
- **Django Admin:** `/django-admin/` - Data management (users, products, orders)

---

## Database Models

### Core App (`apps/core/`)
- **Coach** - Coaching staff profiles (name, role, bio, instagram, specialties)
- **InstagramPost** - Cached Instagram posts for news feed
- **NewsletterSubscriber** - Email subscriptions with preferences

### Events App (`apps/events/`)
- **Event** - Events with registration, payments, iCal sync
- **CalendarSource** - External iCal feeds for auto-sync

### Payments App (`apps/payments/`)
- **Product** - Merch with multiple images, inventory tracking
- **ProductImage** - Product gallery images
- **Order** / **OrderItem** - Purchase records
- **Bag** / **BagItem** - Shopping cart (supports guests via session)
- **SubscriptionPlan** / **Subscription** - Recurring memberships
- **Payment** - Generic payment tracking

### Portal App (`apps/portal/`)
- **UserProfile** - Extended user data (role, phone, address, waiver status)
- **Player** - Player profiles (DOB, jersey, position, medical info)
- **GuardianRelationship** - Links guardians to players
- **DuesAccount** / **DuesTransaction** - Balance tracking
- **SavedPaymentMethod** - Stripe saved cards
- **PromoCredit** - Promotional credits
- **EventCheckIn** - Event attendance tracking

### CMS App (`apps/cms/`)
- **HomePage** - Hero section, CTA, section toggles
- **BlogIndexPage** / **BlogPage** - News/blog with categories
- **TeamPage** / **PlayerProfile** - Team roster

---

## Frontend Architecture

### Key Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage (Hero, Coaches, Featured Merch, News Feed, Newsletter) |
| `/shop` | Product grid with filters (category, tags, search, sort) |
| `/shop/[slug]` | Product detail with gallery and variants |
| `/shop/success` | Stripe checkout success |
| `/events` | Events listing with filters |
| `/news` | Combined blog + Instagram feed |
| `/portal/login` | Authentication |
| `/portal/register` | User registration |
| `/portal/dashboard` | Parent dashboard |
| `/portal/children` | Child/player management |
| `/portal/billing` | Payment methods, order history |

### Key Components

- **LayoutShell** - Page wrapper with header/footer
- **Hero** - Homepage hero section
- **CoachesSection** - Coach carousel with fallback data
- **FeaturedMerch** - Product grid (hides on API error)
- **NewsFeed** - Unified blog + Instagram feed (hides on API error)
- **BagDrawer** - Shopping cart sidebar
- **ProductQuickView** - Modal for quick product preview
- **EventRegistrationModal** - Event signup flow

### State Management

- **Shopping Bag:** React Context (`lib/bag.tsx`) with `useBag()` hook
- **Auth:** NextAuth.js session with `useSession()` hook
- **Theme:** `next-themes` with dark mode default

### Data Fetching Patterns

- **Server Components:** Wagtail CMS content (blog, team pages)
- **Client Components:** Products, events, news feed (with loading skeletons)
- **API Client:** `lib/api-client.ts` for Django REST endpoints
- **Wagtail Client:** `lib/wagtail-client.ts` for CMS content

---

## Design System

### Color Palette (CSS Variables in globals.css)

| Token | Purpose | HSL Value |
|-------|---------|-----------|
| `--primary` | Primary CTAs, links | Hot Pink (331.7 73.9% 53.3%) |
| `--secondary` | Secondary actions | Teal (188.7 94.5% 42.7%) |
| `--accent` | Destructive, alerts | Jersey Red (353.4 55% 48.8%) |
| `--tertiary` | Highlights, badges | Amber (37.7 92.1% 50.2%) |

### Design Principles

- **Dark Mode Default** - Premium feel, reduces eye strain
- **Mobile First** - 60%+ traffic expected from mobile
- **Skeleton Loaders** - Loading states over spinners
- **Nike-style Cards** - Image-centric, minimal text, no buttons on cards
- **Graceful Degradation** - Fallback data when APIs fail, hide empty sections
- **Muted Success for Admin UI** - Use `bg-success/30` hover states with `text-foreground` for dashboard cards
- **Semantic Variants** - Prefer `variant="success"` on buttons over inline color classes

> **Full Design System:** See `documentation/DESIGN_SYSTEM.md` for comprehensive UI patterns, color tokens, and component guidelines.

### Responsive Breakpoints

- **Mobile:** < 768px (2-column grids, touch-first)
- **Tablet:** md 768px (3-column)
- **Desktop:** lg 1024px (4-column)
- **Wide:** xl 1280px (full layouts)

---

## Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/njstars

# Security
SECRET_KEY=<generate-with-openssl-rand-hex-32>
DJANGO_SETTINGS_MODULE=config.settings.development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Instagram (optional - mock data available)
INSTAGRAM_ACCESS_TOKEN=...
INSTAGRAM_BUSINESS_ACCOUNT_ID=...
```

### Frontend (.env.local)

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:8000
INTERNAL_API_URL=http://backend:8000  # Docker internal

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-openssl-rand-hex-32>

# OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Testing

### Backend (pytest)

```bash
# Run all tests
pytest

# With coverage
pytest --cov=apps --cov-report=html

# Single test file
pytest apps/events/tests/test_views.py -v

# Single test
pytest apps/events/tests/test_views.py::TestEventViewSet::test_list -v
```

### Frontend (Jest)

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Single file
npm test -- --testPathPattern="ComponentName"
```

---

## Current Status & Priorities

### Completed Features (90%)
- Full e-commerce (products, bag, Stripe checkout, orders)
- Event management with registration and payments
- Wagtail CMS integration (homepage, blog, team pages)
- News feed merging blog posts + Instagram
- Coach profiles with fallback data
- Member portal with player management
- Authentication with OAuth (Google, Facebook, Apple)
- Calendar sync (iCal export, Google Calendar links)
- Shopping bag with guest support

### In Progress / Critical
1. **Instagram Graph API** - Replace mock data with live feed
2. **Custom Products/Invoices** - Coach-created payment links
3. **Private Lessons Booking** - `/privates` endpoint
4. **Tryout Registration** - Modal form with waivers

### Revenue Model
- **Platform Fee (Events/Merch):** 20%
- **Coach Services Fee:** 5%

---

## Common Tasks

### Adding a New API Endpoint

1. Create/update model in `apps/<app>/models.py`
2. Run migrations: `python manage.py makemigrations && python manage.py migrate`
3. Create serializer in `apps/<app>/serializers.py`
4. Create viewset in `apps/<app>/views.py`
5. Register route in `apps/<app>/urls.py`
6. Add types to `frontend/src/types/` if needed
7. Update API client in `frontend/src/lib/api-client.ts`

### Adding a New Page

1. Create route in `frontend/src/app/<route>/page.tsx`
2. Add layout if needed: `frontend/src/app/<route>/layout.tsx`
3. Create components in `frontend/src/components/`
4. Use existing UI components from `components/ui/`
5. Add loading skeleton for async data

### Adding a Wagtail Page Type

1. Create model in `apps/cms/models.py` extending `Page`
2. Define panels and api_fields
3. Run migrations
4. Register in Wagtail admin
5. Add type to `frontend/src/types/wagtail.ts`
6. Update `frontend/src/lib/wagtail-client.ts`

### Seeding Data

```bash
# Via Docker
make seed

# Manually
python manage.py seed_data      # Products, events, users
python manage.py seed_wagtail   # CMS pages, blog posts
```

### Debug Container Issues

```bash
# Check container health
docker ps
make status

# View logs
make logs-backend
make logs-frontend

# Restart unhealthy container
make restart-backend

# Shell into container
make shell-backend
```

### Run Commands on Railway Database (from Local Docker)

To run Django management commands against **Railway's development database** from your local machine:

```bash
# 1. Link to Railway project (one-time setup)
railway link -p <project-id> -e development

# 2. Get the public database URL
railway variables -s Postgres --json | python3 -c "import sys,json; print(json.load(sys.stdin)['DATABASE_PUBLIC_URL'])"

# 3. Run command via Docker with Railway's DATABASE_URL
# Use the helper script:
./scripts/railway-dev-cmd.sh "python manage.py createsuperuser"

# Or manually (replace <URL> with the DATABASE_PUBLIC_URL from step 2):
docker exec -e DATABASE_URL="<URL>" njstars-backend python manage.py <command>
```

**Example: Create superuser on Railway development:**
```bash
./scripts/railway-dev-cmd.sh "python manage.py shell -c \"
from django.contrib.auth import get_user_model
User = get_user_model()
User.objects.create_superuser('admin', 'email@example.com', 'password')
\""
```

**Why this works:** The local Docker container runs Django with Railway's database URL injected as an environment variable, connecting your local code to the remote database.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `backend/config/settings/base.py` | Django settings (488 lines) |
| `backend/apps/payments/models.py` | Payment models (592 lines) |
| `backend/apps/portal/models.py` | Portal models (523 lines) |
| `backend/apps/cms/models.py` | Wagtail CMS pages (288 lines) |
| `frontend/src/lib/api-client.ts` | Django API client |
| `frontend/src/lib/wagtail-client.ts` | CMS client |
| `frontend/src/lib/bag.tsx` | Shopping bag context |
| `frontend/src/app/globals.css` | Theme variables & animations |
| `documentation/DESIGN_SYSTEM.md` | UI patterns, color system, component guidelines |
| `documentation/MVP/NEXT_STEPS.md` | Roadmap & priorities |
| `documentation/CRITICAL.md` | Known issues & fixes |

---

## Multi-Tenant Considerations

When building features, keep these principles in mind for future multi-tenancy:

1. **Tenant-Scoped Models:** Add `tenant` FK to models that will be tenant-specific (products, events, users, etc.)
2. **Configurable Branding:** Keep colors, logos, and text in CMS/database, not hardcoded
3. **Domain Routing:** Design URL structure to support `{tenant}.platform.com` or `platform.com/{tenant}`
4. **Shared vs Tenant Data:** Some data (categories, subscription types) may be shared; others (products, events) are tenant-specific
5. **Admin Permissions:** Plan for tenant admins vs platform super-admins

---

## Git Workflow

This project uses a **feature branch workflow**. See `documentation/GIT_WORKFLOW.md` for full details.

### Branch Structure
- `main` - Production-ready code (deploys to Railway/Vercel production)
- `dev` - Integration branch for testing features together
- `feature/*` - New features (e.g., `feature/calendar-sync`)
- `fix/*` - Bug fixes (e.g., `fix/typescript-billing-error`)

### Quick Reference
```bash
# Start new feature (ALWAYS branch from dev)
git checkout dev && git pull origin dev
git checkout -b feature/my-feature

# Work on feature, commit often
git add . && git commit -m "Add feature component"

# Push feature branch
git push -u origin feature/my-feature

# When done: merge to dev first, test, then merge dev to main
git checkout dev && git merge feature/my-feature
git push origin dev
# After testing on dev:
git checkout main && git merge dev
git push origin main
```

### Rules
1. **Never commit directly to `main`** - Always go through `dev` first
2. **Create feature branches for any non-trivial work** - Even small features
3. **Keep feature branches short-lived** - Merge within 1-3 days ideally
4. **Delete feature branches after merging** - Keep repo clean
5. **No AI attribution in commits** - Do not include "Generated with Claude Code", "Co-Authored-By: Claude", or similar AI tool mentions in commit messages

---

---

## Daily Changelog

After each development session or significant batch of changes, update the daily changelog:

### Location
`documentation/changelogs/YYYY-MM-DD.md`

### When to Update
- After completing a feature or bug fix
- Before ending a session
- When significant progress is made

### Changelog Format
```markdown
# Changelog: [Date]

> **Review Status:** Pending
> **Session Focus:** [Brief description of main work areas]

---

## [Category]

### [Feature/Fix Name]
**Files:** `path/to/file.tsx`, `path/to/other.py`

**Issue/Feature:** [What was the problem or what was added]

**Implementation:**
- [Key change 1]
- [Key change 2]

---

## Files Changed Summary
[List all files modified with brief descriptions]

---

## Testing Checklist
- [ ] [Test item 1]
- [ ] [Test item 2]

---

## Notes for Tomorrow
1. [Follow-up item]
2. [Known issue to address]
```

### Categories to Use
- **Bug Fixes** - Issues resolved
- **Backend API Enhancements** - New endpoints, model changes
- **Frontend Admin Pages** - Admin UI additions
- **Frontend Features** - User-facing features
- **Documentation Updates** - Doc changes
- **Performance** - Optimization work
- **Security** - Security-related changes

## Getting Help

- **Docker Issues:** Check `documentation/DOCKER.md`
- **Testing:** Check `documentation/TESTING.md`
- **Deployment:** Check `documentation/DEPLOYMENT_GUIDE.md`
- **Architecture:** Check `documentation/ARCHITECTURE.md`
- **Meeting Notes:** Check `documentation/MEETING NOTES/`
- **Git Workflow:** Check `documentation/GIT_WORKFLOW.md`

---

## Development Guidelines

### Docker-First Development
Always check for running Docker containers before starting development work:
```bash
docker ps  # Check running containers
make up    # Start if not running
```
Work inside Docker containers for consistency with production environment.

### TODO Labels for Incomplete Features
Use `#TODO` comments in code for features that are:
- Partially implemented
- Waiting to be wired up
- Missing full functionality

This makes incomplete work easily searchable:
```bash
grep -r "#TODO" frontend/src/
grep -r "#TODO" backend/apps/
```

### Current #TODO Items
Search the codebase for `#TODO` to find all pending implementation items. Common patterns:
- `#TODO-registrations` - Portal registrations page
- `#TODO-settings` - Portal settings page
- I like the muted grays on the dashboard UI and want to 
keep it across the site