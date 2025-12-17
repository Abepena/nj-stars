"use client"

/**
 * Player Dashboard Example
 *
 * Fetches real data from /api/portal/player/dashboard/ with fallback to mock data.
 *
 * #TODO: QR check-in - player scans coach's event QR code to check in
 * #TODO: Implement dues payment functionality
 * #TODO: Add attendance-based rewards/credits for shop or event discounts

 * #TODO: Implement push notifications for upcoming events
 */

import { useState, useEffect } from "react"
import { ProfileEditModal } from "@/components/profile-edit-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Calendar,
  DollarSign,
  Trophy,
  MapPin,
  Clock,
  CheckCircle,
  User,
  Star,
  ChevronRight
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ==================== Types ====================

interface PlayerProfile {
  id: number
  first_name: string
  last_name: string
  age: number
  email: string
  team_name: string | null
  jersey_number: string
  position: string
  photo_url: string | null
}

interface PlayerStats {
  practices_attended: number
  practices_total: number
  tournaments_played: number
  games_this_season: number
}

interface CurrentEvent {
  title: string
  location: string
  checked_in_at: string
}

interface UpcomingEvent {
  id: number
  title: string
  date: string
  location: string
  type: 'practice' | 'tournament' | 'game'
}

interface Teammate {
  name: string
  number: string
  position: string
}

interface PlayerDashboardData {
  profile: PlayerProfile
  stats: PlayerStats
  dues_balance: string
  is_checked_in: boolean
  current_event: CurrentEvent | null
  upcoming_events: UpcomingEvent[]
  teammates: Teammate[]
}

// ==================== Mock Data ====================

const mockPlayerData: PlayerDashboardData = {
  profile: {
    id: 1,
    first_name: "Marcus",
    last_name: "Johnson",
    age: 14,
    email: "marcus.j@email.com",
    team_name: "8th Grade Elite",
    jersey_number: "23",
    position: "Point Guard",
    photo_url: null,
  },
  stats: {
    practices_attended: 12,
    practices_total: 15,
    tournaments_played: 3,
    games_this_season: 8,
  },
  dues_balance: "75.00",
  is_checked_in: true,
  current_event: {
    title: "Practice - 8th Grade Elite",
    location: "NJ Stars Training Center",
    checked_in_at: "2025-12-09T18:05:00Z",
  },
  upcoming_events: [
    { id: 1, title: "Practice - 8th Grade Elite", date: "2025-12-11T18:00:00Z", location: "NJ Stars Training Center", type: "practice" },
    { id: 2, title: "Holiday Classic - Day 1", date: "2025-12-14T09:00:00Z", location: "Rutgers Athletic Center", type: "tournament" },
    { id: 3, title: "Holiday Classic - Day 2", date: "2025-12-15T09:00:00Z", location: "Rutgers Athletic Center", type: "tournament" },
    { id: 4, title: "Practice - 8th Grade Elite", date: "2025-12-18T18:00:00Z", location: "NJ Stars Training Center", type: "practice" },
  ],
  teammates: [
    { name: "Tyler Smith", number: "11", position: "SG" },
    { name: "Devon Brown", number: "3", position: "SF" },
    { name: "Chris Lee", number: "24", position: "PF" },
    { name: "Jordan Davis", number: "5", position: "C" },
  ],
}

// ==================== Loading Skeleton ====================

function PlayerDashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <Skeleton className="h-6 w-48" />
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <Skeleton className="h-24 w-24 rounded-full mx-auto sm:mx-0" />
        <div className="flex-1 text-center sm:text-left">
          <Skeleton className="h-8 w-48 mb-2 mx-auto sm:mx-0" />
          <Skeleton className="h-5 w-64 mx-auto sm:mx-0" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
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
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== Main Component ====================

