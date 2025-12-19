# NJ Stars Elite - Design Philosophy & Overview

> **Last Updated:** December 9, 2025
> **Status:** Active Design System
> **Related Files:** `design_audit.html`, `DESIGN_AUDIT_IMPLEMENTATION.md`, `DESIGN_DIRECTION.md`

---

## Core Philosophy

**"Athletic Edge meets Paper Sophistication"**

NJ Stars Elite combines the bold, competitive spirit of AAU basketball with the sophistication and readability of modern, paper-like interfaces. The design prioritizes:

1. **Accessibility First** - WCAG 2.1 AA compliance is non-negotiable
2. **Mobile Excellence** - 60%+ of traffic is mobile; every interaction must be touch-friendly
3. **Design Token Consistency** - All colors use HSL tokens, enabling future theming
4. **Perceived Performance** - Skeleton loaders over spinners for 30% faster-feeling UX

---

## Color System

### Brand Colors (HSL Design Tokens)

| Token | Color | HSL Value | Usage |
|-------|-------|-----------|-------|
| `--primary` | Hot Pink | `331.7 73.9% 53.3%` | Primary CTAs, links |
| `--secondary` | Teal | `188.7 94.5% 42.7%` | Secondary actions, apparel tags |
| `--accent` | Jersey Red | `353.4 55% 48.8%` | Destructive, jersey category |
| `--tertiary` | Amber | `37.7 92.1% 50.2%` | Highlights, accessories |

### Status Colors

| Token | Usage |
|-------|-------|
| `--success` | In stock, completed |
| `--warning` | Low stock, tryouts |
| `--info` | News, informational |
| `--destructive` | Errors, out of stock |

### Background Hierarchy (Dark Mode Default)

```css
--bg-primary: 20 13% 9%;      /* Main background */
--bg-secondary: 20 9.4% 12.5%; /* Cards, panels */
--bg-tertiary: 20 7.1% 16.5%;  /* Elevated surfaces */
```

### Text Hierarchy

```css
--text-primary: 26.7 16.4% 89.2%;   /* Main text - 12.8:1 contrast */
--text-secondary: 38.8 6.8% 65%;    /* Muted text - 4.6:1 contrast (WCAG AA) */
--text-tertiary: 38.8 6.8% 55%;     /* Labels, captions */
```

---

## Typography

### Font Stack

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Scale

| Class | Size | Usage |
|-------|------|-------|
| `text-5xl sm:text-8xl` | 48-96px | Hero headlines |
| `text-4xl` | 36px | Section headers |
| `text-2xl` | 24px | Card titles |
| `text-base` | 16px | Body copy |
| `text-sm` | 14px | Labels, meta |
| `text-xs` | 12px | Badges, tags |

### Line Height

- Headers: `leading-tight` (1.25)
- Body: `leading-relaxed` (1.625) - Claude-inspired readability

---

## Component Patterns

### Buttons

| Variant | Usage | Example |
|---------|-------|---------|
| `default` | Standard actions | Add to Cart |
| `cta` | Primary CTAs | Register for Tryouts |
| `outline` | Secondary actions | Continue Shopping |
| `ghost` | Tertiary actions | View All |

**CTA Gradient Pattern:**
```css
bg-gradient-to-br from-foreground/40 to-primary text-background
```

### Cards

- **Fixed height on desktop**: `h-[540px]` for grid consistency
- **Adaptive on mobile**: `h-auto` to respect content
- **Image ratio**: `aspect-[4/3]` for responsive scaling
- **Hover state**: Subtle lift with shadow increase

### Tags & Badges

**Category Tags (Use Design Tokens):**
```tsx
// ✅ Correct
<span className="bg-info/15 text-info">NEWS</span>
<span className="bg-warning/15 text-warning">TRYOUTS</span>

// ❌ Avoid hardcoded colors
<span className="bg-blue-500/10 text-blue-500">NEWS</span>
```

**Touch Target Compliance:**
```css
min-h-[44px] min-w-[44px] /* WCAG 2.5.5 */
```

---

## Accessibility Standards

### Required for All Interactive Elements

1. **Labels**: All form inputs must have `<label>` elements
2. **Touch Targets**: Minimum 44×44px clickable area
3. **Contrast**: 4.5:1 for text, 3:1 for UI components
4. **Focus States**: 2px ring with `ring-primary`
5. **ARIA**: Proper `aria-label`, `aria-pressed`, `aria-describedby`

