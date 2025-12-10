"use client"

import { useEffect, useState } from "react"
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
  AlertCircle
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ==================== Types ====================

interface Child {
  id: number
  first_name: string
  last_name: string
  age: number
  team_name: string
  primary_photo_url: string | null
  is_active: boolean
}

interface UpcomingEvent {
  player_name: string
  event_title: string
  event_date: string
  registration_id: number
}

interface ActiveCheckIn {
  player_name: string
  event_title: string
  checked_in_at: string
}

interface UserProfile {
  id: number
  email: string
  full_name: string
  role: string
  auto_pay_enabled: boolean
  profile_completeness: number
}

interface DashboardData {
  profile: UserProfile
  children: Child[]
  total_balance: string
  auto_pay_enabled: boolean
  upcoming_events: UpcomingEvent[]
  recent_orders: any[]
  promo_credit_total: string
  active_check_ins: ActiveCheckIn[]
}

// ==================== Main Component ====================

export default function ParentDashboard() {
  const { data: session } = useSession()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedChild, setSelectedChild] = useState<string>("all")

  useEffect(() => {
    async function fetchDashboard() {
      if (!session) return

      try {
        setLoading(true)
        setError(null)

        const accessToken = (session as any)?.accessToken
        const response = await fetch(`${API_BASE}/api/portal/dashboard/`, {
          headers: {
            "Authorization": `Bearer ${accessToken || ""}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setDashboard(data)
        } else {
          setError("Failed to load dashboard data")
        }
      } catch (err) {
        console.error("Failed to fetch dashboard:", err)
        setError("Unable to connect to server")
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchDashboard()
    }
  }, [session])

  if (loading) {
    return <DashboardSkeleton />
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

  if (!dashboard) {
    return null
  }

  const balance = parseFloat(dashboard.total_balance)
  const promoCredits = parseFloat(dashboard.promo_credit_total)
  const firstName = session?.user?.name?.split(" ")[0] || "there"

  return (
    <div className="space-y-6 sm:space-y-8">
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
      {dashboard.profile.profile_completeness < 80 && (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Complete your profile</p>
                <p className="text-sm text-muted-foreground">
                  {dashboard.profile.profile_completeness}% complete - fill in details to speed up registrations
                </p>
              </div>
            </div>
            <Link href="/portal/profile">
              <Button variant="outline" size="sm">Complete</Button>
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

        <Card className={balance > 0 ? "border-amber-500/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance > 0 ? "text-amber-600" : "text-green-600"}`}>
              ${Math.abs(balance).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {balance > 0 ? "Due" : balance < 0 ? "Credit" : "Paid up!"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Credits</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${promoCredits.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Check-Ins Alert */}
      {dashboard.active_check_ins.length > 0 && (
        <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              Active Check-Ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboard.active_check_ins.map((ci, idx) => (
                <div key={idx} className="flex items-center justify-between py-1">
                  <div>
                    <span className="font-medium">{ci.player_name}</span>
                    <span className="text-muted-foreground"> — {ci.event_title}</span>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 border-green-300">
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
          {dashboard.children.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No children added yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your child's profile to register for events and manage their account
              </p>
              <Link href="/portal/children/add">
                <Button>Add Your First Child</Button>
              </Link>
            </div>
          ) : (
            <Tabs value={selectedChild} onValueChange={setSelectedChild}>
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
                    <ChildCard key={child.id} child={child} />
                  ))}
                </div>
              </TabsContent>

              {dashboard.children.map((child) => (
                <TabsContent key={child.id} value={child.id.toString()}>
                  <ChildDetailView
                    child={child}
                    events={dashboard.upcoming_events.filter(e =>
                      e.player_name === `${child.first_name} ${child.last_name}`
                    )}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      {dashboard.upcoming_events.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Events</CardTitle>
              <Link href="/portal/children">
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
                  <Badge className="ml-2 shrink-0">Registered</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/portal/billing">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Make a Payment</h3>
                <p className="text-sm text-muted-foreground">
                  {dashboard.auto_pay_enabled ? "Auto-pay on" : "Set up auto-pay"}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/orders">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-6 w-6 text-primary" />
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
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <CreditCard className="h-6 w-6 text-primary" />
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

// ==================== Child Components ====================

function ChildCard({ child }: { child: Child }) {
  return (
    <Link href={`/portal/children/${child.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {child.primary_photo_url ? (
                <img
                  src={child.primary_photo_url}
                  alt={child.first_name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-primary">
                  {child.first_name[0]}{child.last_name[0]}
                </span>
              )}
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
  )
}

function ChildDetailView({ child, events }: { child: Child; events: UpcomingEvent[] }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
          {child.primary_photo_url ? (
            <img
              src={child.primary_photo_url}
              alt={child.first_name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-primary">
              {child.first_name[0]}{child.last_name[0]}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold">{child.first_name} {child.last_name}</h3>
          <p className="text-muted-foreground">
            {child.team_name && `${child.team_name} • `}Age {child.age}
          </p>
        </div>
        <Link href={`/portal/children/${child.id}`}>
          <Button variant="outline">View Profile</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events</p>
            ) : (
              <ul className="space-y-2">
                {events.slice(0, 3).map((event, idx) => (
                  <li key={idx} className="text-sm flex justify-between">
                    <span className="truncate">{event.event_title}</span>
                    <span className="text-muted-foreground shrink-0 ml-2">
                      {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/portal/children/${child.id}/schedule`} className="block">
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Calendar className="h-4 w-4" /> View Schedule
              </Button>
            </Link>
            <Link href={`/portal/children/${child.id}/dues`} className="block">
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <DollarSign className="h-4 w-4" /> View Dues
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ==================== Loading Skeleton ====================

function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Children */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
