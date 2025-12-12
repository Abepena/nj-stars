"use client"

/**
 * Dashboard > Children Tab
 *
 * Re-exports the children management page for the dashboard tab navigation.
 */

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  Plus,
  Calendar,
  DollarSign,
  CheckCircle,
  ChevronRight,
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
  position: string
  jersey_number: string
  primary_photo_url: string | null
  is_active: boolean
  dues_balance: string
  upcoming_events_count: number
  is_checked_in: boolean
}

// ==================== Main Component ====================

export default function ChildrenPage() {
  const { data: session } = useSession()
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchChildren() {
      if (!session) return

      try {
        setLoading(true)
        setError(null)

        const accessToken = (session as any)?.accessToken
        const response = await fetch(`${API_BASE}/api/portal/players/`, {
          headers: {
            "Authorization": `Bearer ${accessToken || ""}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setChildren(data.results || data)
        } else {
          setError("Failed to load children data")
        }
      } catch (err) {
        console.error("Failed to fetch children:", err)
        setError("Unable to connect to server")
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchChildren()
    }
  }, [session])

  if (loading) {
    return <ChildrenListSkeleton />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Children</h1>
          <p className="text-muted-foreground mt-1">
            Manage your children's profiles, schedules, and dues
          </p>
        </div>
        <Link href="/portal/dashboard/children/add">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add Child
          </Button>
        </Link>
      </div>

      {/* Children Grid */}
      {children.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No children added yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add your child's profile to register them for events, track their schedule, and manage their dues.
            </p>
            <Link href="/portal/dashboard/children/add">
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Add Your First Child
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <ChildProfileCard key={child.id} child={child} />
          ))}
        </div>
      )}
    </div>
  )
}

// ==================== Child Profile Card ====================

function ChildProfileCard({ child }: { child: Child }) {
  const balance = parseFloat(child.dues_balance)
  const hasBalance = balance > 0

  return (
    <Link href={`/portal/dashboard/children/${child.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardContent className="p-5">
          {/* Header with avatar */}
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {child.primary_photo_url ? (
                <img
                  src={child.primary_photo_url}
                  alt={child.first_name}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-primary">
                  {child.first_name[0]}{child.last_name[0]}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold truncate">
                    {child.first_name} {child.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {child.team_name || `Age ${child.age}`}
                    {child.jersey_number && ` • #${child.jersey_number}`}
                  </p>
                </div>
                {child.is_checked_in && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 shrink-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold">{child.age}</div>
              <div className="text-xs text-muted-foreground">Years Old</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold flex items-center justify-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {child.upcoming_events_count}
              </div>
              <div className="text-xs text-muted-foreground">Events</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-semibold ${hasBalance ? 'text-amber-600' : 'text-green-600'}`}>
                ${Math.abs(balance).toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">
                {hasBalance ? 'Due' : 'Credit'}
              </div>
            </div>
          </div>

          {/* Balance Alert */}
          {hasBalance && (
            <div className="mt-3 flex items-center gap-2 p-2 rounded-md bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-sm">
              <DollarSign className="h-4 w-4 shrink-0" />
              <span>Balance due: ${balance.toFixed(2)}</span>
            </div>
          )}

          {/* View Profile Link */}
          <div className="flex items-center justify-end mt-4 text-sm text-primary">
            View Profile
            <ChevronRight className="h-4 w-4 ml-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// ==================== Loading Skeleton ====================

function ChildrenListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="text-center">
                    <Skeleton className="h-6 w-8 mx-auto mb-1" />
                    <Skeleton className="h-3 w-12 mx-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
