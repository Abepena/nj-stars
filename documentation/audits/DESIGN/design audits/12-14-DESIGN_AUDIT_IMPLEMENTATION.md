# Design Audit Implementation Progress

> **Started:** December 14, 2025
> **Status:** Week 1 Pending
> **Reference:** `design_audit 12-14.html`
> **Previous Audit:** December 9, 2025 (11/11 Complete)

---

## Overall Progress

| Phase | Status | Tasks Complete | Total Tasks | Time Estimate |
|-------|--------|----------------|-------------|---------------|
| Week 1: Critical Accessibility | :hourglass: | 0/5 | 5 | ~2 hours |
| Week 2: High Priority UX | :hourglass: | 0/8 | 8 | ~1.5 hours |
| Week 3+: Medium/Low Priority | :hourglass: | 0/12 | 12 | ~2.5 hours |

**Total: 25 tasks, ~6 hours estimated**

---

## Week 1: Critical Accessibility Fixes

> **Priority:** CRITICAL - WCAG 2.1 AA Compliance
> **Estimated Time:** ~2 hours

### Task 1: Add ARIA Labels to Quantity Buttons
**Status:** :hourglass: Not Started
**Priority:** CRITICAL
**Estimated Time:** 15 min

**Files Modified:**
- [ ] `frontend/src/components/product-quick-view.tsx`

**Issue:**
Minus and plus buttons use Unicode characters only. Screen readers announce "button minus" instead of "Decrease quantity".

**Before:**
```tsx
// product-quick-view.tsx:421-437
<button
  onClick={() => setQuantity(q => Math.max(1, q - 1))}
  disabled={quantity <= 1}
  className="..."
>
  −
</button>
```

**After:**
```tsx
<button
  onClick={() => setQuantity(q => Math.max(1, q - 1))}
  disabled={quantity <= 1}
  aria-label={quantity <= 1 ? "Decrease quantity (minimum reached)" : "Decrease quantity"}
  className="..."
>
  −
</button>

{/* Also add aria-live to quantity display */}
<span aria-live="polite" aria-atomic="true">{quantity}</span>

<button
  onClick={() => setQuantity(q => q + 1)}
  aria-label="Increase quantity"
  className="..."
>
  +
</button>
```

---

### Task 2: Increase Size Selection Buttons to 48px
**Status:** :hourglass: Not Started
**Priority:** CRITICAL
**Estimated Time:** 20 min

**Files Modified:**
- [ ] `frontend/src/components/product-quick-view.tsx`
- [ ] `frontend/src/app/shop/[slug]/page.tsx`

**Issue:**
Size buttons use `min-w-[2.5rem] py-1.5` (40px) which is below WCAG 2.5 minimum of 44x44px.

**Before:**
```tsx
// product-quick-view.tsx:398-410
<button
  className={cn(
    "min-w-[2.5rem] px-3 py-1.5 rounded-md text-sm font-medium...",
  )}
>
```

**After:**
```tsx
<button
  className={cn(
    "min-w-[3rem] min-h-[3rem] px-4 py-2 rounded-md text-sm font-medium...",
  )}
>
```

---

### Task 3: Fix Color Swatch Labels and Hit Areas
**Status:** :hourglass: Not Started
**Priority:** CRITICAL
**Estimated Time:** 25 min

**Files Modified:**
- [ ] `frontend/src/components/product-quick-view.tsx`
- [ ] `frontend/src/app/shop/[slug]/page.tsx`

**Issue:**
Color swatches are 28px (below 44px minimum) and labels don't include hex codes or selection state.

**Before:**
```tsx
// product-quick-view.tsx:372-386
<button
  className={cn("w-7 h-7 rounded-full...")}
  aria-label={`Select ${color.name}`}
>
```

**After:**
```tsx
<button
  className={cn(
    "w-11 h-11 rounded-full flex items-center justify-center...",
    selectedColor === color.id && "ring-2 ring-primary ring-offset-2"
  )}
  aria-label={`Select ${color.name}${color.hex ? ` (#${color.hex})` : ''}`}
  aria-pressed={selectedColor === color.id}
>
  <span
    className="w-7 h-7 rounded-full"
    style={{ backgroundColor: color.hex || color.name }}
  />
</button>
```

---

### Task 4: Add Bag Count to Button ARIA Label
**Status:** :hourglass: Not Started
**Priority:** CRITICAL
**Estimated Time:** 10 min

