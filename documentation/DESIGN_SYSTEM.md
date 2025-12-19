# Design System & UI Philosophy

> **Purpose:** Document the visual design patterns, color system, and UI consistency guidelines for the NJ Stars / LEAG platform.
> **Last Updated:** December 18, 2025

---

## Design Philosophy

### Core Principles

1. **Dark Mode Default** — Premium feel, reduces eye strain for evening use
2. **Mobile First** — 60%+ traffic expected from mobile devices
3. **Muted & Professional** — Avoid harsh colors; prefer muted tones with foreground text
4. **Graceful Degradation** — Fallback data when APIs fail, hide empty sections
5. **Skeleton Loaders** — Loading states over spinners for perceived performance

### Design System Consistency Pattern

- **Semantic Color Tokens** (`success`, `muted`, `foreground`) instead of raw colors ensures UI adapts to theme changes automatically
- **Variant Props** (like `variant="success"` on Button) centralize style definitions, making site-wide updates a single-file change
- **Hover State Progressions** (`bg-muted` → `bg-success/30`) create visual feedback hierarchies that guide user attention

---

## Dashboard vs Website Design Philosophy

The platform has two distinct visual contexts with different design approaches:

### Website (Public-Facing)

The public website uses **vibrant brand colors** to create energy and excitement:

- **Primary colors** (hot pink, teal) used prominently for CTAs and highlights
- **Higher contrast** backgrounds and accents
- **Brand personality** expressed through color choices
- **Marketing-focused** visual hierarchy

### Dashboard (Admin/Portal)

Admin dashboards and internal tools use **muted, professional tones**:

- **Muted backgrounds** (`bg-muted`, `bg-muted/50`) instead of stark white or bright colors
- **Subtle hover states** using `bg-success/30` rather than vivid colors
- **Foreground text** on all interactive elements for readability
- **Reduced visual noise** to support focus on data and actions
- **Consistent icon containers** with muted backgrounds

**Dashboard Card Headers Pattern:**
```tsx
<CardTitle className="flex items-center gap-2 text-foreground">
  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
    <Icon className="h-4 w-4 text-muted-foreground" />
  </div>
  Section Title
</CardTitle>
```

**Dashboard Page Headers Pattern:**
```tsx
<div className="flex items-center gap-3">
  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
    <Icon className="h-6 w-6 text-muted-foreground" />
  </div>
  <div>
    <h1 className="text-2xl font-bold">Page Title</h1>
    <p className="text-muted-foreground text-sm">Description</p>
  </div>
</div>
```

### Date & Time Inputs (Admin Forms)

Date, time, and datetime-local inputs have special styling for admin dashboards:

- **Muted background** (`bg-muted/50`) to blend with dashboard aesthetic
- **Clean picker icon** - no background box, just the native icon
- **Dark mode visibility** with `invert` filter on picker icon
- **Subtle opacity** (70% default, 100% on hover)

```tsx
// Use DateTimeInput for datetime-local fields
import { DateTimeInput } from "@/components/ui/datetime-input"

<DateTimeInput
  id="start_datetime"
  value={startDate}
  onChange={(e) => setStartDate(e.target.value)}
/>

// Regular Input handles date/time types automatically
import { Input } from "@/components/ui/input"

<Input type="date" value={date} onChange={...} />
<Input type="time" value={time} onChange={...} />
```

**Key webkit pseudo-element styling:**
```css
[&::-webkit-calendar-picker-indicator]:cursor-pointer
[&::-webkit-calendar-picker-indicator]:opacity-70
[&::-webkit-calendar-picker-indicator]:hover:opacity-100
dark:[&::-webkit-calendar-picker-indicator]:invert
```

---

## Color System

### Semantic Color Tokens (CSS Variables in globals.css)

