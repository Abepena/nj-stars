"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { LayoutShell } from "@/components/layout-shell"
import { ErrorMessage } from "@/components/error-message"
import { EventCardSkeleton } from "@/components/skeletons/event-card-skeleton"
import { CalendarSkeleton } from "@/components/skeletons/calendar-skeleton"
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
import { Calendar, List, SlidersHorizontal, ChevronLeft, ChevronRight, Check, X, ChevronDown, User, Download, ExternalLink, CalendarPlus, MapPin } from "lucide-react"
import { EventMap } from "@/components/event-map"
import { Switch } from "@/components/ui/switch"
import { EventCardHorizontal } from "@/components/event-card-horizontal"

// Brand icons as inline SVGs
const GoogleCalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.5 4h-3V2.5a.5.5 0 0 0-1 0V4h-7V2.5a.5.5 0 0 0-1 0V4h-3A2.5 2.5 0 0 0 2 6.5v13A2.5 2.5 0 0 0 4.5 22h15a2.5 2.5 0 0 0 2.5-2.5v-13A2.5 2.5 0 0 0 19.5 4zM4.5 5.5h15a1 1 0 0 1 1 1V8H3.5V6.5a1 1 0 0 1 1-1zm15 15h-15a1 1 0 0 1-1-1V9.5h17v10a1 1 0 0 1-1 1z"/>
    <path d="M12 11a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm0 5.5a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="#4285F4"/>
  </svg>
)

const AppleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
)
import {
  generateGoogleCalendarUrl,
  downloadEventIcs,
  getICalendarSubscriptionUrl,
} from "@/lib/calendar-utils"
import { cn } from "@/lib/utils"
import { EventRegistrationModal } from "@/components/event-registration-modal"

