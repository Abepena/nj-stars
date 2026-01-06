"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { LayoutShell } from "@/components/layout-shell"
import { ErrorMessage } from "@/components/error-message"
import { NewsCardSkeleton } from "@/components/skeletons/news-card-skeleton"
import { Breadcrumbs } from "@/components/breadcrumbs"
import type { FilterCategory, FilterTag } from "@/components/filter-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { SlidersHorizontal, Check, ChevronDown, Search, X } from "lucide-react"
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth, isWithinInterval } from "date-fns"
import { cn } from "@/lib/utils"

// News-specific sort options
type NewsSortOption = "newest" | "oldest"

// Time range filter options
type TimeFilter = "all" | "this_week" | "this_month"

type BlogCategory = 'news' | 'tryouts' | 'camp' | 'tournament' | 'merch' | 'sale' | 'announcement'

interface InstagramPost {
  id: number
  instagram_id: string
  caption: string
  media_type: string
  media_url: string
  permalink: string
  timestamp: string
}

interface WagtailBlogPost {
  id: number
  meta: {
    slug: string
    first_published_at: string
  }
  title: string
  date: string
  category: BlogCategory
  intro: string
  featured_image: { url: string } | null
}

interface FeedItem {
  id: string
  type: "huddle" | "instagram"
  category?: BlogCategory
  title: string
  content?: string
  excerpt?: string
  image_url?: string
  author?: string
  published_date: string
  permalink?: string
  media_type?: string
}

// Category tag colors
const CATEGORY_CONFIG: Record<BlogCategory | 'instagram', { label: string; className: string }> = {
  news: { label: 'News', className: 'text-info' },
  tryouts: { label: 'Tryouts', className: 'text-warning' },
  camp: { label: 'Camp', className: 'text-success' },
  tournament: { label: 'Tournament', className: 'text-secondary' },
  merch: { label: 'Merch', className: 'text-primary' },
  sale: { label: 'Sale', className: 'text-tertiary' },
  announcement: { label: 'Announcement', className: 'text-accent' },
  instagram: { label: 'Instagram', className: 'text-primary' },
}

// Category filter colors
const getCategoryColor = (category: string, isActive: boolean) => {
  const colors: Record<string, { active: string; inactive: string }> = {
    news: {
      active: "bg-info/15 text-info border border-info/30",
      inactive: "bg-info/5 text-info/60 border border-info/10 hover:bg-info/10",
    },
    tryouts: {
      active: "bg-warning/15 text-warning border border-warning/30",
      inactive: "bg-warning/5 text-warning/60 border border-warning/10 hover:bg-warning/10",
    },
    camp: {
      active: "bg-success/15 text-success border border-success/30",
      inactive: "bg-success/5 text-success/60 border border-success/10 hover:bg-success/10",
    },
    tournament: {
      active: "bg-secondary/15 text-secondary border border-secondary/30",
      inactive: "bg-secondary/5 text-secondary/60 border border-secondary/10 hover:bg-secondary/10",
    },
    merch: {
      active: "bg-primary/15 text-primary border border-primary/30",
      inactive: "bg-primary/5 text-primary/60 border border-primary/10 hover:bg-primary/10",
    },
    sale: {
      active: "bg-tertiary/15 text-tertiary border border-tertiary/30",
      inactive: "bg-tertiary/5 text-tertiary/60 border border-tertiary/10 hover:bg-tertiary/10",
    },
    announcement: {
      active: "bg-accent/15 text-accent border border-accent/30",
      inactive: "bg-accent/5 text-accent/60 border border-accent/10 hover:bg-accent/10",
    },
    instagram: {
      active: "bg-primary/15 text-primary border border-primary/30",
      inactive: "bg-primary/5 text-primary/60 border border-primary/10 hover:bg-primary/10",
    },
  }
  const colorSet = colors[category] || {
    active: "bg-muted text-muted-foreground border border-border",
    inactive: "bg-muted/30 text-muted-foreground/50 border border-border/30 hover:bg-muted/50",
  }
  return isActive ? colorSet.active : colorSet.inactive
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Sort options configuration
const SORT_OPTIONS: { value: NewsSortOption; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
]

// Time filter options configuration
const TIME_FILTER_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
]

// Collapsible section component for mobile filter
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

