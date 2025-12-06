# Phase 4: Wagtail CMS Pages – Implementation Plan

> **Status:** ✅ Complete (Full Integration with UI Polish)
> **Last Updated:** December 6, 2025

## Summary

Wagtail CMS is now fully integrated with the Next.js frontend:

- **Wagtail Admin**: `/cms-admin/` (login: `pena.abe@gmail.com` / `admin123`)
- **API Endpoints**: `/api/v2/pages/` (Wagtail API v2)
- **CMS Content**: HomePage hero, blog posts, team roster all editable

Changes made in Wagtail admin will appear on the Next.js frontend after page refresh.

---

This document outlines the remaining tasks to complete the Wagtail CMS integration.

---

## TODO: Setup & Configuration ✅ COMPLETE

- [x] Add Wagtail URL routes to `config/urls.py`:
  - ✅ Added Wagtail admin at `/cms-admin/`
  - ✅ Django admin moved to `/django-admin/`
  - ✅ Added Wagtail documents at `/documents/`
  - ✅ Added Wagtail pages at `/cms/`
  - ⚠️ API router will be added in "Register Pages with Wagtail API Router" section

- [x] Configure media file serving in development:
  - ✅ Added media URL serving for development
  - ✅ Uses `MEDIA_URL=/media/` and `MEDIA_ROOT=BASE_DIR/media`

- [x] Verify static files configuration:
  - ✅ Successfully collected 258 static files with WhiteNoise
  - ✅ 736 files post-processed for compression
  - ✅ Django check passed with no issues

- [x] **BONUS:** Upgraded Wagtail from 6.0 to 7.2.1
  - ✅ Updated Django REST Framework to 3.15.2 (required dependency)
  - ✅ Applied 16 new Wagtail migrations
  - ✅ Backend container rebuilt and running

---

## TODO: Database Migrations ✅ COMPLETE

- [x] Create migrations for cms app:
  - ✅ Migration `0001_initial` already exists
  - ✅ All Wagtail page models included

- [x] Apply all pending migrations:
  - ✅ All migrations applied successfully (200+ across all apps)
  - ✅ No errors in migration output

- [x] Create Wagtail superuser (if not exists):
  - ✅ Superuser exists: `pena.abe@gmail.com` (dev only)
  - ✅ Password: `admin123`
  - ⚠️ **TODO:** Change to production admin before launch (documented in NEXT_STEPS.md)

---

## TODO: Enhance Page Models with API Fields ✅ COMPLETE

- [x] Add `api_fields` to HomePage model:
  - ✅ Exposed: hero_heading, hero_subheading, hero_image, cta_label, cta_url, body
  - ✅ Added newsletter fields to api_fields
  - ✅ Image rendition: fill-800x600 for hero_image

- [x] Add `api_fields` to BlogIndexPage model:
  - ✅ Exposed: intro
  - ✅ Added `get_blog_posts()` method to retrieve child pages

- [x] Add `api_fields` to BlogPage model:
  - ✅ Exposed: date, intro, body, author, featured_image
  - ✅ Added featured_image field (ForeignKey to Image)
  - ✅ Added author field (ForeignKey to User)
  - ✅ Image rendition: fill-1200x800 for featured_image

- [x] Add `api_fields` to TeamPage model:
  - ✅ Exposed: intro, players
  - ✅ Players automatically serialized with api_fields

- [x] Add `max_count = 1` constraint to HomePage
  - ✅ Only one HomePage allowed

- [x] Add `max_count = 1` constraint to TeamPage
  - ✅ Only one TeamPage allowed

- [x] Add newsletter fields to HomePage:
  - ✅ show_newsletter_signup (BooleanField, default=True)
  - ✅ newsletter_heading (CharField, default="Stay Updated")
  - ✅ newsletter_subheading (CharField, default="Get the latest news...")

- [x] **BONUS:** Enhanced PlayerProfile model:
  - ✅ Added POSITION_CHOICES (PG, SG, SF, PF, C)
  - ✅ Added grade field
  - ✅ Added height field
  - ✅ Added bio field
  - ✅ Added api_fields with image rendition (fill-300x300)

- [x] Created and applied migration `0002_blogpage_author_blogpage_featured_image_and_more`

---

## TODO: Expand StreamField Blocks (Optional Enhancement)

- [ ] Add additional blocks to HomePage body StreamField:
  - embedded_video block (using EmbedBlock)
  - quote block (StructBlock with quote, attribution)
  - html block (RawHTMLBlock for embeds)
  - cta_button block (StructBlock with label, url, style)

**Note:** Current StreamField blocks (rich_text, highlight) are sufficient for MVP. Additional blocks can be added as needed.
  - Add to content_panels
  - Add to api_fields

---

## TODO: Player Profile Enhancements

- [ ] Add position choices to PlayerProfile:
  - Create POSITION_CHOICES tuple (PG, SG, SF, PF, C)
  - Update position field to use choices

