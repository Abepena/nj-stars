"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { ExportButton } from "@/components/ui/export-button"
import {
  DollarSign,
  ChevronLeft,
  ChevronDown,
  Search,
  Users,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Loader2,
  AlertCircle,
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface CashPayment {
  id: number
  collected_by: number
  collected_by_name: string
  collected_at: string
  payment_for: string
  linked_item_description: string
  amount: string
  status: string
  status_display: string
  handed_off_to: number | null
  handed_off_to_name: string | null
  handed_off_at: string | null
  event: number | null
  notes: string
}

interface StaffCashSummary {
  staff_id: number
  staff_name: string
  staff_email: string
  total_collected: number
  total_handed_off: number
  pending_amount: number
  pending_count: number
}

interface Stats {
  totalPending: number
  totalHandedOff: number
  pendingCount: number
}

export default function CashReconciliationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data
  const [pendingCash, setPendingCash] = useState<CashPayment[]>([])
  const [staffSummary, setStaffSummary] = useState<StaffCashSummary[]>([])
  const [recentHistory, setRecentHistory] = useState<CashPayment[]>([])
  const [stats, setStats] = useState<Stats>({ totalPending: 0, totalHandedOff: 0, pendingCount: 0 })

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // UI State
  const [pendingExpanded, setPendingExpanded] = useState(true)
  const [staffExpanded, setStaffExpanded] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/portal/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    if (!session) return
    setLoading(true)
    setError(null)

    try {
      const apiToken = (session as any)?.apiToken
      const headers = {
        Authorization: apiToken ? `Token ${apiToken}` : "",
      }

      // Fetch pending cash, staff summary, and history in parallel
      const [pendingRes, staffRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/api/payments/cash/pending/`, { headers }),
        fetch(`${API_BASE}/api/payments/cash/by-staff/`, { headers }),
        fetch(`${API_BASE}/api/payments/cash/history/?page_size=20`, { headers }),
      ])

      if (!pendingRes.ok || !staffRes.ok || !historyRes.ok) {
        throw new Error("Failed to fetch cash data")
      }

      const [pendingData, staffData, historyData] = await Promise.all([
        pendingRes.json(),
        staffRes.json(),
        historyRes.json(),
      ])

      setPendingCash(pendingData.results || [])
      setStaffSummary(staffData.results || [])
      setRecentHistory(historyData.results || [])
      setStats({
        totalPending: pendingData.total_pending || 0,
        totalHandedOff: staffData.results?.reduce(
          (sum: number, s: StaffCashSummary) => sum + s.total_handed_off,
          0
        ) || 0,
        pendingCount: pendingData.count || 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleHandoff = async (cashId: number) => {
    setActionLoading(cashId)

    try {
      const apiToken = (session as any)?.apiToken
      const response = await fetch(`${API_BASE}/api/payments/cash/${cashId}/handoff/`, {
        method: "POST",
        headers: {
          Authorization: apiToken ? `Token ${apiToken}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        throw new Error("Failed to mark as handed off")
      }

      // Refresh data
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update")
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "collected":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "handed_off":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Handed Off
          </Badge>
        )
      case "deposited":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
            <DollarSign className="h-3 w-3 mr-1" />
            Deposited
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredHistory = recentHistory.filter((cash) => {
    const matchesSearch =
      searchQuery === "" ||
      cash.collected_by_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cash.linked_item_description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || cash.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Export columns
  const exportColumns = [
    { key: "collected_at", label: "Date" },
    { key: "collected_by_name", label: "Collected By" },
    { key: "payment_for", label: "Type" },
    { key: "linked_item_description", label: "Description" },
    { key: "amount", label: "Amount" },
    { key: "status_display", label: "Status" },
    { key: "handed_off_to_name", label: "Handed Off To" },
    { key: "notes", label: "Notes" },
  ]

  if (loading) {
    return <CashDashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/portal/dashboard/admin" className="hover:text-foreground">
          Admin
        </Link>
        <span>/</span>
        <span className="text-foreground">Cash Reconciliation</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cash Reconciliation</h1>
          <p className="text-muted-foreground">Track and reconcile cash payments collected by staff</p>
        </div>
        <Link href="/portal/dashboard/admin">
          <Button variant="outline">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="p-4 flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            {error}
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">${stats.totalPending.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Pending Handoff</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">${stats.totalHandedOff.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Handed Off</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.pendingCount}</div>
                <div className="text-xs text-muted-foreground">Pending Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Yet to be Collected (Pending) */}
      <Card>
        <Collapsible open={pendingExpanded} onOpenChange={setPendingExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    Cash Yet to be Collected
                  </CardTitle>
                  <CardDescription>
                    ${stats.totalPending.toFixed(2)} pending from {pendingCash.length} payments
                  </CardDescription>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    pendingExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {pendingCash.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending cash to collect. All payments have been handed off! ✓
                </p>
              ) : (
                <>
                  <div className="flex justify-end mb-4">
                    <ExportButton
                      data={pendingCash.map((c) => ({
                        ...c,
                        collected_at: format(new Date(c.collected_at), "yyyy-MM-dd HH:mm"),
                      }))}
                      columns={exportColumns}
                      filename="pending_cash"
                      sheetName="Pending Cash Payments"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Staff</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingCash.map((cash) => (
                          <TableRow key={cash.id}>
                            <TableCell className="text-sm">
                              {format(new Date(cash.collected_at), "MMM d, h:mm a")}
                            </TableCell>
                            <TableCell className="font-medium">{cash.collected_by_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {cash.payment_for}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {cash.linked_item_description}
                            </TableCell>
                            <TableCell className="text-right font-bold text-green-600">
                              ${parseFloat(cash.amount).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => handleHandoff(cash.id)}
                                disabled={actionLoading === cash.id}
                              >
                                {actionLoading === cash.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Mark Handed Off"
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Staff Breakdown */}
      <Card>
        <Collapsible open={staffExpanded} onOpenChange={setStaffExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Cash by Staff Member
                  </CardTitle>
                  <CardDescription>View cash totals per staff member</CardDescription>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    staffExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {staffSummary.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No cash payments recorded yet
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Member</TableHead>
                        <TableHead className="text-right">Total Collected</TableHead>
                        <TableHead className="text-right">Handed Off</TableHead>
                        <TableHead className="text-right">Pending</TableHead>
                        <TableHead className="text-right">Items Pending</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffSummary.map((staff) => (
                        <TableRow key={staff.staff_id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{staff.staff_name}</div>
                              <div className="text-xs text-muted-foreground">{staff.staff_email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            ${staff.total_collected.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            ${staff.total_handed_off.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-amber-600 font-medium">
                            ${staff.pending_amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {staff.pending_count > 0 && (
                              <Badge variant="secondary">{staff.pending_count}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Recent Cash History */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Recent Cash Transactions</CardTitle>
              <CardDescription>All cash payments across all staff</CardDescription>
            </div>
            <ExportButton
              data={filteredHistory.map((c) => ({
                ...c,
                collected_at: format(new Date(c.collected_at), "yyyy-MM-dd HH:mm"),
              }))}
              columns={exportColumns}
              filename="cash_history"
              sheetName="Cash Payment History"
            />
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by staff or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="collected">Pending</SelectItem>
                <SelectItem value="handed_off">Handed Off</SelectItem>
                <SelectItem value="deposited">Deposited</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No cash transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((cash) => (
                    <TableRow key={cash.id}>
                      <TableCell className="text-sm">
                        {format(new Date(cash.collected_at), "MMM d, h:mm a")}
                      </TableCell>
                      <TableCell className="font-medium">{cash.collected_by_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {cash.payment_for}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {cash.linked_item_description}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ${parseFloat(cash.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(cash.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            {cash.status === "collected" && (
                              <DropdownMenuItem onClick={() => handleHandoff(cash.id)}>
                                Mark Handed Off
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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

function CashDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-20 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
