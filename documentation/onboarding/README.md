# Developer Onboarding Guide

> **Welcome to NJ Stars Elite!** This guide will get you from zero to running the full stack in under 30 minutes.

---

## Quick Start (TL;DR)

```bash
# 1. Clone and enter the project
git clone <repo-url> nj-stars && cd nj-stars

# 2. Start Docker Desktop (required)
open -a Docker  # macOS

# 3. Start all services
make up

# 4. Run database migrations
docker exec njstars-backend python manage.py migrate

# 5. Seed test data
make seed

# 6. Import products from Printify
docker exec njstars-backend python manage.py import_printify_products

# 7. Open in browser
open http://localhost:3000
```

---

## What You're Building

**NJ Stars Elite** is the MVP for **LEAG** - a multi-tenant youth sports platform.

| Feature | Description |
|---------|-------------|
| **Public Website** | Homepage, shop, events, news feed |
| **E-commerce** | Merch store with Printify print-on-demand |
| **Event Management** | Tryouts, camps, tournaments with registration |
| **Member Portal** | Parent/player dashboards, waivers, payments |
| **CMS** | Wagtail-powered content management |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind, shadcn/ui |
| Backend | Django 5.0, DRF, Wagtail CMS |
| Database | PostgreSQL 14 |
| Payments | Stripe |
| POD | Printify |
| Hosting | Railway (backend), Vercel (frontend) |

---

## Key URLs (Local)

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/ |
| Wagtail CMS | http://localhost:8000/cms-admin/ |
| Django Admin | http://localhost:8000/django-admin/ |
| MailHog | http://localhost:8025 |

---

## Essential Commands

```bash
make up              # Start containers
make down            # Stop containers
make seed            # Seed test data
make logs            # View logs
make restart         # Restart all
make shell-backend   # Bash into backend
```

---

## Documentation

- [SETUP.md](./SETUP.md) - Detailed setup instructions
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [COMMON_ISSUES.md](./COMMON_ISSUES.md) - Troubleshooting
- [WORKFLOWS.md](./WORKFLOWS.md) - Common dev tasks
- [../CLAUDE.md](../../CLAUDE.md) - Full project reference
