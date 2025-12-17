# Master Prompt: SEO Infrastructure & CMS Integration Audit

## Your Role

You are a senior technical SEO engineer and Django/Wagtail/Next JS specialist. Your mission is to audit the existing codebase for SEO readiness, identify gaps, and produce a roadmap that gives non-technical business owners full control over their site's search visibility—without ever touching code or needing developer support.

**Core Philosophy**: SEO should be invisible infrastructure that "just works" by default, with owner-accessible controls for the 20% of optimizations that drive 80% of results. Every tenant should rank well for their local market without understanding what "schema markup" means.

---

## Phase 1: Technical SEO Audit

### 1.1 Crawlability & Indexation

```bash
# Check for robots.txt handling
find . -name "robots.txt" -o -name "*robots*" | xargs ls -la
grep -r "robots" --include="*.py" --include="*.txt" | head -20

# Check for sitemap generation
find . -name "*sitemap*" -type f
grep -r "sitemap" --include="*.py" --include="*.xml" | head -30

# Check URL configuration
find . -name "urls.py" -type f | xargs cat | head -100

# Look for canonical URL handling
grep -r "canonical" --include="*.py" --include="*.html" | head -20

# Check for noindex/nofollow patterns
grep -r "noindex\|nofollow" --include="*.py" --include="*.html" | head -20
```

Document:
- [ ] Is `robots.txt` dynamically generated per tenant or static?
- [ ] Does sitemap exist? Is it auto-generated? Does it include all public pages?
- [ ] Are URLs clean, semantic, and consistent? (no trailing slash inconsistency, no query params for content)
- [ ] Is there canonical URL handling to prevent duplicate content?
- [ ] Are admin/private pages properly noindexed?

### 1.2 Meta Tags & Head Elements

```bash
# Find base templates
find . -name "base*.html" -o -name "layout*.html" | xargs ls -la

# Check for meta tag patterns
grep -r "<meta" --include="*.html" | head -40

# Check for title tag handling
grep -r "<title" --include="*.html" | head -20

# Look for Open Graph / social meta
grep -r "og:" --include="*.html" | head -20
grep -r "twitter:" --include="*.html" | head -20

# Check for Wagtail SEO patterns
grep -r "seo_title\|search_description\|meta_description" --include="*.py" | head -30
```

Document:
- [ ] Are title tags dynamic and template-driven?
- [ ] Is there a fallback hierarchy? (page-specific → site default)
- [ ] Meta descriptions: editable per page? Auto-generated fallback?
- [ ] Open Graph tags present? (critical for social sharing)
- [ ] Twitter Card tags present?
- [ ] Are there character limit validations? (title ≤60, description ≤160)

### 1.3 Structured Data (Schema.org)

```bash
# Check for JSON-LD or schema markup
grep -r "schema.org\|application/ld+json\|itemtype\|itemscope" --include="*.html" --include="*.py" | head -30

# Look for any structured data generation
grep -r "json-ld\|structured_data\|schema" --include="*.py" | head -20
```

Evaluate schema coverage for sports organization context:

| Schema Type | Priority | Status | Notes |
|-------------|----------|--------|-------|
| `Organization` | P0 | ? | Basic business info |
| `LocalBusiness` / `SportsOrganization` | P0 | ? | Critical for local SEO |
| `Event` | P0 | ? | Tryouts, camps, games |
| `SportsTeam` | P1 | ? | Team pages |
| `Person` (coaches) | P2 | ? | Staff pages |
| `Article` / `BlogPosting` | P2 | ? | News/blog content |
| `BreadcrumbList` | P1 | ? | Navigation context |
| `FAQPage` | P2 | ? | If FAQ content exists |
| `Review` / `AggregateRating` | P3 | ? | Testimonials |

### 1.4 Performance & Core Web Vitals

```bash
# Check for image optimization
grep -r "srcset\|loading=\"lazy\"\|lazy" --include="*.html" | head -20

# Look for static file configuration
grep -r "STATIC\|MEDIA\|whitenoise\|cloudfront\|cdn" --include="*.py" --include="settings*" | head -30

# Check for compression
grep -r "gzip\|brotli\|compress" --include="*.py" | head -10

# Check for caching headers
grep -r "cache\|Cache-Control\|max-age" --include="*.py" | head -20
```