interface Event {
  id: number
  title: string
  slug: string
  description: string
  event_type: string
  start_datetime: string
  end_datetime: string
  location: string
  latitude?: number
  longitude?: number
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

// Event type colors for tags - includes calendarText for readable contrast on calendar items
// calendarBg is a muted version for calendar day cells, bgClassName is the full-saturation version for badges
const EVENT_TYPE_CONFIG: Record<string, { label: string; className: string; bgClassName: string; calendarBg: string; calendarText: string; dotColor: string }> = {
  open_gym: { label: 'Open Gym', className: 'text-success', bgClassName: 'bg-success', calendarBg: 'bg-success/40', calendarText: 'text-foreground', dotColor: 'bg-success/70' },
  tryout: { label: 'Tryout', className: 'text-info', bgClassName: 'bg-info', calendarBg: 'bg-info/40', calendarText: 'text-foreground', dotColor: 'bg-info/70' },
  game: { label: 'Game', className: 'text-accent', bgClassName: 'bg-accent', calendarBg: 'bg-accent/40', calendarText: 'text-foreground', dotColor: 'bg-accent/70' },
  practice: { label: 'Practice', className: 'text-warning', bgClassName: 'bg-warning', calendarBg: 'bg-warning/30', calendarText: 'text-foreground', dotColor: 'bg-warning/60' },
  tournament: { label: 'Tournament', className: 'text-secondary', bgClassName: 'bg-secondary', calendarBg: 'bg-secondary/40', calendarText: 'text-foreground', dotColor: 'bg-secondary/70' },
  camp: { label: 'Camp', className: 'text-tertiary', bgClassName: 'bg-tertiary', calendarBg: 'bg-tertiary/30', calendarText: 'text-foreground', dotColor: 'bg-tertiary/60' },
  skills: { label: 'Skills', className: 'text-primary', bgClassName: 'bg-primary', calendarBg: 'bg-primary/40', calendarText: 'text-foreground', dotColor: 'bg-primary/70' },
}

// Category filter colors - matches category-colors.ts
const getEventTypeColor = (type: string, isActive: boolean) => {
  const colors: Record<string, { active: string; inactive: string }> = {
    open_gym: {
      active: "bg-success/30 text-success font-medium border border-success/70",
      inactive: "bg-success/8 text-success/70 border border-success/25 hover:bg-success/12",
    },
    tryout: {
      active: "bg-info/30 text-info font-medium border border-info/70",
      inactive: "bg-info/8 text-info/70 border border-info/25 hover:bg-info/12",
    },
    game: {
      active: "bg-accent/30 text-accent font-medium border border-accent/70",
      inactive: "bg-accent/8 text-accent/70 border border-accent/25 hover:bg-accent/12",
    },
    practice: {
      active: "bg-warning/30 text-warning font-medium border border-warning/70",
      inactive: "bg-warning/8 text-warning/70 border border-warning/25 hover:bg-warning/12",
    },
    tournament: {
      active: "bg-secondary/30 text-secondary font-medium border border-secondary/70",
      inactive: "bg-secondary/8 text-secondary/70 border border-secondary/25 hover:bg-secondary/12",
    },
    camp: {
      active: "bg-tertiary/30 text-tertiary font-medium border border-tertiary/70",
      inactive: "bg-tertiary/8 text-tertiary/70 border border-tertiary/25 hover:bg-tertiary/12",
    },
    skills: {
      active: "bg-primary/30 text-primary font-medium border border-primary/70",
      inactive: "bg-primary/8 text-primary/70 border border-primary/25 hover:bg-primary/12",
    },
  }
  const colorSet = colors[type] || {
    active: "bg-muted text-foreground font-medium border border-border",
    inactive: "bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50",
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
  { value: "skills", label: "Skills" },
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
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<Event[]>([])
  const [myEventIds, setMyEventIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>("date_asc")
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("upcoming")
  const [viewMode, setViewMode] = useState<ViewMode>("calendar")
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [initialFilterSet, setInitialFilterSet] = useState(false)
  const [selectedEventForRegistration, setSelectedEventForRegistration] = useState<Event | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [highlightedEventId, setHighlightedEventId] = useState<number | null>(null)
  const [mobileMapOpen, setMobileMapOpen] = useState(false)
  const [highlightDate, setHighlightDate] = useState<Date | null>(null)
  const [highlightProcessed, setHighlightProcessed] = useState(false)
  const [mapFocusedEvents, setMapFocusedEvents] = useState<Event[]>([])

  // Stable callback to update map focused events when calendar date changes
  const handleDateSelect = useCallback((date: Date | null, events: Event[]) => {
    setMapFocusedEvents(events)
  }, [])

  // Stable callback to clear highlight after animation completes
  const handleHighlightComplete = useCallback(() => {
    setHighlightDate(null)
  }, [])

  // Initialize filters from URL query parameters
  useEffect(() => {
    if (!searchParams) return
    const eventType = searchParams.get('event_type')
    const viewParam = searchParams.get('view')

    if (eventType && EVENT_TYPES.some(t => t.value === eventType)) {
      setSelectedTypes([eventType])
      setTimeFilter("upcoming") // Show upcoming events when filtering by type
      setInitialFilterSet(true)
    }

    // Set view mode from URL parameter, or default to list on mobile
    if (viewParam === 'list' || viewParam === 'calendar') {
      setViewMode(viewParam)
    } else if (typeof window !== 'undefined' && window.innerWidth < 768) {
      // Default to list view on mobile
      setViewMode('list')
    }
  }, [searchParams])

  // Handle highlight param to focus on a specific event with animation (runs only once)
  // Also handles openRegistration param to auto-open the registration modal after login redirect
  useEffect(() => {
    if (!searchParams || highlightProcessed) return
    const highlightSlug = searchParams.get('highlight')
    const openRegistration = searchParams.get('openRegistration')
    
    if (highlightSlug && events.length > 0) {
      const eventToHighlight = events.find(e => e.slug === highlightSlug)
      if (eventToHighlight) {
        const eventDate = new Date(eventToHighlight.start_datetime)
        setHighlightedEventId(eventToHighlight.id)
        setSelectedTypes([eventToHighlight.event_type])
        setTimeFilter("upcoming")
        setInitialFilterSet(true)
        setHighlightProcessed(true) // Mark as processed to prevent re-triggering
        
        // Trigger the animation by setting highlightDate
        // The CalendarView will handle animating to this date
        setTimeout(() => {
          setHighlightDate(eventDate)
        }, 300) // Small delay to let the page render first
        
        // Auto-open registration modal if returning from login
        if (openRegistration === 'true') {
          setTimeout(() => {
            setSelectedEventForRegistration(eventToHighlight)
          }, 500) // Delay to let highlight animation start first
        }
      }
    }
  }, [searchParams, events, highlightProcessed])

  // Set default filter to "My Events" for authenticated users (only if no URL params)
  useEffect(() => {
    if (!initialFilterSet && authStatus !== 'loading') {
      setInitialFilterSet(true)
    }
  }, [session, authStatus, initialFilterSet, searchParams])

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

  // Refresh my event IDs after registration
  const refreshMyEventIds = async () => {
    if (!session) return
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
      console.error('Failed to refresh my event IDs:', err)
    }
  }

  const handleRegisterClick = (event: Event) => {
    setSelectedEventForRegistration(event)
  }

  // Helper to get the color dot class for event types
  const getEventTypeDotColor = (type: string) => {
    const dotColors: Record<string, string> = {
      open_gym: "bg-success",
      tryout: "bg-info",
      game: "bg-accent",
      practice: "bg-warning",
      tournament: "bg-secondary",
      camp: "bg-tertiary",
      skills: "bg-primary",
    }
    return dotColors[type] || "bg-muted-foreground"
  }

  // Filter content for both mobile and desktop
  const FilterContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn("space-y-4", isMobile && "pb-24")}>
      {/* Event Types - Now at the top */}
      <CollapsibleSection title="Categories" defaultOpen={true}>
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
                {/* Color dot on the right */}
                <span className={cn(
                  "w-2.5 h-2.5 rounded-full shrink-0",
                  getEventTypeDotColor(type.value)
                )} />
              </button>
            )
          })}
        </div>
      </CollapsibleSection>

      <Separator />

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
    </div>
  )

  return (
    <LayoutShell>
      <PageHeader
        title="The Schedule"
        subtitle="Find your next game, tryout, or open gym session."
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

              {/* Map button (mobile) */}
              <Sheet open={mobileMapOpen} onOpenChange={setMobileMapOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <MapPin className="w-4 h-4" />
                    Map
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh] p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle>Event Locations</SheetTitle>
                  </SheetHeader>
                  <div className="h-[calc(80vh-60px)]">
                    <EventMap
                      events={filteredEvents}
                      focusedEvents={mapFocusedEvents}
                      selectedEventId={highlightedEventId}
                      onEventSelect={(id) => {
                        setHighlightedEventId(id)
                        setMobileMapOpen(false)
                      }}
                      className="h-full rounded-none border-0"
                    />
                  </div>
                </SheetContent>
              </Sheet>

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

                {/* Map toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Show Map</span>
                  </div>
                  <Switch
                    checked={showMap}
                    onCheckedChange={setShowMap}
                  />
                </div>

                <FilterContent isMobile={false} />

                {/* Calendar Sync - Only show for My Events */}
                {session && timeFilter === "my_events" && myEventIds.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <Separator />
                    <p className="text-sm font-semibold">Sync Calendar</p>
                    <p className="text-xs text-muted-foreground">
                      Subscribe to your events in your favorite calendar app.
                    </p>
                    <div className="space-y-2">
                      <a
                        href={getICalendarSubscriptionUrl()}
                        download="njstars-my-events.ics"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                      >
                        <Download className="w-4 h-4" />
                        Download .ics file
                      </a>
                      <button
                        onClick={() => {
                          const url = getICalendarSubscriptionUrl()
                          navigator.clipboard.writeText(url)
                          alert('Calendar URL copied! Paste this in your calendar app\'s "Subscribe" feature.')
                        }}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Copy subscription URL
                      </button>
                    </div>
                  </div>
                )}

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
            <div className="flex-1">
              {/* Map Section (when enabled) */}
              {showMap && (
                <div className="mb-6 rounded-lg overflow-hidden border border-border">
                  <EventMap
                    events={filteredEvents}
                      focusedEvents={mapFocusedEvents}
                    selectedEventId={highlightedEventId}
                    onEventSelect={(id) => {
                      setHighlightedEventId(id)
                      // Scroll to the event card
                      const element = document.getElementById(`event-card-${id}`)
                      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }}
                    className="h-[350px] md:h-[400px]"
                  />
                </div>
              )}

              <main className="flex-1 min-w-0">
                {error && (
                  <div className="mb-8">
                    <ErrorMessage error={error} />
                  </div>
                )}

                {loading ? (
                  viewMode === "calendar" ? (
                    <CalendarSkeleton />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {[1, 2, 3, 4].map((i) => (
                        <EventCardSkeleton key={i} />
                      ))}
                    </div>
                  )
                ) : viewMode === "calendar" ? (
                  <CalendarView
                    events={eventsForMonth}
                    currentMonth={currentMonth}
                    onMonthChange={setCurrentMonth}
                    onRegisterClick={handleRegisterClick}
                    myEventIds={myEventIds}
                    highlightDate={highlightDate}
                    onDateSelect={handleDateSelect}
                    onHighlightComplete={handleHighlightComplete}
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
                  <div className="flex flex-col gap-3">
                    {filteredEvents.map((event) => {
                      const typeConfig = EVENT_TYPE_CONFIG[event.event_type] || {
                        label: event.event_type,
                        className: 'text-muted-foreground',
                        bgClassName: 'bg-muted',
                        calendarText: 'text-foreground'
                      }
                      return (
                        <EventCardHorizontal
                          key={event.id}
                          event={event}
                          typeConfig={typeConfig}
                          onRegisterClick={() => handleRegisterClick(event)}
                          isRegistered={myEventIds.includes(event.id)}
                          isHighlighted={highlightedEventId === event.id}
                          onMouseEnter={() => setHighlightedEventId(event.id)}
                          onMouseLeave={() => setHighlightedEventId(null)}
                        />
                      )
                    })}
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </section>

      {/* Event Registration Modal */}
      {selectedEventForRegistration && (
        <EventRegistrationModal
          event={selectedEventForRegistration}
          open={!!selectedEventForRegistration}
          onOpenChange={(open) => {
            if (!open) setSelectedEventForRegistration(null)
          }}
          onSuccess={refreshMyEventIds}
        />
      )}
    </LayoutShell>
  )
}