export default function NewsPage() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [filteredItems, setFilteredItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<NewsSortOption>("newest")
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  useEffect(() => {
    async function fetchFeed() {
      try {
        setLoading(true)
        setError(null)

        const [instagramResponse, blogResponse] = await Promise.all([
          fetch(`${API_BASE}/api/instagram/`).catch(() => null),
          fetch(`${API_BASE}/api/v2/pages/?type=cms.BlogPage&fields=date,intro,featured_image,category&order=-date&limit=50`).catch(() => null),
        ])

        const allItems: FeedItem[] = []

        if (instagramResponse?.ok) {
          const instagramData = await instagramResponse.json()
          const instagramFeed: FeedItem[] = (instagramData.results || []).map((post: InstagramPost) => {
            const firstLine = post.caption.split('\n')[0]
            const titleText = firstLine.replace(/[🏀💪🔥⭐🎯🏆📸🔊💯🌟]/g, '').trim()
            const title = titleText.substring(0, 60) + (titleText.length > 60 ? '...' : '')
            const contentLines = post.caption.split('\n').slice(1).join('\n').trim()
            const content = contentLines || post.caption

            return {
              id: `ig-${post.instagram_id}`,
              type: "instagram" as const,
              title: title || 'Instagram Post',
              content: content,
              image_url: post.media_url,
              published_date: post.timestamp,
              permalink: post.permalink,
              media_type: post.media_type,
            }
          })
          allItems.push(...instagramFeed)
        }

        if (blogResponse?.ok) {
          const blogData = await blogResponse.json()
          const blogFeed: FeedItem[] = (blogData.items || []).map((post: WagtailBlogPost) => ({
            id: `blog-${post.id}`,
            type: "huddle" as const,
            category: post.category || "news",
            title: post.title,
            excerpt: post.intro,
            image_url: post.featured_image?.url,
            published_date: post.date,
            permalink: `/news/${post.meta.slug}`,
          }))
          allItems.push(...blogFeed)
        }

        allItems.sort((a, b) =>
          new Date(b.published_date).getTime() - new Date(a.published_date).getTime()
        )

        setFeedItems(allItems)
        setFilteredItems(allItems)

        if (!instagramResponse?.ok && !blogResponse?.ok) {
          throw new Error('Failed to fetch news feed from any source')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load news feed'
        setError(errorMessage)
        setFeedItems([])
        setFilteredItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchFeed()
  }, [])

  // Filter and sort items
  useEffect(() => {
    let filtered = [...feedItems]
    const now = new Date()

    // Filter by time range
    if (timeFilter !== "all") {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.published_date)
        if (timeFilter === "this_week") {
          const weekStart = startOfWeek(now, { weekStartsOn: 0 })
          const weekEnd = endOfWeek(now, { weekStartsOn: 0 })
          return isWithinInterval(itemDate, { start: weekStart, end: weekEnd })
        }
        if (timeFilter === "this_month") {
          const monthStart = startOfMonth(now)
          const monthEnd = endOfMonth(now)
          return isWithinInterval(itemDate, { start: monthStart, end: monthEnd })
        }
        return true
      })
    }

    // Filter by source type (Blog vs Instagram)
    if (selectedTags.length > 0) {
      filtered = filtered.filter(item => {
        if (selectedTags.includes('blog') && item.type === 'huddle') return true
        if (selectedTags.includes('instagram') && item.type === 'instagram') return true
        return false
      })
    }

    // Filter by categories (only applies to blog posts)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(item => {
        if (item.type === 'instagram') return true // Keep Instagram posts
        return item.category && selectedCategories.includes(item.category)
      })
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.content?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.published_date).getTime() - new Date(a.published_date).getTime())
        break
      case "oldest":
        filtered.sort((a, b) => new Date(a.published_date).getTime() - new Date(b.published_date).getTime())
        break
      default:
        filtered.sort((a, b) => new Date(b.published_date).getTime() - new Date(a.published_date).getTime())
    }

    setFilteredItems(filtered)
  }, [feedItems, searchQuery, selectedCategories, selectedTags, sortBy, timeFilter])

  // Build filter options
  const getCategoryCounts = () => {
    const counts: Record<string, number> = {}
    feedItems.forEach(item => {
      if (item.type === 'huddle' && item.category) {
        counts[item.category] = (counts[item.category] || 0) + 1
      }
    })
    return counts
  }

  const getTagCounts = () => {
    let blog = 0
    let instagram = 0
    feedItems.forEach(item => {
      if (item.type === 'huddle') blog++
      if (item.type === 'instagram') instagram++
    })
    return { blog, instagram }
  }

  const categoryCounts = getCategoryCounts()
  const tagCounts = getTagCounts()

  const categories: FilterCategory[] = [
    { value: "news", label: "News", count: categoryCounts["news"] || 0 },
    { value: "announcement", label: "Announcements", count: categoryCounts["announcement"] || 0 },
    { value: "tryouts", label: "Tryouts", count: categoryCounts["tryouts"] || 0 },
    { value: "tournament", label: "Tournaments", count: categoryCounts["tournament"] || 0 },
    { value: "camp", label: "Camps", count: categoryCounts["camp"] || 0 },
    { value: "merch", label: "Merch", count: categoryCounts["merch"] || 0 },
  ].filter(cat => cat.count > 0)

  const tags: FilterTag[] = [
    { value: "blog", label: "Blog Posts", count: tagCounts.blog },
    { value: "instagram", label: "Instagram", count: tagCounts.instagram },
  ]

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedTags([])
    setSortBy("newest")
    setTimeFilter("all")
    setSearchQuery("")
  }

  // Calculate active filter count
  const activeFilterCount = selectedCategories.length + selectedTags.length + (searchQuery ? 1 : 0) + (timeFilter !== "all" ? 1 : 0)
  const hasActiveFilters = activeFilterCount > 0 || sortBy !== "newest"

  return (
    <LayoutShell background="gradient-grid">
      <PageHeader
        title="The Huddle"
        subtitle="Stay connected with the latest news, updates, and highlights."
      />

      {/* Sticky Mobile Filter Bar */}
      <div className="lg:hidden sticky top-[60px] z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Search on mobile */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-bg-secondary/40 border-white/[0.08] placeholder:text-muted-foreground/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Filter & Sort Button */}
          <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 shrink-0">
                <SlidersHorizontal className="w-4 h-4" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="ml-1 bg-foreground text-background text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader className="text-left mb-6">
                <SheetTitle>Filter & Sort</SheetTitle>
              </SheetHeader>

              <div className="space-y-4 pb-24">
                {/* Sort By */}
                <CollapsibleSection title="Sort By" defaultOpen={true}>
                  <div className="space-y-1 pt-2">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
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

                <Separator />

                {/* Time Range */}
                <CollapsibleSection title="Time Range" defaultOpen={true}>
                  <div className="space-y-1 pt-2">
                    {TIME_FILTER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTimeFilter(option.value)}
                        className={cn(
                          "w-full flex items-center justify-between py-2 text-sm transition-colors",
                          timeFilter === option.value
                            ? "text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                            timeFilter === option.value ? "border-foreground" : "border-muted-foreground"
                          )}>
                            {timeFilter === option.value && (
                              <span className="w-2 h-2 rounded-full bg-foreground" />
                            )}
                          </span>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>

                <Separator />

                {/* Source (Blog vs Instagram) */}
                <CollapsibleSection title="Source" defaultOpen={true}>
                  <div className="space-y-1 pt-2">
                    {tags.map((tag) => {
                      const isActive = selectedTags.includes(tag.value)
                      return (
                        <button
                          key={tag.value}
                          onClick={() => toggleTag(tag.value)}
                          className={cn(
                            "w-full flex items-center justify-between py-2 text-sm transition-colors",
                            isActive
                              ? "text-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <span className={cn(
                              "w-5 h-5 rounded border flex items-center justify-center",
                              isActive ? "bg-foreground border-foreground" : "border-muted-foreground"
                            )}>
                              {isActive && <Check className="w-3 h-3 text-background" />}
                            </span>
                            {tag.label}
                          </span>
                          <span className="text-xs opacity-70">({tag.count})</span>
                        </button>
                      )
                    })}
                  </div>
                </CollapsibleSection>

                <Separator />

                {/* Categories */}
                <CollapsibleSection title="Categories" defaultOpen={true}>
                  <div className="space-y-1 pt-2">
                    {categories.map((category) => {
                      const isActive = selectedCategories.includes(category.value)
                      return (
                        <button
                          key={category.value}
                          onClick={() => toggleCategory(category.value)}
                          className={cn(
                            "w-full flex items-center justify-between py-2 text-sm transition-colors",
                            isActive
                              ? "text-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <span className={cn(
                              "w-5 h-5 rounded border flex items-center justify-center",
                              isActive ? "bg-foreground border-foreground" : "border-muted-foreground"
                            )}>
                              {isActive && <Check className="w-3 h-3 text-background" />}
                            </span>
                            {category.label}
                          </span>
                          <span className="text-xs opacity-70">({category.count})</span>
                        </button>
                      )
                    })}
                  </div>
                </CollapsibleSection>
              </div>

              {/* Fixed footer */}
              <SheetFooter className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-3">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="flex-1"
                  >
                    Clear{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
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

        {/* Results count on mobile */}
        <div className="container mx-auto px-4 pb-2">
          <p className="text-xs text-muted-foreground">
            {filteredItems.length} {filteredItems.length === 1 ? 'Result' : 'Results'}
          </p>
        </div>
      </div>

      <section className="py-8 section-depth-light">
        <div className="container mx-auto px-4 relative z-10">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "News" },
            ]}
            className="hidden lg:flex"
          />

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Filter Sidebar */}
            <aside className="hidden lg:block w-full lg:w-64 lg:flex-shrink-0">
              <div className="lg:sticky lg:top-24 rounded-lg bg-bg-secondary/60 border border-white/[0.06] p-5 space-y-6">
                <h2 className="text-lg font-semibold">Filter</h2>

                {/* Sort By */}
                <CollapsibleSection title="Sort By" defaultOpen={false}>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm transition-colors min-h-[32px]",
                          sortBy === option.value
                            ? "bg-foreground text-background"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>

                <Separator />

                {/* Time Range */}
                <CollapsibleSection title="Time Range" defaultOpen={false}>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {TIME_FILTER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTimeFilter(option.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm transition-colors min-h-[32px]",
                          timeFilter === option.value
                            ? "bg-foreground text-background"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>

                <Separator />

                {/* Search */}
                <div>
                  <label htmlFor="desktop-search" className="sr-only">Search posts</label>
                  <Input
                    id="desktop-search"
                    type="text"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-bg-secondary/40 border-white/[0.08] placeholder:text-muted-foreground/50"
                  />
                </div>

                {/* Source */}
                <CollapsibleSection title="Source" defaultOpen={true}>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {tags.map((tag) => {
                      const isActive = selectedTags.includes(tag.value)
                      return (
                        <button
                          key={tag.value}
                          onClick={() => toggleTag(tag.value)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm transition-colors min-h-[32px]",
                            isActive
                              ? "bg-foreground text-background"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {tag.label} ({tag.count})
                        </button>
                      )
                    })}
                  </div>
                </CollapsibleSection>

                <Separator />

                {/* Categories */}
                <CollapsibleSection title="Categories" defaultOpen={true}>
                  <div className="flex flex-wrap lg:flex-col gap-2 pt-2">
                    {categories.map((category) => {
                      const isActive = selectedCategories.includes(category.value)
                      return (
                        <button
                          key={category.value}
                          onClick={() => toggleCategory(category.value)}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors min-h-[40px]",
                            getCategoryColor(category.value, isActive)
                          )}
                        >
                          {category.label}
                          <span className="text-xs opacity-70">({category.count})</span>
                        </button>
                      )
                    })}
                  </div>
                </CollapsibleSection>

                <Separator />

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                    </Button>

                    {/* Results count */}
                    <p className="text-sm text-muted-foreground text-center">
                      Showing {filteredItems.length} of {feedItems.length}
                    </p>
                  </div>
                )}
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              {error && (
                <div className="mb-8">
                  <ErrorMessage error={error} />
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <NewsCardSkeleton key={i} />
                  ))}
                </div>
              ) : !error && filteredItems.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-lg text-muted-foreground mb-4">
                    {hasActiveFilters
                      ? "No posts match your filters."
                      : "No posts available. Check back soon!"}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredItems.map((item) => (
                    <NewsCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </section>
    </LayoutShell>
  )
}

