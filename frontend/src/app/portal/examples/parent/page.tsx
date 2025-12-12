"use client"

/**
 * Parent Dashboard Example
 *
 * #TODO: Fetch real dashboard data from /api/portal/dashboard/
 * #TODO: Fetch children list from /api/portal/players/
 * #TODO: Fetch upcoming events from /api/portal/registrations/
 * #TODO: Fetch dues balance from /api/portal/dues/
 * #TODO: Implement add child flow (/portal/children/add)
 * #TODO: Implement payment methods management (/portal/billing/payment-methods)
 * #TODO: Implement orders history (/portal/orders)
 * #TODO: Implement profile completion flow
 * #TODO: Fetch and display promo credits from /api/portal/credits/
 * #TODO: Real-time check-in status updates via WebSocket or polling
 */

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

// ==================== Mock Data ====================

const mockParentData = {
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
      team_name: "U15 Elite",
      primary_photo_url: null,
      is_active: true,
    },
    {
      id: 2,
      first_name: "Jaylen",
      last_name: "Johnson",
      age: 11,
      team_name: "U12 Select",
      primary_photo_url: null,
      is_active: true,
    }
  ],
  total_balance: "175.00",
  upcoming_events: [
    { player_name: "Marcus Johnson", event_title: "Practice - U15 Elite", event_date: "2025-12-11T18:00:00Z", registration_id: 101 },
    { player_name: "Jaylen Johnson", event_title: "Practice - U12 Select", event_date: "2025-12-11T17:00:00Z", registration_id: 102 },
    { player_name: "Marcus Johnson", event_title: "Tournament - Holiday Classic", event_date: "2025-12-14T09:00:00Z", registration_id: 103 },
    { player_name: "Jaylen Johnson", event_title: "Skills Clinic", event_date: "2025-12-15T10:00:00Z", registration_id: 104 },
  ],
  recent_orders: [
    { id: 1, total: "89.99", status: "delivered", created_at: "2025-12-01" },
  ],
  promo_credit_total: "25.00",
  active_check_ins: [
    { player_name: "Marcus Johnson", event_title: "Practice - U15 Elite", checked_in_at: "2025-12-09T18:05:00Z" }
  ],
}

// ==================== Main Component ====================

export default function ParentExamplePage() {
  const dashboard = mockParentData
  const balance = parseFloat(dashboard.total_balance)
  const promoCredits = parseFloat(dashboard.promo_credit_total)

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Role Badge */}
      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
        👨‍👩‍👧‍👦 Parent View — Sarah Johnson
      </Badge>

      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          Welcome back, Sarah!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your family
        </p>
      </div>

      {/* Profile Completion Nudge */}
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
          <Button variant="outline" size="sm">Complete</Button>
        </CardContent>
      </Card>

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

        <Card className="border-amber-500/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
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
            <div className="text-2xl font-bold text-green-600">${promoCredits.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Check-Ins Alert */}
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

      {/* Children Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Children</CardTitle>
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Child</span>
            </Button>
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
                  <Card key={child.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-lg font-bold text-primary">
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
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Button>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Make a Payment</h3>
              <p className="text-sm text-muted-foreground">Auto-pay on</p>
            </div>
          </CardContent>
        </Card>

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
      </div>
    </div>
  )
}