| Token | Purpose | HSL Value (Dark Mode) |
|-------|---------|----------------------|
| `--primary` | Primary CTAs, links | Hot Pink (331.7 73.9% 53.3%) |
| `--secondary` | Alternative actions | Teal (188.7 94.5% 42.7%) |
| `--accent` | Destructive, alerts | Jersey Red (353.4 55% 48.8%) |
| `--tertiary` | Highlights, badges | Amber (37.7 92.1% 50.2%) |
| `--success` | Positive states, confirmations | Green |
| `--warning` | Caution states | Amber/Orange |
| `--info` | Informational | Blue |
| `--muted` | Subtle backgrounds | Gray |
| `--foreground` | Primary text | Light gray/white |
| `--muted-foreground` | Secondary text | Dimmed gray |

### Admin/Dashboard Color Usage

For admin dashboards and internal tools, prefer **muted success tones** over bright colors:

```
Hover backgrounds:   bg-success/10, bg-success/20, bg-success/30
Active backgrounds:  bg-success/40, bg-success/60
Icon containers:     bg-muted → group-hover:bg-success/30
Text on hover:       text-foreground (NOT text-success)
```

**Key Rule:** Text should always be `text-foreground` on colored backgrounds for readability.

---

## Component Patterns

### Buttons

Use semantic variants instead of inline color classes:

```tsx
// ✅ Good - uses centralized variant
<Button variant="success">Generate Link</Button>

// ❌ Bad - inline colors, hard to maintain
<Button className="bg-secondary/80 hover:bg-secondary text-white">Generate Link</Button>
```

**Available Variants:**
- `default` — Primary actions (hot pink)
- `secondary` — Alternative actions (teal)
- `destructive` — Dangerous actions (red)
- `outline` — Bordered, transparent
- `ghost` — Minimal, hover only
- `success` — Muted green with foreground text (admin/dashboard)
- `cta` — High-emphasis hero buttons

### Badges

All muted badge variants use `text-foreground` for consistency:

```tsx
// Event category badges
<Badge variant="tryout">Tryout</Badge>
<Badge variant="practice">Practice</Badge>
<Badge variant="game">Game</Badge>

// Status badges
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="muted">Draft</Badge>
```

### Dashboard Cards

Use the componentized dashboard cards for consistency:

```tsx
import { 
  DashboardActionCard,
  DashboardLinkCard,
  DashboardStatCard,
  DashboardSection 
} from "@/components/dashboard/dashboard-cards"

// Quick action with icon
<DashboardActionCard
  href="/portal/dashboard/events"
  icon={Calendar}
  title="Events"
  description="Manage schedule"
/>

// Stat display
<DashboardStatCard
  icon={Users}
  title="Active Players"
  value={48}
  description="Total registered"
/>

// Navigation link with arrow
<DashboardLinkCard
  href="/portal/dashboard/roster"
  icon={Users}
  title="View Roster"
  description="48 active players"
/>
```

### Dropdowns & Select Menus

Dropdown items should use muted gray hover, not accent colors:

```tsx
// ✅ Good - muted hover
className="hover:bg-muted transition-colors"

// ❌ Bad - accent color hover
className="hover:bg-accent/50"
```

---

## Hover State Guidelines

### Dashboard Cards & Interactive Elements

```css
/* Base state */
.card {
  background: transparent;
  border-color: border;
}

/* Hover state */
.card:hover {
  background: bg-success/10 or bg-muted/50;
  border-color: border-success/30 or border-foreground/20;
}

/* Icon container in card */
.icon-container {
  background: bg-muted;
}
.card:hover .icon-container {
  background: bg-success/30;
}

/* Icon itself */
.icon {
  color: text-muted-foreground;
}
.card:hover .icon {
  color: text-foreground;
}
```

### Folder-Style Tabs

For tabbed interfaces like the dashboard role switcher:

```tsx
<TabsTrigger
  className={`
    rounded-t-lg rounded-b-none border border-b-0 border-transparent
    data-[state=active]:bg-success/40 data-[state=active]:border-border
    data-[state=active]:text-foreground data-[state=active]:z-20
    data-[state=inactive]:bg-muted/30 data-[state=inactive]:text-muted-foreground
    hover:bg-success/20 hover:text-foreground
    -mb-px
  `}
>
```

