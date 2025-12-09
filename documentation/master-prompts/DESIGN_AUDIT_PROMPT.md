# Master Prompt: Design Audit Generation

> **Purpose:** Generate a comprehensive `design_audit.html` report and `DESIGN_AUDIT_IMPLEMENTATION.md` checklist for any web project.
> **Last Updated:** December 9, 2025
> **Output Files:** `design_audit.html`, `DESIGN_AUDIT_IMPLEMENTATION.md`

---

## How to Use This Prompt

Copy the prompt below and customize the `[PROJECT_VARIABLES]` section with your project's specific details. The prompt will generate:

1. **design_audit.html** - A standalone HTML file with live rendered examples, before/after comparisons, and visual demonstrations of issues
2. **DESIGN_AUDIT_IMPLEMENTATION.md** - A markdown checklist with prioritized tasks, time estimates, and file-by-file implementation notes

---

## The Master Prompt

```
You are a senior UI/UX designer and accessibility expert conducting a comprehensive design audit. Generate two deliverables:

1. `design_audit.html` - A self-contained HTML file styled with Tailwind CDN that serves as an interactive audit report
2. `DESIGN_AUDIT_IMPLEMENTATION.md` - A markdown implementation checklist

## PROJECT VARIABLES (Customize These)

PROJECT_NAME: [Your project name, e.g., "NJ Stars Elite Basketball"]
TECH_STACK: [e.g., "Next.js 14, Tailwind CSS, shadcn/ui, TypeScript"]
BRAND_COLORS: [List your brand color palette with HSL/HEX values]
  - Primary: [color and use case]
  - Secondary: [color and use case]
  - Accent: [color and use case]
  - Background: [dark/light mode colors]
  - Text: [primary, secondary, muted text colors]
FONT_FAMILY: [Primary font, e.g., "Inter, system-ui, sans-serif"]
TARGET_AUDIENCE: [e.g., "Parents of youth basketball players, ages 30-50"]
MOBILE_PRIORITY: [e.g., "60%+ expected mobile traffic"]
KEY_PAGES_TO_AUDIT: [List 3-5 main pages]
  - [Page 1]
  - [Page 2]
  - [Page 3]
KEY_COMPONENTS_TO_AUDIT: [List 5-10 components]
  - [Component 1]
  - [Component 2]

## AUDIT CATEGORIES

Analyze the project across these categories:

### 1. Accessibility (WCAG 2.1 AA Compliance)
- Form input labels and ARIA attributes
- Touch target sizes (minimum 44x44px)
- Color contrast ratios (4.5:1 for text, 3:1 for UI)
- Focus states and keyboard navigation
- Screen reader compatibility
- Skip links and bypass blocks
- Alt text for images
- Error state announcements

### 2. UI Polish & Aesthetics
- Typography hierarchy (font sizes, weights, line-heights)
- Color consistency (design tokens vs hardcoded values)
- Whitespace and spacing rhythm
- Shadow and elevation system
- Border radius consistency
- Icon sizing and alignment
- Animation and transition timing

### 3. UX & Usability
- Navigation clarity and information architecture
- Breadcrumb navigation
- Loading states (spinners vs skeletons)
- Error handling and empty states
- Call-to-action hierarchy
- Form validation feedback
- Mobile responsiveness
- Touch gestures on mobile

### 4. Design System Consistency
- Component variants usage
- Color token adoption
- Spacing scale adherence
- Typography scale usage
- Button style consistency
- Card layout patterns
- Icon style consistency

### 5. Performance UX
- Perceived performance (skeleton loaders)
- Image optimization (lazy loading, srcset)
- Above-the-fold content priority
- Animation jank prevention

## DESIGN_AUDIT.HTML STRUCTURE

Generate an HTML file with these sections:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[PROJECT_NAME] - UI/UX Design Audit Report</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* Include project's CSS variables/design tokens */
    :root {
      /* Copy project's color system here */
    }

    /* Custom styles for audit report */
    /* Priority badges, comparison grids, etc. */
  </style>
</head>
<body>
  <!-- 1. Header with project name and date -->

  <!-- 2. Table of Contents -->

  <!-- 3. Executive Summary -->
  <!-- - 3 critical friction points with impact metrics -->
  <!-- - Audit metrics (critical/high/medium/low counts) -->

  <!-- 4. UI Polish & Aesthetics Section -->
  <!-- - Typography analysis -->
  <!-- - Color palette review -->
  <!-- - Spacing/whitespace audit -->

  <!-- 5. UX & Usability Section -->
  <!-- - Navigation review -->
  <!-- - Accessibility audit (passing/failing checklist) -->
  <!-- - CTA effectiveness -->
  <!-- - Mobile responsiveness -->

  <!-- 6. "Show, Don't Tell" Gallery -->
  <!-- CRITICAL: This section contains LIVE RENDERED examples -->
  <!-- Each issue shows Before (current) and After (recommended) -->
  <!-- Include actual styled components users can interact with -->

  <!-- Example pattern for each issue: -->
  <div class="comparison-grid">
    <div class="before">
      <!-- Actual component showing the problem -->
      <!-- e.g., small touch targets, missing labels -->
    </div>
    <div class="after">
      <!-- Fixed component showing the solution -->
      <!-- e.g., 44px buttons, proper labels -->
    </div>
  </div>

  <!-- 7. Recommendations Roadmap -->
  <!-- Week 1: Critical fixes (accessibility, legal compliance) -->
  <!-- Week 2-3: Design system consolidation -->
  <!-- Week 4+: Polish and enhancements -->

  <!-- 8. Summary table with time estimates -->

  <!-- Footer with scroll-to-top button -->
</body>
</html>
```

