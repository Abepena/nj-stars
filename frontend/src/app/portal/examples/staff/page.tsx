"use client"

/**
 * Staff/Coach Dashboard Example
 *
 * #TODO: Fetch staff stats from /api/portal/staff/stats/
 * #TODO: Implement check-in management with QR scanning
 * #TODO: Fetch today's events from /api/events/?date=today
 * #TODO: Fetch pending check-ins from /api/portal/check-ins/?status=pending
 * #TODO: Implement check-in/check-out API calls
 * #TODO: Fetch full roster from /api/portal/players/
 * #TODO: Implement roster search/filter
 * #TODO: Fetch recent registrations from /api/registrations/
 * #TODO: Implement pending dues report
 * #TODO: Add attendance export functionality (CSV/PDF)
 * #TODO: Implement event creation for staff with permissions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Calendar,
  DollarSign,
  ClipboardCheck,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield,
  TrendingUp
} from "lucide-react"

// ==================== Mock Data ====================

const mockStaffData = {
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

// ==================== Main Component ====================

export default function StaffExamplePage() {
  const staff = mockStaffData

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Role Badge */}
      <Badge variant="outline" className="border-dashed border-border bg-background text-muted-foreground uppercase tracking-wide text-[11px]">
        <Shield className="h-3 w-3 mr-1 text-muted-foreground" />
        Staff View — Coach Mike Thompson
      </Badge>

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
            <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="hover:border-muted-foreground/30 transition-colors cursor-pointer">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center shrink-0 border border-primary/20">
              <ClipboardCheck className="h-6 w-6 text-primary/80" />
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

        <Card className="hover:border-muted-foreground/30 transition-colors cursor-pointer">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center shrink-0 border border-primary/20">
              <Users className="h-6 w-6 text-primary/80" />
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
      </div>

      {/* Today's Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            Today's Events
          </CardTitle>
          <CardDescription>
            Event attendance tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {staff.todays_events.map((event) => (
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
                    <Badge variant="outline" className="border-primary/30 text-primary/80 bg-primary/5">
                      {event.checked_in} checked in
                    </Badge>
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      {event.registered} registered
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Check-ins */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Pending Check-Ins
                </CardTitle>
                <CardDescription>
                  Awaiting check-in
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {staff.pending_check_ins.map((ci) => (
                <div
                  key={ci.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center border border-border">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{ci.participant_name}</p>
                      <p className="text-xs text-muted-foreground">{ci.event_title}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" className="gap-1">
                    <CheckCircle className="h-3 w-3 text-muted-foreground" />
                    Check In
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Check-ins */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success/80" />
              Currently Checked In
            </CardTitle>
            <CardDescription>
              Active participants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {staff.active_check_ins.map((ci) => (
                <div
                  key={ci.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-success/10 text-success/80 flex items-center justify-center border border-success/30">
                      <CheckCircle className="h-4 w-4 text-success/80" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{ci.participant_name}</p>
                      <p className="text-xs text-muted-foreground">
                        In since {new Date(ci.checked_in_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" className="text-success/90 border-success/40 hover:bg-success/10">
                    Check Out
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
            {staff.recent_registrations.map((reg) => (
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
