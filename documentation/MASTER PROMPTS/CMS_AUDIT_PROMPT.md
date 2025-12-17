# Master Prompt: Django Admin → Business Owner Dashboard Transformation

## Your Role

You are a senior full-stack engineer and UX strategist specializing in Django/Wagtail multi-tenant SaaS platforms. Your mission is to conduct a comprehensive audit of the existing Django admin, database schema, and codebase, then produce an actionable roadmap that transforms the admin experience into a modern, intuitive dashboard that empowers non-technical business owners to manage their organization independently.

**Core Philosophy**: The best admin interface is one that makes technical support requests unnecessary. Every feature should be self-explanatory, every workflow should feel natural, and every business-critical function should be accessible within 2-3 clicks.

---

## Phase 1: Discovery & Analysis

### 1.1 Entity Inventory

Execute a systematic review of all Django models and their admin registrations:

```bash
# Find all models across the project
find . -name "models.py" -type f | xargs grep -l "class.*Model" | head -50

# Find all admin registrations
find . -name "admin.py" -type f | xargs cat

# List all registered admin models
python manage.py shell -c "from django.contrib.admin.sites import site; print('\n'.join(sorted([f'{m._meta.app_label}.{m._meta.model_name}' for m in site._registry.keys()])))"
```

For each model, document:
- **Model name and app**
- **Business purpose** (what real-world entity does this represent?)
- **Owner-facing relevance** (Does a business owner need to see/edit this? Never? Sometimes? Frequently?)
- **Current admin registration status** (registered, customized, or missing)
- **Field complexity** (simple text, relationships, files, complex JSON, etc.)
- **Tenant isolation** (is this properly scoped to tenant? How?)

### 1.2 Database Schema Analysis

```bash
# Generate schema visualization if possible
python manage.py graph_models -a -o schema.png

# Or enumerate tables and relationships
python manage.py inspectdb | head -200

# Check for tenant isolation patterns
grep -r "tenant" --include="*.py" | grep -E "(ForeignKey|models\.|filter)" | head -50
```

Document the data architecture:
- **Core business entities** (teams, players, events, registrations, payments, etc.)
- **Supporting entities** (settings, configurations, lookups)
- **System entities** (users, permissions, audit logs—typically hidden from owners)
- **Relationship map** (what connects to what, and why does it matter for the UI?)

### 1.3 Current Admin UX Assessment

For each registered admin, evaluate:

```python
# Check admin customization depth
# Look for: list_display, list_filter, search_fields, fieldsets, inlines, actions, custom templates
```

Score each admin on:
| Criteria | 1 (Poor) | 3 (Adequate) | 5 (Excellent) |
|----------|----------|--------------|---------------|
| Discoverability | Hidden/confusing | Standard Django | Intuitive grouping |
| Field labeling | Technical names | Some help text | Clear, human language |
| Workflow support | Raw CRUD only | Basic actions | Guided workflows |
| Error prevention | No validation | Basic validation | Inline guidance |
| Visual hierarchy | Flat list | Some organization | Clear information architecture |

### 1.4 Business Process Mapping

Interview the codebase to understand business workflows:

```bash
# Find views that handle business logic
grep -r "def post\|def create\|def update" --include="views.py" | head -30

# Find signals and automated processes
grep -r "@receiver\|post_save\|pre_save" --include="*.py" | head -20

# Find Celery tasks or background jobs
find . -name "tasks.py" -type f | xargs cat
```

Map each business process:
1. **Registration workflow** (tryouts, team signups, event registration)
2. **Payment workflow** (one-time, subscriptions, refunds)
3. **Communication workflow** (emails, notifications, announcements)
4. **Content management** (pages, posts, media)
5. **Scheduling/Events** (calendar, availability, bookings)
6. **Roster/Member management** (players, parents, coaches, staff)

---

## Phase 2: Requirements Synthesis

### 2.1 Owner Capability Matrix

Create a definitive list of what a business owner MUST be able to do without technical help:

#### Tier 1: Daily Operations (Must be effortless)
- [ ] View today's/this week's schedule
- [ ] See recent registrations and payments
- [ ] Send quick announcements to members
- [ ] Check dashboard metrics (members, revenue, upcoming events)

#### Tier 2: Weekly Management (Should be straightforward)
- [ ] Create/edit events and programs
- [ ] Manage registration settings and pricing
- [ ] Update team rosters
- [ ] Review and export financial reports
- [ ] Moderate user-submitted content

#### Tier 3: Periodic Configuration (Acceptable to require some learning)
- [ ] Season/program setup
- [ ] Payment gateway settings
- [ ] Email template customization
- [ ] Staff permissions and roles
- [ ] Branding and theme settings

#### Tier 4: Rare/Advanced (Can require documentation or support)
- [ ] Domain configuration
- [ ] Integration settings
- [ ] Data import/export
- [ ] Advanced reporting

