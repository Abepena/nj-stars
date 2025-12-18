"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChevronLeft,
  Search,
  AlertCircle,
  Users,
  Filter,
  CheckCircle,
  XCircle
} from "lucide-react"
import { BackToDashboard } from "@/components/back-to-dashboard"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ==================== Types ====================

interface Player {
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

export default function RosterPage() {
  const { data: session } = useSession()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [teamFilter, setTeamFilter] = useState<string>("all")

  useEffect(() => {
    async function fetchRoster() {
      if (!session) return

      try {
        setLoading(true)
        setError(null)

        const apiToken = (session as any)?.apiToken
        const response = await fetch(`${API_BASE}/api/portal/players/`, {
          headers: {
            "Authorization": `Token ${apiToken || ""}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setPlayers(data.results || data)
        } else if (response.status === 403) {
          setError("You don't have permission to access this page")
        } else {
          setError("Failed to load roster")
        }
      } catch (err) {
        console.error("Failed to fetch roster:", err)
        setError("Unable to connect to server")
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchRoster()
    }
  }, [session])

  // Get unique teams
  const teams = Array.from(new Set(players.map(p => p.team_name).filter(Boolean)))

  // Filter players
  const filteredPlayers = players.filter(p => {
    const matchesSearch =
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.jersey_number.includes(searchQuery)
    const matchesTeam = teamFilter === "all" || p.team_name === teamFilter
    return matchesSearch && matchesTeam
  })

  if (loading) {
    return <RosterSkeleton />
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

  const activePlayers = filteredPlayers.filter(p => p.is_active)
  const inactivePlayers = filteredPlayers.filter(p => !p.is_active)

  return (
    <div className="space-y-6">
      <BackToDashboard />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Player Roster</h1>
        <p className="text-muted-foreground mt-1">
          View all registered players across teams
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{players.length}</div>
            <p className="text-xs text-muted-foreground">Total Players</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {players.filter(p => p.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{teams.length}</div>
            <p className="text-xs text-muted-foreground">Teams</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {players.filter(p => parseFloat(p.dues_balance) > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">Balance Due</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or jersey number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roster Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {filteredPlayers.length} Player(s)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No players found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead className="hidden sm:table-cell">Team</TableHead>
                    <TableHead className="hidden md:table-cell">Position</TableHead>
                    <TableHead className="hidden md:table-cell">Age</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.map((player) => (
                    <PlayerRow key={player.id} player={player} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== Player Row ====================

function PlayerRow({ player }: { player: Player }) {
  const balance = parseFloat(player.dues_balance)

  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/portal/children/${player.id}`}
          className="flex items-center gap-3 hover:text-primary transition-colors"
        >
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            {player.primary_photo_url ? (
              <img
                src={player.primary_photo_url}
                alt={player.first_name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-foreground">
                {player.first_name[0]}{player.last_name[0]}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium">
              {player.first_name} {player.last_name}
              {player.jersey_number && (
                <span className="text-muted-foreground ml-1">#{player.jersey_number}</span>
              )}
            </p>
            <p className="text-sm text-muted-foreground sm:hidden">
              {player.team_name || 'No team'}
            </p>
          </div>
        </Link>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {player.team_name || (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {player.position || (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {player.age}
      </TableCell>
      <TableCell>
        {balance > 0 ? (
          <span className="text-amber-600 font-medium">${balance.toFixed(2)}</span>
        ) : balance < 0 ? (
          <span className="text-green-600">${Math.abs(balance).toFixed(2)} credit</span>
        ) : (
          <span className="text-green-600">$0.00</span>
        )}
      </TableCell>
      <TableCell>
        {player.is_active ? (
          <Badge variant="outline" className="bg-success/40 text-foreground border-success/50 gap-1">
            <CheckCircle className="h-3 w-3" />
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-muted/50 text-foreground border-border gap-1">
            <XCircle className="h-3 w-3" />
            Inactive
          </Badge>
        )}
      </TableCell>
    </TableRow>
  )
}

// ==================== Loading Skeleton ====================

function RosterSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-40" />

      <div>
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <Skeleton className="h-8 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-44" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