- [ ] Add optional stats fields to PlayerProfile:
  - grade (CharField)
  - height (CharField)
  - bio (TextField, blank=True)

- [ ] Add headshot image renditions for API:
  - Thumbnail (100x100)
  - Medium (300x300)

---

## TODO: Register Pages with Wagtail API Router ✅ COMPLETE

- [x] Create `apps/cms/api.py` file:
  - ✅ WagtailAPIRouter configured
  - ✅ PagesAPIViewSet, ImagesAPIViewSet, DocumentsAPIViewSet registered
  - ✅ Endpoints: pages, images, documents

- [x] Update `config/urls.py` to include CMS API router:
  - ✅ Import api_router from apps.cms.api
  - ✅ Added path `api/v2/` pointing to api_router.urls

---

## TODO: Create Initial Page Tree ✅ COMPLETE (via seed script)

- [x] Set up Wagtail root page:
  - ✅ HomePage created as site root via seed_wagtail command
  - ✅ Site object configured with hostname localhost:8000

- [x] Create BlogIndexPage under root:
  - ✅ Title: "The Huddle"
  - ✅ Slug: "news"
  - ✅ Intro text added

- [x] Create sample BlogPage entries:
  - ✅ 3 blog posts created with titles, dates, intro, body content

- [x] Create TeamPage under root:
  - ✅ Title: "Our Team"
  - ✅ Slug: "team"
  - ✅ Intro text added

- [x] Add sample PlayerProfiles:
  - ✅ 5 players created with positions, numbers, grades, heights, bios

---

## TODO: Seed Data Script ✅ COMPLETE

- [x] Create `backend/apps/cms/management/commands/seed_wagtail.py`:
  - ✅ Management command class created
  - ✅ Programmatically creates HomePage with hero content
  - ✅ Creates BlogIndexPage with sample blog posts
  - ✅ Creates TeamPage with sample players
  - ✅ Fixes tree consistency with Page.fix_tree()
  - ✅ Creates Site object if none exists

- [x] Run seed command:
  - ✅ `docker compose exec backend python manage.py seed_wagtail`

---

## TODO: Test API Endpoints ✅ COMPLETE

- [x] Test HomePage API:
  - ✅ GET `/api/v2/pages/?type=cms.HomePage&fields=*` returns all fields
  - ✅ hero_heading, hero_subheading, cta_label, newsletter fields all work

- [x] Test BlogPage API:
  - ✅ GET `/api/v2/pages/?type=cms.BlogPage&fields=*` returns all posts
  - ✅ date, intro, body StreamField content all serialize correctly

- [x] Test TeamPage API:
  - ✅ GET `/api/v2/pages/?type=cms.TeamPage&fields=*` returns team page
  - ✅ Nested players array with all api_fields working

---

## TODO: Permissions & Security

- [ ] Create Editor group in Wagtail:
  - Access Groups in Wagtail admin
  - Create "Editors" group
  - Assign page edit permissions for Blog and Team pages

- [ ] Configure page-level permissions:
  - HomePage: Admin only
  - BlogIndexPage: Editors can add/edit children
  - TeamPage: Editors can edit

- [ ] Verify CORS allows API access from frontend:
  - Test from localhost:3000
  - Check response headers include CORS

---

## TODO: Frontend Integration Preparation ✅ COMPLETE

- [x] Create TypeScript types for Wagtail responses:
  - ✅ `frontend/src/types/wagtail.ts` created with:
    - WagtailPage base type with meta information
    - HomePage, BlogIndexPage, BlogPage, TeamPage types
    - PlayerProfile type with position choices
    - StreamField block types (RichTextBlock, HighlightBlock, etc.)

- [x] Create frontend Wagtail client:
  - ✅ `frontend/src/lib/wagtail-client.ts` created with:
    - `fetchHomePage()` - fetches HomePage with all fields
    - `fetchBlogPosts()` - fetches BlogPages ordered by date
    - `fetchBlogPost(slug)` - fetches single post by slug
    - `fetchTeamPage()` - fetches TeamPage with players
    - Server-side/client-side URL detection for Docker

- [x] Update homepage to fetch from Wagtail:
  - ✅ `frontend/src/app/page.tsx` - async server component fetches HomePage
  - ✅ `frontend/src/components/hero.tsx` - accepts CMS props with fallbacks

- [x] Update news feed to include blog posts:
  - ✅ `frontend/src/components/news-feed.tsx` - fetches both Instagram and Wagtail blog posts
  - ✅ Merges and sorts by date
  - ✅ Blog posts link to internal `/news/{slug}` routes
  - ✅ Category tags with color coding (news, tryouts, camp, tournament, merch, sale, announcement)