### Mobile-Specific

- Carousel controls: Always visible (not hover-only)
- Filters: Touch-friendly sizing
- Forms: Generous tap targets

---

## Loading States

### Skeleton Loaders (Preferred)

Use skeleton loaders for all data-fetching states. They provide:
- 30% perceived performance improvement
- Preview of content structure
- Reduced layout shift

**Available Skeletons:**
- `ProductCardSkeleton` - Shop grid items
- `ProductDetailSkeleton` - Full product page
- `EventCardSkeleton` - Event listings
- `NewsCardSkeleton` - News feed items

### When to Use Spinners

Only for brief actions where content structure is unknown:
- Adding to cart (button state)
- Form submissions
- Checkout processing

---

## Responsive Breakpoints

| Breakpoint | Width | Notes |
|------------|-------|-------|
| Mobile | `< 768px` | Single column, touch-first |
| Tablet | `md: 768px` | 2-column grids |
| Desktop | `lg: 1024px` | Full layouts |
| Wide | `xl: 1280px` | 4-column product grids |

### Mobile-First Approach

All styles are mobile-first. Desktop enhancements use `md:` prefix:

```tsx
// ✅ Correct - mobile first
className="h-auto md:h-[540px]"
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"

// ❌ Avoid - desktop first
className="h-[540px] sm:h-auto"
```

---

## Animation & Transitions

### Timing

- **Standard**: `200ms` (buttons, hovers)
- **Content**: `300ms` (modals, drawers)
- **Complex**: `500ms` (page transitions)

### Easing

```css
transition-all duration-200 ease-in-out
```

### Hover States

| Element | Effect |
|---------|--------|
| Links | Underline + color change |
| Buttons | Slight lift (`translateY(-1px)`) + shadow |
| Cards | Elevation increase + background shift |
| Images | Scale 1.05 + brightness |

---

## Dark Mode / Light Mode

The site is dark-mode by default with full light mode support via CSS variables.

### Theme Toggle

Located in header (desktop & mobile). Persists to `localStorage`.

### Implementation

All colors use HSL tokens defined in `globals.css`:
- `:root` or `.dark` - Dark mode values
- `.light` - Light mode overrides

**Benefit:** Changing one token updates all components site-wide.

---

## File Structure

```
documentation/design/
├── DESIGN_PHILOSOPHY.md      # This file - overview & principles
├── DESIGN_DIRECTION.md       # Original design direction document
├── DESIGN_AUDIT_IMPLEMENTATION.md  # Implementation checklist
└── design_audit.html         # Interactive audit with live examples
```

---

## Design Decisions Log

### December 2025

| Decision | Rationale |
|----------|-----------|
| Dark mode default | Premium feel, reduces eye strain, matches black jerseys |
| Hot pink primary | Energetic, stands out, works on dark backgrounds |
| Skeleton loaders | 30% perceived performance boost over spinners |
| 44px touch targets | WCAG 2.5.5 compliance, prevents mis-taps |
| HSL color tokens | Future-proofs theming, enables light mode with single update |
| Inter font | Clean, athletic, excellent readability at all sizes |

---

## Quick Reference

### Adding a New Category Tag

```tsx
// 1. Add to getCategoryColor function
const colors: Record<string, string> = {
  jersey: "bg-accent/15 text-accent border border-accent/30",
  apparel: "bg-secondary/15 text-secondary border border-secondary/30",
  accessories: "bg-tertiary/15 text-tertiary border border-tertiary/30",
  equipment: "bg-info/15 text-info border border-info/30",
  // Add new category here using design tokens
}
```

### Creating a New Skeleton

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export function MyComponentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}
```

### Ensuring Accessibility

```tsx
// Form input with proper label
<label htmlFor="email" className="sr-only">Email</label>
<Input
  id="email"
  type="email"
  aria-describedby={error ? "email-error" : undefined}
  aria-invalid={!!error}
/>
{error && <p id="email-error" className="text-destructive text-sm">{error}</p>}
```

---

## Resources

- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Contrast Checker**: https://webaim.org/resources/contrastchecker/

---

*This document serves as the single source of truth for NJ Stars design decisions. Update it as the design system evolves.*