Document:
- [ ] Image optimization pipeline exists?
- [ ] Lazy loading implemented?
- [ ] CDN configured for static assets?
- [ ] Compression enabled (gzip/brotli)?
- [ ] Cache headers properly set?
- [ ] Render-blocking resources minimized?

### 1.5 Multi-Tenant SEO Isolation

```bash
# Check domain/subdomain handling
grep -r "domain\|subdomain\|host" --include="*.py" | grep -E "(tenant|site)" | head -20

# Look for tenant-specific settings
grep -r "tenant.*seo\|seo.*tenant" --include="*.py" | head -10

# Check for site framework usage
grep -r "sites.Site\|get_current_site\|SITE_ID" --include="*.py" | head -20
```

Critical questions:
- [ ] Does each tenant have isolated robots.txt?
- [ ] Does each tenant have their own sitemap?
- [ ] Are canonical URLs tenant-aware?
- [ ] Can each tenant configure their own Google Search Console verification?
- [ ] Is there cross-tenant content duplication risk?

### 1.6 Local SEO Infrastructure

```bash
# Check for location/address models
grep -r "address\|location\|latitude\|longitude\|geo" --include="models.py" | head -20

# Look for Google Business Profile integration
grep -r "google.*business\|gbp\|places" --include="*.py" | head -10

# Check for NAP (Name, Address, Phone) consistency patterns
grep -r "phone\|address\|contact" --include="*.html" --include="*.py" | head -30
```

Document:
- [ ] Is business location data modeled?
- [ ] Is NAP information centralized (single source of truth)?
- [ ] Does LocalBusiness schema pull from this data?
- [ ] Is there support for multiple locations per tenant?

---

## Phase 2: Content SEO Assessment

### 2.1 URL Architecture

```python
# Analyze URL patterns
# Run in Django shell:
from django.urls import get_resolver
def show_patterns(resolver, prefix=''):
    for pattern in resolver.url_patterns:
        if hasattr(pattern, 'url_patterns'):
            show_patterns(pattern, prefix + str(pattern.pattern))
        else:
            print(f"{prefix}{pattern.pattern}")

show_patterns(get_resolver())
```

Evaluate URL structure:
- [ ] Are URLs human-readable and keyword-friendly?
- [ ] Is hierarchy logical? (`/events/tryouts/summer-2025/` vs `/event?id=47`)
- [ ] Are slugs auto-generated from titles? Editable?
- [ ] Is there URL history/redirect handling for changed slugs?

### 2.2 Content Model SEO Fields

For each content type (Wagtail pages, blog posts, events, etc.), check:

```bash
# Find all Page models
grep -r "class.*Page.*models\|class.*Page.*wagtail" --include="*.py" | head -30

# Check for SEO field mixins
grep -r "seo\|meta\|promote" --include="*.py" | grep -E "class|Field" | head -40
```

Required fields per content type:

| Field | Purpose | Validation |
|-------|---------|------------|
| `seo_title` | Override auto title | Max 60 chars |
| `meta_description` | Search snippet | Max 160 chars |
| `slug` | URL path | Auto-gen + editable |
| `og_image` | Social share image | Recommend dimensions |
| `canonical_url` | Override if needed | Valid URL |
| `noindex` | Exclude from search | Boolean |
| `focus_keyword` | Content guidance | Optional |

### 2.3 Internal Linking Structure

```bash
# Check for related content patterns
grep -r "related\|similar\|also_like" --include="*.py" --include="*.html" | head -20

# Look for breadcrumb implementation
grep -r "breadcrumb" --include="*.py" --include="*.html" | head -20

# Check for navigation structure
grep -r "menu\|navigation\|nav" --include="*.py" --include="*.html" | head -30
```

Document:
- [ ] Breadcrumbs implemented and schema-marked?
- [ ] Related content suggestions automated?
- [ ] Navigation depth reasonable? (3 clicks to any content)
- [ ] Orphan page detection possible?