**Files Modified:**
- [ ] `frontend/src/components/site-header.tsx`
- [ ] `frontend/src/components/mobile-nav.tsx`

**Issue:**
Shopping bag button shows visual badge but screen readers only hear "Shopping bag button".

**Before:**
```tsx
// site-header.tsx:112-116
<Button variant="ghost" size="icon" className="relative">
  <ShoppingBag className="h-5 w-5" />
  {itemCount > 0 && (
    <span className="absolute -top-1 -right-1 ...">
      {itemCount > 99 ? "99+" : itemCount}
    </span>
  )}
</Button>
```

**After:**
```tsx
<Button
  variant="ghost"
  size="icon"
  className="relative"
  aria-label={itemCount > 0 ? `Shopping bag with ${itemCount} items` : "Shopping bag (empty)"}
>
  <ShoppingBag className="h-5 w-5" />
  {itemCount > 0 && (
    <span className="absolute -top-1 -right-1 ..." aria-hidden="true">
      {itemCount > 99 ? "99+" : itemCount}
    </span>
  )}
</Button>
```

---

### Task 5: Implement Modal Focus Management
**Status:** :hourglass: Not Started
**Priority:** CRITICAL
**Estimated Time:** 45 min

**Files Modified:**
- [ ] `frontend/src/components/product-quick-view.tsx`
- [ ] `frontend/src/components/mobile-nav.tsx`

**Issue:**
QuickView modal and mobile nav sheet don't trap focus or set initial focus.

**Changes Needed:**

1. **QuickView Modal (product-quick-view.tsx:279-286)**
```tsx
<DialogContent
  aria-modal="true"
  onOpenAutoFocus={(e) => {
    // Focus the close button or first interactive element
    e.preventDefault();
    document.querySelector('[data-dialog-close]')?.focus();
  }}
>
```

2. **Mobile Nav Sheet (mobile-nav.tsx)**
- Add `aria-modal="true"` to Sheet content
- Ensure focus is trapped within the sheet when open
- Return focus to hamburger button on close

**Note:** If using Radix UI Dialog/Sheet, these may be partially handled, but verify with screen reader testing.

---

## Week 2: High Priority UX Improvements

> **Priority:** HIGH - Screen Reader Support & Touch Targets
> **Estimated Time:** ~1.5 hours

### Task 6: Add role="alert" to Error Messages
**Status:** :hourglass: Not Started
**Priority:** HIGH
**Estimated Time:** 10 min

**Files Modified:**
- [ ] `frontend/src/components/error-message.tsx`

**Before:**
```tsx
<div className="text-destructive ...">
  {errorMessage}
</div>
```

**After:**
```tsx
<div role="alert" aria-live="assertive" className="text-destructive ...">
  {errorMessage}
</div>
```

---

### Task 7: Fix Filter Count Badge Accessibility
**Status:** :hourglass: Not Started
**Priority:** HIGH
**Estimated Time:** 10 min

**Files Modified:**
- [ ] `frontend/src/components/filter-sidebar.tsx`

**Before:**
```tsx
// filter-sidebar.tsx:388-395
<Button>
  Filters {activeFilterCount > 0 && `[${activeFilterCount}]`}
</Button>
```

**After:**
```tsx
<Button
  aria-label={activeFilterCount > 0
    ? `Filters (${activeFilterCount} active)`
    : 'Filters'
  }
>
  Filters {activeFilterCount > 0 && <span aria-hidden="true">[{activeFilterCount}]</span>}
</Button>
```

---

### Task 8: Add Theme Toggle ARIA Label
**Status:** :hourglass: Not Started
**Priority:** HIGH
**Estimated Time:** 5 min

**Files Modified:**
- [ ] `frontend/src/components/mobile-nav.tsx`
- [ ] `frontend/src/components/site-header.tsx`

**After:**
```tsx
<Button
  onClick={toggleTheme}
  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
>
```

---

### Task 9: Add External Link Indicators
**Status:** :hourglass: Not Started
**Priority:** HIGH
**Estimated Time:** 20 min

**Files Modified:**
- [ ] `frontend/src/components/news-feed.tsx`
- [ ] `frontend/src/components/coaches-section.tsx`

**Changes:**
```tsx
// For all external links
<a
  href={url}
  target="_blank"
  rel="noopener noreferrer"
  title="Opens in new window"
  className="inline-flex items-center gap-1"
>
  {linkText}
  <ExternalLink className="w-3 h-3" aria-hidden="true" />
  <span className="sr-only">(opens in new window)</span>
</a>
```

