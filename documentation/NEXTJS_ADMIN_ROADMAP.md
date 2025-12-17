# Next.js Admin Panel Roadmap

> **Goal:** Replace Wagtail CMS admin with a fully client-side admin experience in Next.js
> **Created:** December 2025

---

## Why Move Away from Wagtail Admin?

| Wagtail Admin | Next.js Admin |
|---------------|---------------|
| Separate Django app at `/cms-admin/` | Unified codebase at `/portal/admin/` |
| Django templates + limited JS | Full React + TypeScript |
| Generic admin styling | Custom branded UI matching public site |
| Page refreshes between actions | SPA experience with instant feedback |
| Limited mobile experience | Mobile-first responsive design |
| Requires Django deployment | Can work with any backend API |

---

## Current State: What Wagtail Provides

### Model Admin Groups (wagtail_hooks.py)

| Group | Models | Current Features |
|-------|--------|------------------|
| **Events & Programs** | Events, Registrations | List, filter, export CSV/XLSX |
| **Shop** | Products, Orders | List, filter, order status management |
| **Members** | Players, Dues Accounts | List, filter, dues tracking |
| **Staff** | Coaches | List, edit profiles |
| **Communications** | Newsletter Subscribers | List, export |

### CMS Pages

| Page Type | Purpose |
|-----------|---------|
| HomePage | Hero, CTAs, section toggles |
| BlogIndexPage | Blog listing configuration |
| BlogPage | Individual blog posts |
| TeamPage | Team roster display |

### Media Management
- Image uploads with renditions
- Document management
- Automatic image optimization

### Already Built in Next.js Portal

| Route | Status | Description |
|-------|--------|-------------|
| `/portal/admin` | â Built | Admin dashboard with quick stats |
| `/portal/admin/printify` | â Built | Printify product sync & management |
| `/portal/admin/roster` | â Built | Player roster management |
| `/portal/admin/check-ins` | â Built | Event check-in system |
| `/portal/admin/events` | ð§ Partial | Event management |

---

## Target State: Full Next.js Admin

```
/portal/admin/
âââ page.tsx                    # Dashboard (exists)
âââ events/
â   âââ page.tsx               # Event list with filters
â   âââ [id]/page.tsx          # Edit event
â   âââ new/page.tsx           # Create event
âââ registrations/
â   âââ page.tsx               # Registration list + export
â   âââ [id]/page.tsx          # View/edit registration
âââ products/
â   âââ page.tsx               # Product list
â   âââ [id]/page.tsx          # Edit product
â   âââ new/page.tsx           # Create product
âââ orders/
â   âââ page.tsx               # Order list + filters
â   âââ [id]/page.tsx          # Order details + status
âââ players/
â   âââ page.tsx               # Player roster
â   âââ [id]/page.tsx          # Player profile + dues
âââ coaches/
â   âââ page.tsx               # Coach list
â   âââ [id]/page.tsx          # Edit coach profile
âââ content/
â   âââ page.tsx               # CMS content overview
â   âââ homepage/page.tsx      # Edit homepage sections
â   âââ blog/
â       âââ page.tsx           # Blog post list
â       âââ [id]/page.tsx      # Edit blog post
â       âââ new/page.tsx       # Create blog post
âââ media/
â   âââ page.tsx               # Media library
âââ subscribers/
â   âââ page.tsx               # Newsletter list + export
âââ reports/
    âââ page.tsx               # Financial reports
```

---

## Migration Phases

### Phase 1: API Foundation (Week 1-2)

Create REST endpoints for all admin operations. Currently, many models only have read endpoints.

**New API Endpoints Needed:**