- [x] UI Polish for placeholder images:
  - ✅ Created `logo square thick muted.svg` with `#2e2927` background (matches card muted color)
  - ✅ Cards without images display branded logo placeholder
  - ✅ Applied to: news-feed.tsx, featured-merch.tsx, shop/page.tsx

- [x] Featured Merch component:
  - ✅ Product tags: FEATURED, BEST SELLING, ON SALE
  - ✅ Price display with compare-at strikethrough
  - ✅ Stock quantity warnings

- [x] Docker networking configured:
  - ✅ Backend ALLOWED_HOSTS includes 'backend' for container-to-container
  - ✅ Wagtail client uses different URLs for SSR vs client-side

---

## TODO: Newsletter Email Integration 📧

> **Status:** Not Started
> **Priority:** Medium (Post-MVP)

The newsletter signup form UI is complete and CMS-editable via Wagtail. The following integration work is needed to make it functional:

- [ ] Choose email service provider:
  - Options: Mailchimp, SendGrid, ConvertKit, Resend, AWS SES
  - Consider: cost, ease of integration, list management features

- [ ] Create backend API endpoint:
  - `POST /api/newsletter/subscribe/`
  - Validate email format
  - Handle duplicate subscriptions gracefully
  - Store subscriber in database and/or send to email service

- [ ] Create Django model for subscribers (optional):
  - `NewsletterSubscriber` model with email, subscribed_at, is_active fields
  - Useful for backup/analytics even if using external service

- [ ] Connect frontend form to API:
  - Update `newsletter-signup.tsx` to call backend endpoint
  - Add loading state, success/error feedback
  - Consider double opt-in confirmation

- [ ] Set up email templates:
  - Welcome email for new subscribers
  - Regular newsletter template
  - Unsubscribe confirmation

**Note:** The CMS fields (`show_newsletter_signup`, `newsletter_heading`, `newsletter_subheading`) already work. This TODO is for the actual email delivery functionality.

---

## TODO: Quality Assurance

- [ ] Smoke test Wagtail admin:
  - Login at /cms-admin/
  - Navigate to Pages
  - Create/edit/publish a page
  - Verify changes appear in API

- [ ] Test media uploads:
  - Upload image via admin
  - Verify appears in /media/
  - Verify API returns correct URL

- [ ] Verify no migration issues:
  - Run `python manage.py showmigrations`
  - Confirm all migrations applied
  - Run `python manage.py check` for errors

- [ ] Test with frontend:
  - Start both backend and frontend
  - Fetch homepage data from Next.js
  - Render Wagtail content in React component

---

## Implementation Order

1. **Setup & Configuration** - URL routes and static/media config
2. **Database Migrations** - Apply migrations, create superuser
3. **API Fields** - Add api_fields to all page models
4. **API Router** - Register pages with Wagtail API
5. **Page Tree** - Create initial pages via admin
6. **Seed Data** - Create management command for reproducible seeding
7. **Testing** - Verify all API endpoints work
8. **Permissions** - Set up editor groups
9. **Frontend Prep** - Types and API client updates
10. **QA** - Full integration test

---

## Quick Commands

```bash
# Run migrations
cd backend
source .venv/bin/activate
python manage.py makemigrations cms
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver

# Collect static files
python manage.py collectstatic --noinput

# Run seed script (after creating)
python manage.py seed_wagtail

# Check for issues
python manage.py check
python manage.py showmigrations
```

---

## API Endpoints (After Setup)

| Endpoint | Description |
|----------|-------------|
| `GET /api/v2/pages/` | List all pages |
| `GET /api/v2/pages/?type=cms.HomePage` | Get homepage |
| `GET /api/v2/pages/?type=cms.BlogPage` | List blog posts |
| `GET /api/v2/pages/{id}/` | Get page by ID |
| `GET /api/v2/images/` | List all images |
| `GET /api/v2/documents/` | List all documents |

---

## Files to Create/Modify

| File | Action | Status |
|------|--------|--------|
| `backend/config/urls.py` | Add Wagtail URL routes | ✅ Done |
| `backend/apps/cms/models.py` | Add api_fields, enhance models | ✅ Done |
| `backend/apps/cms/api.py` | Create API router configuration | ✅ Done |
| `backend/apps/cms/management/commands/seed_wagtail.py` | Create seed script | ✅ Done |
| `frontend/src/lib/wagtail-client.ts` | Create Wagtail API client | ✅ Done |
| `frontend/src/types/wagtail.ts` | Create TypeScript types | ✅ Done |
| `frontend/src/components/news-feed.tsx` | Integrate Wagtail blog posts | ✅ Done |
| `frontend/src/components/featured-merch.tsx` | Add product tags, placeholders | ✅ Done |
| `frontend/src/app/shop/page.tsx` | Multi-select filters, placeholders | ✅ Done |
| `frontend/public/brand/logos/logo square thick muted.svg` | Muted placeholder logo | ✅ Done |