---

### Task 10: Fix Category Filter Button Sizes
**Status:** :hourglass: Not Started
**Priority:** HIGH
**Estimated Time:** 15 min

**Files Modified:**
- [ ] `frontend/src/components/filter-sidebar.tsx`

**Before:**
```tsx
// filter-sidebar.tsx:219-252
<button className="px-3 py-2 ...">
```

**After:**
```tsx
<button className="px-4 py-3 min-h-[44px] ...">
```

---

### Task 11: Add Hero Video Fallback
**Status:** :hourglass: Not Started
**Priority:** HIGH
**Estimated Time:** 20 min

**Files Modified:**
- [ ] `frontend/src/components/hero.tsx`

**Changes:**
```tsx
<video
  autoPlay
  loop
  muted
  playsInline
  preload="metadata"
  poster="/images/hero-fallback.jpg"  // Add fallback image
  className="..."
>
  <source src="/videos/hero.mp4" type="video/mp4" />
  {/* Fallback for no video support */}
  <img src="/images/hero-fallback.jpg" alt="NJ Stars Elite Basketball" />
</video>
```

---

### Task 12: Fix Product Badge Touch Targets
**Status:** :hourglass: Not Started
**Priority:** HIGH
**Estimated Time:** 15 min

**Files Modified:**
- [ ] `frontend/src/app/shop/page.tsx`

**Before:**
```tsx
<span className="text-xs font-medium ...">Featured</span>
```

**After:**
```tsx
<span className="text-xs font-medium px-3 py-2 min-h-[44px] inline-flex items-center ...">
  Featured
</span>
```

---

### Task 13: Set Dialog Initial Focus
**Status:** :hourglass: Not Started
**Priority:** HIGH
**Estimated Time:** 15 min

**Files Modified:**
- [ ] `frontend/src/components/product-quick-view.tsx`

**Changes:**
```tsx
<DialogContent
  onOpenAutoFocus={(e) => {
    e.preventDefault();
    // Focus the close button for easy dismissal
    const closeButton = document.querySelector('[data-radix-collection-item]');
    closeButton?.focus();
  }}
>
```

---

## Week 3+: Medium & Low Priority

> **Priority:** MEDIUM/LOW - Polish & Maintainability
> **Estimated Time:** ~2.5 hours

### Task 14: Add Loading State Announcements
**Status:** :hourglass: Not Started
**Priority:** MEDIUM
**Estimated Time:** 20 min

**Files Modified:**
- [ ] `frontend/src/app/shop/page.tsx`
- [ ] `frontend/src/components/featured-merch.tsx`
- [ ] `frontend/src/components/news-feed.tsx`

**Changes:**
```tsx
{isLoading && (
  <div role="status" aria-label="Loading products">
    <span className="sr-only">Loading products...</span>
    <ProductCardSkeleton />
  </div>
)}
```

---

### Task 15: Create Shared ProductCard Component
**Status:** :hourglass: Not Started
**Priority:** MEDIUM
**Estimated Time:** 45 min

**Files Modified:**
- [ ] `frontend/src/components/product-card.tsx` (new)
- [ ] `frontend/src/components/featured-merch.tsx`
- [ ] `frontend/src/app/shop/page.tsx`

**Notes:**
Create a single ProductCard component with variant prop to handle different display modes (grid, featured, compact).

---

### Task 16: Fix Newsletter Error Announcements
**Status:** :hourglass: Not Started
**Priority:** MEDIUM
**Estimated Time:** 10 min

**Files Modified:**
- [ ] `frontend/src/components/newsletter-signup.tsx`

---

### Task 17: Fix Heading Hierarchy Issues
**Status:** :hourglass: Not Started
**Priority:** MEDIUM
**Estimated Time:** 15 min

**Files Modified:**
- [ ] `frontend/src/components/featured-merch.tsx`

---

### Task 18: Make Search Label Visible on Mobile
**Status:** :hourglass: Not Started
**Priority:** MEDIUM
**Estimated Time:** 10 min

**Files Modified:**
- [ ] `frontend/src/components/filter-sidebar.tsx`

---

### Task 19: Fix Hero Gradient Underline Visibility
**Status:** :hourglass: Not Started
**Priority:** MEDIUM
**Estimated Time:** 10 min

