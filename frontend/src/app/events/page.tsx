"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { LayoutShell } from "@/components/layout-shell"
import { ErrorMessage } from "@/components/error-message"
import { EventCardSkeleton } from "@/components/skeletons/event-card-skeleton"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns"
import { Calendar, List, SlidersHorizontal, ChevronLeft, ChevronRight, Check, X, ChevronDown, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface Event {
  id: number
  title: string
  slug: string
  description: string
  event_type: string
  start_datetime: string
  end_datetime: string
  location: string
  max_participants?: number
  price: string
  requires_payment: boolean
  spots_remaining: number | null
  is_full: boolean
  is_registration_open: boolean
  image_url?: string
}

type ViewMode = "list" | "calendar"
type SortOption = "date_asc" | "date_desc" | "name_asc" | "name_desc"
type TimeFilter = "all" | "upcoming" | "this_week" | "this_month" | "my_events"

// Event type colors for tags
const EVENT_TYPE_CONFIG: Record<string, { label: string; className: string; bgClassName: string }> = {
  open_gym: { label: 'Open Gym', className: 'text-success', bgClassName: 'bg-success' },
  tryout: { label: 'Tryout', className: 'text-info', bgClassName: 'bg-info' },
  game: { label: 'Game', className: 'text-accent', bgClassName: 'bg-accent' },
  practice: { label: 'Practice', className: 'text-warning', bgClassName: 'bg-warning' },
  tournament: { label: 'Tournament', className: 'text-secondary', bgClassName: 'bg-secondary' },
  camp: { label: 'Camp', className: 'text-tertiary', bgClassName: 'bg-tertiary' },
}

// Category filter colors
const getEventTypeColor = (type: string, isActive: boolean) => {
  const colors: Record<string, { active: string; inactive: string }> = {
    open_gym: {
      active: "bg-success/15 text-success border border-success/30",
      inactive: "bg-success/5 text-success/60 border border-success/10 hover:bg-success/10",
    },
    tryout: {
      active: "bg-info/15 text-info border border-info/30",
      inactive: "bg-info/5 text-info/60 border border-info/10 hover:bg-info/10",
    },
    game: {
      active: "bg-accent/15 text-accent border border-accent/30",
      inactive: "bg-accent/5 text-accent/60 border border-accent/10 hover:bg-accent/10",
    },
    practice: {
      active: "bg-warning/15 text-warning border border-warning/30",
      inactive: "bg-warning/5 text-warning/60 border border-warning/10 hover:bg-warning/10",
    },
    tournament: {
      active: "bg-secondary/15 text-secondary border border-secondary/30",
      inactive: "bg-secondary/5 text-secondary/60 border border-secondary/10 hover:bg-secondary/10",
    },
    camp: {
      active: "bg-tertiary/15 text-tertiary border border-tertiary/30",
      inactive: "bg-tertiary/5 text-tertiary/60 border border-tertiary/10 hover:bg-tertiary/10",
    },
  }
  const colorSet = colors[type] || {
    active: "bg-muted text-muted-foreground border border-border",
    inactive: "bg-muted/30 text-muted-foreground/50 border border-border/30 hover:bg-muted/50",
  }
  return isActive ? colorSet.active : colorSet.inactive
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "date_asc", label: "Date (Soonest)" },
  { value: "date_desc", label: "Date (Latest)" },
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "name_desc", label: "Name (Z-A)" },
]