// Calendar View Component
function CalendarView({
  events,
  currentMonth,
  onMonthChange,
  onRegisterClick,
  myEventIds = [],
  highlightDate,
  onDateSelect,
  onHighlightComplete,
}: {
  events: Event[]
  currentMonth: Date
  onMonthChange: (date: Date) => void
  onRegisterClick: (event: Event) => void
  myEventIds?: number[]
  highlightDate?: Date | null
  onDateSelect?: (date: Date | null, events: Event[]) => void
  onHighlightComplete?: () => void
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showSyncMenu, setShowSyncMenu] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [pulsingDate, setPulsingDate] = useState<Date | null>(null)
  const [pendingHighlight, setPendingHighlight] = useState<Date | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)
  const eventListRef = useRef<HTMLDivElement>(null)

  // Handle highlight date animation sequence (only runs once when highlightDate is first set)
  useEffect(() => {
    if (!highlightDate || pendingHighlight) return // Skip if already animating

    const highlightMonth = startOfMonth(highlightDate)
    const current = startOfMonth(currentMonth)

    // If highlight date is in a different month, we need to animate to it
    if (!isSameMonth(highlightDate, currentMonth)) {
      // Determine direction and start the animation sequence
      const monthsDiff = (highlightMonth.getFullYear() - current.getFullYear()) * 12 +
                        (highlightMonth.getMonth() - current.getMonth())

      if (monthsDiff !== 0) {
        setPendingHighlight(highlightDate)
        // Navigate one month at a time with animation
        const direction = monthsDiff > 0 ? 'left' : 'right'
        setSlideDirection(direction)
        setIsAnimating(true)

        // After animation, move to next month
        setTimeout(() => {
          const nextMonth = monthsDiff > 0
            ? addMonths(currentMonth, 1)
            : subMonths(currentMonth, 1)
          onMonthChange(nextMonth)
          setIsAnimating(false)
          setSlideDirection(null)
        }, 350) // Match transition duration
      }
    } else {
      // Same month - just pulse and select the date
      setPulsingDate(highlightDate)
      setTimeout(() => {
        setSelectedDate(highlightDate)
        setTimeout(() => {
          setPulsingDate(null)
          onHighlightComplete?.() // Clear parent's highlightDate
        }, 600)
      }, 200)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightDate]) // Only trigger on initial highlightDate set, callback is stable

  // Continue animation if we have a pending highlight and reached a new month
  useEffect(() => {
    if (!pendingHighlight || isAnimating) return

    if (isSameMonth(pendingHighlight, currentMonth)) {
      // Reached the target month - pulse and select
      setTimeout(() => {
        setPulsingDate(pendingHighlight)
        setTimeout(() => {
          setSelectedDate(pendingHighlight)
          setTimeout(() => {
            setPulsingDate(null)
            setPendingHighlight(null)
            onHighlightComplete?.() // Clear parent's highlightDate
          }, 600)
        }, 200)
      }, 100)
    } else {
      // Need to continue animating
      const highlightMonth = startOfMonth(pendingHighlight)
      const current = startOfMonth(currentMonth)
      const monthsDiff = (highlightMonth.getFullYear() - current.getFullYear()) * 12 +
                        (highlightMonth.getMonth() - current.getMonth())

      const direction = monthsDiff > 0 ? 'left' : 'right'
      setSlideDirection(direction)
      setIsAnimating(true)

      setTimeout(() => {
        const nextMonth = monthsDiff > 0
          ? addMonths(currentMonth, 1)
          : subMonths(currentMonth, 1)
        onMonthChange(nextMonth)
        setIsAnimating(false)
        setSlideDirection(null)
      }, 350)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingHighlight, currentMonth, isAnimating]) // onMonthChange and onHighlightComplete are stable

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

  const selectedDayEvents = useMemo(() => selectedDate ? getEventsForDay(selectedDate) : [], [selectedDate, events])

  // Notify parent of date selection changes for map zoom
  useEffect(() => {
    onDateSelect?.(selectedDate, selectedDayEvents)
  }, [selectedDate, selectedDayEvents, onDateSelect])

  // Default to today if it has events and user hasn't interacted yet
  useEffect(() => {
    if (hasInitialized || highlightDate) return // Skip if already initialized or using highlight
    
    const today = new Date()
    const todayEvents = getEventsForDay(today)
    
    if (todayEvents.length > 0 && isSameMonth(today, currentMonth)) {
      setSelectedDate(today)
    }
    setHasInitialized(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, currentMonth]) // Only run when events load or month changes

  // Auto-scroll to event list when a day is selected
  useEffect(() => {
    if (selectedDate && eventListRef.current) {
      // Small delay to let the panel render
      setTimeout(() => {
        if (eventListRef.current) {
          const rect = eventListRef.current.getBoundingClientRect()
          const isFullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight
          
          if (!isFullyVisible) {
            eventListRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }
        }
      }, 100)
    }
  }, [selectedDate])

  const handleDayClick = (day: Date, dayEvents: Event[]) => {
    if (dayEvents.length > 0) {
      setSelectedDate(isSameDay(day, selectedDate || new Date(0)) ? null : day)
    }
  }

  // Animated month navigation
  const handleMonthNav = (direction: 'prev' | 'next') => {
    if (isAnimating) return
    setSlideDirection(direction === 'next' ? 'left' : 'right')
    setIsAnimating(true)

    setTimeout(() => {
      onMonthChange(direction === 'next' ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1))
      setIsAnimating(false)
      setSlideDirection(null)
    }, 350)
  }

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button
            onClick={() => handleMonthNav('prev')}
            disabled={isAnimating}
            className="p-2 hover:bg-muted rounded-md transition-colors disabled:opacity-50"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            {/* Sync to Calendar - subtle icon button */}
            <div className="relative">
              <button
                onClick={() => setShowSyncMenu(!showSyncMenu)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                aria-label="Sync to calendar"
                title="Add to your calendar"
              >
                <CalendarPlus className="w-4 h-4" />
              </button>
              {showSyncMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSyncMenu(false)}
                  />
                  <div className="absolute top-full right-0 mt-1 bg-background border border-border rounded-lg shadow-lg py-1 min-w-[220px] z-20">
                    <p className="px-3 py-1.5 text-xs text-muted-foreground font-medium border-b border-border">
                      Add to your calendar
                    </p>
                    <button
                      onClick={() => {
                        // Open Google Calendar with subscription
                        window.open('https://calendar.google.com/calendar/r?cid=' + encodeURIComponent(getICalendarSubscriptionUrl()), '_blank')
                        setShowSyncMenu(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                    >
                      <GoogleCalendarIcon className="w-4 h-4" />
                      Add to Google Calendar
                    </button>
                    <a
                      href={getICalendarSubscriptionUrl()}
                      download="njstars-events.ics"
                      className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                      onClick={() => setShowSyncMenu(false)}
                    >
                      <AppleIcon className="w-4 h-4" />
                      Add to Apple Calendar
                    </a>
                    <a
                      href={getICalendarSubscriptionUrl()}
                      download="njstars-events.ics"
                      className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted transition-colors border-t border-border"
                      onClick={() => setShowSyncMenu(false)}
                    >
                      <Download className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Download for other apps</span>
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => handleMonthNav('next')}
            disabled={isAnimating}
            className="p-2 hover:bg-muted rounded-md transition-colors disabled:opacity-50"
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
        <div
          className={cn(
            "grid grid-cols-7 transition-all duration-300 ease-out",
            slideDirection === 'left' && "animate-slide-out-left",
            slideDirection === 'right' && "animate-slide-out-right"
          )}
        >
          {days.map((day, i) => {
            const dayEvents = getEventsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isTodayDate = isToday(day)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const hasEvents = dayEvents.length > 0
            const isPulsing = pulsingDate && isSameDay(day, pulsingDate)

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
                  "min-h-[60px] md:min-h-[80px] p-1.5 border-b border-r border-border text-left transition-all relative",
                  !isCurrentMonth && "bg-muted/30",
                  i % 7 === 6 && "border-r-0",
                  hasEvents && "cursor-pointer hover:bg-muted/50",
                  isSelected && "bg-primary/10 ring-2 ring-primary ring-inset",
                  !hasEvents && "cursor-default",
                  isPulsing && "animate-pulse-highlight"
                )}
              >
                {/* Date number */}
                <div className={cn(
                  "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full transition-all",
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
                        const typeConfig = EVENT_TYPE_CONFIG[type] || { bgClassName: 'bg-muted', dotColor: 'bg-muted/70' }
                        return (
                          <div key={type} className="flex gap-0.5">
                            {Array.from({ length: Math.min(count, 3) }).map((_, idx) => (
                              <div
                                key={idx}
                                className={cn("w-1.5 h-1.5 rounded-full", typeConfig.dotColor || typeConfig.bgClassName)}
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
                        const typeConfig = EVENT_TYPE_CONFIG[event.event_type] || { bgClassName: 'bg-muted', calendarBg: 'bg-muted/50', calendarText: 'text-foreground' }
                        return (
                          <div
                            key={event.id}
                            className={cn(
                              "text-[10px] px-1 py-0.5 rounded truncate font-medium",
                              typeConfig.calendarBg || typeConfig.bgClassName,
                              typeConfig.calendarText
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
        <div ref={eventListRef} className="bg-card rounded-lg border border-border overflow-hidden animate-in slide-in-from-top-2 duration-200">
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
                  bgClassName: 'bg-muted',
                  calendarText: 'text-foreground'
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
                              "inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1",
                              typeConfig.bgClassName,
                              typeConfig.calendarText
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
                            {myEventIds.includes(event.id) ? (
                              <span className="flex items-center justify-end gap-1 text-xs font-medium text-success mt-1">
                                <Check className="w-3 h-3" />
                                Registered
                              </span>
                            ) : event.is_registration_open && (
                              <Button
                                variant="default"
                                size="sm"
                                className="min-h-[44px] md:min-h-0 md:h-auto py-2.5 md:py-1.5 px-4 md:px-3 text-sm md:text-xs font-medium mt-2 md:mt-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onRegisterClick(event)
                                }}
                              >
                                Register
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
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="flex items-center justify-center min-h-[100px] p-4">
            <div className="text-center">
              <Calendar className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Click on a day with events to see details
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Event Card Component
function EventCard({
  event,
  onRegisterClick,
  isRegistered,
  isHighlighted,
  onMouseEnter,
  onMouseLeave,
}: {
  event: Event
  onRegisterClick: () => void
  isRegistered?: boolean
  isHighlighted?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}) {
  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false)
  const typeConfig = EVENT_TYPE_CONFIG[event.event_type] || { label: event.event_type, className: 'text-muted-foreground' }
  const formattedDate = format(new Date(event.start_datetime), "EEE, MMM dd")
  const formattedTime = format(new Date(event.start_datetime), "h:mm a")

  const handleAddToGoogleCalendar = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = generateGoogleCalendarUrl({
      title: event.title,
      description: event.description,
      location: event.location,
      start_datetime: event.start_datetime,
      end_datetime: event.end_datetime,
      slug: event.slug,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
    setCalendarMenuOpen(false)
  }

  const handleDownloadIcs = (e: React.MouseEvent) => {
    e.stopPropagation()
    downloadEventIcs({
      title: event.title,
      description: event.description,
      location: event.location,
      start_datetime: event.start_datetime,
      end_datetime: event.end_datetime,
      slug: event.slug,
    })
    setCalendarMenuOpen(false)
  }

  return (
    <article
      id={`event-card-${event.id}`}
      className={cn(
        "flex flex-col cursor-pointer group transition-all duration-200",
        isHighlighted && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg"
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
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

        {/* Calendar button - shown on hover */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setCalendarMenuOpen(!calendarMenuOpen)
              }}
              className="p-2 bg-background/90 backdrop-blur-sm rounded-lg hover:bg-background transition-colors"
              aria-label="Add to calendar"
            >
              <Calendar className="w-4 h-4" />
            </button>

            {/* Calendar menu dropdown */}
            {calendarMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 bg-background border border-border rounded-lg shadow-lg py-1 min-w-[210px] z-10">
                <button
                  onClick={handleAddToGoogleCalendar}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                >
                  <GoogleCalendarIcon className="w-4 h-4" />
                  Add to Google Calendar
                </button>
                <button
                  onClick={handleDownloadIcs}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                >
                  <AppleIcon className="w-4 h-4" />
                  Add to Apple Calendar
                </button>
                <button
                  onClick={handleDownloadIcs}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left border-t border-border text-muted-foreground"
                >
                  <Download className="w-4 h-4" />
                  Download for other apps
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content - Nike style */}
      <div className="flex flex-col pt-3 space-y-1.5">
        {/* Type tag and registration inline */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${typeConfig.className}`}>
            {typeConfig.label}
          </span>
          {isRegistered ? (
            <span className="flex items-center gap-1 text-xs font-medium text-success">
              <Check className="w-3 h-3" />
              Registered
            </span>
          ) : event.is_registration_open && (
            <Button
              variant="default"
              size="sm"
              className="min-h-[44px] md:min-h-0 md:h-auto py-2.5 md:py-1.5 px-4 md:px-3 text-sm md:text-xs font-medium"
              onClick={(e) => {
                e.stopPropagation()
                onRegisterClick()
              }}
            >
              Register
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