export default function PlayerExamplePage() {
  const [dashboard, setDashboard] = useState<PlayerDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [usingMockData, setUsingMockData] = useState(false)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE}/api/portal/player/dashboard/`, {
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
              id: data.profile?.id || 0,
              first_name: data.profile?.first_name || '',
              last_name: data.profile?.last_name || '',
              age: data.profile?.age || 0,
              email: data.profile?.email || '',
              team_name: data.profile?.team_name || null,
              jersey_number: data.profile?.jersey_number || '',
              position: data.profile?.position || '',
              photo_url: data.profile?.photo_url || null,
            },
            stats: data.stats || mockPlayerData.stats,
            dues_balance: data.dues_balance || '0.00',
            is_checked_in: data.is_checked_in || false,
            current_event: data.current_event || null,
            upcoming_events: data.upcoming_events || [],
            teammates: data.teammates || [],
          })
          setUsingMockData(false)
        } else {
          console.warn('Player dashboard API returned error, using mock data:', response.status)
          setDashboard(mockPlayerData)
          setUsingMockData(true)
        }
      } catch (error) {
        console.warn('Failed to fetch player dashboard, using mock data:', error)
        setDashboard(mockPlayerData)
        setUsingMockData(true)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (loading) {
    return <PlayerDashboardSkeleton />
  }

  if (!dashboard) {
    return <PlayerDashboardSkeleton />
  }

  const player = dashboard
  const balance = parseFloat(player.dues_balance)
  const attendanceRate = player.stats.practices_total > 0
    ? Math.round((player.stats.practices_attended / player.stats.practices_total) * 100)
    : 0

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Role Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="border-dashed border-border bg-background text-muted-foreground uppercase tracking-wide text-[11px]">
          Player View — {player.profile.first_name} {player.profile.last_name} (13+)
        </Badge>
        {usingMockData && (
          <Badge variant="outline" className="border-dashed border-amber-500/50 bg-amber-500/10 text-amber-600 uppercase tracking-wide text-[11px]">
            Demo Data
          </Badge>
        )}
      </div>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center shrink-0 mx-auto sm:mx-0 border border-border">
          <span className="text-3xl font-bold text-foreground">
            {player.profile.first_name.charAt(0)}{player.profile.last_name.charAt(0)}
          </span>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {player.profile.first_name} {player.profile.last_name}
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            #{player.profile.jersey_number} • {player.profile.position} • {player.profile.team_name || 'No Team'}
          </p>

          {/* Current Check-in Status */}
          {player.is_checked_in && player.current_event && (
            <Badge variant="outline" className="mt-3 border-dashed border-border text-muted-foreground gap-1 bg-transparent">
              <CheckCircle className="h-3 w-3 text-muted-foreground" />
              Checked in at {player.current_event.title}
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            <Progress value={attendanceRate} className="h-1 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {player.stats.practices_attended}/{player.stats.practices_total} practices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Tournaments</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{player.stats.tournaments_played}</div>
            <p className="text-xs text-muted-foreground">This season</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Games</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{player.stats.games_this_season}</div>
            <p className="text-xs text-muted-foreground">Played</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Dues</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              ${balance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {balance > 0 ? 'Balance due' : 'Paid up'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Event */}
      {player.is_checked_in && player.current_event && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success/80" />
              Currently Checked In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-lg">{player.current_event.title}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {player.current_event.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Since {new Date(player.current_event.checked_in_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              My Schedule
            </CardTitle>
            <CardDescription>Upcoming practices and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {player.upcoming_events.length > 0 ? (
                player.upcoming_events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-muted text-muted-foreground border border-border">
                      {event.type === 'tournament' ? <Trophy className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 border-border text-muted-foreground bg-muted/50">
                      {event.type === 'tournament' ? 'Tournament' : 'Practice'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming events</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Teammates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              My Teammates
            </CardTitle>
            <CardDescription>{player.profile.team_name || 'Team'} roster</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Current player highlighted */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border border-border">
                  <span className="font-bold text-foreground">
                    {player.profile.jersey_number}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{player.profile.first_name} {player.profile.last_name}</p>
                  <p className="text-sm text-muted-foreground">{player.profile.position}</p>
                </div>
                <Badge variant="outline" className="border-border text-muted-foreground bg-muted/50">You</Badge>
              </div>

              {player.teammates.length > 0 ? (
                player.teammates.map((teammate, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="font-medium text-muted-foreground">
                        {teammate.number}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{teammate.name}</p>
                      <p className="text-sm text-muted-foreground">{teammate.position}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No teammates found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ProfileEditModal
          player={{
            id: player.profile.id,
            first_name: player.profile.first_name,
            last_name: player.profile.last_name,
            email: player.profile.email,
            jersey_number: player.profile.jersey_number,
            position: player.profile.position,
          }}
          onSave={(updated) => {
            setDashboard((prev) =>
              prev
                ? {
                    ...prev,
                    profile: {
                      ...prev.profile,
                      first_name: updated.first_name,
                      last_name: updated.last_name,
                      email: updated.email || prev.profile.email,
                      jersey_number: updated.jersey_number || prev.profile.jersey_number,
                      position: updated.position || prev.profile.position,
                    },
                  }
                : prev
            )
          }}
          trigger={
            <Card className="hover:border-muted-foreground/30 transition-colors cursor-pointer group">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border group-hover:border-muted-foreground/30 transition-colors">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Edit My Profile</h3>
                  <p className="text-sm text-muted-foreground">Update photo and contact info</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          }
        />

        <Card className="hover:border-muted-foreground/30 transition-colors cursor-pointer group">
              <h3 className="font-medium">View Dues History</h3>
              <p className="text-sm text-muted-foreground">See charges and payments</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
