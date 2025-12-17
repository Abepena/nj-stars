"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  Calendar,
  CalendarPlus,
  DollarSign,
  ClipboardCheck,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ==================== Types ====================

interface AdminStats {
  total_players: number
  todays_events: number
  pending_payments: number
  check_ins_today: number
}

interface PendingCheckIn {
  id: number
  event_title: string
  participant_name: string
  event_date: string
}

interface RecentRegistration {
  id: number
  participant_first_name: string
  participant_last_name: string
  event_title: string
  registered_at: string
}

interface StaffDashboardData {
  admin_stats: AdminStats
  pending_check_ins: PendingCheckIn[]
  recent_registrations: RecentRegistration[]
}

// ==================== Main Component ====================

export default function AdminDashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<StaffDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user is staff
  const isStaff = (session?.user as any)?.role === 'staff' || (session?.user as any)?.isAdmin

  useEffect(() => {
    async function fetchStaffDashboard() {
      if (!session) return

      try {
        setLoading(true)
        setError(null)

        const accessToken = (session as any)?.accessToken
        const response = await fetch(`${API_BASE}/api/portal/dashboard/staff/`, {
          headers: {
            "Authorization": `Bearer ${accessToken || ""}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setData(data)
        } else if (response.status === 403) {
          setError("You don't have permission to access this page")
        } else {
          setError("Failed to load dashboard data")
        }
      } catch (err) {
        console.error("Failed to fetch staff dashboard:", err)
        setError("Unable to connect to server")
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchStaffDashboard()
    }
  }, [session])

  if (loading) {
    return <AdminDashboardSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Link href="/portal/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { admin_stats, pending_check_ins, recent_registrations } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage check-ins, view stats, and monitor activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admin_stats.total_players}</div>
            <p className="text-xs text-muted-foreground">Total registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admin_stats.todays_events}</div>
            <p className="text-xs text-muted-foreground">Scheduled today</p>
          </CardContent>
        </Card>

        <Card className={admin_stats.pending_payments > 0 ? "border-amber-500/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Dues</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${admin_stats.pending_payments > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {admin_stats.pending_payments}
            </div>
            <p className="text-xs text-muted-foreground">Accounts with balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Check-ins Today</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{admin_stats.check_ins_today}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/portal/dashboard/admin/check-ins">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <ClipboardCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Manage Check-Ins</h3>
                <p className="text-sm text-muted-foreground">
                  {pending_check_ins.length} pending for today
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/dashboard/admin/roster">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">View Roster</h3>
                <p className="text-sm text-muted-foreground">
                  {admin_stats.total_players} active players
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/dashboard/admin/events/new">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <CalendarPlus className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Create Event</h3>
                <p className="text-sm text-muted-foreground">
                  Add a new event to the calendar
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Pending Check-ins */}
      {pending_check_ins.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Pending Check-Ins
                </CardTitle>
                <CardDescription>
                  Participants awaiting check-in for today's events
                </CardDescription>
              </div>
              <Link href="/portal/dashboard/admin/check-ins">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pending_check_ins.slice(0, 5).map((ci) => (
                <div
                  key={ci.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{ci.participant_name}</p>
                    <p className="text-sm text-muted-foreground">{ci.event_title}</p>
                  </div>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Pending
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Registrations */}
      {recent_registrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Registrations</CardTitle>
            <CardDescription>
              Latest event registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recent_registrations.slice(0, 5).map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {reg.participant_first_name} {reg.participant_last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{reg.event_title}</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(reg.registered_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ==================== Loading Skeleton ====================

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40 mb-1" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
