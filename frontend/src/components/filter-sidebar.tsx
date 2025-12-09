"use client"

import { useState } from "react"
import { X, SlidersHorizontal, Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { getCategoryColor as getCentralizedCategoryColor } from "@/lib/category-colors"

export interface FilterCategory {
  value: string
  label: string
  count?: number
}

export interface FilterTag {
  value: string
  label: string
  count?: number
  color?: string
}

export interface FilterColor {
  name: string
  hex: string
}

export type SortOption = "featured" | "newest" | "price_high" | "price_low"

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
  /** Available filter tags (Featured, Best Seller, Sale, etc.) */
  tags?: FilterTag[]
  /** Currently selected tag values */
  selectedTags?: string[]
  /** Callback when tag selection changes */
  onTagToggle?: (tag: string) => void
  /** Available colors for filtering */
  colors?: FilterColor[]
  /** Selected color names */
  selectedColors?: string[]
  /** Callback when color selection changes */
  onColorToggle?: (color: string) => void
  /** Sort option */
  sortBy?: SortOption
  /** Callback when sort changes */
  onSortChange?: (sort: SortOption) => void
  /** Callback to clear all filters */
  onClearFilters: () => void
  /** Total count of items */
  totalCount?: number
  /** Filtered count of items */
  filteredCount?: number
  /** Custom category color function */
  getCategoryColor?: (category: string, isActive: boolean) => string
  /** Show visible label for search input (default: false, sr-only) */
  showSearchLabel?: boolean
  /** Additional class names */
  className?: string
}

// Default category colors - uses centralized color system
const defaultGetCategoryColor = getCentralizedCategoryColor

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price_high", label: "Price: High-Low" },
  { value: "price_low", label: "Price: Low-High" },
]

// Collapsible section component
function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 text-sm font-semibold hover:text-muted-foreground transition-colors"
        aria-expanded={isOpen}
      >
        {title}
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            isOpen ? "rotate-180" : ""
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {children}
      </div>
    </div>
  )
}

