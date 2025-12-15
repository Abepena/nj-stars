"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  User,
  CalendarPlus,
  Download,
} from "lucide-react"
import { format } from "date-fns"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ==================== Types ====================

type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

interface Registration {
  id: number
  event_title: string
  event_slug: string
  event_start_datetime: string
  event_location: string
  event_type: string
  participant_first_name: string
  participant_last_name: string
  payment_status: PaymentStatus
  amount_paid: number
  registered_at: string
}

// ==================== Status Config ====================

const statusConfig: Record<PaymentStatus, { icon: React.ComponentType<any>; color: string; bgColor: string; label: string }> = {
  pending: { icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-100 dark:bg-amber-900/50', label: 'Payment Pending' },
  completed: { icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/50', label: 'Confirmed' },
  failed: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/50', label: 'Payment Failed' },
  refunded: { icon: XCircle, color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-900/50', label: 'Refunded' },
}

const eventTypeConfig: Record<string, { label: string; color: string }> = {
  tryout: { label: 'Tryout', color: 'bg-primary text-primary-foreground' },
  camp: { label: 'Camp', color: 'bg-secondary text-secondary-foreground' },
  clinic: { label: 'Clinic', color: 'bg-tertiary text-tertiary-foreground' },
  practice: { label: 'Practice', color: 'bg-muted text-muted-foreground' },
  game: { label: 'Game', color: 'bg-accent text-accent-foreground' },
  tournament: { label: 'Tournament', color: 'bg-violet-500 text-white' },
  other: { label: 'Event', color: 'bg-slate-500 text-white' },
}

// ==================== Main Component ====================

export default function RegistrationsPage() {
  const { data: session } = useSession()
  const [upcomingRegistrations, setUpcomingRegistrations] = useState<Registration[]>([])
  const [pastRegistrations, setPastRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRegistrations() {
      if (!session) return

      try {
        setLoading(true)
        setError(null)

        const accessToken = (session as any)?.apiToken
        const headers = {
          "Authorization": `Token ${accessToken || ""}`,
          "Content-Type": "application/json",
        }

        // Fetch upcoming and past registrations in parallel
        const [upcomingRes, pastRes] = await Promise.all([
          fetch(`${API_BASE}/api/events/registrations/upcoming/`, { headers }),
          fetch(`${API_BASE}/api/events/registrations/past/`, { headers }),
        ])

        if (upcomingRes.ok) {
          const upcomingData = await upcomingRes.json()
          setUpcomingRegistrations(upcomingData)
        }

        if (pastRes.ok) {
          const pastData = await pastRes.json()
          setPastRegistrations(pastData)
        }

        if (!upcomingRes.ok && !pastRes.ok) {
          if (upcomingRes.status === 401) {
            setError("Please log in to view your registrations")
          } else {
            setError("Failed to load registrations")
          }
        }
      } catch (err) {
        console.error("Failed to fetch registrations:", err)
        setError("Unable to connect to server")
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchRegistrations()
    }
  }, [session])

  if (loading) {
    return <RegistrationsSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  const totalRegistrations = upcomingRegistrations.length + pastRegistrations.length

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/portal/dashboard"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Registrations</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your event registrations
          </p>
        </div>

        {/* Calendar Subscribe Button */}
        {upcomingRegistrations.length > 0 && (
          <Button variant="outline" size="sm" asChild>
            <a href={`${API_BASE}/api/events/registrations/calendar.ics`} download>
              <Download className="h-4 w-4 mr-2" />
              Export to Calendar
            </a>
          </Button>
        )}
      </div>

      {/* Empty State */}
      {totalRegistrations === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No registrations yet</h3>
            <p className="text-muted-foreground mb-4">
              Your event registrations will appear here after you sign up for events
            </p>
            <Button asChild>
              <Link href="/events">Browse Events</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingRegistrations.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastRegistrations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingRegistrations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CalendarPlus className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No upcoming events</p>
                  <Button variant="link" asChild>
                    <Link href="/events">Find events to register for</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              upcomingRegistrations.map((reg) => (
                <RegistrationCard key={reg.id} registration={reg} />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastRegistrations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No past registrations</p>
                </CardContent>
              </Card>
            ) : (
              pastRegistrations.map((reg) => (
                <RegistrationCard key={reg.id} registration={reg} isPast />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

// ==================== Registration Card ====================

function RegistrationCard({ registration, isPast }: { registration: Registration; isPast?: boolean }) {
  const config = statusConfig[registration.payment_status] || statusConfig.pending
  const StatusIcon = config.icon
  const typeConfig = eventTypeConfig[registration.event_type] || eventTypeConfig.other

  const eventDate = new Date(registration.event_start_datetime)

  return (
    <Card className={isPast ? 'opacity-75' : ''}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Date Box */}
            <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary">
              <span className="text-xs font-medium uppercase">
                {format(eventDate, 'MMM')}
              </span>
              <span className="text-xl font-bold leading-none">
                {format(eventDate, 'd')}
              </span>
            </div>

            <div>
              {/* Event Type Badge */}
              <Badge className={`${typeConfig.color} text-xs mb-1`}>
                {typeConfig.label}
              </Badge>

              <CardTitle className="text-base font-semibold">
                <Link
                  href={`/events?highlight=${registration.event_slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {registration.event_title}
                </Link>
              </CardTitle>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {format(eventDate, 'h:mm a')}
                </span>
                {registration.event_location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {registration.event_location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t">
          {/* Participant Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>
              {registration.participant_first_name} {registration.participant_last_name}
            </span>
          </div>

          {/* Amount & Actions */}
          <div className="flex items-center gap-3">
            {registration.amount_paid > 0 && (
              <span className="text-sm font-medium">
                ${registration.amount_paid.toFixed(2)}
              </span>
            )}

            {!isPast && registration.payment_status === 'pending' && (
              <Button size="sm" variant="default">
                Complete Payment
              </Button>
            )}

            <Button size="sm" variant="ghost" asChild>
              <Link href={`/events?highlight=${registration.event_slug}`}>
                View Event
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== Loading Skeleton ====================

function RegistrationsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>

      <Skeleton className="h-10 w-full mb-4" />

      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <Skeleton className="h-14 w-14 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-16 mb-2" />
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between pt-3 border-t">
                <Skeleton className="h-4 w-32" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
