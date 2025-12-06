# Phase 4: Wagtail CMS Pages – Implementation Checklist

## Setup & Config
- [ ] Enable Wagtail API v2 in settings:
  - Ensure `wagtail.api.v2` is in `INSTALLED_APPS`.
  - Add `path("api/v2/", api_router.urls)` in `config/urls.py`.
  - Confirm `WAGTAIL_SITE_NAME` and `WAGTAILADMIN_BASE_URL` set.
- [ ] Static/media settings:
  - Verify `MEDIA_URL`/`MEDIA_ROOT` and file storage are correct.
  - Confirm WhiteNoise/static configuration still intact.

## Migrations & Admin
- [ ] Run migrations for new Wagtail models.
- [ ] Create initial Wagtail superuser (if not done).
- [ ] Validate Wagtail admin loads: `/admin/` → Pages menu present.

## Page Models Validation
- [ ] HomePage:
  - Confirm hero fields, CTA, optional hero image.
  - StreamField blocks (heading, paragraph, image, embedded_video, quote, html).
  - Newsletter toggle fields.
  - `max_count = 1`.
- [ ] BlogIndexPage / BlogPage:
  - Verify parent/child relationships (BlogIndexPage → BlogPage).
  - API fields exposed for listing + detail (date, author, excerpt, featured_image, body).
- [ ] TeamPage / PlayerProfile:
  - Inline players via ParentalKey + InlinePanel.
  - Position choices, jersey numbers, optional stats fields.
  - `max_count = 1` on TeamPage.

## API Exposure
- [ ] Confirm desired fields in `api_fields` for all page types (Home, BlogIndex, Blog, Team).
- [ ] Add custom serializers if needed for computed fields or nested player data.
- [ ] Test API endpoints:
  - `GET /api/v2/pages/?type=cms.HomePage&fields=*`
  - `GET /api/v2/pages/?type=cms.BlogPage&fields=*`
  - `GET /api/v2/pages/?type=cms.TeamPage&fields=*`

## Routing & Slugs
- [ ] Create root page tree in Wagtail:
  - Set HomePage as root.
  - Add BlogIndexPage under root; add a few BlogPages.
  - Add TeamPage under root; add PlayerProfiles via inline panel.
- [ ] Verify slugs and URLs render via Wagtail routing.

## Content & Media
- [ ] Upload sample images for hero/featured/blog/team.
- [ ] Populate seed content for demo (Home hero text, 2–3 blog posts, team roster).
- [ ] Confirm media URLs accessible via `/media/…`.

## Permissions & Auth
- [ ] Ensure staff/editor roles can edit pages (Wagtail groups/permissions).
- [ ] Confirm login redirects to Wagtail admin.

## Frontend Integration Prep
- [ ] Decide page fetch strategy for Next.js: Wagtail API v2 with `fields=*` or selected fields.
- [ ] Note required mappings: hero fields → homepage hero component; blog data → news feed; team roster → roster page.

## QA Checklist
- [ ] Smoke-test Wagtail admin CRUD for HomePage, BlogPage, TeamPage.
- [ ] Validate API responses include expected fields and image renditions.
- [ ] Check no missing migrations and no errors on `runserver`.
