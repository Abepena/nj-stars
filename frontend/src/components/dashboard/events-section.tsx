"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  AlertCircle,
  MoreHorizontal,
  Eye,
  EyeOff,
  Copy,
  Pencil,
  Trash2,
  MapPin,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const EVENT_TYPE_COLORS: Record<string, string> = {
  tryout: "badge-tryout",
  open_gym: "badge-open-gym",
  tournament: "badge-tournament",
  practice: "badge-practice",
  camp: "badge-camp",
  game: "badge-game",
  skills: "badge-skills",
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  tryout: "Tryout",
  open_gym: "Open Gym",
  tournament: "Tournament",
  practice: "Practice",
  camp: "Camp",
  game: "Game",
  skills: "Skills",
}

interface Event {
  id: number
  title: string
  slug: string
  description: string
  event_type: string
  start_datetime: string
  end_datetime: string
  location: string
  requires_payment: boolean
  price: string
  max_participants: number | null
  registration_open: boolean
  is_public: boolean
  spots_remaining: number | null
  is_full: boolean
}

export function EventsSection({ showCreateButton = false }: { showCreateButton?: boolean }) {
  const { data: session } = useSession()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchEvents = async () => {
    if (!session) return

    try {
      setLoading(true)
      setError(null)

      const apiToken = (session as any)?.apiToken
      const response = await fetch(`${API_BASE}/api/events/`, {
        headers: {
          Authorization: apiToken ? `Token ${apiToken}` : "",
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setEvents(data.results || data)
      } else {
        setError("Failed to load events")
      }
    } catch (err) {
      console.error("Failed to fetch events:", err)
      setError("Unable to connect to server")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchEvents()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const filteredEvents = useMemo(() => {
    let filtered = [...events]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.location.toLowerCase().includes(query)
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((e) => e.event_type === typeFilter)
    }

    if (statusFilter === "public") {
      filtered = filtered.filter((e) => e.is_public)
    } else if (statusFilter === "draft") {
      filtered = filtered.filter((e) => !e.is_public)
    } else if (statusFilter === "open") {
      filtered = filtered.filter((e) => e.registration_open)
    } else if (statusFilter === "closed") {
      filtered = filtered.filter((e) => !e.registration_open)
    }

    filtered.sort(
      (a, b) =>
        new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    )

    return filtered
  }, [events, searchQuery, typeFilter, statusFilter])

  const handleToggleRegistration = async (slug: string) => {
    setActionLoading(`reg-${slug}`)
    try {
      const apiToken = (session as any)?.apiToken
      const response = await fetch(`${API_BASE}/api/events/${slug}/toggle_registration/`, {
        method: "POST",
        headers: {
          Authorization: apiToken ? `Token ${apiToken}` : "",
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const updated = await response.json()
        setEvents((prev) =>
          prev.map((e) => (e.slug === slug ? { ...e, ...updated } : e))
        )
      }
    } catch (err) {
      console.error("Failed to toggle registration:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleTogglePublic = async (slug: string) => {
    setActionLoading(`pub-${slug}`)
    try {
      const apiToken = (session as any)?.apiToken
      const response = await fetch(`${API_BASE}/api/events/${slug}/toggle_public/`, {
        method: "POST",
        headers: {
          Authorization: apiToken ? `Token ${apiToken}` : "",
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const updated = await response.json()
        setEvents((prev) =>
          prev.map((e) => (e.slug === slug ? { ...e, ...updated } : e))
        )
      }
    } catch (err) {
      console.error("Failed to toggle public:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDuplicate = async (slug: string) => {
    setActionLoading(`dup-${slug}`)
    try {
      const apiToken = (session as any)?.apiToken
      const response = await fetch(`${API_BASE}/api/events/${slug}/duplicate/`, {
        method: "POST",
        headers: {
          Authorization: apiToken ? `Token ${apiToken}` : "",
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        await fetchEvents()
      }
    } catch (err) {
      console.error("Failed to duplicate event:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this event? This cannot be undone.")) {
      return
    }

    setActionLoading(`del-${slug}`)
    try {
      const apiToken = (session as any)?.apiToken
      const response = await fetch(`${API_BASE}/api/events/${slug}/`, {
        method: "DELETE",
        headers: {
          Authorization: apiToken ? `Token ${apiToken}` : "",
        },
      })

      if (response.ok || response.status === 204) {
        setEvents((prev) => prev.filter((e) => e.slug !== slug))
      }
    } catch (err) {
      console.error("Failed to delete event:", err)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return <EventsSkeleton />
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
      <Card>
        <CardContent className="p-3 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[130px] h-9">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[130px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="open">Reg Open</SelectItem>
                <SelectItem value="closed">Reg Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showCreateButton && (
            <div className="flex justify-end">
              <Link href="/portal/dashboard/events/new">
                <Button variant="success" size="sm" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Create Event
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-20 text-center text-muted-foreground text-sm">
                      No events found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => {
                    const isPast = new Date(event.end_datetime) < new Date()
                    const priceDisplay = event.requires_payment
                      ? parseFloat(event.price).toFixed(2)
                      : "Free"

                    return (
                      <TableRow key={event.id} className={isPast ? "opacity-60" : ""}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{event.title}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location.length > 25
                                ? event.location.substring(0, 25) + "..."
                                : event.location}
                            </div>
                            {event.requires_payment && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {priceDisplay}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {format(new Date(event.start_datetime), "MMM d, yyyy")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(event.start_datetime), "h:mm a")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${EVENT_TYPE_COLORS[event.event_type] || ""} text-xs`}
                          >
                            {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {event.is_public ? (
                              <Badge variant="success" className="w-fit text-xs">
                                Public
                              </Badge>
                            ) : (
                              <Badge variant="muted" className="w-fit text-xs">
                                Draft
                              </Badge>
                            )}
                            {event.registration_open ? (
                              <Badge variant="info" className="w-fit text-xs">
                                Reg. Open
                              </Badge>
                            ) : (
                              <Badge variant="muted" className="w-fit text-xs">
                                Reg. Closed
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                {actionLoading?.includes(event.slug) ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-3 w-3" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/events?highlight=${event.slug}`}>
                                  <Eye className="h-3 w-3 mr-2" />
                                  View on Site
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/portal/dashboard/admin/events/${event.slug}/edit`}>
                                  <Pencil className="h-3 w-3 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleToggleRegistration(event.slug)}>
                                {event.registration_open ? (
                                  <>
                                    <ToggleLeft className="h-3 w-3 mr-2" />
                                    Close Registration
                                  </>
                                ) : (
                                  <>
                                    <ToggleRight className="h-3 w-3 mr-2" />
                                    Open Registration
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTogglePublic(event.slug)}>
                                {event.is_public ? (
                                  <>
                                    <EyeOff className="h-3 w-3 mr-2" />
                                    Make Draft
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3 w-3 mr-2" />
                                    Make Public
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDuplicate(event.slug)}>
                                <Copy className="h-3 w-3 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(event.slug)}
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EventsSkeleton() {
  return (
    <div className="space-y-4">
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
