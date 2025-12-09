"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface FilterCategory {
  value: string
  label: string
  count?: number
}

export interface FilterSidebarProps {
  /** Page title for the sidebar header */
  title?: string
  /** Search input placeholder */
  searchPlaceholder?: string
  /** Current search query value */
  searchQuery: string
  /** Callback when search changes */
  onSearchChange: (query: string) => void
  /** Available filter categories */
  categories: FilterCategory[]
  /** Currently selected category values */
  selectedCategories: string[]
  /** Callback when category selection changes */
  onCategoryToggle: (category: string) => void
  /** Callback to clear all filters */
  onClearFilters: () => void
  /** Total count of items */
  totalCount?: number
  /** Filtered count of items */
  filteredCount?: number
  /** Custom category color function */
  getCategoryColor?: (category: string, isActive: boolean) => string
  /** Additional class names */
  className?: string
}

// Default category colors
function defaultGetCategoryColor(category: string, isActive: boolean): string {
  const colors: Record<string, { active: string; inactive: string }> = {
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
    // News types
    blog: {
      active: "bg-primary/15 text-primary border border-primary/30",
      inactive: "bg-primary/5 text-primary/70 border border-primary/20 hover:bg-primary/10",
    },
    instagram: {
      active: "bg-accent/15 text-accent border border-accent/30",
      inactive: "bg-accent/5 text-accent/70 border border-accent/20 hover:bg-accent/10",
    },
  }
  const colorSet = colors[category] || {
    active: "bg-muted text-foreground border border-border",
    inactive: "bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50",
  }
  return isActive ? colorSet.active : colorSet.inactive
}

export function FilterSidebar({
  title,
  searchPlaceholder = "Search...",
  searchQuery,
  onSearchChange,
  categories,
  selectedCategories,
  onCategoryToggle,
  onClearFilters,
  totalCount,
  filteredCount,
  getCategoryColor = defaultGetCategoryColor,
  className,
}: FilterSidebarProps) {
  const hasActiveFilters = selectedCategories.length > 0 || searchQuery.length > 0
  const activeFilterCount = selectedCategories.length + (searchQuery ? 1 : 0)

  return (
    <aside
      className={cn(
        "w-full lg:w-64 lg:flex-shrink-0",
        className
      )}
    >
      <div className="lg:sticky lg:top-24 space-y-6">
        {/* Title */}
        {title && (
          <h2 className="text-lg font-semibold">{title}</h2>
        )}

        {/* Search */}
        <div>
          <label htmlFor="filter-search" className="sr-only">
            {searchPlaceholder}
          </label>
          <Input
            id="filter-search"
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Categories
          </h3>
          <div className="flex flex-wrap lg:flex-col gap-2">
            {categories.map((category) => {
              const isActive = selectedCategories.includes(category.value)
              return (
                <button
                  key={category.value}
                  onClick={() => onCategoryToggle(category.value)}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    "flex items-center justify-between gap-2",
                    "min-h-[40px]",
                    getCategoryColor(category.value, isActive)
                  )}
                  aria-label={`Filter by ${category.label}`}
                  aria-pressed={isActive}
                >
                  <span>{category.label}</span>
                  {category.count !== undefined && (
                    <span className="text-xs opacity-70">({category.count})</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Clear Filters ({activeFilterCount})
            </Button>

            {/* Results count */}
            {totalCount !== undefined && filteredCount !== undefined && (
              <p className="text-sm text-muted-foreground text-center">
                Showing {filteredCount} of {totalCount}
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