---

## Phase 3: CMS Integration Requirements

### 3.1 Owner-Accessible SEO Controls

Define what business owners MUST be able to edit without developers:

#### Tier 1: Per-Page SEO (Every content editor should see these)
- [ ] SEO Title (with character counter, preview)
- [ ] Meta Description (with character counter, preview)
- [ ] Social Share Image (with dimension guidance)
- [ ] URL Slug (with "this will break links" warning)
- [ ] "Hide from search engines" toggle

#### Tier 2: Site-Wide Settings (Settings panel, not per-page)
- [ ] Default title format (`%page_title% | %site_name%`)
- [ ] Default meta description (fallback)
- [ ] Default social share image
- [ ] Google Search Console verification code
- [ ] Google Analytics / GA4 ID
- [ ] Facebook Pixel ID
- [ ] Organization schema defaults (name, logo, contact)

#### Tier 3: Local SEO Settings
- [ ] Business Name (as it appears on Google)
- [ ] Address (with autocomplete/validation)
- [ ] Phone number (formatted)
- [ ] Business hours
- [ ] Service area definition
- [ ] Google Business Profile link

#### Tier 4: Advanced (Can require documentation)
- [ ] Redirect manager (old URL → new URL)
- [ ] Custom robots.txt rules
- [ ] Sitemap inclusion/exclusion rules
- [ ] Canonical URL overrides

### 3.2 SEO Preview & Validation

Non-technical owners need to SEE what they're affecting:

- [ ] **Google Preview**: Live mockup of how the page appears in search results
- [ ] **Social Preview**: Facebook/Twitter card preview with actual image
- [ ] **Character Counters**: Visual indicators (green/yellow/red) for title/description length
- [ ] **Missing Field Warnings**: "This page has no meta description" alerts
- [ ] **Broken Link Detection**: Flag internal links to deleted/moved pages
- [ ] **Image Alt Text Reminders**: Prompt when images lack alt text

### 3.3 Automated SEO Features

Things that should happen WITHOUT owner action:

- [ ] Sitemap auto-regeneration on publish
- [ ] Canonical URL auto-generation
- [ ] Breadcrumb auto-generation from page hierarchy
- [ ] Schema markup auto-generation from content fields
- [ ] Open Graph auto-population from page content
- [ ] Image auto-optimization on upload
- [ ] 301 redirect auto-creation on slug change

---

## Phase 4: Implementation Roadmap

### Phase A: Foundation (Week 1-2)
**Goal**: Technical SEO infrastructure that works automatically

- [ ] Implement dynamic `robots.txt` per tenant
- [ ] Create auto-generating XML sitemap (pages, events, news)
- [ ] Add canonical URL middleware
- [ ] Ensure proper noindex on admin/private routes
- [ ] Configure cache headers and compression
- [ ] Set up image optimization pipeline (WebP conversion, srcset generation)

**Deliverable**: Site passes basic technical SEO audit; crawlers can discover all content.

```python
# Example: Tenant-aware robots.txt view
from django.http import HttpResponse
from django_tenants.utils import get_tenant

def robots_txt(request):
    tenant = get_tenant(request)
    lines = [
        "User-agent: *",
        "Allow: /",
        "",
        f"Sitemap: https://{tenant.domain}/sitemap.xml",
        "",
        "# Disallow admin and private areas",
        "Disallow: /admin/",
        "Disallow: /api/",
        "Disallow: /accounts/",
    ]
    return HttpResponse("\n".join(lines), content_type="text/plain")
```

### Phase B: Meta Tag Infrastructure (Week 3-4)
**Goal**: Every page has proper, editable meta tags

- [ ] Create SEO mixin for all page models
- [ ] Implement title tag template with configurable format
- [ ] Add meta description with auto-generation fallback
- [ ] Implement Open Graph tags (og:title, og:description, og:image, og:url)
- [ ] Implement Twitter Card tags
- [ ] Add character limit validation in admin

**Deliverable**: All pages render with complete, valid meta tags.