---

## Typography

### Text Colors

| Context | Class |
|---------|-------|
| Primary text | `text-foreground` |
| Secondary/helper text | `text-muted-foreground` |
| Links | `text-primary` or `text-foreground` with underline |
| Error text | `text-destructive` or `text-red-600` |
| Success text | `text-success` (icons only, not body text) |

**Important:** Body text should almost always be `text-foreground` or `text-muted-foreground`. Colored text (like `text-success`, `text-secondary`) should be reserved for icons and very small labels, not paragraphs or prices.

### Price Display

```tsx
// ✅ Good - foreground text for readability
<p className="text-2xl font-bold text-foreground">$49.99</p>

// ❌ Bad - colored text harder to read
<p className="text-2xl font-bold text-secondary">$49.99</p>
```

---

## Responsive Breakpoints

| Breakpoint | Width | Typical Use |
|------------|-------|-------------|
| Mobile | < 768px | 2-column grids, touch-first |
| Tablet (md) | 768px | 3-column grids |
| Desktop (lg) | 1024px | 4-column grids, sidebars |
| Wide (xl) | 1280px | Full layouts |

---

## Card Styles

### Standard Cards

```tsx
<Card className="hover:bg-muted/50 hover:border-foreground/20 transition-all">
```

### Highlighted/Warning Cards

```tsx
<Card className={highlight ? "border-warning/30" : ""}>
```

### TODO/Unimplemented Feature Cards

Mark unimplemented features visually:

```tsx
const TODO_CARD_STYLES = "border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50 cursor-not-allowed"
const TODO_ICON_BG = "bg-rose-500/10"
const TODO_ICON_COLOR = "text-rose-400"
```

---

## Icons

### Icon Colors

| Context | Color |
|---------|-------|
| Default/inactive | `text-muted-foreground` |
| On hover | `text-foreground` |
| Success state | `text-success` |
| In icon container | Match container state |

### Icon Sizes

| Size | Class | Use Case |
|------|-------|----------|
| Small | `h-4 w-4` | Inline with text, badges |
| Medium | `h-5 w-5` | Section headers, buttons |
| Large | `h-6 w-6` | Card icons, feature highlights |
| XL | `h-8 w-8` or `h-12 w-12` | Hero sections, empty states |

---

## Animation & Transitions

Keep transitions subtle and quick:

```css
transition-colors     /* For color changes */
transition-all        /* For multi-property changes */
duration-200          /* Default timing */
ease-in-out          /* Default easing */
```

Avoid animations that:
- Last longer than 300ms
- Move elements unexpectedly
- Distract from content

---

## Accessibility Notes

1. **Color Contrast** — Ensure text meets WCAG AA standards
2. **Focus States** — All interactive elements must have visible focus rings
3. **Touch Targets** — Minimum 44x44px for mobile tap targets
4. **Screen Readers** — Use proper ARIA labels and semantic HTML

---

## File Reference

| File | Purpose |
|------|---------|
| `frontend/src/app/globals.css` | CSS variables, theme tokens |
| `frontend/src/components/ui/button.tsx` | Button variants |
| `frontend/src/components/ui/badge.tsx` | Badge variants |
| `frontend/src/components/ui/input.tsx` | Input with date/time type handling |
| `frontend/src/components/ui/datetime-input.tsx` | Styled datetime-local input for admin forms |
| `frontend/src/components/dashboard/dashboard-cards.tsx` | Reusable dashboard components |
| `frontend/src/lib/utils.ts` | `cn()` utility for class merging |

---

## Quick Reference: Muted Success Theme

For admin/staff dashboards, use this consistent pattern:

```
Background hover:     bg-success/10 → bg-success/20 → bg-success/30
Icon container hover: bg-muted → bg-success/30
Active tab:          bg-success/40
Button:              variant="success" (bg-success/60)
Text:                ALWAYS text-foreground
Icons:               text-muted-foreground → text-foreground on hover
```