**Files Modified:**
- [ ] `frontend/src/components/hero.tsx`

---

### Task 20: Add Sticky Sidebar Visual Indicator
**Status:** :hourglass: Not Started
**Priority:** MEDIUM
**Estimated Time:** 15 min

**Files Modified:**
- [ ] `frontend/src/components/filter-sidebar.tsx`

---

### Task 21: Add aria-live to Add-to-Bag Button
**Status:** :hourglass: Not Started
**Priority:** LOW
**Estimated Time:** 10 min

**Files Modified:**
- [ ] `frontend/src/components/featured-merch.tsx`

---

### Task 22: Standardize Button Sizing
**Status:** :hourglass: Not Started
**Priority:** LOW
**Estimated Time:** 20 min

**Files Modified:**
- [ ] Various button usages throughout codebase

---

### Task 23: Add Hero Text Max Constraint
**Status:** :hourglass: Not Started
**Priority:** LOW
**Estimated Time:** 5 min

**Files Modified:**
- [ ] `frontend/src/components/hero.tsx`

---

### Task 24: Clarify Filter Apply Button
**Status:** :hourglass: Not Started
**Priority:** LOW
**Estimated Time:** 5 min

**Files Modified:**
- [ ] `frontend/src/components/filter-sidebar.tsx`

**Change:**
```tsx
// Change "Apply" to "Apply & Close"
<SheetClose>Apply & Close</SheetClose>
```

---

### Task 25: Fix "Almost Gone!" Badge Color Token
**Status:** :hourglass: Not Started
**Priority:** LOW
**Estimated Time:** 5 min

**Files Modified:**
- [ ] `frontend/src/app/shop/page.tsx`

**Change:**
```tsx
// Line 202: Change text-accent to text-warning
<span className="text-warning">Almost Gone!</span>
```

---

## Files Modified (Summary)

### Pending (15+ files)

**Critical (Week 1):**
1. [ ] `frontend/src/components/product-quick-view.tsx` - Tasks 1, 2, 3, 5, 13
2. [ ] `frontend/src/app/shop/[slug]/page.tsx` - Tasks 2, 3
3. [ ] `frontend/src/components/site-header.tsx` - Tasks 4, 8
4. [ ] `frontend/src/components/mobile-nav.tsx` - Tasks 4, 5, 8

**High (Week 2):**
5. [ ] `frontend/src/components/error-message.tsx` - Task 6
6. [ ] `frontend/src/components/filter-sidebar.tsx` - Tasks 7, 10, 18, 20, 24
7. [ ] `frontend/src/components/news-feed.tsx` - Task 9
8. [ ] `frontend/src/components/coaches-section.tsx` - Task 9
9. [ ] `frontend/src/components/hero.tsx` - Tasks 11, 19, 23
10. [ ] `frontend/src/app/shop/page.tsx` - Tasks 12, 14, 25

**Medium/Low (Week 3+):**
11. [ ] `frontend/src/components/product-card.tsx` (new) - Task 15
12. [ ] `frontend/src/components/featured-merch.tsx` - Tasks 14, 15, 17, 21
13. [ ] `frontend/src/components/newsletter-signup.tsx` - Task 16

---

## Impact Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| WCAG 2.1 AA Touch Targets | ~80% | ~98% | Better mobile accessibility |
| ARIA Labels Coverage | ~60% | ~95% | Screen reader support |
| Focus Management | Partial | Full | Keyboard navigation |
| Loading State Announcements | None | Present | Screen reader UX |
| Code Duplication | 2 ProductCards | 1 shared | DRY maintainability |

---

## Testing Checklist

After implementation, verify with:
- [ ] axe DevTools browser extension
- [ ] WAVE accessibility evaluation tool
- [ ] Keyboard-only navigation (Tab, Shift+Tab, Enter, Escape)
- [ ] Screen reader testing (VoiceOver on Mac, NVDA on Windows)
- [ ] Mobile device touch target testing
- [ ] Lighthouse accessibility audit (target: 95+)

---

## Notes

- Previous audit (Dec 9) achieved 11/11 completion - this is a continuation
- Focus is on ARIA accessibility and screen reader support
- The current styling is well-liked - these changes are functional, not visual
- Priority given to interactive elements (buttons, forms, modals)
- Testing with actual assistive technology recommended before marking complete

---

**Last Updated:** December 14, 2025