// Filter content shared between desktop sidebar and mobile drawer
function FilterContent({
  searchPlaceholder,
  searchQuery,
  onSearchChange,
  categories,
  selectedCategories,
  onCategoryToggle,
  tags,
  selectedTags = [],
  onTagToggle,
  colors,
  selectedColors = [],
  onColorToggle,
  sortBy,
  onSortChange,
  getCategoryColor = defaultGetCategoryColor,
  showSearchLabel = false,
  isMobile = false,
}: Omit<FilterSidebarProps, 'title' | 'onClearFilters' | 'totalCount' | 'filteredCount' | 'className'> & { isMobile?: boolean }) {
  return (
    <div className={cn("space-y-4", isMobile && "pb-24")}>
      {/* Sort By - Mobile drawer style */}
      {onSortChange && (
        <CollapsibleSection title="Sort By" defaultOpen={isMobile}>
          <div className="space-y-1 pt-2">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={cn(
                  "w-full flex items-center justify-between py-2 text-sm transition-colors",
                  sortBy === option.value
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-3">
                  <span className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    sortBy === option.value ? "border-foreground" : "border-muted-foreground"
                  )}>
                    {sortBy === option.value && (
                      <span className="w-2 h-2 rounded-full bg-foreground" />
                    )}
                  </span>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {onSortChange && <Separator />}

      {/* Search */}
      {!isMobile && (
        <div>
          <label
            htmlFor="filter-search"
            className={showSearchLabel ? "text-sm text-muted-foreground mb-1.5 block" : "sr-only"}
          >
            {showSearchLabel ? "Search Products" : searchPlaceholder}
          </label>
          <Input
            id="filter-search"
            type="text"
            placeholder={showSearchLabel ? "e.g. Jersey, Hoodie..." : searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
          />
        </div>
      )}

      {/* Categories */}
      <CollapsibleSection title="Categories" defaultOpen={true}>
        <div className={cn(
          "flex gap-2 pt-2",
          isMobile ? "flex-col" : "flex-wrap lg:flex-col"
        )}>
          {categories.map((category) => {
            const isActive = selectedCategories.includes(category.value)
            return (
              <button
                key={category.value}
                onClick={() => onCategoryToggle(category.value)}
                className={cn(
                  "flex items-center justify-between py-2 text-sm transition-colors",
                  isMobile ? "w-full" : "px-3 py-2 rounded-md min-h-[40px]",
                  isMobile
                    ? isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                    : getCategoryColor(category.value, isActive)
                )}
                aria-label={`Filter by ${category.label}`}
                aria-pressed={isActive}
              >
                <span className="flex items-center gap-3">
                  {isMobile && (
                    <span className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center",
                      isActive ? "bg-foreground border-foreground" : "border-muted-foreground"
                    )}>
                      {isActive && <Check className="w-3 h-3 text-background" />}
                    </span>
                  )}
                  {category.label}
                </span>
                {category.count !== undefined && (
                  <span className="text-xs opacity-70">({category.count})</span>
                )}
              </button>
            )
          })}
        </div>
      </CollapsibleSection>

      <Separator />

      {/* Tags */}
      {tags && tags.length > 0 && onTagToggle && (
        <>
          <CollapsibleSection title="Shop By" defaultOpen={true}>
            <div className={cn(
              "flex gap-2",
              isMobile ? "flex-col" : "flex-wrap"
            )}>
              {tags.map((tag) => {
                const isActive = selectedTags.includes(tag.value)
                return (
                  <button
                    key={tag.value}
                    onClick={() => onTagToggle(tag.value)}
                    className={cn(
                      "flex items-center gap-3 py-2 text-sm transition-colors",
                      isMobile ? "w-full" : "px-3 py-1.5 rounded-full min-h-[32px]",
                      isMobile
                        ? isActive
                          ? "text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground"
                        : isActive
                          ? "bg-foreground text-background"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                    aria-label={`Filter by ${tag.label}`}
                    aria-pressed={isActive}
                  >
                    {isMobile && (
                      <span className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center",
                        isActive ? "bg-foreground border-foreground" : "border-muted-foreground"
                      )}>
                        {isActive && <Check className="w-3 h-3 text-background" />}
                      </span>
                    )}
                    {tag.label}
                    {!isMobile && tag.count !== undefined && (
                      <span className="ml-1 opacity-70">({tag.count})</span>
                    )}
                  </button>
                )
              })}
            </div>
          </CollapsibleSection>
          <Separator />
        </>
      )}

      {/* Colors */}
      {colors && colors.length > 0 && onColorToggle && (
        <CollapsibleSection title="Color" defaultOpen={true}>
          <div className="grid grid-cols-3 gap-4 pt-2">
            {colors.map((color) => {
              const isActive = selectedColors.includes(color.name)
              return (
                <button
                  key={color.name}
                  onClick={() => onColorToggle(color.name)}
                  className="flex flex-col items-center gap-2 group"
                  aria-label={`Filter by ${color.name}`}
                  aria-pressed={isActive}
                >
                  <span
                    className={cn(
                      "w-7 h-7 rounded-full border border-border transition-all flex items-center justify-center",
                      isActive ? "ring-2 ring-offset-2 ring-offset-background ring-primary" : "hover:scale-110"
                    )}
                    style={{ backgroundColor: color.hex }}
                  >
                    {isActive && (
                      <Check className={cn(
                        "w-4 h-4",
                        color.hex === "#ffffff" || color.hex === "#6b7280"
                          ? "text-gray-800"
                          : "text-white"
                      )} />
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground">
                    {color.name}
                  </span>
                </button>
              )
            })}
          </div>
        </CollapsibleSection>
      )}
    </div>
  )
}

export function FilterSidebar({
  title,
  searchPlaceholder = "Search...",
  searchQuery,
  onSearchChange,
  categories,
  selectedCategories,
  onCategoryToggle,
  tags,
  selectedTags = [],
  onTagToggle,
  colors,
  selectedColors = [],
  onColorToggle,
  sortBy = "featured",
  onSortChange,
  onClearFilters,
  totalCount,
  filteredCount,
  getCategoryColor = defaultGetCategoryColor,
  showSearchLabel = false,
  className,
}: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hasActiveFilters = selectedCategories.length > 0 || selectedTags.length > 0 || selectedColors.length > 0 || searchQuery.length > 0
  const activeFilterCount = selectedCategories.length + selectedTags.length + selectedColors.length + (searchQuery ? 1 : 0)

  return (
    <>
      {/* Mobile: Results count + Filter button */}
      <div className="lg:hidden flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredCount !== undefined ? `${filteredCount} Results` : ""}
        </p>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              Filter
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-foreground text-background text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader className="text-left mb-6">
              <SheetTitle className="flex items-center justify-between">
                <span>Sort By</span>
                <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </SheetClose>
              </SheetTitle>
            </SheetHeader>

            <FilterContent
              searchPlaceholder={searchPlaceholder}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              categories={categories}
              selectedCategories={selectedCategories}
              onCategoryToggle={onCategoryToggle}
              tags={tags}
              selectedTags={selectedTags}
              onTagToggle={onTagToggle}
              colors={colors}
              selectedColors={selectedColors}
              onColorToggle={onColorToggle}
              sortBy={sortBy}
              onSortChange={onSortChange}
              getCategoryColor={getCategoryColor}
              isMobile={true}
            />

            {/* Fixed footer */}
            <SheetFooter className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-3">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={onClearFilters}
                  className="flex-1"
                >
                  Clear ({activeFilterCount})
                </Button>
              )}
              <SheetClose asChild>
                <Button className="flex-1">
                  Apply
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:block w-full lg:w-64 lg:flex-shrink-0",
          className
        )}
      >
        <div className="lg:sticky lg:top-24 space-y-6">
          {/* Title */}
          {title && (
            <h2 className="text-lg font-semibold">{title}</h2>
          )}

          <FilterContent
            searchPlaceholder={searchPlaceholder}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            categories={categories}
            selectedCategories={selectedCategories}
            onCategoryToggle={onCategoryToggle}
            tags={tags}
            selectedTags={selectedTags}
            onTagToggle={onTagToggle}
            colors={colors}
            selectedColors={selectedColors}
            onColorToggle={onColorToggle}
            getCategoryColor={getCategoryColor}
            showSearchLabel={showSearchLabel}
            isMobile={false}
          />

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
    </>
  )
}