// News card matching homepage Huddle FeedCard style
function NewsCard({ item }: { item: FeedItem }) {
  const formattedDate = format(new Date(item.published_date), "MMM dd, yyyy")

  const getTagConfig = () => {
    if (item.type === "instagram") {
      return CATEGORY_CONFIG.instagram
    }
    const category = item.category || "news"
    return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.news
  }

  const tagConfig = getTagConfig()

  const cardContent = (
    <article className="flex flex-col cursor-pointer group h-full">
      {/* Card wrapper matching FeedCard style */}
      <div className="h-full rounded-lg bg-bg-secondary/60 border border-white/[0.06] overflow-hidden flex flex-col transition-all duration-200 hover:bg-bg-secondary/80 hover:border-white/[0.1]">
        {/* Image thumbnail - portrait aspect ratio */}
        <div className="relative w-full aspect-[4/5] bg-bg-secondary overflow-hidden">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center relative">
              <Image
                src="/brand/logos/logo square thick muted.svg"
                alt={item.title}
                fill
                className="opacity-30 object-contain p-8"
              />
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="p-4 flex flex-col flex-1">
          {/* Tag label */}
          <span className={`text-xs font-medium uppercase tracking-wider mb-2 ${tagConfig.className}`}>
            {tagConfig.label}
          </span>

          {/* Title */}
          <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-white transition-colors mb-2">
            {item.title}
          </h3>

          {/* Date - at bottom */}
          <p className="text-xs text-text-tertiary mt-auto">
            {formattedDate}
          </p>
        </div>
      </div>
    </article>
  )

  if (item.type === "huddle" && item.permalink) {
    return <Link href={item.permalink}>{cardContent}</Link>
  }

  if (item.type === "instagram" && item.permalink) {
    return (
      <a href={item.permalink} target="_blank" rel="noopener noreferrer">
        {cardContent}
      </a>
    )
  }

  return cardContent
}