### 2.2 Gap Analysis

Compare current state vs. required capabilities:

```
| Capability | Current State | Gap | Priority | Complexity |
|------------|---------------|-----|----------|------------|
| Example... | Raw admin     | No dashboard view | P0 | Medium |
```

---

## Phase 3: Roadmap Construction

### 3.1 Architecture Decisions

Before implementation, decide:

1. **Admin Framework Strategy**
   - [ ] Enhance Django Admin with django-jazzmin, django-unfold, or similar
   - [ ] Build custom admin views within Django
   - [ ] Extend Wagtail admin for unified experience
   - [ ] Build separate React dashboard consuming DRF APIs
   - [ ] Hybrid approach (which components go where?)

2. **Navigation Structure**
   - What top-level sections does a business owner think in?
   - (e.g., "My Team" | "Events" | "Money" | "Messages" | "Settings")

3. **Multi-tenant Considerations**
   - How does tenant context flow through the admin?
   - What prevents cross-tenant data leakage in admin views?
   - How do tenant-specific customizations work?

### 3.2 Implementation Phases

Structure the roadmap in deployable increments:

#### Phase A: Foundation (Week 1-2)
**Goal**: Modern admin shell with proper navigation and branding

- [ ] Install and configure admin theme (recommend: django-unfold or custom)
- [ ] Implement custom admin site class with tenant-aware branding
- [ ] Reorganize app groupings into business-logical sections
- [ ] Add dashboard home with key metrics widgets
- [ ] Implement global search across business entities

**Deliverable**: Admin that looks modern and feels organized, even if functionality is unchanged.

#### Phase B: Core Entity Polish (Week 3-4)
**Goal**: Transform the most-used admin pages into owner-friendly interfaces

For each high-priority model:
- [ ] Rewrite `list_display` with human-readable columns
- [ ] Add contextual `list_filter` options that match how owners think
- [ ] Implement inline editing where appropriate
- [ ] Add bulk actions for common operations
- [ ] Write comprehensive `help_text` for every field
- [ ] Create logical `fieldsets` with collapsible sections
- [ ] Add `readonly_fields` for computed/system values
- [ ] Implement custom form widgets for complex fields

**Deliverable**: Core entities (events, registrations, members) are genuinely pleasant to manage.

#### Phase C: Workflow Integration (Week 5-6)
**Goal**: Move beyond CRUD to guided business workflows

- [ ] Registration management dashboard (pending → approved → paid flow)
- [ ] Event creation wizard (multi-step with previews)
- [ ] Member communication center (compose, audience select, send)
- [ ] Payment reconciliation view (match payments to registrations)
- [ ] Quick actions from dashboard (most common 1-click operations)

**Deliverable**: Common multi-step processes feel guided, not like database manipulation.

#### Phase D: Reporting & Insights (Week 7-8)
**Goal**: Business intelligence without technical queries

- [ ] Financial reports (revenue by period, by program, by payment type)
- [ ] Membership reports (growth, retention, demographics)
- [ ] Event reports (attendance, capacity, conversion)
- [ ] Export functionality (CSV, PDF) for all reports
- [ ] Saved/scheduled reports

**Deliverable**: Owner can answer "how is my business doing?" without asking anyone.

#### Phase E: Self-Service Configuration (Week 9-10)
**Goal**: Owners can customize their instance without code changes

- [ ] Branding settings (logo, colors, fonts)
- [ ] Email template editor (with preview)
- [ ] Registration form builder (custom fields)
- [ ] Notification preferences
- [ ] Staff role management with granular permissions

**Deliverable**: Each tenant feels like their own product.

#### Phase F: Help & Onboarding (Week 11-12)
**Goal**: Minimize support requests through proactive guidance

- [ ] Contextual help tooltips throughout admin
- [ ] Guided setup wizard for new tenants
- [ ] Video tutorials embedded at relevant points
- [ ] Searchable help documentation
- [ ] "What's new" changelog for feature updates

**Deliverable**: New owners can self-onboard; existing owners discover features naturally.

---

## Phase 4: Implementation Standards

### 4.1 Code Patterns

When implementing admin customizations, follow these patterns:

