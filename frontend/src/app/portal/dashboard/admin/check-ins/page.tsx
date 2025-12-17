"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChevronLeft,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  LogOut,
  Loader2,
  User
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ==================== Types ====================

interface CheckIn {
  id: number
  event_registration: number
  event_title: string
  event_date: string
  participant_name: string
  checked_in_at: string | null
  checked_out_at: string | null
  is_checked_in: boolean
  is_checked_out: boolean
  notes: string
}

// ==================== Main Component ====================

export default function CheckInsPage() {
  const { data: session } = useSession()
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    fetchCheckIns()
  }, [session])

  async function fetchCheckIns() {
    if (!session) return

    try {
      setLoading(true)
      setError(null)

      const apiToken = (session as any)?.apiToken
      const response = await fetch(`${API_BASE}/api/portal/check-ins/`, {
        headers: {
          "Authorization": `Token ${apiToken || ""}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCheckIns(data.results || data)
      } else if (response.status === 403) {
        setError("You don't have permission to access this page")
      } else {
        setError("Failed to load check-ins")
      }
    } catch (err) {
      console.error("Failed to fetch check-ins:", err)
      setError("Unable to connect to server")
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (id: number) => {
    setActionLoading(id)
    try {
      const apiToken = (session as any)?.apiToken
      const response = await fetch(`${API_BASE}/api/portal/check-ins/${id}/check_in/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${apiToken || ""}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const updated = await response.json()
        setCheckIns(checkIns.map(ci =>
          ci.id === id ? { ...ci, ...updated } : ci
        ))
      }
    } catch (err) {
      console.error("Failed to check in:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCheckOut = async (id: number) => {
    setActionLoading(id)
    try {
      const apiToken = (session as any)?.apiToken
      const response = await fetch(`${API_BASE}/api/portal/check-ins/${id}/check_out/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${apiToken || ""}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const updated = await response.json()
        setCheckIns(checkIns.map(ci =>
          ci.id === id ? { ...ci, ...updated } : ci
        ))
      }
    } catch (err) {
      console.error("Failed to check out:", err)
    } finally {
      setActionLoading(null)
    }
  }

  // Filter check-ins
  const filteredCheckIns = checkIns.filter(ci =>
    ci.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ci.event_title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pendingCheckIns = filteredCheckIns.filter(ci => !ci.checked_in_at)
  const activeCheckIns = filteredCheckIns.filter(ci => ci.is_checked_in)
  const completedCheckIns = filteredCheckIns.filter(ci => ci.is_checked_out)

  if (loading) {
    return <CheckInsSkeleton />
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

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/portal/dashboard/admin"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Admin Dashboard
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Check-In Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage participant check-ins for events
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or event..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{pendingCheckIns.length}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{activeCheckIns.length}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-muted-foreground">{completedCheckIns.length}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingCheckIns.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Active ({activeCheckIns.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <LogOut className="h-4 w-4" />
            Completed ({completedCheckIns.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Check-Ins</CardTitle>
              <CardDescription>
                Participants awaiting check-in
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingCheckIns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No pending check-ins</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingCheckIns.map((ci) => (
                    <CheckInRow
                      key={ci.id}
                      checkIn={ci}
                      onCheckIn={handleCheckIn}
                      onCheckOut={handleCheckOut}
                      isLoading={actionLoading === ci.id}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Tab */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Check-Ins</CardTitle>
              <CardDescription>
                Currently checked-in participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeCheckIns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No active check-ins</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeCheckIns.map((ci) => (
                    <CheckInRow
                      key={ci.id}
                      checkIn={ci}
                      onCheckIn={handleCheckIn}
                      onCheckOut={handleCheckOut}
                      isLoading={actionLoading === ci.id}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Tab */}
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Completed Check-Ins</CardTitle>
              <CardDescription>
                Participants who have checked out
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedCheckIns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <LogOut className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No completed check-ins</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {completedCheckIns.map((ci) => (
                    <CheckInRow
                      key={ci.id}
                      checkIn={ci}
                      onCheckIn={handleCheckIn}
                      onCheckOut={handleCheckOut}
                      isLoading={actionLoading === ci.id}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ==================== Check-In Row ====================

function CheckInRow({
  checkIn: ci,
  onCheckIn,
  onCheckOut,
  isLoading
}: {
  checkIn: CheckIn
  onCheckIn: (id: number) => void
  onCheckOut: (id: number) => void
  isLoading: boolean
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
          ci.is_checked_in
            ? 'bg-green-100 text-green-600'
            : ci.is_checked_out
            ? 'bg-gray-100 text-gray-600'
            : 'bg-amber-100 text-amber-600'
        }`}>
          {ci.is_checked_in ? (
            <CheckCircle className="h-5 w-5" />
          ) : ci.is_checked_out ? (
            <LogOut className="h-5 w-5" />
          ) : (
            <Clock className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{ci.participant_name}</p>
          <p className="text-sm text-muted-foreground truncate">{ci.event_title}</p>
          {ci.checked_in_at && (
            <p className="text-xs text-muted-foreground">
              In: {new Date(ci.checked_in_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
              })}
              {ci.checked_out_at && (
                <> • Out: {new Date(ci.checked_out_at).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit'
                })}</>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!ci.checked_in_at && (
          <Button
            onClick={() => onCheckIn(ci.id)}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Check In
          </Button>
        )}
        {ci.is_checked_in && (
          <Button
            variant="outline"
            onClick={() => onCheckOut(ci.id)}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Check Out
          </Button>
        )}
        {ci.is_checked_out && (
          <Badge variant="secondary">Completed</Badge>
        )}
      </div>
    </div>
  )
}

// ==================== Loading Skeleton ====================

function CheckInsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-40" />

      <div>
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>

      <Skeleton className="h-10 w-72" />

      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <Skeleton className="h-8 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Skeleton className="h-10 w-80" />

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40 mb-1" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-10 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