```python
# Example: SEO Mixin for Wagtail Pages
from wagtail.models import Page
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from django.db import models

class SEOFields(models.Model):
    """Mixin providing SEO fields for any page type."""
    
    seo_title = models.CharField(
        max_length=60,
        blank=True,
        help_text="Title shown in search results. Keep under 60 characters."
    )
    meta_description = models.CharField(
        max_length=160,
        blank=True,
        help_text="Description shown in search results. Keep under 160 characters."
    )
    og_image = models.ForeignKey(
        'wagtailimages.Image',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='+',
        help_text="Image shown when shared on social media. Recommended: 1200x630px."
    )
    noindex = models.BooleanField(
        default=False,
        help_text="Hide this page from search engines."
    )
    
    seo_panels = [
        MultiFieldPanel([
            FieldPanel('seo_title'),
            FieldPanel('meta_description'),
            FieldPanel('og_image'),
            FieldPanel('noindex'),
        ], heading="Search Engine Optimization")
    ]
    
    class Meta:
        abstract = True
    
    def get_meta_title(self):
        return self.seo_title or self.title
    
    def get_meta_description(self):
        if self.meta_description:
            return self.meta_description
        # Auto-generate from first paragraph if available
        if hasattr(self, 'body') and self.body:
            return truncate_text(extract_text(self.body), 160)
        return ""
```

### Phase C: Structured Data (Week 5-6)
**Goal**: Rich snippets in search results for all content types

- [ ] Implement Organization schema (site-wide)
- [ ] Implement LocalBusiness schema (tenant settings)
- [ ] Implement Event schema (auto-generated from event model)
- [ ] Implement BreadcrumbList schema (auto-generated from hierarchy)
- [ ] Implement SportsTeam schema (team pages)
- [ ] Add schema validation in development

**Deliverable**: Events show with dates/prices in search; organization appears in knowledge panel.

```python
# Example: Auto-generating Event schema
def get_event_schema(event):
    return {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        "name": event.name,
        "description": event.description,
        "startDate": event.start_datetime.isoformat(),
        "endDate": event.end_datetime.isoformat(),
        "location": {
            "@type": "Place",
            "name": event.location.name,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": event.location.street,
                "addressLocality": event.location.city,
                "addressRegion": event.location.state,
                "postalCode": event.location.zip_code,
            }
        },
        "organizer": {
            "@type": "SportsOrganization",
            "name": event.organization.name,
            "url": event.organization.website_url,
        },
        "offers": {
            "@type": "Offer",
            "price": str(event.price),
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock" if event.spots_available > 0 else "https://schema.org/SoldOut",
            "url": event.registration_url,
            "validFrom": event.registration_opens.isoformat(),
        },
        "eventStatus": "https://schema.org/EventScheduled",
    }
```

### Phase D: Local SEO Controls (Week 7-8)
**Goal**: Each tenant fully optimized for local search

- [ ] Create Local SEO settings model (NAP, hours, service area)
- [ ] Build settings UI in tenant admin
- [ ] Auto-populate LocalBusiness schema from settings
- [ ] Implement consistent NAP in footer/contact pages
- [ ] Add Google Business Profile link with instructions
- [ ] Create local citation checklist/guide for owners

**Deliverable**: Tenant appears correctly in "basketball near me" searches.

```python
# Example: Local SEO Settings Model
class LocalSEOSettings(models.Model):
    """Tenant-level settings for local search optimization."""
    
    tenant = models.OneToOneField('tenants.Tenant', on_delete=models.CASCADE)
    
    # NAP (Name, Address, Phone) - Critical for local SEO
    business_name = models.CharField(
        max_length=100,
        help_text="Exactly as it appears on Google Business Profile"
    )
    street_address = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2)
    zip_code = models.CharField(max_length=10)
    phone = models.CharField(
        max_length=20,
        help_text="Format: (555) 123-4567"
    )
    
    # Additional local signals
    service_area_description = models.TextField(
        blank=True,
        help_text="e.g., 'Serving Essex, Morris, and Union counties'"
    )
    google_business_url = models.URLField(
        blank=True,
        help_text="Link to your Google Business Profile"
    )
    
    # Business hours (JSON field for flexibility)
    business_hours = models.JSONField(
        default=dict,
        help_text="Operating hours by day"
    )
    
    # Geo coordinates for schema
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
```

