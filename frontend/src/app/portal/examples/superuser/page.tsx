"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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

// ==================== Mock Data ====================

const mockSuperuserData = {
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

// ==================== Main Component ====================

export default function SuperuserExamplePage() {
  const admin = mockSuperuserData
  const revenueProgress = (admin.revenue.mtd / admin.revenue.mtd_goal) * 100
  const revenueChange = ((admin.revenue.mtd - admin.revenue.last_month) / admin.revenue.last_month * 100).toFixed(1)

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Role Badge */}
      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
        <Crown className="h-3 w-3 mr-1" />
        Superuser View — Full System Access
      </Badge>

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
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Month to Date</p>
              <p className="text-3xl font-bold text-primary">${admin.revenue.mtd.toLocaleString()}</p>
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
            <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
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
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="font-medium text-sm">User Management</p>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <p className="font-medium text-sm">Billing Admin</p>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <p className="font-medium text-sm">Orders</p>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <BarChart3 className="h-5 w-5 text-primary" />
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
              {admin.pending_issues.map((issue) => (
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
              ))}
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
              {admin.recent_activity.map((activity, idx) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Performing Events
          </CardTitle>
          <CardDescription>By registrations and revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {admin.top_events.map((event, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
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
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admin Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Django Admin</h3>
              <p className="text-sm text-muted-foreground">/django-admin/</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Crown className="h-6 w-6 text-primary" />
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
