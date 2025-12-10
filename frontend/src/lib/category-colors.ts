/**
 * Centralized category color system for consistent styling across the app.
 * Used for product categories, event types, and news/blog tags.
 */

export const CATEGORY_COLORS: Record<string, { active: string; inactive: string }> = {
  // Product categories
  jersey: {
    active: "bg-accent/25 text-accent border border-accent/60",
    inactive: "bg-accent/8 text-accent/80 border border-accent/25 hover:bg-accent/12",
  },
  apparel: {
    active: "bg-secondary/25 text-secondary border border-secondary/60",
    inactive: "bg-secondary/8 text-secondary/80 border border-secondary/25 hover:bg-secondary/12",
  },
  accessories: {
    active: "bg-tertiary/25 text-tertiary border border-tertiary/60",
    inactive: "bg-tertiary/8 text-tertiary/80 border border-tertiary/25 hover:bg-tertiary/12",
  },
  equipment: {
    active: "bg-info/25 text-info border border-info/60",
    inactive: "bg-info/8 text-info/80 border border-info/25 hover:bg-info/12",
  },

  // Event types
  tryout: {
    active: "bg-accent/25 text-accent border border-accent/60",
    inactive: "bg-accent/8 text-accent/80 border border-accent/25 hover:bg-accent/12",
  },
  camp: {
    active: "bg-secondary/25 text-secondary border border-secondary/60",
    inactive: "bg-secondary/8 text-secondary/80 border border-secondary/25 hover:bg-secondary/12",
  },
  tournament: {
    active: "bg-tertiary/25 text-tertiary border border-tertiary/60",
    inactive: "bg-tertiary/8 text-tertiary/80 border border-tertiary/25 hover:bg-tertiary/12",
  },
  practice: {
    active: "bg-info/25 text-info border border-info/60",
    inactive: "bg-info/8 text-info/80 border border-info/25 hover:bg-info/12",
  },
  game: {
    active: "bg-success/25 text-success border border-success/60",
    inactive: "bg-success/8 text-success/80 border border-success/25 hover:bg-success/12",
  },
  open_gym: {
    active: "bg-warning/25 text-warning border border-warning/60",
    inactive: "bg-warning/8 text-warning/80 border border-warning/25 hover:bg-warning/12",
  },

  // News/content types
  blog: {
    active: "bg-primary/25 text-primary border border-primary/60",
    inactive: "bg-primary/8 text-primary/80 border border-primary/25 hover:bg-primary/12",
  },
  instagram: {
    active: "bg-accent/25 text-accent border border-accent/60",
    inactive: "bg-accent/8 text-accent/80 border border-accent/25 hover:bg-accent/12",
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