const TIME_FILTERS: { value: TimeFilter; label: string; authRequired?: boolean }[] = [
  { value: "my_events", label: "My Events", authRequired: true },
  { value: "all", label: "All Events" },
  { value: "upcoming", label: "Upcoming" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
]

const EVENT_TYPES = [
  { value: "tryout", label: "Tryouts" },
  { value: "open_gym", label: "Open Gym" },
  { value: "tournament", label: "Tournaments" },
  { value: "camp", label: "Camps" },
  { value: "practice", label: "Practice" },
  { value: "game", label: "Games" },
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

export default function EventsPage() {
  const { data: session, status: authStatus } = useSession()
  const [events, setEvents] = useState<Event[]>([])
  const [myEventIds, setMyEventIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>("date_asc")
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("upcoming")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [initialFilterSet, setInitialFilterSet] = useState(false)

  // Set default filter to "My Events" for authenticated users
  useEffect(() => {
    if (!initialFilterSet && authStatus !== 'loading') {
      if (session) {
        setTimeFilter("my_events")
      }
      setInitialFilterSet(true)
    }
  }, [session, authStatus, initialFilterSet])

  // Fetch events
  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true)
        setError(null)
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        const response = await fetch(`${API_BASE}/api/events/`)

        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.statusText}`)
        }

        const data = await response.json()
        setEvents(data.results || [])
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load events"
        setError(errorMessage)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Fetch user's registered event IDs when authenticated
  useEffect(() => {
    async function fetchMyEventIds() {
      if (!session) {
        setMyEventIds([])
        return
      }

      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        const response = await fetch(`${API_BASE}/api/events/registrations/my_event_ids/`, {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken || ''}`,
          },
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          setMyEventIds(data.event_ids || [])
        }
      } catch (err) {
        console.error('Failed to fetch my event IDs:', err)
      }
    }

    fetchMyEventIds()
  }, [session])

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let filtered = [...events]
    const now = new Date()

    // Time filter
    switch (timeFilter) {
      case "my_events":
        // Filter to only events the user is registered for (upcoming only)
        filtered = filtered.filter(e =>
          myEventIds.includes(e.id) && new Date(e.start_datetime) >= now
        )
        break
      case "upcoming":
        filtered = filtered.filter(e => new Date(e.start_datetime) >= now)
        break
      case "this_week":
        const weekEnd = endOfWeek(now)
        filtered = filtered.filter(e => {
          const date = new Date(e.start_datetime)
          return date >= now && date <= weekEnd
        })
        break
      case "this_month":
        const monthEnd = endOfMonth(now)
        filtered = filtered.filter(e => {
          const date = new Date(e.start_datetime)
          return date >= now && date <= monthEnd
        })
        break
    }

    // Type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(e => selectedTypes.includes(e.event_type))
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort
    switch (sortBy) {
      case "date_asc":
        filtered.sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
        break
      case "date_desc":
        filtered.sort((a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime())
        break
      case "name_asc":
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "name_desc":
        filtered.sort((a, b) => b.title.localeCompare(a.title))
        break
    }

    return filtered
  }, [events, searchQuery, selectedTypes, sortBy, timeFilter, myEventIds])

  // Get events for calendar view
  const eventsForMonth = useMemo(() => {
    return filteredEvents.filter(e => {
      const date = new Date(e.start_datetime)
      return isSameMonth(date, currentMonth)
    })
  }, [filteredEvents, currentMonth])

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const clearFilters = () => {
    setSelectedTypes([])
    setSortBy("date_asc")
    setTimeFilter("upcoming")
    setSearchQuery("")
  }

  const hasActiveFilters = selectedTypes.length > 0 || searchQuery.length > 0 || timeFilter !== "upcoming" || sortBy !== "date_asc"
  const activeFilterCount = selectedTypes.length + (searchQuery ? 1 : 0) + (timeFilter !== "upcoming" ? 1 : 0) + (sortBy !== "date_asc" ? 1 : 0)

  // Filter content for both mobile and desktop
  const FilterContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn("space-y-4", isMobile && "pb-24")}>
      {/* Sort By */}
      <CollapsibleSection title="Sort By" defaultOpen={isMobile}>
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
          {TIME_FILTERS.map((option) => {
            // Skip auth-required filters for unauthenticated users
            if (option.authRequired && !session) return null

            const isMyEvents = option.value === "my_events"

            return (
              <button
                key={option.value}
                onClick={() => setTimeFilter(option.value)}
                className={cn(
                  "w-full flex items-center justify-between py-2 text-sm transition-colors",
                  timeFilter === option.value
                    ? isMyEvents
                      ? "text-primary font-medium"
                      : "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-3">
                  <span className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    timeFilter === option.value
                      ? isMyEvents
                        ? "border-primary"
                        : "border-foreground"
                      : "border-muted-foreground"
                  )}>
                    {timeFilter === option.value && (
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        isMyEvents ? "bg-primary" : "bg-foreground"
                      )} />
                    )}
                  </span>
                  <span className="flex items-center gap-2">
                    {isMyEvents && <User className="w-3.5 h-3.5" />}
                    {option.label}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </CollapsibleSection>

      <Separator />

      {/* Search (desktop only) */}
      {!isMobile && (
        <>
          <div>
            <label htmlFor="events-search" className="sr-only">
              Search events
            </label>
            <Input
              id="events-search"
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Separator />
        </>
      )}

      {/* Event Types */}
      <CollapsibleSection title="Event Type" defaultOpen={true}>
        <div className={cn(
          "flex gap-2 pt-2",
          isMobile ? "flex-col" : "flex-wrap lg:flex-col"
        )}>
          {EVENT_TYPES.map((type) => {
            const isActive = selectedTypes.includes(type.value)
            return (
              <button
                key={type.value}
                onClick={() => toggleType(type.value)}
                className={cn(
                  "flex items-center justify-between py-2 text-sm transition-colors",
                  isMobile ? "w-full" : "px-3 py-2 rounded-md min-h-[40px]",
                  isMobile
                    ? isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                    : getEventTypeColor(type.value, isActive)
                )}
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
                  {type.label}
                </span>
              </button>
            )
          })}
        </div>
      </CollapsibleSection>
    </div>
  )

  return (
    <LayoutShell>
      <PageHeader
        title="Events"
        subtitle="Open gyms, tryouts, games, and tournaments for NJ Stars athletes."
      />

      <section className="py-8">
        <div className="container mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Events" },
            ]}
          />

          {/* Mobile: Sticky filter bar */}
          <div className="lg:hidden sticky top-[57px] z-40 -mx-4 px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border mb-4">
            <div className="flex items-center justify-between gap-3">
              {/* View toggle */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    viewMode === "list" ? "bg-background shadow-sm" : "hover:bg-background/50"
                  )}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    viewMode === "calendar" ? "bg-background shadow-sm" : "hover:bg-background/50"
                  )}
                  aria-label="Calendar view"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground flex-1 text-center">
                {filteredEvents.length} events
              </p>

              {/* Filter button */}
              <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    Filter
                    <SlidersHorizontal className="w-4 h-4" />
                    {activeFilterCount > 0 && (
                      <span className="bg-foreground text-background text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                  <SheetHeader className="text-left mb-6">
                    <SheetTitle>Filter & Sort</SheetTitle>
                  </SheetHeader>

                  <FilterContent isMobile={true} />

                  <SheetFooter className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-3">
                    {hasActiveFilters && (
                      <Button variant="outline" onClick={clearFilters} className="flex-1">
                        Clear ({activeFilterCount})
                      </Button>
                    )}
                    <SheetClose asChild>
                      <Button className="flex-1">Apply</Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-full lg:w-64 lg:flex-shrink-0">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* View toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">View:</span>
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "p-2 rounded-md transition-colors",
                        viewMode === "list" ? "bg-background shadow-sm" : "hover:bg-background/50"
                      )}
                      aria-label="List view"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("calendar")}
                      className={cn(
                        "p-2 rounded-md transition-colors",
                        viewMode === "calendar" ? "bg-background shadow-sm" : "hover:bg-background/50"
                      )}
                      aria-label="Calendar view"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <FilterContent isMobile={false} />

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <div className="space-y-3">
                    <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters ({activeFilterCount})
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      Showing {filteredEvents.length} of {events.length}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <EventCardSkeleton key={i} />
                  ))}
                </div>
              ) : viewMode === "calendar" ? (
                <CalendarView
                  events={eventsForMonth}
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                />
              ) : !error && filteredEvents.length === 0 ? (
                <div className="text-center py-16">
                  {timeFilter === "my_events" ? (
                    <>
                      <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg text-muted-foreground mb-2">
                        You haven't registered for any upcoming events yet.
                      </p>
                      <p className="text-sm text-muted-foreground mb-6">
                        Browse all events to find your next training session, game, or tryout.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setTimeFilter("upcoming")}
                      >
                        Browse All Events
                      </Button>
                    </>
                  ) : (
                    <p className="text-lg text-muted-foreground mb-4">
                      {hasActiveFilters
                        ? "No events match your filters."
                        : "No upcoming events scheduled. Check back soon!"}
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {filteredEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
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

// Calendar View Component
function CalendarView({
  events,
  currentMonth,
  onMonthChange,
}: {
  events: Event[]
  currentMonth: Date
  onMonthChange: (date: Date) => void
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getEventsForDay = (day: Date) => {
    return events
      .filter(e => isSameDay(new Date(e.start_datetime), day))
      .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
  }

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : []

  const handleDayClick = (day: Date, dayEvents: Event[]) => {
    if (dayEvents.length > 0) {
      setSelectedDate(isSameDay(day, selectedDate || new Date(0)) ? null : day)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid - cleaner with dots instead of full titles */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayEvents = getEventsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isTodayDate = isToday(day)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const hasEvents = dayEvents.length > 0

            // Group events by type for color dots
            const eventTypeGroups = dayEvents.reduce((acc, event) => {
              const type = event.event_type
              if (!acc[type]) acc[type] = 0
              acc[type]++
              return acc
            }, {} as Record<string, number>)

            return (
              <button
                key={i}
                onClick={() => handleDayClick(day, dayEvents)}
                disabled={!hasEvents}
                className={cn(
                  "min-h-[60px] md:min-h-[80px] p-1.5 border-b border-r border-border text-left transition-colors relative",
                  !isCurrentMonth && "bg-muted/30",
                  i % 7 === 6 && "border-r-0",
                  hasEvents && "cursor-pointer hover:bg-muted/50",
                  isSelected && "bg-primary/10 ring-2 ring-primary ring-inset",
                  !hasEvents && "cursor-default"
                )}
              >
                {/* Date number */}
                <div className={cn(
                  "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mx-auto md:mx-0",
                  isTodayDate && "bg-primary text-primary-foreground",
                  !isCurrentMonth && "text-muted-foreground"
                )}>
                  {format(day, "d")}
                </div>

                {/* Event indicators - dots on mobile, mini labels on desktop */}
                {hasEvents && (
                  <div className="mt-1">
                    {/* Mobile: colored dots */}
                    <div className="flex flex-wrap gap-0.5 justify-center md:hidden">
                      {Object.entries(eventTypeGroups).map(([type, count]) => {
                        const typeConfig = EVENT_TYPE_CONFIG[type] || { bgClassName: 'bg-muted' }
                        return (
                          <div key={type} className="flex gap-0.5">
                            {Array.from({ length: Math.min(count, 3) }).map((_, idx) => (
                              <div
                                key={idx}
                                className={cn("w-1.5 h-1.5 rounded-full", typeConfig.bgClassName)}
                              />
                            ))}
                            {count > 3 && (
                              <span className="text-[8px] text-muted-foreground">+{count - 3}</span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Desktop: compact event preview */}
                    <div className="hidden md:block space-y-0.5">
                      {dayEvents.slice(0, 2).map((event) => {
                        const typeConfig = EVENT_TYPE_CONFIG[event.event_type] || { bgClassName: 'bg-muted' }
                        return (
                          <div
                            key={event.id}
                            className={cn(
                              "text-[10px] px-1 py-0.5 rounded truncate text-white",
                              typeConfig.bgClassName
                            )}
                          >
                            {format(new Date(event.start_datetime), "h:mm")} {event.title.substring(0, 12)}
                          </div>
                        )
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-center text-muted-foreground font-medium">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Day Detail Panel */}
      {selectedDate && selectedDayEvents.length > 0 && (
        <div className="bg-card rounded-lg border border-border overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <div>
              <h3 className="font-semibold">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''} scheduled
              </p>
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="Close day details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Events List - scrollable */}
          <div className="max-h-[400px] overflow-y-auto">
            <div className="divide-y divide-border">
              {selectedDayEvents.map((event) => {
                const typeConfig = EVENT_TYPE_CONFIG[event.event_type] || {
                  label: event.event_type,
                  className: 'text-muted-foreground',
                  bgClassName: 'bg-muted'
                }
                const startTime = format(new Date(event.start_datetime), "h:mm a")
                const endTime = format(new Date(event.end_datetime), "h:mm a")

                return (
                  <div key={event.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex gap-4">
                      {/* Time column */}
                      <div className="flex-shrink-0 w-20 text-center">
                        <p className="text-sm font-medium">{startTime}</p>
                        <p className="text-xs text-muted-foreground">to {endTime}</p>
                      </div>

                      {/* Event details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className={cn(
                              "inline-block text-xs font-medium px-2 py-0.5 rounded-full text-white mb-1",
                              typeConfig.bgClassName
                            )}>
                              {typeConfig.label}
                            </span>
                            <h4 className="font-medium truncate">{event.title}</h4>
                            {event.location && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="truncate">{event.location}</span>
                              </p>
                            )}
                          </div>

                          {/* Price & Register */}
                          <div className="flex-shrink-0 text-right">
                            <p className={cn(
                              "text-sm font-semibold",
                              event.requires_payment ? "text-foreground" : "text-success"
                            )}>
                              {event.requires_payment ? `$${event.price}` : 'FREE'}
                            </p>
                            {event.is_registration_open && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto py-1 px-2 text-xs text-primary hover:text-primary-foreground hover:bg-primary mt-1"
                              >
                                Register →
                              </Button>
                            )}
                            {event.spots_remaining !== null && event.spots_remaining <= 10 && (
                              <p className="text-xs text-accent mt-1">
                                {event.spots_remaining} spots left
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty state when no date selected */}
      {!selectedDate && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Click on a day with events to see details
        </p>
      )}
    </div>
  )
}

// Event Card Component
function EventCard({ event }: { event: Event }) {
  const typeConfig = EVENT_TYPE_CONFIG[event.event_type] || { label: event.event_type, className: 'text-muted-foreground' }
  const formattedDate = format(new Date(event.start_datetime), "EEE, MMM dd")
  const formattedTime = format(new Date(event.start_datetime), "h:mm a")

  return (
    <article className="flex flex-col cursor-pointer group">
      {/* Image - rounded corners, no card border */}
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg bg-muted">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center relative">
            <Image
              src="/brand/logos/logo square thick muted.svg"
              alt={event.title}
              fill
              className="opacity-30 object-contain p-12"
            />
            {/* Date overlay on placeholder */}
            <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
              <p className="text-lg font-bold leading-none">{format(new Date(event.start_datetime), "dd")}</p>
              <p className="text-xs text-muted-foreground uppercase">{format(new Date(event.start_datetime), "MMM")}</p>
            </div>
          </div>
        )}

        {/* Spots remaining badge */}
        {event.spots_remaining !== null && event.spots_remaining <= 10 && (
          <div className="absolute top-4 right-4 bg-accent/90 text-accent-foreground text-xs font-medium px-2 py-1 rounded">
            {event.spots_remaining} spots left
          </div>
        )}
      </div>

      {/* Content - Nike style */}
      <div className="flex flex-col pt-3 space-y-1.5">
        {/* Type tag and registration inline */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${typeConfig.className}`}>
            {typeConfig.label}
          </span>
          {event.is_registration_open && (
            <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs text-primary hover:text-primary-foreground hover:bg-primary">
              Register →
            </Button>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-medium line-clamp-2 group-hover:text-primary transition-colors">
          {event.title}
        </h3>

        {/* Date & Time */}
        <p className="text-sm text-muted-foreground">
          {formattedDate} · {formattedTime}
        </p>

        {/* Location */}
        {event.location && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.location}
          </p>
        )}

        {/* Price */}
        <span className={`text-sm font-semibold ${event.requires_payment ? 'text-foreground' : 'text-success'}`}>
          {event.requires_payment ? `$${event.price}` : 'FREE'}
        </span>
      </div>
    </article>
  )
}
