"use client"

/**
 * Parent Dashboard
 *
 * Fetches real data from /api/portal/dashboard/ with fallback to mock data.
 * Authentication is handled by NextAuth session cookies.
 */

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  Calendar,
  DollarSign,
  CreditCard,
  ShoppingBag,
  Gift,
  CheckCircle,
  ChevronRight,
  Plus,
  AlertCircle,
  Loader2
} from "lucide-react"
import type {
  ParentDashboard,
  PlayerSummary,
  UpcomingEvent,
  ActiveCheckIn,
  RecentOrder
} from "@/lib/api-client"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ==================== Mock Data (Fallback) ====================

const mockParentData: ParentDashboard = {
  profile: {
    id: 1,
    email: "sarah.johnson@email.com",
    full_name: "Sarah Johnson",
    role: "parent",
    auto_pay_enabled: true,
    profile_completeness: 85,
  },
  children: [
    {
      id: 1,
      first_name: "Marcus",
      last_name: "Johnson",
      age: 14,
      team_name: "8th Grade Elite",
      primary_photo_url: null,
      is_active: true,
    },
    {
      id: 2,
      first_name: "Jaylen",
      last_name: "Johnson",
      age: 11,
      team_name: "6th Grade Select",
      primary_photo_url: null,
      is_active: true,
    }
  ],
  total_balance: "50.00",
  upcoming_events: [
    { player_name: "Marcus Johnson", event_title: "Practice - 8th Grade Elite", event_date: "2025-12-11T18:00:00Z", registration_id: 101 },
    { player_name: "Jaylen Johnson", event_title: "Practice - 6th Grade Select", event_date: "2025-12-11T17:00:00Z", registration_id: 102 },
    { player_name: "Marcus Johnson", event_title: "Tournament - Holiday Classic", event_date: "2025-12-14T09:00:00Z", registration_id: 103 },
    { player_name: "Jaylen Johnson", event_title: "Skills Clinic", event_date: "2025-12-15T10:00:00Z", registration_id: 104 },
  ],
  recent_orders: [
    { id: 1, total: "89.99", status: "delivered", created_at: "2025-12-01" },
  ],
  promo_credit_total: "25.00",
  active_check_ins: [
    { player_name: "Marcus Johnson", event_title: "Practice - 8th Grade Elite", checked_in_at: "2025-12-09T18:05:00Z" }
  ],
}

// ==================== Main Component ====================

export default function ParentExamplePage() {
  const { data: session } = useSession()
  const [dashboard, setDashboard] = useState<ParentDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [usingMockData, setUsingMockData] = useState(false)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true)

        const response = await fetch(`${API_BASE}/api/portal/dashboard/`, {
          credentials: 'include', // Include cookies for session auth
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setDashboard(data)
          setUsingMockData(false)
        } else {
          // API returned error, use mock data
          console.warn('Dashboard API returned error, using mock data:', response.status)
          setDashboard(mockParentData)
          setUsingMockData(true)
        }
      } catch (error) {
        // Network error or CORS issue, use mock data
        console.warn('Failed to fetch dashboard, using mock data:', error)
        setDashboard(mockParentData)
        setUsingMockData(true)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!dashboard) {
    return null
  }

  const balance = parseFloat(dashboard.total_balance)
  const promoCredits = parseFloat(dashboard.promo_credit_total)
  const firstName = dashboard.profile.full_name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Role Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="border-dashed border-border bg-background text-muted-foreground uppercase tracking-wide text-[11px]">
          Parent View — {dashboard.profile.full_name || dashboard.profile.email}
        </Badge>
        {usingMockData && (
          <Badge variant="outline" className="border-dashed border-amber-500/50 text-amber-500 text-[10px]">
            Demo Data
          </Badge>
        )}
      </div>

      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          Welcome back, {firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your family
        </p>
      </div>

      {/* Profile Completion Nudge */}
      {dashboard.profile.profile_completeness < 100 && (
        <Card className="border border-dashed border-border bg-muted/40">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-background border border-border flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Complete your profile</p>
                <p className="text-sm text-muted-foreground">
                  {dashboard.profile.profile_completeness}% complete - fill in details to speed up registrations
                </p>
              </div>
            </div>
            <Link href="/portal/profile">
              <Button variant="default" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/85">
                Complete
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Children</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.children.length}</div>
            <p className="text-xs text-muted-foreground">
              {dashboard.children.filter(c => c.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.upcoming_events.length}</div>
            <p className="text-xs text-muted-foreground truncate">
              {dashboard.upcoming_events[0]?.event_title || "None scheduled"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              ${balance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Due</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Credits</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">${promoCredits.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Check-Ins Alert */}
      {dashboard.active_check_ins.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success/80" />
              <span className="font-semibold">Active Check-Ins</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboard.active_check_ins.map((ci, idx) => (
                <div key={idx} className="flex items-center justify-between py-2">
                  <div>
                    <span className="font-medium">{ci.player_name}</span>
                    <span className="text-muted-foreground"> — {ci.event_title}</span>
                  </div>
                  <Badge variant="outline" className="border-success/30 text-success/80 bg-success/10">
                    Checked In
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Children Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Children</CardTitle>
            <Link href="/portal/children/add">
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Child</span>
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4 flex-wrap h-auto gap-1">
              <TabsTrigger value="all" className="text-sm">All</TabsTrigger>
              {dashboard.children.map((child) => (
                <TabsTrigger key={child.id} value={child.id.toString()} className="text-sm">
                  {child.first_name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboard.children.map((child) => (
                  <Link key={child.id} href={`/portal/children/${child.id}`}>
                    <Card className="hover:border-muted-foreground/30 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
                            <span className="text-lg font-semibold text-foreground">
                              {child.first_name[0]}{child.last_name[0]}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium truncate">{child.first_name} {child.last_name}</h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {child.team_name || `Age ${child.age}`}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Upcoming Events</CardTitle>
            <Link href="/portal/registrations">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboard.upcoming_events.slice(0, 5).map((event, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{event.event_title}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.player_name} — {new Date(event.event_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <Badge variant="outline" className="ml-2 shrink-0 border-border text-muted-foreground bg-muted/50">
                  Registered
                </Badge>
              </div>
            ))}
            {dashboard.upcoming_events.length === 0 && (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No upcoming events. <Link href="/events" className="text-primary hover:underline">Browse events</Link>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/portal/billing">
          <Card className="hover:border-muted-foreground/30 transition-colors cursor-pointer h-full group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border group-hover:border-muted-foreground/30 transition-colors">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">Make a Payment</h3>
                <p className="text-sm text-muted-foreground">
                  {dashboard.profile.auto_pay_enabled ? 'Auto-pay on' : 'Auto-pay off'}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/orders">
          <Card className="hover:border-muted-foreground/30 transition-colors cursor-pointer h-full group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border group-hover:border-muted-foreground/30 transition-colors">
                <ShoppingBag className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">View Orders</h3>
                <p className="text-sm text-muted-foreground">
                  {dashboard.recent_orders.length} recent orders
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/billing/payment-methods">
          <Card className="hover:border-muted-foreground/30 transition-colors cursor-pointer h-full group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border group-hover:border-muted-foreground/30 transition-colors">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">Payment Methods</h3>
                <p className="text-sm text-muted-foreground">Manage saved cards</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

// ==================== Loading Skeleton ====================

function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Role Badge */}
      <Skeleton className="h-6 w-48" />

      {/* Header */}
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-48 mt-2" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-16 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Children Section */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24 mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Events Section */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-lg border">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64 mt-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
