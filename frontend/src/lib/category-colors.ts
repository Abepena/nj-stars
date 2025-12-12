/**
 * Centralized category color system for consistent styling across the app.
 * Used for product categories, event types, and news/blog tags.
 */

export const CATEGORY_COLORS: Record<string, { active: string; inactive: string }> = {
  // Event types
  tryout: {
    active: "bg-accent/30 text-accent font-medium border border-accent/70",
    inactive: "bg-accent/8 text-accent/70 border border-accent/25 hover:bg-accent/12",
  },
  camp: {
    active: "bg-secondary/30 text-secondary font-medium border border-secondary/70",
    inactive: "bg-secondary/8 text-secondary/70 border border-secondary/25 hover:bg-secondary/12",
  },
  tournament: {
    active: "bg-tertiary/30 text-tertiary font-medium border border-tertiary/70",
    inactive: "bg-tertiary/8 text-tertiary/70 border border-tertiary/25 hover:bg-tertiary/12",
  },
  practice: {
    active: "bg-info/30 text-info font-medium border border-info/70",
    inactive: "bg-info/8 text-info/70 border border-info/25 hover:bg-info/12",
  },
  game: {
    active: "bg-success/30 text-success font-medium border border-success/70",
    inactive: "bg-success/8 text-success/70 border border-success/25 hover:bg-success/12",
  },
  open_gym: {
    active: "bg-warning/30 text-warning font-medium border border-warning/70",
    inactive: "bg-warning/8 text-warning/70 border border-warning/25 hover:bg-warning/12",
  },

  // News/content types
  blog: {
    active: "bg-primary/30 text-primary font-medium border border-primary/70",
    inactive: "bg-primary/8 text-primary/70 border border-primary/25 hover:bg-primary/12",
  },
  instagram: {
    active: "bg-accent/30 text-accent font-medium border border-accent/70",
    inactive: "bg-accent/8 text-accent/70 border border-accent/25 hover:bg-accent/12",
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
