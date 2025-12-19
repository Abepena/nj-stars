"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, CheckCircle2, Mail, Phone, Shield } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

type Guardian = {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  relationship: string
  is_primary: boolean
}

type PlayerAdmin = {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  position: string | null
  jersey_number: string | null
  team_name: string | null
  guardians: Guardian[]
  waiver_signed: boolean
  created_at: string
}

export function ManageUsersSection() {
  const { data: session } = useSession()
  const [players, setPlayers] = useState<PlayerAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [waiverFilter, setWaiverFilter] = useState<"all" | "signed" | "unsigned">("all")

  useEffect(() => {
    if (!session) return

    const fetchRoster = async () => {
      try {
        setLoading(true)
        setError(null)
        const apiToken = (session as any)?.apiToken
        const url = new URL(`${API_BASE}/api/portal/admin/roster/`)
        if (waiverFilter !== "all") {
          url.searchParams.set("waiver", waiverFilter)
        }
        const res = await fetch(url.toString(), {
          headers: {
            Authorization: apiToken ? `Token ${apiToken}` : "",
            "Content-Type": "application/json",
          },
        })

        if (res.ok) {
          const data = await res.json()
          setPlayers(data || [])
        } else {
          setError("Unable to load users")
        }
      } catch (err) {
        console.error("Failed to load roster", err)
        setError("Unable to load users")
      } finally {
        setLoading(false)
      }
    }

    fetchRoster()
  }, [session, waiverFilter])

  const filteredPlayers = useMemo(() => {
    const term = search.trim().toLowerCase()
    return players.filter((p) => {
      if (!term) return true
      const guardianMatch = p.guardians?.some((g) =>
        `${g.first_name} ${g.last_name} ${g.email}`.toLowerCase().includes(term)
      )
      return (
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(term) ||
        (p.email && p.email.toLowerCase().includes(term)) ||
        guardianMatch
      )
    })
  }, [players, search])

  const guardianCount = useMemo(() => {
    const seen = new Set<string>()
    players.forEach((p) =>
      (p.guardians || []).forEach((g) => {
        if (g.email) {
          seen.add(g.email.toLowerCase())
        }
      })
    )
    return seen.size
  }, [players])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">{error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex-1 flex flex-wrap gap-2">
          <Badge variant="outline">Players: {players.length}</Badge>
          <Badge variant="outline">Guardians: {guardianCount}</Badge>
          <Badge variant="outline">Staff: n/a (admin only)</Badge>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <Input
            placeholder="Search users or guardians..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
          <select
            className="h-10 rounded-md border bg-transparent px-3 text-sm"
            value={waiverFilter}
            onChange={(e) => setWaiverFilter(e.target.value as any)}
          >
            <option value="all">All waivers</option>
            <option value="signed">Waiver signed</option>
            <option value="unsigned">Waiver not signed</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Guardians</TableHead>
                  <TableHead>Waiver</TableHead>
                  <TableHead className="text-right">Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-16 text-center text-sm text-muted-foreground">
                      No users match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlayers.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {player.first_name} {player.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {player.email || "No email on file"}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="secondary">Player</Badge>
                            {player.position && (
                              <Badge variant="outline">{player.position}</Badge>
                            )}
                            {player.jersey_number && (
                              <Badge variant="outline">#{player.jersey_number}</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {player.team_name ? (
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            {player.team_name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">No team</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {player.guardians?.length ? (
                            player.guardians.map((g) => (
                              <div key={g.email || g.id} className="flex items-center gap-2 text-xs">
                                <Badge variant={g.is_primary ? "default" : "outline"}>
                                  {g.relationship || "Guardian"}
                                </Badge>
                                <span className="font-medium">{g.first_name} {g.last_name}</span>
                                <span className="text-muted-foreground truncate">{g.email}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No guardians linked</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {player.waiver_signed ? (
                          <Badge variant="success" className="gap-1 text-xs">
                            <CheckCircle2 className="h-3 w-3" />
                            Signed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Not signed</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {player.email && (
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`mailto:${player.email}`}>
                                <Mail className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          {player.phone && (
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`tel:${player.phone}`}>
                                <Phone className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