## DESIGN_AUDIT_IMPLEMENTATION.MD STRUCTURE

```markdown
# Design Audit Implementation Progress

> **Started:** [Date]
> **Status:** [Phase] In Progress
> **Reference:** `design_audit.html`

---

## Overall Progress

| Phase | Status | Tasks Complete | Total Tasks | Time Spent |
|-------|--------|----------------|-------------|------------|
| Week 1: Critical Fixes | ⏳ | 0/X | X | 0 hours |
| Week 2-3: Design System | ⏳ | 0/X | X | 0 hours |
| Week 4+: Polish | ⏳ | 0/X | X | 0 hours |

---

## Week 1: Critical Accessibility Fixes

> **Priority:** CRITICAL - Legal Compliance
> **Estimated Time:** X hours

### Task 1: [Task Name]
**Status:** ⏳ Not Started
**Files Modified:**
- [ ] `path/to/file1.tsx`
- [ ] `path/to/file2.tsx`

**Changes:**
- [Describe specific changes needed]

**Before:**
```tsx
// Current problematic code
```

**After:**
```tsx
// Fixed code
```

---

[Repeat for each task...]

---

## Files Modified (Summary)

### Completed (X files)
1. [file1.tsx]
2. [file2.tsx]

### Pending (X files)
1. [ ] [file3.tsx]

---

## Impact Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| WCAG Compliance | ❌ | ✅ | Legal compliance |
| Touch Target Success | ~60% | ~95% | +35% mobile UX |
| [etc.] | | | |
```

## IMPORTANT GUIDELINES

1. **Live Examples Required**: The HTML file MUST contain actual rendered components showing issues and fixes, not just descriptions. Users should be able to interact with (hover, focus, click) the examples.

2. **Use Project's Design Tokens**: Extract the project's actual CSS variables and use them in the audit HTML to show authentic comparisons.

3. **Prioritize by Impact**:
   - CRITICAL: Accessibility/legal issues
   - HIGH: UX friction causing user drop-off
   - MEDIUM: Design consistency issues
   - LOW: Polish and nice-to-haves

4. **Include Time Estimates**: Every task should have a realistic time estimate to help with planning.

5. **File-Specific Guidance**: Name the exact files that need modification and show before/after code snippets.

6. **Business Impact**: Connect each issue to business outcomes (conversions, user retention, legal risk).

## DELIVERABLES

After analysis, create these two files:

1. `/design_audit.html` - In project root
2. `/documentation/DESIGN_AUDIT_IMPLEMENTATION.md` - In documentation folder

Both files should be immediately usable - the HTML viewable in a browser, the markdown trackable as you implement fixes.
```

---

## Example Usage

### Step 1: Read your project's key files

Before running the prompt, read:
- `globals.css` or `tailwind.config.js` (design tokens)
- Key page files you want audited
- Component files (buttons, cards, forms)

### Step 2: Customize the variables

```
PROJECT_NAME: "My SaaS App"
TECH_STACK: "React 18, Tailwind CSS, Radix UI"
BRAND_COLORS:
  - Primary: hsl(221, 83%, 53%) - Blue - CTAs
  - Secondary: hsl(280, 85%, 65%) - Purple - Accents
  - Background: hsl(220, 13%, 10%) - Dark slate
  - Text Primary: hsl(0, 0%, 95%) - Off-white
KEY_PAGES_TO_AUDIT:
  - Homepage
  - Dashboard
  - Settings
  - Checkout
```

### Step 3: Run the prompt

Provide the customized prompt along with the files you've read, and the AI will generate both deliverables.

---

## Checklist Items Typically Found

### Accessibility (Usually ~5-8 issues)
- [ ] Missing form labels
- [ ] Touch targets below 44px
- [ ] Contrast failures
- [ ] Missing skip links
- [ ] Hover-only interactions on mobile
- [ ] Missing ARIA labels on buttons/icons

### Design System (Usually ~4-6 issues)
- [ ] Hardcoded colors instead of tokens
- [ ] Inconsistent button styles
- [ ] Fixed heights breaking mobile
- [ ] Repeated gradient patterns (not DRY)

### UX Polish (Usually ~6-10 items)
- [ ] Spinners instead of skeletons
- [ ] Missing breadcrumbs
- [ ] No empty states
- [ ] Missing loading states
- [ ] No error boundaries
- [ ] Missing "clear filters" option

---

## Tips for Best Results

1. **Read the actual code**: Don't just describe what you think is there - read the actual component files to find real issues.

2. **Test on mobile**: Many issues only appear at small viewport sizes. Check responsive behavior.

3. **Use browser dev tools**: Check actual contrast ratios, computed styles, and accessibility tree.

4. **Prioritize ruthlessly**: Week 1 should be ONLY critical/legal issues. Don't overload it.

5. **Make it actionable**: Every issue should have a clear fix with code example.

---

**Created by:** Claude Code
**Version:** 1.0
**Last Updated:** December 9, 2025