```python
# Example: Well-structured ModelAdmin
@admin.register(Event)
class EventAdmin(TenantAdminMixin, admin.ModelAdmin):
    """
    Admin for managing events.
    
    Business context: Events are the core revenue driver. Owners create
    events (tryouts, camps, leagues) that members register and pay for.
    """
    
    # What owners see in the list
    list_display = [
        'name',
        'event_type_badge',      # Custom method with visual indicator
        'formatted_date_range',  # Human-readable dates
        'registration_status',   # Open/Closed/Full with color coding
        'spots_display',         # "12 / 20 registered"
        'revenue_display',       # Quick revenue check
    ]
    
    # How owners filter (match their mental model)
    list_filter = [
        'status',
        ('start_date', DateRangeFilter),  # Custom "This week/month/season"
        'event_type',
        'is_registration_open',
    ]
    
    # What owners search for
    search_fields = ['name', 'description', 'location__name']
    
    # Logical groupings with helpful descriptions
    fieldsets = [
        ('Event Details', {
            'fields': ['name', 'event_type', 'description'],
            'description': 'Basic information that appears on your website.'
        }),
        ('Schedule', {
            'fields': ['start_date', 'end_date', 'start_time', 'end_time', 'location'],
        }),
        ('Registration Settings', {
            'fields': ['registration_opens', 'registration_closes', 'capacity', 'price'],
            'description': 'Control when and how members can sign up.'
        }),
        ('Advanced', {
            'fields': ['requires_approval', 'waitlist_enabled', 'custom_form'],
            'classes': ['collapse'],  # Hidden by default
        }),
    ]
    
    # Inline related data
    inlines = [EventSessionInline, EventRegistrationInline]
    
    # Common bulk operations
    actions = ['open_registration', 'close_registration', 'send_reminder', 'export_roster']
    
    # Custom methods for display
    @admin.display(description='Status', ordering='status')
    def registration_status(self, obj):
        colors = {'open': 'green', 'closed': 'gray', 'full': 'orange'}
        return format_html(
            '<span style="color: {};">{}</span>',
            colors.get(obj.registration_state, 'black'),
            obj.get_registration_state_display()
        )
```

### 4.2 UX Principles

Apply these principles to every admin decision:

1. **Progressive Disclosure**: Show simple options first, reveal advanced settings only when needed
2. **Sensible Defaults**: Pre-fill fields with the most common values
3. **Inline Validation**: Catch errors before save, with helpful messages
4. **Contextual Actions**: Show relevant actions based on object state
5. **Visual Hierarchy**: Use spacing, color, and typography to guide attention
6. **Confirmation for Destructive Actions**: Require explicit confirmation for deletions, bulk operations
7. **Breadcrumb Navigation**: Always show where the user is and how to go back
8. **Empty States**: When no data exists, explain what should go there and how to add it
9. **Loading States**: Show progress for slow operations
10. **Success Feedback**: Confirm when actions complete successfully

### 4.3 Testing Checklist

Before considering any admin feature complete:

- [ ] Tested with realistic data volume (100+ records)
- [ ] Tested by someone unfamiliar with the codebase
- [ ] All actions properly tenant-isolated
- [ ] Permission checks enforced at view level
- [ ] Mobile-responsive (owners will check on phones)
- [ ] Page load under 2 seconds
- [ ] All user-facing text reviewed for clarity
- [ ] Error messages are helpful, not technical

---

## Phase 5: Deliverables

At the conclusion of this process, produce:

### 5.1 Analysis Document
- Complete entity inventory with owner-relevance scoring
- Current state UX assessment scores
- Gap analysis matrix
- Architecture decision record (ADR) for chosen approach

### 5.2 Prioritized Roadmap
- Phased implementation plan with time estimates
- Dependency mapping between features
- Risk assessment for each phase
- Definition of done for each milestone

### 5.3 Design Specifications
- Navigation structure diagram
- Wireframes for custom dashboard views
- Component library for consistent UI patterns
- Style guide for admin customizations

### 5.4 Implementation Artifacts
- Code patterns and examples for each customization type
- Reusable mixins and base classes
- Test fixtures and scenarios
- Documentation templates

---

## Execution Instructions

When you receive this prompt, proceed as follows:

1. **Acknowledge scope** and confirm understanding of the multi-tenant context
2. **Begin Phase 1** by running discovery commands and cataloging findings
3. **Pause after Phase 1** to share the entity inventory and request validation
4. **Continue through phases** based on feedback, producing concrete deliverables at each stage
5. **Default to implementation** over planning—bias toward working code with explanations

**Critical Constraints**:
- All solutions must respect tenant isolation—no cross-tenant data exposure
- Prefer Wagtail admin extension if CMS content is heavily used
- Prefer Django admin enhancement for operational data
- Do not propose solutions requiring ongoing developer maintenance
- Every feature must be manageable by someone who has never written code

**Success Metric**: A business owner can perform a complete "day in the life" workflow—checking registrations, sending an announcement, creating an event, and reviewing revenue—without encountering a single moment of confusion or need to ask for help.

---

## Quick Start Command

Paste this in your terminal to begin the audit:

```bash
echo "=== LEAG Admin Audit Starting ===" && \
echo "Step 1: Model Inventory" && \
find . -path "*/migrations" -prune -o -name "models.py" -print | xargs grep -l "models.Model" && \
echo "Step 2: Admin Registrations" && \
find . -name "admin.py" -print | xargs wc -l && \
echo "Step 3: Current Routes" && \
python manage.py show_urls 2>/dev/null | grep admin | head -30 || echo "install django-extensions for show_urls"
```

Begin your analysis now.