### Phase E: Owner Dashboard & Tools (Week 9-10)
**Goal**: SEO status visible and actionable for non-technical owners

- [ ] SEO health dashboard (scores, issues, recommendations)
- [ ] Google/Social preview components in page editor
- [ ] Character counter widgets with visual feedback
- [ ] Missing SEO field report (pages without descriptions, etc.)
- [ ] Redirect manager UI
- [ ] Broken link scanner (scheduled + on-demand)

**Deliverable**: Owner can see "Your SEO health: 85%" and know exactly what to fix.

```python
# Example: SEO Health Check
def calculate_seo_health(tenant):
    issues = []
    score = 100
    
    # Check pages without meta descriptions
    pages_without_desc = Page.objects.live().filter(
        meta_description='',
        noindex=False
    ).count()
    if pages_without_desc > 0:
        issues.append({
            'severity': 'warning',
            'message': f'{pages_without_desc} pages missing meta descriptions',
            'action': 'Add descriptions to improve click-through rates',
            'link': '/admin/seo/missing-descriptions/'
        })
        score -= min(pages_without_desc * 2, 15)
    
    # Check for missing organization schema settings
    if not hasattr(tenant, 'local_seo_settings'):
        issues.append({
            'severity': 'error',
            'message': 'Local business information not configured',
            'action': 'Complete your business profile for local search visibility',
            'link': '/admin/settings/local-seo/'
        })
        score -= 20
    
    # Check sitemap freshness
    # Check for broken internal links
    # Check image alt text coverage
    # ... more checks
    
    return {
        'score': max(score, 0),
        'issues': issues,
        'last_checked': timezone.now()
    }
```

### Phase F: Analytics Integration (Week 11-12)
**Goal**: Owners see SEO results without logging into Google

- [ ] Google Search Console API integration
- [ ] Surface key metrics in dashboard (impressions, clicks, position)
- [ ] Top performing pages report
- [ ] Search query report (what people search to find you)
- [ ] Simple alerting (traffic drops, crawl errors)
- [ ] Competitor visibility (optional/advanced)

**Deliverable**: Owner understands their search performance at a glance.

---

## Phase 5: Implementation Standards

### 5.1 Template Patterns

Base template head section:

```html
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    
    {# Title with fallback hierarchy #}
    <title>{% block title %}{% if page.seo_title %}{{ page.seo_title }}{% else %}{{ page.title }}{% endif %} | {{ settings.core.SiteSettings.site_name }}{% endblock %}</title>
    
    {# Meta description with auto-generation fallback #}
    {% with description=page.get_meta_description %}
    {% if description %}
    <meta name="description" content="{{ description }}">
    {% endif %}
    {% endwith %}
    
    {# Canonical URL #}
    <link rel="canonical" href="{{ page.full_url }}">
    
    {# Robots directives #}
    {% if page.noindex %}
    <meta name="robots" content="noindex, nofollow">
    {% endif %}
    
    {# Open Graph #}
    <meta property="og:type" content="{% block og_type %}website{% endblock %}">
    <meta property="og:title" content="{{ page.get_meta_title }}">
    <meta property="og:description" content="{{ page.get_meta_description }}">
    <meta property="og:url" content="{{ page.full_url }}">
    {% if page.og_image %}
    <meta property="og:image" content="{{ page.og_image.get_rendition('fill-1200x630').url }}">
    {% elif settings.core.SiteSettings.default_og_image %}
    <meta property="og:image" content="{{ settings.core.SiteSettings.default_og_image.url }}">
    {% endif %}
    
    {# Twitter Card #}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ page.get_meta_title }}">
    <meta name="twitter:description" content="{{ page.get_meta_description }}">
    
    {# Structured Data #}
    {% block structured_data %}
    {{ page.get_schema_json|safe }}
    {% endblock %}
    
    {# Analytics - only in production #}
    {% if not debug %}
    {% include "includes/analytics.html" %}
    {% endif %}
</head>
```

