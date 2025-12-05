"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"
import { LayoutShell } from "@/components/layout-shell"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('http://localhost:8000/api/events/')
        const data = await response.json()
        setEvents(data.results)
        setFilteredEvents(data.results)
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  useEffect(() => {
    let filtered = events

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter(event => event.event_type === selectedType)
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
  }, [searchQuery, selectedType, events])

  const eventTypes = [
    { value: "all", label: "All Events" },
    { value: "tryout", label: "Tryouts" },
    { value: "open_gym", label: "Open Gym" },
    { value: "tournament", label: "Tournaments" },
    { value: "camp", label: "Camps" },
    { value: "practice", label: "Practice" },
    { value: "game", label: "Games" },
  ]

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      open_gym: "bg-green-100 text-green-800",
      tryout: "bg-blue-100 text-blue-800",
      game: "bg-red-100 text-red-800",
      practice: "bg-yellow-100 text-yellow-800",
      tournament: "bg-purple-100 text-purple-800",
      camp: "bg-orange-100 text-orange-800",
    }
    return colors[type] || "bg-gray-100 text-gray-800"
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
              {eventTypes.map((type) => (
                <Button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  variant={selectedType === type.value ? "default" : "outline"}
                  className={selectedType === type.value
                    ? "bg-gradient-to-br from-foreground/40 to-accent text-background font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-transform"
                    : "border-border text-primary hover:bg-gradient-to-br hover:from-foreground/40 hover:to-accent hover:shadow-lg hover:scale-105 transition-all"
                  }
                  size="sm"
                >
                  {type.label}
                </Button>
              ))}
            </div>

            {searchQuery || selectedType !== "all" ? (
              <p className="text-sm text-muted-foreground">
                Showing {filteredEvents.length} of {events.length} events
              </p>
            ) : null}
          </div>

          {loading ? (
            <div className="space-y-4 max-w-3xl mx-auto">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
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
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getEventTypeColor(
                          event.event_type
                        )}`}
                      >
                        {event.event_type.replace("_", " ").toUpperCase()}
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
                      <Button className="w-full bg-gradient-to-br from-foreground/40 to-accent text-background font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-transform">
                        Register Now
                      </Button>
                    )}
                    {!event.is_registration_open && event.is_full && (
                      <Button disabled className="w-full text-primary">Event Full</Button>
                    )}
                    {!event.is_registration_open && !event.is_full && (
                      <Button disabled className="w-full text-primary">Registration Closed</Button>
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
