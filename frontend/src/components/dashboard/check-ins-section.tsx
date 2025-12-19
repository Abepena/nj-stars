"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { format, isToday, isFuture, isPast } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  AlertCircle,
  Check,
  Clock,
  Users,
  Calendar,
  CheckCircle2,
  Loader2,
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface Registration {
  id: number
  participant_first_name: string
  participant_last_name: string
  participant_email: string
  checked_in: boolean
  checked_in_at?: string
  checked_in_by?: string
  registered_at: string
}

interface EventWithRegistrations {
  id: number
  title: string
  slug: string
  start_datetime: string
  end_datetime: string
  location: string
  registrations: Registration[]
  checked_in_count: number
  total_registrations: number
}

export function CheckInsSection() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<EventWithRegistrations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("today")
  const [checkingIn, setCheckingIn] = useState<number | null>(null)

  const fetchCheckIns = async () => {
    if (!session) return

    try {
      setLoading(true)
      setError(null)

      const apiToken = (session as any)?.apiToken

      let dateParam = ""
      if (dateFilter === "today") {
        dateParam = `?date=${format(new Date(), "yyyy-MM-dd")}`
      } else if (dateFilter === "upcoming") {
        dateParam = "?upcoming=true"
      } else if (dateFilter === "past") {
        dateParam = "?past=true"
      }

      const response = await fetch(`${API_BASE}/api/portal/admin/check-ins/${dateParam}`, {
        headers: {
          Authorization: apiToken ? `Token ${apiToken}` : "",
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setEvents(data.results || data)
      } else {
        setError("Failed to load check-ins")
      }
    } catch (err) {
      console.error("Failed to fetch check-ins:", err)
      setError("Unable to connect to server")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchCheckIns()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, dateFilter])

  const handleCheckIn = async (eventSlug: string, registrationId: number) => {
    setCheckingIn(registrationId)
    try {
      const apiToken = (session as any)?.apiToken
      const response = await fetch(
        `${API_BASE}/api/portal/admin/check-ins/${eventSlug}/${registrationId}/`,
        {
          method: "POST",
          headers: {
            Authorization: apiToken ? `Token ${apiToken}` : "",
            "Content-Type": "application/json",
          },
        }
      )

      if (response.ok) {
        setEvents((prev) =>
          prev.map((event) => {
            if (event.slug !== eventSlug) return event
            return {
              ...event,
              checked_in_count: event.checked_in_count + 1,
              registrations: event.registrations.map((reg) =>
                reg.id === registrationId
                  ? { ...reg, checked_in: true, checked_in_at: new Date().toISOString() }
                  : reg
              ),
            }
          })
        )
      }
    } catch (err) {
      console.error("Failed to check in:", err)
    } finally {
      setCheckingIn(null)
    }
  }

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events

    const query = searchQuery.toLowerCase()
    return events
      .map((event) => ({
        ...event,
        registrations: event.registrations.filter(
          (r) =>
            r.participant_first_name.toLowerCase().includes(query) ||
            r.participant_last_name.toLowerCase().includes(query) ||
            r.participant_email.toLowerCase().includes(query)
        ),
      }))
      .filter((event) => event.registrations.length > 0 || event.title.toLowerCase().includes(query))
  }, [events, searchQuery])

  const stats = useMemo(() => {
    const total = events.reduce((sum, e) => sum + e.total_registrations, 0)
    const checkedIn = events.reduce((sum, e) => sum + e.checked_in_count, 0)
    return { total, checkedIn, pending: total - checkedIn }
  }, [events])

  if (loading) {
    return <CheckInsSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-info/40 flex items-center justify-center">
                <Users className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <div className="text-lg font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-success/40 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <div className="text-lg font-bold">{stats.checkedIn}</div>
                <div className="text-xs text-muted-foreground">Checked In</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-warning/30 flex items-center justify-center">
                <Clock className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <div className="text-lg font-bold">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by participant name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-9">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past Events</SelectItem>
                <SelectItem value="all">All Events</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events with Check-ins */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No Events Found</h3>
            <p className="text-sm text-muted-foreground">
              {dateFilter === "today"
                ? "No events scheduled for today"
                : "No events match your filters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => {
            const eventDate = new Date(event.start_datetime)
            const isEventToday = isToday(eventDate)
            const isEventPast = isPast(new Date(event.end_datetime))
            const isEventFuture = isFuture(eventDate)

            return (
              <Card key={event.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {event.title}
                        {isEventToday && (
                          <Badge className="bg-primary/20 text-primary border-primary/30">
                            Today
                          </Badge>
                        )}
                        {isEventPast && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Past
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        {format(eventDate, "EEEE, MMM d, yyyy 'at' h:mm a")}
                        <span className="mx-2">•</span>
                        {event.location}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {event.checked_in_count}/{event.total_registrations}
                      </div>
                      <div className="text-xs text-muted-foreground">Checked In</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {event.registrations.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-3 text-center">
                      No registrations for this event
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {event.registrations.map((registration) => (
                        <div
                          key={registration.id}
                          className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                            registration.checked_in
                              ? "bg-green-500/5 border-green-500/20"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-7 w-7 rounded-full flex items-center justify-center ${
                                registration.checked_in
                                  ? "bg-green-500/20 text-green-600"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {registration.checked_in ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {registration.participant_first_name}{" "}
                                {registration.participant_last_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {registration.participant_email}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {registration.checked_in ? (
                              <div className="text-right">
                                <Badge
                                  variant="outline"
                                  className="bg-green-500/10 text-green-600 border-green-500/30"
                                >
                                  Checked In
                                </Badge>
                                {registration.checked_in_at && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(registration.checked_in_at), "h:mm a")}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleCheckIn(event.slug, registration.id)}
                                disabled={checkingIn === registration.id || isEventFuture}
                              >
                                {checkingIn === registration.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="h-3 w-3 mr-1" />
                                    Check In
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CheckInsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-3">
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
