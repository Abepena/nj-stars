# NJ Stars Elite - Design Direction
## Claude-Inspired Paper UI with Athletic Edge

> **Brand Philosophy**: Combine the bold, competitive spirit of AAU basketball with the sophistication and readability of Claude's paper-like interface.

---

## 🎨 Color Palette

### Primary Colors (Muted for Paper Feel)

**Jersey Red (Muted for Dark Mode)**
```css
--primary-red: #c13847;           /* Muted jersey red - primary brand accent */
--primary-red-hover: #d4233d;     /* Brighter on hover - closer to actual jersey */
--primary-red-muted: #8a2a35;     /* Even more muted for subtle elements */
```

**Neutrals (Claude-Inspired Paper)**
```css
/* Dark mode (default) - Warm paper tones */
--bg-primary: #1a1614;            /* Deep warm black - main background */
--bg-secondary: #231f1d;          /* Slightly lighter - cards, panels */
--bg-tertiary: #2d2927;           /* Elevated surfaces - hover states */

--text-primary: #e8e3df;          /* Warm off-white - main text */
--text-secondary: #b8b0a8;        /* Muted warm gray - secondary text */
--text-tertiary: #8a8479;         /* Subtle warm gray - labels, captions */

--border-subtle: #3a3531;         /* Warm dark borders */
--border-default: #4a443f;        /* Standard borders */
```

**Accent Colors**
```css
--accent-gold: #d4a574;           /* Warm gold for highlights, awards */
--accent-blue: #5b8fb9;           /* Muted blue for links, info */
--success: #6b9a7e;               /* Muted green - payment success */
--warning: #c4904f;               /* Warm orange - warnings */
--error: #c13847;                 /* Use primary red for errors */
```

### Light Mode (Future)
```css
/* Light mode - Cream paper aesthetic */
--bg-primary-light: #f9f7f4;      /* Warm cream - paper texture */
--bg-secondary-light: #f0ece7;    /* Slightly darker cream */
--text-primary-light: #2d2927;    /* Dark warm gray */
/* ... (to be defined when implementing light mode) */
```

---

## 📐 Typography

### Font Stack
```css
/* Primary - Clean, athletic, readable */
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif;

/* Display - Headers, hero text */
--font-display: 'Inter', -apple-system, system-ui, sans-serif;
font-weight: 700-900 (Bold to Black)
letter-spacing: -0.02em (tight for impact)

/* Body - Comfortable reading */
--font-body: -apple-system, system-ui, sans-serif;
font-weight: 400-500 (Regular to Medium)
line-height: 1.6-1.8 (relaxed, Claude-like)

/* Mono - Order numbers, stats */
--font-mono: 'SF Mono', 'Roboto Mono', 'Courier New', monospace;
```

### Type Scale (Fluid, responsive)
```css
--text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);    /* 12-14px */
--text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);      /* 14-16px */
--text-base: clamp(1rem, 0.95rem + 0.5vw, 1.125rem);     /* 16-18px */
--text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);     /* 18-20px */
--text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);      /* 20-24px */
--text-2xl: clamp(1.5rem, 1.3rem + 1vw, 2rem);           /* 24-32px */
--text-3xl: clamp(2rem, 1.5rem + 2vw, 3rem);             /* 32-48px */
--text-4xl: clamp(2.5rem, 2rem + 2.5vw, 4rem);           /* 40-64px */
```

---

## 🎯 Design Principles

### 1. **Paper-Like Depth** (Claude-Inspired)
- Subtle shadows, no harsh blacks
- Layered cards with soft elevation
- Warm, organic feel despite digital medium

```css
/* Elevation system */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.15);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.2),
             0 2px 4px -1px rgba(0, 0, 0, 0.12);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.25),
             0 4px 6px -2px rgba(0, 0, 0, 0.15);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.3),
             0 10px 10px -5px rgba(0, 0, 0, 0.15);
```

### 2. **Athletic Edge**
- Bold typography for impact
- Sharp corners with subtle rounding (4-8px)
- Confident, decisive interactions
- High-contrast CTAs (red buttons pop)

### 3. **Readability First**
- Generous line-height (1.6-1.8)
- Comfortable font sizes (16px base minimum)
- Clear visual hierarchy
- Ample whitespace

