/**
 * Centralized category color system for consistent styling across the app.
 * Used for product categories, event types, and news/blog tags.
 */

export const CATEGORY_COLORS: Record<string, { active: string; inactive: string }> = {
  // Product categories
  jersey: {
    active: "bg-accent/15 text-accent border border-accent/30",
    inactive: "bg-accent/5 text-accent/70 border border-accent/20 hover:bg-accent/10",
  },
  apparel: {
    active: "bg-secondary/15 text-secondary border border-secondary/30",
    inactive: "bg-secondary/5 text-secondary/70 border border-secondary/20 hover:bg-secondary/10",
  },
  accessories: {
    active: "bg-tertiary/15 text-tertiary border border-tertiary/30",
    inactive: "bg-tertiary/5 text-tertiary/70 border border-tertiary/20 hover:bg-tertiary/10",
  },
  equipment: {
    active: "bg-info/15 text-info border border-info/30",
    inactive: "bg-info/5 text-info/70 border border-info/20 hover:bg-info/10",
  },

  // Event types
  tryout: {
    active: "bg-accent/15 text-accent border border-accent/30",
    inactive: "bg-accent/5 text-accent/70 border border-accent/20 hover:bg-accent/10",
  },
  camp: {
    active: "bg-secondary/15 text-secondary border border-secondary/30",
    inactive: "bg-secondary/5 text-secondary/70 border border-secondary/20 hover:bg-secondary/10",
  },
  tournament: {
    active: "bg-tertiary/15 text-tertiary border border-tertiary/30",
    inactive: "bg-tertiary/5 text-tertiary/70 border border-tertiary/20 hover:bg-tertiary/10",
  },
  practice: {
    active: "bg-info/15 text-info border border-info/30",
    inactive: "bg-info/5 text-info/70 border border-info/20 hover:bg-info/10",
  },
  game: {
    active: "bg-success/15 text-success border border-success/30",
    inactive: "bg-success/5 text-success/70 border border-success/20 hover:bg-success/10",
  },
  open_gym: {
    active: "bg-warning/15 text-warning border border-warning/30",
    inactive: "bg-warning/5 text-warning/70 border border-warning/20 hover:bg-warning/10",
  },

  // News/content types
  blog: {
    active: "bg-primary/15 text-primary border border-primary/30",
    inactive: "bg-primary/5 text-primary/70 border border-primary/20 hover:bg-primary/10",
  },
  instagram: {
    active: "bg-accent/15 text-accent border border-accent/30",
    inactive: "bg-accent/5 text-accent/70 border border-accent/20 hover:bg-accent/10",
  },
}

const DEFAULT_COLORS = {
  active: "bg-muted text-foreground border border-border",
  inactive: "bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50",
}

/**
 * Get the appropriate color classes for a category based on active state.
 * @param category - The category key (e.g., 'jersey', 'tryout', 'blog')
 * @param isActive - Whether the category is currently selected/active
 * @returns Tailwind CSS classes for the category styling
 */
export function getCategoryColor(category: string, isActive: boolean = false): string {
  const colorSet = CATEGORY_COLORS[category.toLowerCase()] || DEFAULT_COLORS
  return isActive ? colorSet.active : colorSet.inactive
}

/**
 * Get the badge color classes for a category (always returns active styling).
 * Use this for static badges that don't have an active/inactive state.
 * @param category - The category key
 * @returns Tailwind CSS classes for badge styling
 */
export function getCategoryBadgeColor(category: string): string {
  return getCategoryColor(category, true)
}