```python
# Events
POST   /api/events/                    # Create event
PUT    /api/events/{id}/               # Update event
DELETE /api/events/{id}/               # Delete event

# Registrations  
PUT    /api/registrations/{id}/        # Update registration
DELETE /api/registrations/{id}/        # Delete registration
GET    /api/registrations/export/      # Export CSV/XLSX

# Products
POST   /api/payments/products/         # Create product
PUT    /api/payments/products/{id}/    # Update product
DELETE /api/payments/products/{id}/    # Delete product

# Orders
PUT    /api/payments/orders/{id}/      # Update order status
GET    /api/payments/orders/export/    # Export orders

# Players
POST   /api/portal/players/            # Create player (admin)
PUT    /api/portal/players/{id}/       # Update player
DELETE /api/portal/players/{id}/       # Delete player

# Coaches
POST   /api/coaches/                   # Create coach
PUT    /api/coaches/{id}/              # Update coach
DELETE /api/coaches/{id}/              # Delete coach

# Media
POST   /api/media/upload/              # Upload image/document
GET    /api/media/                     # List media
DELETE /api/media/{id}/                # Delete media

# CMS Content
GET    /api/cms/homepage/              # Get homepage config
PUT    /api/cms/homepage/              # Update homepage
POST   /api/cms/blog/                  # Create blog post
PUT    /api/cms/blog/{id}/             # Update blog post
DELETE /api/cms/blog/{id}/             # Delete blog post
```

**Permission System:**
```python
# backend/apps/portal/permissions.py
class IsOrgAdmin(BasePermission):
    """Only org admins can access admin endpoints"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.profile.role == "admin"
```

---

### Phase 2: Core Admin UI (Week 3-4)

Build the shared admin components and first set of pages.

**Shared Components:**

```
frontend/src/components/admin/
âââ admin-layout.tsx           # Sidebar + header
âââ data-table.tsx             # Sortable, filterable table
âââ data-table-toolbar.tsx     # Search, filters, export
âââ form-field.tsx             # Consistent form inputs
âââ image-upload.tsx           # Drag-drop image upload
âââ rich-text-editor.tsx       # Blog/description editor
âââ status-badge.tsx           # Order/registration status
âââ confirm-dialog.tsx         # Delete confirmations
âââ export-button.tsx          # CSV/XLSX export
```

**First Pages to Build:**
1. Events list + CRUD (most used)
2. Registrations list + export
3. Orders list + status management

---

### Phase 3: E-commerce Admin (Week 5-6)

**Products:**
- Product list with images
- Create/edit form with:
  - Multiple image upload
  - Variant management (sizes)
  - Inventory tracking
  - Printify sync status

**Orders:**
- Order list with status filters
- Order detail view
- Status update workflow
- Refund initiation (links to Stripe)

---

### Phase 4: Members & Content (Week 7-8)

**Players:**
- Player roster with search
- Player profile editing
- Dues account management
- Payment history

**Content Management:**
- Homepage section toggles
- Blog post editor with:
  - Rich text (TipTap or Slate)
  - Featured image
  - Categories/tags
  - Publish scheduling

---

### Phase 5: Media & Polish (Week 9-10)

**Media Library:**
- Grid view of all uploads
- Drag-drop upload
- Image cropping/optimization
- Usage tracking (which content uses image)

**Polish:**
- Loading skeletons
- Optimistic updates
- Keyboard shortcuts
- Bulk actions (delete multiple, etc.)

---

## Technical Decisions

### Rich Text Editor Options

| Option | Pros | Cons |
|--------|------|------|
| **TipTap** | Headless, React-native, extensible | More setup required |
| **Slate** | Flexible, good React support | Steeper learning curve |
| **Lexical** | Meta-backed, performant | Newer, less ecosystem |
| **MDX** | Markdown-based, developer-friendly | Less WYSIWYG for non-devs |

**Recommendation:** TipTap with shadcn/ui styling - best balance of flexibility and UX.

### Image Upload Strategy

```typescript
// Option 1: Direct to Django media
POST /api/media/upload/
- Django stores in MEDIA_ROOT
- Served via whitenoise or S3

// Option 2: Direct to S3 with presigned URLs
GET /api/media/presign/ -> { uploadUrl, publicUrl }
- Frontend uploads directly to S3
- Faster, less server load

// Option 3: Cloudinary/Uploadcare
- Third-party handles optimization
- Easy but adds cost/dependency
```

