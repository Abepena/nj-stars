"use client"

/**
 * Superuser/Admin Dashboard Example
 *
 * Fetches real data from /api/portal/admin/dashboard/ with fallback to mock data.
 *
 * #TODO: Implement user management CRUD (/portal/admin/users)
 * #TODO: Implement billing admin tools (/portal/admin/billing)
 * #TODO: Fetch and display orders list (/portal/admin/orders)
 * #TODO: Implement reports generation (revenue, attendance, etc.)
 * #TODO: Implement issue resolution workflow
 * #TODO: Real-time activity feed via WebSocket
 * #TODO: Implement staff management (promote/demote users)
 * #TODO: Add Printify product management (/portal/admin/printify)
 * #TODO: Implement Stripe dashboard integration/links
 * #TODO: Add system settings management
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  Calendar,
  DollarSign,
  ClipboardCheck,
  ChevronRight,
  Crown,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  BarChart3,
  Settings,
  Shield,
  UserPlus,
  AlertTriangle
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ==================== Types ====================

interface SystemStats {
  total_users: number
  total_players: number
  total_staff: number
  active_subscriptions: number
}

interface Revenue {
  mtd: number
  mtd_goal: number
  last_month: number
  ytd: number
}

interface AdminStats {
  total_players: number
  todays_events: number
  pending_payments: number
  check_ins_today: number
}

interface PendingIssue {
  id: number
  type: string
  message: string
  priority: 'high' | 'medium' | 'low'
}

interface RecentActivity {
  action: string
  user: string
  target: string
  time: string
}

interface TopEvent {
  name: string
  registrations: number
  revenue: number
}

interface SuperuserDashboardData {
  profile: {
    name: string
    email: string
    role: string
  }
  system_stats: SystemStats
  revenue: Revenue
  admin_stats: AdminStats
  pending_issues: PendingIssue[]
  recent_activity: RecentActivity[]
  top_events: TopEvent[]
}

// ==================== Mock Data ====================

const mockSuperuserData: SuperuserDashboardData = {
  profile: {
    name: "Admin User",
    email: "admin@njstars.com",
    role: "superuser",
  },
  system_stats: {
    total_users: 156,
    total_players: 48,
    total_staff: 8,
    active_subscriptions: 32,
  },
  revenue: {
    mtd: 12450.00,
    mtd_goal: 15000.00,
    last_month: 14200.00,
    ytd: 142500.00,
  },
  admin_stats: {
    total_players: 48,
    todays_events: 3,
    pending_payments: 12,
    check_ins_today: 24,
  },
  pending_issues: [
    { id: 1, type: "payment", message: "Failed payment for Johnson family", priority: "high" },
    { id: 2, type: "registration", message: "Duplicate registration detected", priority: "medium" },
    { id: 3, type: "support", message: "Parent inquiry about refund", priority: "low" },
  ],
  recent_activity: [
    { action: "New registration", user: "Sarah Johnson", target: "Holiday Classic", time: "2 min ago" },
    { action: "Payment received", user: "Mike Davis", target: "$175.00", time: "15 min ago" },
    { action: "Staff login", user: "Coach Thompson", target: "Admin portal", time: "32 min ago" },
    { action: "Order placed", user: "Lisa Chen", target: "Team Jersey + Shorts", time: "1 hr ago" },
    { action: "New account", user: "David Wilson", target: "Parent registration", time: "2 hrs ago" },
  ],
  top_events: [
    { name: "Holiday Classic", registrations: 42, revenue: 4200 },
    { name: "Skills Clinic", registrations: 28, revenue: 1400 },
    { name: "Winter Camp", registrations: 24, revenue: 3600 },
  ],
}

// ==================== Loading Skeleton ====================

function SuperuserDashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <Skeleton className="h-6 w-56" />
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <Skeleton className="h-10 w-10 mx-auto mb-2 rounded-lg" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ==================== Main Component ====================

export default function SuperuserExamplePage() {
  const [dashboard, setDashboard] = useState<SuperuserDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [usingMockData, setUsingMockData] = useState(false)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE}/api/portal/admin/dashboard/`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          // Map API response to our interface
          setDashboard({
            profile: {
              name: data.profile?.full_name || data.profile?.name || 'Admin',
              email: data.profile?.email || '',
              role: data.profile?.role || 'superuser',
            },
            system_stats: data.system_stats || mockSuperuserData.system_stats,
            revenue: data.revenue || mockSuperuserData.revenue,
            admin_stats: data.admin_stats || mockSuperuserData.admin_stats,
            pending_issues: data.pending_issues || [],
            recent_activity: data.recent_activity || [],
            top_events: data.top_events || [],
          })
          setUsingMockData(false)
        } else {
          console.warn('Admin dashboard API returned error, using mock data:', response.status)
          setDashboard(mockSuperuserData)
          setUsingMockData(true)
        }
      } catch (error) {
        console.warn('Failed to fetch admin dashboard, using mock data:', error)
        setDashboard(mockSuperuserData)
        setUsingMockData(true)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (loading) {
    return <SuperuserDashboardSkeleton />
  }

  if (!dashboard) {
    return <SuperuserDashboardSkeleton />
  }

  const admin = dashboard
  const revenueProgress = (admin.revenue.mtd / admin.revenue.mtd_goal) * 100
  const revenueChange = ((admin.revenue.mtd - admin.revenue.last_month) / admin.revenue.last_month * 100).toFixed(1)

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Role Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="border-dashed border-amber-500/50 bg-amber-500/10 text-amber-600 uppercase tracking-wide text-[11px]">
          <Crown className="h-3 w-3 mr-1" />
          Superuser View — Full System Access
        </Badge>
        {usingMockData && (
          <Badge variant="outline" className="border-dashed border-amber-500/50 bg-amber-500/10 text-amber-600 uppercase tracking-wide text-[11px]">
            Demo Data
          </Badge>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Control Center</h1>
          <p className="text-muted-foreground mt-1">
            Full system overview and management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Revenue Card */}
      <Card className="bg-muted/30 border-border">
        <CardContent className="p-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Month to Date</p>
              <p className="text-3xl font-bold text-foreground">${admin.revenue.mtd.toLocaleString()}</p>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={revenueProgress} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground">{revenueProgress.toFixed(0)}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                of ${admin.revenue.mtd_goal.toLocaleString()} goal
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">vs Last Month</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">
                  {parseFloat(revenueChange) >= 0 ? '+' : ''}{revenueChange}%
                </p>
                <TrendingUp className={`h-5 w-5 ${parseFloat(revenueChange) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last month: ${admin.revenue.last_month.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Year to Date</p>
              <p className="text-2xl font-bold">${admin.revenue.ytd.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Total revenue
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
              <p className="text-2xl font-bold">{admin.system_stats.active_subscriptions}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Monthly recurring
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admin.system_stats.total_users}</div>
            <p className="text-xs text-muted-foreground">
              {admin.system_stats.total_staff} staff, {admin.system_stats.total_players} players
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Today&apos;s Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admin.admin_stats.todays_events}</div>
            <p className="text-xs text-muted-foreground">Scheduled today</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Dues</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{admin.admin_stats.pending_payments}</div>
            <p className="text-xs text-muted-foreground">Accounts with balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Check-ins Today</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{admin.admin_stats.check_ins_today}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="hover:border-muted-foreground/30 transition-colors cursor-pointer group">
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mx-auto mb-2 border border-border group-hover:border-muted-foreground/30 transition-colors">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-medium text-sm">User Management</p>
          </CardContent>
        </Card>
        <Card className="hover:border-muted-foreground/30 transition-colors cursor-pointer group">
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mx-auto mb-2 border border-border group-hover:border-muted-foreground/30 transition-colors">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-medium text-sm">Billing Admin</p>
          </CardContent>
        </Card>
        <Card className="hover:border-muted-foreground/30 transition-colors cursor-pointer group">
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mx-auto mb-2 border border-border group-hover:border-muted-foreground/30 transition-colors">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-medium text-sm">Orders</p>
          </CardContent>
        </Card>
        <Card className="hover:border-muted-foreground/30 transition-colors cursor-pointer group">
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mx-auto mb-2 border border-border group-hover:border-muted-foreground/30 transition-colors">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-medium text-sm">Reports</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Issues */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Pending Issues
              </CardTitle>
              <Badge variant="secondary">{admin.pending_issues.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {admin.pending_issues.length > 0 ? (
                admin.pending_issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        issue.priority === 'high' ? 'bg-red-500' :
                        issue.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium text-sm">{issue.message}</p>
                        <p className="text-xs text-muted-foreground capitalize">{issue.type}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      Resolve
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No pending issues</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>System-wide activity feed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {admin.recent_activity.length > 0 ? (
                admin.recent_activity.map((activity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{activity.action}</span>
                        <span className="text-muted-foreground"> by </span>
                        <span className="font-medium">{activity.user}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.target}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{activity.time}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            Top Performing Events
          </CardTitle>
          <CardDescription>By registrations and revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {admin.top_events.length > 0 ? (
              admin.top_events.map((event, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center font-bold text-muted-foreground border border-border">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{event.name}</p>
                      <p className="text-sm text-muted-foreground">{event.registrations} registrations</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${event.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">revenue</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No events data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Admin Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="hover:border-muted-foreground/30 transition-colors cursor-pointer group">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border group-hover:border-muted-foreground/30 transition-colors">
              <Shield className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Django Admin</h3>
              <p className="text-sm text-muted-foreground">/django-admin/</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="hover:border-muted-foreground/30 transition-colors cursor-pointer group">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border group-hover:border-muted-foreground/30 transition-colors">
              <Crown className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Wagtail CMS</h3>
              <p className="text-sm text-muted-foreground">/cms-admin/</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
