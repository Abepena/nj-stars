"use client"

/**
 * Staff/Coach Dashboard Example
 *
 * Fetches real data from /api/portal/dashboard/staff/ with fallback to mock data.
 *
 * #TODO: Implement check-in management with QR scanning
 * #TODO: Implement check-in/check-out API calls
 * #TODO: Implement roster search/filter
 * #TODO: Implement pending dues report
 * #TODO: Add attendance export functionality (CSV/PDF)
 * #TODO: Implement event creation for staff with permissions
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PaymentLinkGenerator } from "@/components/payment-link-generator"
import { DualListPanel, DualListItem } from "@/components/dashboard/dual-list-panel"
import {
  Users,
  Calendar,
  DollarSign,
  ClipboardCheck,
  ChevronRight,
  Clock,
  CheckCircle,
  Shield,
  TrendingUp,
  Link2
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ==================== Types ====================

interface AdminStats {
  total_players: number
  todays_events: number
  pending_payments: number
  check_ins_today: number
}

interface PendingCheckIn {
  id: number
  participant_name: string
  event_title: string
  event_date: string
}

interface ActiveCheckIn {
  id: number
  participant_name: string
  event_title: string
  checked_in_at: string
}

interface RecentRegistration {
  id: number
  participant_first_name: string
  participant_last_name: string
  event_title: string
  registered_at: string
}

interface TodaysEvent {
  id: number
  title: string
  time: string
  location: string
  registered: number
  checked_in: number
}

interface StaffDashboardData {
  profile: {
    name: string
    email: string
    role: string
  }
  admin_stats: AdminStats
  pending_check_ins: PendingCheckIn[]
  active_check_ins: ActiveCheckIn[]
  recent_registrations: RecentRegistration[]
  todays_events: TodaysEvent[]
}

// ==================== Mock Data ====================

const mockStaffData: StaffDashboardData = {
  profile: {
    name: "Coach Mike Thompson",
    email: "mike.t@njstars.com",
    role: "staff",
  },
  admin_stats: {
    total_players: 48,
    todays_events: 3,
    pending_payments: 12,
    check_ins_today: 24,
  },
  pending_check_ins: [
    { id: 1, participant_name: "Marcus Johnson", event_title: "Practice - 8th Grade Elite", event_date: "2025-12-09T18:00:00Z" },
    { id: 2, participant_name: "Tyler Smith", event_title: "Practice - 8th Grade Elite", event_date: "2025-12-09T18:00:00Z" },
    { id: 3, participant_name: "Jaylen Johnson", event_title: "Practice - 6th Grade Select", event_date: "2025-12-09T17:00:00Z" },
    { id: 4, participant_name: "Devon Brown", event_title: "Practice - 8th Grade Elite", event_date: "2025-12-09T18:00:00Z" },
  ],
  active_check_ins: [
    { id: 5, participant_name: "Chris Lee", event_title: "Practice - 8th Grade Elite", checked_in_at: "2025-12-09T17:55:00Z" },
    { id: 6, participant_name: "Jordan Davis", event_title: "Practice - 8th Grade Elite", checked_in_at: "2025-12-09T17:58:00Z" },
  ],
  recent_registrations: [
    { id: 1, participant_first_name: "Emma", participant_last_name: "Wilson", event_title: "Holiday Classic", registered_at: "2025-12-09T14:30:00Z" },
    { id: 2, participant_first_name: "Liam", participant_last_name: "Garcia", event_title: "Skills Clinic", registered_at: "2025-12-09T12:15:00Z" },
    { id: 3, participant_first_name: "Sophia", participant_last_name: "Martinez", event_title: "Holiday Classic", registered_at: "2025-12-09T10:45:00Z" },
  ],
  todays_events: [
    { id: 1, title: "Practice - 6th Grade Select", time: "5:00 PM", location: "Court A", registered: 12, checked_in: 8 },
    { id: 2, title: "Practice - 8th Grade Elite", time: "6:00 PM", location: "Court A", registered: 14, checked_in: 6 },
    { id: 3, title: "Open Gym", time: "7:30 PM", location: "Court B", registered: 8, checked_in: 0 },
  ],
}

// ==================== Loading Skeleton ====================

function StaffDashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <Skeleton className="h-6 w-48" />
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== Main Component ====================

export default function StaffExamplePage() {
  const [dashboard, setDashboard] = useState<StaffDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [usingMockData, setUsingMockData] = useState(false)
  
  // Check-in state management
  const [pendingCheckIns, setPendingCheckIns] = useState<DualListItem[]>([])
  const [activeCheckIns, setActiveCheckIns] = useState<DualListItem[]>([])
  
  // Initialize check-in lists when dashboard data loads
  useEffect(() => {
    if (dashboard) {
      setPendingCheckIns(
        dashboard.pending_check_ins.map((ci) => ({
          id: ci.id,
          title: ci.participant_name,
          subtitle: ci.event_title,
          icon: Clock,
        }))
      )
      setActiveCheckIns(
        dashboard.active_check_ins.map((ci) => ({
          id: ci.id,
          title: ci.participant_name,
          subtitle: `In since ${new Date(ci.checked_in_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          })}`,
          icon: CheckCircle,
        }))
      )
    }
  }, [dashboard])
  
  // Handle toggle check-in/check-out
  const handleToggleCheckIn = (item: DualListItem, checked: boolean) => {
    if (checked) {
      // Check in: move from pending to active
      setPendingCheckIns((prev) => prev.filter((i) => i.id !== item.id))
      setActiveCheckIns((prev) => [
        {
          ...item,
          subtitle: `In since ${new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          })}`,
        },
        ...prev,
      ])
      // #TODO: Call API to record check-in
    } else {
      // Check out: move from active to pending
      setActiveCheckIns((prev) => prev.filter((i) => i.id !== item.id))
      setPendingCheckIns((prev) => [
        ...prev,
        {
          ...item,
          subtitle: "Ready to check in",
        },
      ])
      // #TODO: Call API to record check-out
    }
  }

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE}/api/portal/dashboard/staff/`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          // Map API response to our interface (may need adjustments based on actual API structure)
          setDashboard({
            profile: {
              name: data.profile?.full_name || data.profile?.name || 'Staff Member',
              email: data.profile?.email || '',
              role: data.profile?.role || 'staff',
            },
            admin_stats: data.admin_stats || mockStaffData.admin_stats,
            pending_check_ins: data.pending_check_ins || [],
            active_check_ins: data.active_check_ins || [],
            recent_registrations: data.recent_registrations || [],
            todays_events: data.todays_events || [],
          })
          setUsingMockData(false)
        } else {
          console.warn('Staff dashboard API returned error, using mock data:', response.status)
          setDashboard(mockStaffData)
          setUsingMockData(true)
        }
      } catch (error) {
        console.warn('Failed to fetch staff dashboard, using mock data:', error)
        setDashboard(mockStaffData)
        setUsingMockData(true)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (loading) {
    return <StaffDashboardSkeleton />
  }

  if (!dashboard) {
    return <StaffDashboardSkeleton />
  }

  const staff = dashboard

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Role Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="border-dashed border-border bg-background text-muted-foreground uppercase tracking-wide text-[11px]">
          <Shield className="h-3 w-3 mr-1 text-muted-foreground" />
          Staff View — {staff.profile.name}
        </Badge>
        {usingMockData && (
          <Badge variant="outline" className="border-dashed border-amber-500/50 bg-amber-500/10 text-amber-600 uppercase tracking-wide text-[11px]">
            Demo Data
          </Badge>
        )}
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Staff Dashboard</h1>
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
            <div className="text-2xl font-bold">{staff.admin_stats.total_players}</div>
            <p className="text-xs text-muted-foreground">Total registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Today&apos;s Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.admin_stats.todays_events}</div>
            <p className="text-xs text-muted-foreground">Scheduled today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Dues</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{staff.admin_stats.pending_payments}</div>
            <p className="text-xs text-muted-foreground">Accounts with balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Check-ins Today</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{staff.admin_stats.check_ins_today}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:border-muted-foreground/30 transition-colors cursor-pointer group">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border group-hover:border-muted-foreground/30 transition-colors">
              <ClipboardCheck className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Manage Check-Ins</h3>
              <p className="text-sm text-muted-foreground">
                {staff.pending_check_ins.length} pending for today
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="hover:border-muted-foreground/30 transition-colors cursor-pointer group">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border group-hover:border-muted-foreground/30 transition-colors">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">View Roster</h3>
              <p className="text-sm text-muted-foreground">
                {staff.admin_stats.total_players} active players
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        {/* Payment Link Generator */}
        <Card className="group hover:bg-muted/50 hover:border-foreground/20 transition-all h-full">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-6">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="h-12 w-12 rounded-lg bg-muted group-hover:bg-success/30 flex items-center justify-center shrink-0 transition-colors">
                <Link2 className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <div className="flex-1 min-w-0 sm:hidden">
                <h3 className="font-semibold transition-colors">Payment Links</h3>
                <p className="text-sm text-muted-foreground truncate">Create shareable links</p>
              </div>
            </div>
            <div className="hidden sm:block flex-1 min-w-0">
              <h3 className="font-semibold transition-colors">Generate Payment Link</h3>
              <p className="text-sm text-muted-foreground">Create shareable payment links</p>
            </div>
            <PaymentLinkGenerator
              trigger={
                <Button variant="success" className="w-full sm:w-auto">
                  <Link2 className="h-4 w-4 sm:mr-2" />
                  <span className="sm:inline">Generate</span>
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Today's Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            Today&apos;s Events
          </CardTitle>
          <CardDescription>
            Event attendance tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {staff.todays_events.length > 0 ? (
              staff.todays_events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center border border-border">
                      <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.time} • {event.location}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-success/30 text-success/80 bg-success/5">
                        {event.checked_in} checked in
                      </Badge>
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        {event.registered} registered
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No events scheduled for today</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Check-In Management - Dual List Panel */}
      <DualListPanel
        title="Check-In Management"
        description="Tap the circle to check players in or out"
        icon={ClipboardCheck}
        leftLabel="Pending"
        leftItems={pendingCheckIns}
        leftEmptyMessage="No pending check-ins"
        rightLabel="Checked In"
        rightItems={activeCheckIns}
        rightEmptyMessage="No active check-ins"
        onToggleItem={handleToggleCheckIn}
      />

      {/* Recent Registrations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            Recent Registrations
          </CardTitle>
          <CardDescription>
            Latest event sign-ups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {staff.recent_registrations.length > 0 ? (
              staff.recent_registrations.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {reg.participant_first_name} {reg.participant_last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{reg.event_title}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(reg.registered_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent registrations</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