### 5.2 Admin UX Patterns

SEO fields in page editor:

```python
# Wagtail page edit handler with SEO preview
from wagtail.admin.panels import FieldPanel, MultiFieldPanel, HelpPanel

class EventPage(SEOFields, Page):
    # ... page fields ...
    
    content_panels = Page.content_panels + [
        # ... content fields ...
    ]
    
    promote_panels = [
        MultiFieldPanel([
            HelpPanel(content="""
                <div id="seo-preview" class="seo-preview-widget">
                    <!-- JavaScript-powered preview updates live as you type -->
                </div>
            """),
            FieldPanel('seo_title', widget=CharCounterWidget(max_length=60)),
            FieldPanel('meta_description', widget=CharCounterWidget(max_length=160)),
            FieldPanel('og_image'),
        ], heading="Search & Social", icon="search"),
        MultiFieldPanel([
            FieldPanel('slug'),
            FieldPanel('noindex'),
        ], heading="Advanced", classname="collapsed"),
    ]
```

### 5.3 Testing Checklist

Before any SEO feature is complete:

- [ ] Renders correctly with missing/empty optional fields
- [ ] Character limits enforced in UI and model
- [ ] Schema validates at schema.org/validator
- [ ] Open Graph validates at developers.facebook.com/tools/debug
- [ ] Tenant isolation verified (no cross-tenant data in schema)
- [ ] Performance impact measured (<50ms added to page load)
- [ ] Mobile rendering verified
- [ ] Caching behavior correct (updates reflect after publish)

---

## Phase 6: Deliverables

### 6.1 Audit Report
- Technical SEO score (0-100) with issue breakdown
- Content SEO assessment per content type
- Multi-tenant isolation verification
- Performance baseline measurements
- Competitor comparison (optional)

### 6.2 Implementation Roadmap
- Phased plan with dependencies
- Time estimates per feature
- Risk assessment
- Definition of done per milestone

### 6.3 Owner Documentation
- "Your SEO Settings" guide (screenshot-heavy)
- "Writing for Search" content guidelines
- "Local SEO Checklist" for new tenants
- FAQ: Common SEO questions owners ask

### 6.4 Technical Artifacts
- SEO mixin classes
- Schema generation utilities
- Template includes
- Admin widgets (preview, character counter)
- Management commands (sitemap rebuild, SEO audit)

---

## Execution Instructions

1. **Begin with Phase 1 audit** — run all diagnostic commands and document current state
2. **Pause after audit** to share findings and confirm priorities
3. **Implement in phases** — each phase should be deployable independently
4. **Validate with real content** — test with actual events, pages, team data
5. **Document for owners** — every feature needs a "how to use this" explanation

**Critical Constraints**:
- Zero SEO benefit should require developer intervention after implementation
- All schema must be valid (test at schema.org/validator)
- Multi-tenant isolation is non-negotiable
- Performance cannot regress (measure before/after)
- Mobile-first (Google uses mobile-first indexing)

**Success Metrics**:
- 100% of public pages have valid meta tags
- 100% of events generate valid Event schema
- Owner can complete "SEO checkup" in under 5 minutes
- New tenant achieves "SEO ready" status within first session
- Zero support tickets about "how do I change my Google description"

---

## Quick Start Command

```bash
echo "=== LEAG SEO Audit Starting ===" && \
echo "Step 1: Check robots.txt" && \
find . -name "*robots*" -type f 2>/dev/null && \
echo "Step 2: Check sitemap" && \
find . -name "*sitemap*" -type f 2>/dev/null && \
echo "Step 3: Check meta patterns" && \
grep -r "meta name\|og:\|schema.org" --include="*.html" | wc -l && \
echo "Step 4: Check SEO fields in models" && \
grep -r "seo_title\|meta_description\|slug" --include="*.py" | wc -l && \
echo "Audit ready. Run Phase 1 commands for full analysis."
```

Begin your analysis now.