### 4. **Purposeful Animation**
- Subtle, smooth (200-300ms)
- Easing: cubic-bezier(0.4, 0.0, 0.2, 1)
- No gratuitous effects
- Enhance, don't distract

---

## 🧩 Component Examples

### Buttons

**Primary (CTA) - Jersey Red**
```css
.btn-primary {
  background: linear-gradient(135deg, #c13847 0%, #b8303f 100%);
  color: #fff;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(193, 56, 71, 0.2);
  transition: all 200ms ease;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #d4233d 0%, #c13847 100%);
  box-shadow: 0 4px 8px rgba(193, 56, 71, 0.3);
  transform: translateY(-1px);
}
```

**Secondary - Outlined**
```css
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1.5px solid var(--border-default);
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 200ms ease;
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
  border-color: var(--primary-red-muted);
}
```

### Cards (Paper-like)

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: all 250ms cubic-bezier(0.4, 0.0, 0.2, 1);
}

.card:hover {
  background: var(--bg-tertiary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* Elevated cards (featured content) */
.card-elevated {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-lg);
}
```

### Typography Examples

**Hero Heading**
```css
.hero-title {
  font-size: var(--text-4xl);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  background: linear-gradient(135deg,
    var(--text-primary) 0%,
    var(--primary-red) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

**Body Text**
```css
.body-text {
  font-size: var(--text-base);
  line-height: 1.7;
  color: var(--text-secondary);
  font-weight: 400;
}
```

**Label/Caption**
```css
.label {
  font-size: var(--text-sm);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
}
```

---

## 📱 Layout Patterns

### Container Widths
```css
--container-sm: 640px;   /* Forms, focused content */
--container-md: 768px;   /* Blog posts, articles */
--container-lg: 1024px;  /* Standard pages */
--container-xl: 1280px;  /* Wide layouts, dashboards */
--container-2xl: 1536px; /* Full-width sections */
```

### Spacing Scale (Consistent rhythm)
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.5rem;    /* 24px */
--space-6: 2rem;      /* 32px */
--space-8: 3rem;      /* 48px */
--space-10: 4rem;     /* 64px */
--space-12: 6rem;     /* 96px */
--space-16: 8rem;     /* 128px */
```

### Grid System
```css
/* 12-column responsive grid */
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-6);
}

/* Example: 3-column product grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-6);
}
```

---

## 🎨 Visual Examples

### Homepage Hero Section
```
┌─────────────────────────────────────────────────────────┐
│ [Nav: Logo - Events - Shop - Team - Sign In]            │ ← --bg-primary, subtle border
├─────────────────────────────────────────────────────────┤
│                                                          │
│         NJ STARS ELITE AAU                              │ ← --text-4xl, gradient effect
│         Building Champions                               │ ← --text-xl, --text-secondary
│         On and Off the Court                            │
│                                                          │
│         [Register for Tryouts →]                        │ ← .btn-primary (red)
│         [View Schedule]                                  │ ← .btn-secondary
│                                                          │
│ [Background: Subtle basketball court pattern, dark]     │ ← --bg-secondary with texture
└─────────────────────────────────────────────────────────┘
```

### Event Card
```
┌──────────────────────────────────────┐
│ TRYOUT                               │ ← label (red accent)
│                                      │
│ Winter Tryouts 2025                  │ ← --text-xl, bold
│ Dec 15, 2024 • 6:00 PM              │ ← --text-sm, muted
│ Bergen County Sports Complex         │
│                                      │
│ Open spots: 12 / 30                  │ ← Progress bar (red)
│                                      │
│ [Register Now]                       │ ← .btn-primary
└──────────────────────────────────────┘
← .card with :hover elevation
```

### Product Card (Merch)
```
┌──────────────────────────────┐
│ [Jersey Image]               │ ← High-quality product photo
│ ┌──────────┐                │
│ │ FEATURED │                 │ ← Badge (gold accent)
│ └──────────┘                │
│                              │
│ NJ Stars Home Jersey         │ ← --text-lg, bold
│ $65.00                       │ ← --text-2xl, primary color
│                              │
│ Available in: S, M, L, XL    │ ← --text-sm, muted
│                              │
│ [Add to Cart]                │ ← .btn-primary
└──────────────────────────────┘
```

---

## 🏀 Brand Integration

### Logo Usage
- **Header**: Simplified logo (just basketball + "NJ STARS" text)
- **Footer**: Full logo with "ELITE BASKETBALL" tagline
- **Always on dark backgrounds** for primary brand presence
- White version on very dark backgrounds
- Red accent can be swapped to jersey red (#c13847)

### Basketball Court Pattern (Subtle)
```css
/* Subtle background pattern for hero sections */
.hero-pattern {
  background-image:
    linear-gradient(var(--bg-primary) 0%, var(--bg-secondary) 100%),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 50px,
      rgba(193, 56, 71, 0.03) 50px,
      rgba(193, 56, 71, 0.03) 51px
    );
}
```

### Photo Treatment
- High-contrast, action shots
- Slight warm color grade
- Vignette effect on hero images
- Maintain energy and athleticism

---

## ⚡ Interaction Patterns

### Hover States
- **Links**: Underline + red color
- **Buttons**: Slight lift (translateY) + shadow increase
- **Cards**: Elevation increase + subtle background change
- **Images**: Scale (1.05) + brightness increase

### Loading States
```css
/* Skeleton screens - Claude-inspired */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 0%,
    var(--bg-tertiary) 50%,
    var(--bg-secondary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Focus States (Accessibility)
```css
:focus-visible {
  outline: 2px solid var(--primary-red);
  outline-offset: 2px;
  border-radius: 4px;
}
```

---

## 📐 Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#c13847',
          hover: '#d4233d',
          muted: '#8a2a35',
        },
        bg: {
          primary: '#1a1614',
          secondary: '#231f1d',
          tertiary: '#2d2927',
        },
        text: {
          primary: '#e8e3df',
          secondary: '#b8b0a8',
          tertiary: '#8a8479',
        },
        border: {
          subtle: '#3a3531',
          DEFAULT: '#4a443f',
        },
        accent: {
          gold: '#d4a574',
          blue: '#5b8fb9',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Roboto Mono', 'monospace'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.15)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.12)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.15)',
      }
    }
  }
}
```

---

## 🎯 Implementation Priority

### Phase 1: Core Styles (Now)
1. ✅ Color system defined
2. ✅ Typography scale
3. ✅ Spacing system
4. ⏳ Base Tailwind config
5. ⏳ Button components
6. ⏳ Card components

### Phase 2: Layout (Next)
1. Navigation
2. Footer
3. Page containers
4. Grid systems

### Phase 3: Page Templates
1. Homepage
2. Events listing
3. Shop/Products
4. Team roster
5. Portal/Dashboard

---

## 🔍 Design Rationale

### Why Jersey Red (#c13847 muted from #d4233d)?
- **Authenticity**: Matches actual team jerseys in photos
- **Sophistication**: Muted version fits paper aesthetic better than hot pink
- **Versatility**: Works well in both UI accents and photography
- **Maturity**: More refined than bright magenta, appeals to parents/admins

### Why Dark Mode Default?
- **Focus**: Less eye strain for evening browsing (when parents research)
- **Premium Feel**: Sophisticated, modern
- **Brand Alignment**: Black is primary brand color (jerseys, logo backgrounds)
- **Claude Inspiration**: User preference + proven readability

### Why Paper Texture?
- **Warmth**: Athletic brands can feel cold/corporate
- **Comfort**: Inviting for extended reading (articles, team info)
- **Uniqueness**: Differentiates from typical sports sites
- **Trust**: Sophisticated design builds credibility

---

## ✅ Approval Checklist

Before proceeding to Phase 4 (Wagtail CMS), please confirm:

- [ ] **Color Palette**: Jersey red (#c13847) + warm neutrals approved?
- [ ] **Typography**: Clean sans-serif with bold display weights?
- [ ] **Dark Mode**: Warm paper aesthetic as default?
- [ ] **Component Style**: Subtle shadows, soft edges, confident buttons?
- [ ] **Logo Integration**: How should we handle logo color? Keep pink or adjust to jersey red?

---

## 🚀 Next Steps (After Approval)

1. **Create base Tailwind configuration** in frontend
2. **Build component library** (buttons, cards, forms)
3. **Implement Wagtail CMS** with design system
4. **Create page templates** with new styles
5. **Test accessibility** (WCAG AA minimum)

---

**Design Goal**: A premium AAU basketball platform that feels as polished and thoughtful as Claude, while maintaining the energy and competitive edge of NJ Stars Elite.
