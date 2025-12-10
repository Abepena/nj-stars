# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NJ Stars is a web platform for an AAU basketball team featuring a public website, e-commerce merch store, and protected member portal. The project is actively being rebuilt from FastAPI to Django + Wagtail CMS.

**Domains:**
- **Primary:** njstarselite.com
- **Secondary:** njstarsbasketball.com (owned, can redirect)

## Architecture

**Current State:** Django + Wagtail backend with Next.js frontend (fully integrated)
- `/backend/` - Django 5.0 + Wagtail 7.2.1 (active)
- `/backend_fastapi/` - Original FastAPI backend (archived reference)
- `/frontend/` - Next.js 14 with App Router, TypeScript, Tailwind CSS, shadcn/ui

**Django Backend Structure:**
- `apps/core/` - User model, Instagram integration
- `apps/events/` - Event management
- `apps/registrations/` - Event registration
- `apps/payments/` - Stripe, products, orders, subscriptions
- `apps/cms/` - Wagtail CMS pages (HomePage, BlogPage, TeamPage)
- `config/settings/` - Split settings (base.py, development.py, production.py)

**Frontend Structure:**
- `src/app/` - Next.js App Router pages
- `src/components/` - React components (shadcn/ui in `components/ui/`)
- `src/lib/` - Utilities, API client, mock data
- `src/hooks/` - Custom React hooks

## Development Commands

### Docker (Recommended)
```bash
make build          # Build all containers
make up             # Start all services
make down           # Stop all services
make logs           # View logs
make seed           # Seed database with test data
make test           # Run all tests
make test-backend   # Backend tests with coverage
make test-frontend  # Frontend tests
make shell-backend  # Access backend container
make db-shell       # PostgreSQL shell
```

### Local Development

**Backend (Django):**
```bash
cd backend
source .venv/bin/activate
python manage.py runserver              # Run server at localhost:8000
python manage.py makemigrations         # Create migrations
python manage.py migrate                # Apply migrations
python manage.py createsuperuser        # Create admin user
pytest                                  # Run tests
pytest --cov=apps                       # Tests with coverage
```

**Frontend:**
```bash
cd frontend
npm run dev                             # Dev server at localhost:3000
npm run build                           # Production build
npm run lint                            # ESLint
npm test                                # Jest tests
npm run test:watch                      # Watch mode
npm run test:coverage                   # Coverage report
```

### Stripe Webhook Testing
```bash
stripe listen --forward-to localhost:8000/api/v1/webhooks/stripe
```

## Key API Endpoints

**Django REST Framework:**
- `GET /api/events/` - Events (filterable by event_type)
- `GET /api/events/{slug}/` - Single event
- `GET /api/payments/products/` - Products (filterable by category, featured)
- `GET /api/payments/products/{slug}/` - Single product
- `GET /api/payments/subscription-plans/` - Subscription plans
- `POST /api/payments/create-checkout-session/` - Stripe checkout
- `GET /api/instagram/` - Instagram posts (cached)

**Wagtail CMS API:**
- `GET /api/v2/pages/` - All pages
- `GET /api/v2/pages/?type=cms.HomePage&fields=*` - Homepage with all fields
- `GET /api/v2/pages/?type=cms.BlogPage&fields=date,intro,featured_image,category` - Blog posts
- `GET /api/v2/pages/?type=cms.TeamPage&fields=*` - Team roster with players

**Admin Panels:**
- Wagtail CMS admin: `/cms-admin/`
- Django admin: `/django-admin/`

## Environment Variables

Backend requires: `DATABASE_URL`, `SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`

Frontend requires: `NEXT_PUBLIC_API_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

See `.env.example` files in each directory.

## Current Migration Status

The Django + Wagtail rebuild is ~90% complete. See `documentation/REBUILD_PROGRESS.md` for detailed phase status. Key completed work:
- Django project scaffolding with Wagtail 7.2.1
- Split settings configuration (base, development, production)
- Django models (Events, Payments, Registrations, Core, CMS)
- DRF API endpoints for events, products, subscriptions, Instagram
- Wagtail CMS API for HomePage, BlogPage, TeamPage
- OAuth setup (Google, Facebook, Apple via django-allauth)
- Stripe checkout integration with webhook handlers
- Frontend Wagtail client (`lib/wagtail-client.ts`) with SSR support
- News feed component merging blog posts with Instagram
- Featured merch component with product tags
- Placeholder logo SVG for cards without images (`logo square thick muted.svg`)

## Testing

Backend uses pytest-django. Frontend uses Jest with React Testing Library.

```bash
# Backend single test
pytest apps/events/tests/test_views.py -v

# Frontend single test
npm test -- --testPathPattern="ComponentName"
```

## Services

- **Frontend:** localhost:3000 (Next.js)
- **Backend:** localhost:8000 (Django/Wagtail)
- **Database:** localhost:5432 (PostgreSQL)
- **Nginx:** localhost:80 (production profile only)

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
