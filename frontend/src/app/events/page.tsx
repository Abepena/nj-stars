"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"
import { LayoutShell } from "@/components/layout-shell"
import { ErrorMessage } from "@/components/error-message"
import { LoadingSpinner } from "@/components/loading-spinner"
import { format } from "date-fns"

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
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('http://localhost:8000/api/events/')

        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.statusText}`)
        }

        const data = await response.json()
        setEvents(data.results || [])
        setFilteredEvents(data.results || [])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load events'
        setError(errorMessage)
        setEvents([])
        setFilteredEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  useEffect(() => {
    let filtered = events

    // Filter by types (multiple selection)
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(event => selectedTypes.includes(event.event_type))
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredEvents(filtered)
  }, [searchQuery, selectedTypes, events])

  const eventTypes = [
    { value: "tryout", label: "Tryout" },
    { value: "open_gym", label: "Open Gym" },
    { value: "tournament", label: "Tournament" },
    { value: "camp", label: "Camp" },
    { value: "practice", label: "Practice" },
    { value: "game", label: "Game" },
  ]

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const getEventTypeColor = (type: string, isActive: boolean = false) => {
    const colors: Record<string, { active: string; inactive: string }> = {
      open_gym: {
        active: "bg-success/15 text-success border border-success/30",
        inactive: "bg-success/5 text-success/50 border border-success/10"
      },
      tryout: {
        active: "bg-info/15 text-info border border-info/30",
        inactive: "bg-info/5 text-info/50 border border-info/10"
      },
      game: {
        active: "bg-accent/15 text-accent border border-accent/30",
        inactive: "bg-accent/5 text-accent/50 border border-accent/10"
      },
      practice: {
        active: "bg-warning/15 text-warning border border-warning/30",
        inactive: "bg-warning/5 text-warning/50 border border-warning/10"
      },
      tournament: {
        active: "bg-secondary/15 text-secondary border border-secondary/30",
        inactive: "bg-secondary/5 text-secondary/50 border border-secondary/10"
      },
      camp: {
        active: "bg-tertiary/15 text-tertiary border border-tertiary/30",
        inactive: "bg-tertiary/5 text-tertiary/50 border border-tertiary/10"
      },
    }
    const colorSet = colors[type] || { active: "bg-muted text-muted-foreground border border-border", inactive: "bg-muted/30 text-muted-foreground/50 border border-border/30" }
    return isActive ? colorSet.active : colorSet.inactive
  }

  return (
    <LayoutShell>
      <PageHeader
        title="Events Calendar"
        subtitle="Open gyms, tryouts, games, and tournaments for NJ Stars athletes."
      />

      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* Search and Filter */}
          <div className="max-w-3xl mx-auto mb-8 space-y-4">
            <Input
              type="text"
              placeholder="Search events by title, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />

            <div className="flex flex-wrap gap-2">
              {eventTypes.map((type) => {
                const isActive = selectedTypes.includes(type.value)
                return (
                  <button
                    key={type.value}
                    onClick={() => toggleType(type.value)}
                    className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all duration-200 ease-in-out hover:scale-105 ${getEventTypeColor(
                      type.value,
                      isActive
                    )}`}
                  >
                    {type.label}
                  </button>
                )
              })}
            </div>

            {searchQuery || selectedTypes.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                Showing {filteredEvents.length} of {events.length} events
              </p>
            ) : null}
          </div>

          {error && (
            <div className="max-w-3xl mx-auto">
              <ErrorMessage error={error} />
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" text="Loading events..." />
            </div>
          ) : !error && filteredEvents.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">
                {searchQuery || selectedType !== "all"
                  ? "No events match your search criteria."
                  : "No upcoming events scheduled. Check back soon!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
                        <CardDescription className="text-base">
                          {format(new Date(event.start_datetime), "EEEE, MMMM dd, yyyy 'at' h:mm a")}
                        </CardDescription>
                      </div>
                      <span
                        className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider ${getEventTypeColor(
                          event.event_type,
                          true
                        )}`}
                      >
                        {event.event_type.replace("_", " ")}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{event.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.requires_payment && (
                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                          <span>${event.price}</span>
                        </div>
                      )}
                      {!event.requires_payment && (
                        <div className="flex items-center gap-1 text-blue-600 font-semibold">
                          <span>FREE</span>
                        </div>
                      )}
                      {event.spots_remaining !== null && (
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                          </svg>
                          <span>{event.spots_remaining} spots left</span>
                        </div>
                      )}
                    </div>
                    {event.is_registration_open && (
                      <Button className="w-full bg-gradient-to-br from-foreground/40 to-primary text-background font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 ease-in-out">
                        Register Now
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </LayoutShell>
  )
}
