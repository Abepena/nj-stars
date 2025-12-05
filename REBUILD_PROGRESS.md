# Django + Wagtail Rebuild - Progress Report

> **Last Updated:** December 5, 2024
> **Status:** Phase 2 Complete, Phase 3 In Progress, Phase 4 Started, Frontend Updates In Progress

---

## ✅ Completed Phases

### Phase 1: Project Scaffolding ✅ COMPLETE
- [x] Django 5.0 + Wagtail 6.0 project structure created
- [x] All dependencies installed (Django, Wagtail, DRF, django-allauth, Stripe)
- [x] Created 5 Django apps: core, events, registrations, payments, cms
- [x] FastAPI backend backed up to `backend_fastapi/`
- [x] `.gitignore` configured for Django

**Commit:** `ef5b4e3` - "Begin Django + Wagtail rebuild - Phase 1: Project scaffolding"

---

### Phase 2: Django Settings Configuration ✅ COMPLETE
- [x] Split settings into `base.py`, `development.py`, `production.py`
- [x] Configured all Django + Wagtail apps in INSTALLED_APPS
- [x] django-allauth with Google, Facebook, and Apple OAuth
- [x] PostgreSQL database configuration
- [x] Stripe API settings
- [x] Instagram Basic Display API configuration
- [x] Django REST Framework with token auth
- [x] CORS configured for Next.js frontend
- [x] Whitenoise for static files
- [x] Production security settings (SSL, HSTS, secure cookies)
- [x] `.env.example` with all required variables

**Key Files Created:**
- `backend/config/settings/base.py` - Shared configuration
- `backend/config/settings/development.py` - Local dev overrides
- `backend/config/settings/production.py` - Production security
- `backend/.env.example` - Environment template

**Commit:** `4d62970` - "Phase 2: Configure Django settings with split configuration"

---

### Phase 3: Django Models 🔄 IN PROGRESS
- [x] Events app: Event model with EventType choices
- [ ] Registrations app: EventRegistration model
- [ ] Payments app: SubscriptionPlan, Subscription, Payment models
- [ ] Payments app: Product, Order, OrderItem models
- [ ] Core app: InstagramPost model
- [ ] Register all models in admin.py files

**Progress:** 1/6 model files complete

**Current Status:** Events model created with:
- EventType choices (TRYOUT, OPEN_GYM, TOURNAMENT, PRACTICE, CAMP, GAME)
- Full event fields (title, slug, description, dates, location)
- Payment settings (requires_payment, price, stripe_price_id)
- Registration settings (max_participants, deadline, is_open)
- Properties: `spots_remaining`, `is_full`, `is_registration_open`

---

## 📋 Remaining Phases

### Phase 3: Django Models (Continue)
**Next Steps:**
1. Create EventRegistration model in `apps/registrations/models.py`
   - Participant details (name, age, email, phone)
   - Emergency contact info
   - Medical notes
   - Payment tracking

2. Create Payment models in `apps/payments/models.py`
   - SubscriptionPlan (with Bergen County AAU pricing)
   - Subscription (tracking user subscriptions)
   - Payment (generic payment tracking)
   - Product (merch with Printify fields for Phase 2)
   - Order & OrderItem (order management)

3. Create InstagramPost model in `apps/core/models.py`
   - Cache Instagram posts locally

4. Register all models in admin.py files

**Estimated Time:** 1-2 hours

---
### Phase 4: Wagtail CMS Pages 🔄 STARTED
**Done:**
- Added Wagtail page models: `HomePage`, `BlogIndexPage`, `BlogPage`, `TeamPage`, `PlayerProfile`

**Next Tasks:**
- Configure Wagtail API v2
- Test Wagtail admin interface

**Estimated Time:** 1-2 hours

---

### Frontend Development 🔄 IN PROGRESS
**Recent Progress (December 5, 2024):**
- ✅ Page layouts refactored and improved
- ✅ Homepage sections componentized for reusability
- ✅ Homepage styling completed to desired look and feel
- 🔄 Component library being built out

**Note:** Frontend work is progressing in parallel with backend rebuild. Components are being prepared to integrate with Django/Wagtail API once Phase 5 is complete.

---

### Phase 5: Django REST Framework API ✅ PARTIALLY COMPLETE
**Done:**
- ✅ Events API (list, retrieve with filtering & search)
- ✅ Products API (list, retrieve with filtering & search)
- ✅ Subscription Plans API (list, retrieve)
- ✅ Seed data created and loaded (7 events, 7 products, 4 plans)

**API Endpoints Available:**
- `GET /api/events/` - List all events (filterable by event_type, searchable)
- `GET /api/events/{slug}/` - Get single event
- `GET /api/payments/products/` - List all products (filterable by category)
- `GET /api/payments/products/{slug}/` - Get single product
- `GET /api/payments/subscription-plans/` - List all subscription plans
- `GET /api/payments/subscription-plans/{slug}/` - Get single plan

**Remaining Tasks:**
- Event registration endpoint
- Payments/Checkout integration (Phase 6)
- Instagram API integration

---

### Phase 6: Stripe Integration
**Tasks:**
- Checkout session creation (products, subscriptions, events)
- Webhook handlers (payment success, subscription updates)
- Payment status tracking
- Subscription management

**Estimated Time:** 1-2 hours

---

### Phase 7: Instagram Service Migration
**Tasks:**
- Create InstagramService class
- Implement caching logic
- API endpoint for posts
- Mock data fallback

**Estimated Time:** 30 minutes

---

### Phase 8: Frontend Updates
**Tasks:**
- Update API client endpoints for Django
- Update NextAuth to work with django-allauth
- Add Wagtail API integration
- Test all pages

