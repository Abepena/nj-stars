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
  ChevronLeft,
  Search,
  AlertCircle,
  MoreHorizontal,
  Mail,
  FileDown,
  Eye,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCcw,
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
  paid: {
    label: "Paid",
    className: "bg-success/40 text-foreground border-success/50",
    icon: CheckCircle,
  },
  pending: {
    label: "Pending",
    className: "bg-warning/30 text-foreground border-warning/40",
    icon: Clock,
  },
  failed: {
    label: "Failed",
    className: "bg-accent/40 text-foreground border-accent/50",
    icon: XCircle,
  },
  refunded: {
    label: "Refunded",
    className: "bg-secondary/40 text-foreground border-secondary/50",
    icon: RefreshCcw,
  },
  free: {
    label: "Free",
    className: "bg-info/40 text-foreground border-info/50",
    icon: CheckCircle,
  },
}

interface Event {
  id: number
  title: string
  slug: string
  start_datetime: string
}

interface Registration {
  id: number
  event: Event
  participant_first_name: string
  participant_last_name: string
  participant_email: string
  participant_phone?: string
  participant_dob?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  payment_status: string
  amount_paid: string
  registered_at: string
  checked_in: boolean
  waiver_signed: boolean
  notes?: string
}

export default function RegistrationsAdminPage() {
  const { data: session } = useSession()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [eventFilter, setEventFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")

  useEffect(() => {
    async function fetchData() {
      if (!session) return

      try {
        setLoading(true)
        setError(null)

        const apiToken = (session as any)?.apiToken
        const headers = {
          Authorization: apiToken ? `Token ${apiToken}` : "",
          "Content-Type": "application/json",
        }

        // Fetch registrations and events in parallel
        const [regsResponse, eventsResponse] = await Promise.all([
          fetch(`${API_BASE}/api/portal/admin/registrations/`, { headers }),
          fetch(`${API_BASE}/api/events/`, { headers }),
        ])

        if (regsResponse.ok) {
          const data = await regsResponse.json()
          setRegistrations(data.results || data)
        } else if (regsResponse.status === 403) {
          setError("You don't have permission to access this page")
          return
        } else {
          setError("Failed to load registrations")
          return
        }

        if (eventsResponse.ok) {
          const data = await eventsResponse.json()
          setEvents(data.results || data)
        }
      } catch (err) {
        console.error("Failed to fetch data:", err)
        setError("Unable to connect to server")
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchData()
    }
  }, [session])

  const filteredRegistrations = useMemo(() => {
    let filtered = [...registrations]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.participant_first_name.toLowerCase().includes(query) ||
          r.participant_last_name.toLowerCase().includes(query) ||
          r.participant_email.toLowerCase().includes(query) ||
          r.event.title.toLowerCase().includes(query)
      )
    }

    if (eventFilter !== "all") {
      filtered = filtered.filter((r) => r.event.slug === eventFilter)
    }

    if (paymentFilter !== "all") {
      filtered = filtered.filter((r) => r.payment_status === paymentFilter)
    }

    // Sort by registration date (newest first)
    filtered.sort(
      (a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime()
    )

    return filtered
  }, [registrations, searchQuery, eventFilter, paymentFilter])

  const stats = useMemo(() => {
    const total = registrations.length
    const paid = registrations.filter((r) => r.payment_status === "paid").length
    const pending = registrations.filter((r) => r.payment_status === "pending").length
    const revenue = registrations
      .filter((r) => r.payment_status === "paid")
      .reduce((sum, r) => sum + parseFloat(r.amount_paid || "0"), 0)
    return { total, paid, pending, revenue }
  }, [registrations])

  const handleExportCSV = () => {
    const headers = [
      "Event",
      "Event Date",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "DOB",
      "Payment Status",
      "Amount",
      "Registered At",
      "Checked In",
      "Waiver Signed",
      "Emergency Contact",
      "Emergency Phone",
    ]

    const rows = filteredRegistrations.map((r) => [
      r.event.title,
      format(new Date(r.event.start_datetime), "yyyy-MM-dd"),
      r.participant_first_name,
      r.participant_last_name,
      r.participant_email,
      r.participant_phone || "",
      r.participant_dob || "",
      r.payment_status,
      r.amount_paid,
      format(new Date(r.registered_at), "yyyy-MM-dd HH:mm"),
      r.checked_in ? "Yes" : "No",
      r.waiver_signed ? "Yes" : "No",
      r.emergency_contact_name || "",
      r.emergency_contact_phone || "",
    ])

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const link = document.createElement("a")
    link.setAttribute("href", encodeURI(csvContent))
    link.setAttribute("download", `registrations_${format(new Date(), "yyyy-MM-dd")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return <RegistrationsSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Link href="/portal/dashboard/admin">
          <Button>Go to Admin Dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        href="/portal/dashboard/admin"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Admin
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Event Registrations</h1>
          <p className="text-muted-foreground mt-1">
            {filteredRegistrations.length} registration
            {filteredRegistrations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          <FileDown className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-info/40 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/40 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.paid}</div>
                <div className="text-xs text-muted-foreground">Paid</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-warning/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">${stats.revenue.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.slug} value={event.slug}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                {Object.entries(PAYMENT_STATUS_CONFIG).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Registrations Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No registrations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((registration) => {
                    const paymentConfig =
                      PAYMENT_STATUS_CONFIG[registration.payment_status] ||
                      PAYMENT_STATUS_CONFIG.pending
                    const PaymentIcon = paymentConfig.icon

                    return (
                      <TableRow key={registration.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {registration.participant_first_name}{" "}
                              {registration.participant_last_name}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {registration.participant_email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">
                              {registration.event.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(
                                new Date(registration.event.start_datetime),
                                "MMM d, yyyy"
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={paymentConfig.className}
                            >
                              <PaymentIcon className="h-3 w-3 mr-1" />
                              {paymentConfig.label}
                            </Badge>
                            {parseFloat(registration.amount_paid) > 0 && (
                              <span className="text-sm text-muted-foreground">
                                ${parseFloat(registration.amount_paid).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(registration.registered_at), "MMM d, yyyy")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(registration.registered_at), "h:mm a")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {registration.checked_in && (
                              <Badge
                                variant="outline"
                                className="bg-green-500/10 text-green-600 border-green-500/30 w-fit"
                              >
                                Checked In
                              </Badge>
                            )}
                            {registration.waiver_signed && (
                              <Badge
                                variant="outline"
                                className="bg-blue-500/10 text-blue-600 border-blue-500/30 w-fit"
                              >
                                Waiver Signed
                              </Badge>
                            )}
                            {!registration.checked_in && !registration.waiver_signed && (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/portal/dashboard/admin/registrations/${registration.id}`}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={`mailto:${registration.participant_email}`}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Email Participant
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/portal/dashboard/admin/check-ins?event=${registration.event.slug}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Go to Check-In
                                </Link>
                              </DropdownMenuItem>
                              {registration.payment_status === "paid" && (
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/portal/dashboard/admin/registrations/${registration.id}/refund`}
                                  >
                                    <RefreshCcw className="h-4 w-4 mr-2" />
                                    Process Refund
                                  </Link>
                                </DropdownMenuItem>
                              )}
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

function RegistrationsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-24" />
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-12 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-36" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-10 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