**Recommendation:** Start with Option 1, migrate to Option 2 for production scale.

### State Management for Admin

```typescript
// Use React Query (TanStack Query) for:
- Server state caching
- Optimistic updates
- Background refetching
- Mutation handling

// Example pattern:
const { data: events, isLoading } = useQuery({
  queryKey: ["events"],
  queryFn: () => api.get("/api/events/"),
});

const updateEvent = useMutation({
  mutationFn: (data) => api.put(`/api/events/${data.id}/`, data),
  onSuccess: () => queryClient.invalidateQueries(["events"]),
});
```

---

## Data Table Component

Use `@tanstack/react-table` with shadcn/ui for consistent tables:

```typescript
// Features needed:
- Column sorting (client + server)
- Column filtering
- Global search
- Pagination
- Row selection (for bulk actions)
- Export selected/filtered
- Responsive (card view on mobile)
```

**Reference:** shadcn/ui has a [data-table example](https://ui.shadcn.com/docs/components/data-table) that covers most of this.

---

## Keeping Wagtail for CMS Pages?

**Option A: Full Replacement**
- Build blog editor in Next.js
- Store posts in Django models (not Wagtail pages)
- More work but complete control

**Option B: Hybrid Approach**
- Keep Wagtail for CMS pages (blog, team page)
- Use Next.js admin for operational data (events, orders, players)
- Less migration work
- Staff uses two admin panels

**Option C: Headless Wagtail**
- Keep Wagtail admin for content editors
- Disable public Wagtail URLs
- Use Wagtail API for content, Next.js admin for operations

**Recommendation:** Start with Option B (hybrid), migrate to A if content editing frequency justifies it.

---

## Migration Checklist

### Before Starting
- [ ] Audit all Wagtail ModelAdmin features currently used
- [ ] Document which features staff actually uses vs. available
- [ ] Set up React Query in frontend
- [ ] Create admin layout component

### Phase 1 Complete When
- [ ] All CRUD API endpoints exist with proper permissions
- [ ] API tests cover admin operations
- [ ] Export endpoints work for CSV/XLSX

### Phase 2 Complete When
- [ ] Events CRUD works in Next.js
- [ ] Registrations list + export works
- [ ] Staff can do daily operations without Wagtail

### Phase 3 Complete When
- [ ] Products can be created/edited (non-Printify)
- [ ] Orders can be viewed and status updated
- [ ] Printify sync integrated

### Phase 4 Complete When
- [ ] Player management complete
- [ ] Dues tracking works
- [ ] Blog posts can be created/edited

### Phase 5 Complete When
- [ ] Media library functional
- [ ] All Wagtail ModelAdmin features replicated
- [ ] Staff trained on new admin

### Decommission Wagtail Admin
- [ ] Remove `/cms-admin/` route (or restrict to superusers)
- [ ] Keep Wagtail models for data (optional)
- [ ] Update Standard Work documentation

---

## Effort Estimate

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: API Foundation | 2 weeks | None |
| Phase 2: Core Admin UI | 2 weeks | Phase 1 |
| Phase 3: E-commerce | 2 weeks | Phase 2 |
| Phase 4: Members & Content | 2 weeks | Phase 2 |
| Phase 5: Media & Polish | 2 weeks | Phase 4 |

**Total: ~10 weeks** for full replacement

**Quick Win Alternative:** Build only Events + Registrations admin (~3 weeks) since that is the most-used feature.

---

## Questions to Decide

1. **Rich text editor:** TipTap vs Slate vs simpler Markdown?
2. **Image hosting:** Django media vs S3 vs Cloudinary?
3. **Scope:** Full replacement or hybrid with Wagtail for content?
4. **Timeline:** All at once or incremental migration?
5. **Blog:** Keep Wagtail blog or rebuild in Next.js?

---

## Next Steps

1. **Decide scope** - Full replacement or hybrid?
2. **Start Phase 1** - Build missing API endpoints
3. **Set up React Query** - Install and configure
4. **Build DataTable component** - Reusable for all list views
5. **Migrate Events first** - Most-used admin feature