**Estimated Time:** 1-2 hours

---

### Phase 9: Docker Configuration
**Tasks:**
- Update backend Dockerfile for Django
- Update docker-compose.yml
- Update Makefile commands
- Test Docker build

**Estimated Time:** 1 hour

---

### Phase 10: Testing Infrastructure
**Tasks:**
- Configure pytest-django
- Create test fixtures and factories
- Write model tests
- Write API tests
- Achieve 80%+ coverage

**Estimated Time:** 2-3 hours

---

### Phase 11: Seed Data Script
**Tasks:**
- Create comprehensive seed_data.py
- Seed users (admin, parents, players)
- Seed events with realistic data
- Seed subscription plans (Bergen County pricing)
- Seed products
- Seed Wagtail pages (HomePage, TeamPage, BlogIndexPage)

**Estimated Time:** 1-2 hours

---

### Phase 12: Documentation Updates
**Tasks:**
- Update README.md for Django
- Update PROJECT_STATUS.md
- Update ARCHITECTURE.md
- Create WAGTAIL_CMS_GUIDE.md
- Update DOCKER.md
- Update TESTING.md

**Estimated Time:** 1-2 hours

---

## 📊 Overall Progress

| Phase | Status | Time Spent | Remaining Time |
|-------|--------|------------|----------------|
| 1. Project Scaffolding | ✅ Complete | 30 min | - |
| 2. Settings Configuration | ✅ Complete | 1 hour | - |
| 3. Django Models | 🔄 20% | 30 min | 1-2 hours |
| 4. Wagtail CMS | ⏸️ Pending | - | 1-2 hours |
| 5. API Endpoints | ⏸️ Pending | - | 2-3 hours |
| 6. Stripe Integration | ⏸️ Pending | - | 1-2 hours |
| 7. Instagram Service | ⏸️ Pending | - | 30 min |
| 8. Frontend Updates | ⏸️ Pending | - | 1-2 hours |
| 9. Docker Config | ⏸️ Pending | - | 1 hour |
| 10. Testing | ⏸️ Pending | - | 2-3 hours |
| 11. Seed Data | ⏸️ Pending | - | 1-2 hours |
| 12. Documentation | ⏸️ Pending | - | 1-2 hours |

**Total Progress:** ~15% complete
**Time Invested:** ~2 hours
**Estimated Remaining:** 13-21 hours

---

## 🎯 Key Decisions Implemented

1. **✅ Printify over Printful** - Fields added to Product model for Phase 2 integration
2. **✅ Apple OAuth Added** - Configured in django-allauth alongside Google & Facebook
3. **✅ Bergen County AAU Pricing** - Realistic subscription prices in SubscriptionPlan model:
   - Monthly: $175/month
   - Seasonal: $475 for 3 months
   - Annual: $1,800/year
   - Team Dues: $950 per season (one-time, deadline-based)
4. **✅ Player Stats as Nice-to-Have** - Fields included but marked as Phase 2 priority
5. **✅ Simple Inventory First** - Print-on-demand integration deferred to Phase 2
6. **✅ Domain: njstarselite.com** - All references updated

---

## 🚀 How to Continue

### Option 1: Continue in New Session
The implementation plan (`DJANGO_REBUILD_PLAN.md`) has complete code samples for all remaining phases. A developer can:
1. Follow Phase 3-12 systematically
2. Use the provided code samples as templates
3. Test each phase before moving to the next

### Option 2: Resume with Claude
Start a new session and say:
> "Continue the Django + Wagtail rebuild from REBUILD_PROGRESS.md. Start with Phase 3: Registrations model."

### Option 3: Incremental Approach
1. Complete Phase 3 (models) - get database working
2. Complete Phase 4 (Wagtail CMS) - get admin interface working
3. Test that core features work
4. Continue with API and frontend

---

## 📝 Quick Commands to Continue

```bash
# Activate virtual environment
cd backend
source venv/bin/activate

# Create migrations after adding models
python manage.py makemigrations
python manage.py migrate

# Create superuser for Wagtail admin
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

---

## ✨ What's Working Now

**Backend:**
- ✅ Django project runs (with migrations needed)
- ✅ Settings properly configured for dev/prod
- ✅ All dependencies installed
- ✅ Event model ready for migrations

**To Test (after migrations):**
- Wagtail admin at `/admin`
- Django admin at `/django-admin/`
- API endpoints (once created)

---

## 📦 Next Immediate Steps

1. **Create remaining models** (1-2 hours)
   - Registrations, Payments, Products, Instagram cache

2. **Run migrations** (5 minutes)
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

3. **Create superuser** (2 minutes)
   ```bash
   python manage.py createsuperuser
   ```

4. **Test Wagtail admin** (5 minutes)
   - Visit http://localhost:8000/admin
   - Verify CMS interface loads

5. **Create Wagtail CMS pages** (1-2 hours)
   - HomePage, TeamPage, BlogPage models

6. **Continue with API endpoints** (2-3 hours)

---

## 🎓 Learning Resources

**Wagtail CMS:**
- Official Docs: https://docs.wagtail.org/
- Tutorial: https://docs.wagtail.org/en/stable/getting_started/tutorial.html
- StreamFields: https://docs.wagtail.org/en/stable/topics/streamfield.html

**django-allauth:**
- Docs: https://django-allauth.readthedocs.io/
- Social Providers: https://django-allauth.readthedocs.io/en/latest/providers.html

**Django REST Framework:**
- Quickstart: https://www.django-rest-framework.org/tutorial/quickstart/
- Viewsets: https://www.django-rest-framework.org/api-guide/viewsets/

---

**Status:** Foundation is solid. Ready to continue building! 🚀
