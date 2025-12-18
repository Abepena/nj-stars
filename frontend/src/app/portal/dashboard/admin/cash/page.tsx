"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval, subMonths } from "date-fns"
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
import { Checkbox } from "@/components/ui/checkbox"
import { ExportButton } from "@/components/ui/export-button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  CalendarIcon,
  Eye,
} from "lucide-react"
import { BackToDashboard } from "@/components/back-to-dashboard"

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
  const [limitFilter, setLimitFilter] = useState<string>("10")
  const [dateStart, setDateStart] = useState<string>("")
  const [dateEnd, setDateEnd] = useState<string>("")
  const [monthFilter, setMonthFilter] = useState<string>("all")

  // UI State
  const [pendingExpanded, setPendingExpanded] = useState(true)
  const [staffExpanded, setStaffExpanded] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<CashPayment | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

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

  // Refetch when limit filter changes
  useEffect(() => {
    if (session && !loading) {
      fetchHistory()
    }
  }, [limitFilter])

  const fetchData = async () => {
    if (!session) return
    setLoading(true)
    setError(null)

    try {
      const apiToken = (session as any)?.apiToken
      const headers = {
        Authorization: apiToken ? `Token ${apiToken}` : "",
      }

      // Determine page size based on limit filter
      const pageSize = limitFilter === "all" ? 1000 : parseInt(limitFilter)

      // Fetch pending cash, staff summary, and history in parallel
      const [pendingRes, staffRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/api/payments/cash/pending/`, { headers }),
        fetch(`${API_BASE}/api/payments/cash/by-staff/`, { headers }),
        fetch(`${API_BASE}/api/payments/cash/history/?page_size=${pageSize}`, { headers }),
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

  const fetchHistory = async () => {
    if (!session) return

    try {
      const apiToken = (session as any)?.apiToken
      const headers = {
        Authorization: apiToken ? `Token ${apiToken}` : "",
      }

      const pageSize = limitFilter === "all" ? 1000 : parseInt(limitFilter)
      const historyRes = await fetch(`${API_BASE}/api/payments/cash/history/?page_size=${pageSize}`, { headers })

      if (historyRes.ok) {
        const historyData = await historyRes.json()
        setRecentHistory(historyData.results || [])
      }
    } catch (err) {
      console.error("Failed to fetch history:", err)
    }
  }

  const handleViewDetails = (cash: CashPayment) => {
    setSelectedTransaction(cash)
    setDetailsOpen(true)
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

  const handleUndoHandoff = async (cashId: number) => {
    setActionLoading(cashId)

    try {
      const apiToken = (session as any)?.apiToken
      const response = await fetch(`${API_BASE}/api/payments/cash/${cashId}/undo-handoff/`, {
        method: "POST",
        headers: {
          Authorization: apiToken ? `Token ${apiToken}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        throw new Error("Failed to undo handoff")
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
          <Badge variant="outline" className="bg-warning/30 text-foreground border-warning/40">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "handed_off":
        return (
          <Badge variant="outline" className="bg-success/40 text-foreground border-success/50">
            <CheckCircle className="h-3 w-3 mr-1" />
            Handed Off
          </Badge>
        )
      case "deposited":
        return (
          <Badge variant="outline" className="bg-info/40 text-foreground border-info/50">
            <DollarSign className="h-3 w-3 mr-1" />
            Deposited
          </Badge>
        )
      default:
        return <Badge variant="muted">{status}</Badge>
    }
  }

  const filteredHistory = recentHistory.filter((cash) => {
    const matchesSearch =
      searchQuery === "" ||
      cash.collected_by_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cash.linked_item_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      format(new Date(cash.collected_at), "yyyy-MM-dd").includes(searchQuery)

    const matchesStatus = statusFilter === "all" || cash.status === statusFilter

    // Date range filtering
    let matchesDateRange = true
    const cashDate = new Date(cash.collected_at)

    // If month filter is set (and not "all"), use that
    if (monthFilter && monthFilter !== "all") {
      const [year, month] = monthFilter.split("-").map(Number)
      const monthStart = new Date(year, month - 1, 1)
      const monthEnd = endOfMonth(monthStart)
      matchesDateRange = isWithinInterval(cashDate, { start: monthStart, end: monthEnd })
    } else {
      // Otherwise use custom date range if set
      if (dateStart) {
        const startDate = new Date(dateStart)
        startDate.setHours(0, 0, 0, 0)
        if (cashDate < startDate) matchesDateRange = false
      }
      if (dateEnd && matchesDateRange) {
        const endDate = new Date(dateEnd)
        endDate.setHours(23, 59, 59, 999)
        if (cashDate > endDate) matchesDateRange = false
      }
    }

    return matchesSearch && matchesStatus && matchesDateRange
  })

  // Generate month options for the last 12 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i)
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy"),
    }
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
        <BackToDashboard />
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
              <div className="h-10 w-10 rounded-full bg-warning/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-foreground" />
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
              <div className="h-10 w-10 rounded-full bg-success/40 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-foreground" />
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
              <div className="h-10 w-10 rounded-full bg-info/40 flex items-center justify-center">
                <Users className="h-5 w-5 text-foreground" />
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
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-foreground" />
                    Pending Handoff
                  </CardTitle>
                  <CardDescription>
                    ${stats.totalPending.toFixed(2)} from {pendingCash.length} payments
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
                              <Badge variant="muted" className="capitalize">
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
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-sm text-muted-foreground">Collected</span>
                                {actionLoading === cash.id ? (
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                ) : (
                                  <Checkbox
                                    checked={false}
                                    onCheckedChange={() => handleHandoff(cash.id)}
                                    className="h-5 w-5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 transition-all duration-200"
                                  />
                                )}
                              </div>
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
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-foreground" />
                    By Staff
                  </CardTitle>
                  <CardDescription>Cash totals per staff member</CardDescription>
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
              <CardTitle>Cash Transactions</CardTitle>
              <CardDescription>All cash payments</CardDescription>
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
          {/* Filters Row 1: Search, Status, Limit */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by staff, description, or date (YYYY-MM-DD)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="collected">Pending</SelectItem>
                <SelectItem value="handed_off">Handed Off</SelectItem>
                <SelectItem value="deposited">Deposited</SelectItem>
              </SelectContent>
            </Select>
            <Select value={limitFilter} onValueChange={setLimitFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Show" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">Last 10</SelectItem>
                <SelectItem value="50">Last 50</SelectItem>
                <SelectItem value="100">Last 100</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filters Row 2: Date Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Select
              value={monthFilter}
              onValueChange={(val) => {
                setMonthFilter(val)
                // Clear custom date range when selecting month
                if (val) {
                  setDateStart("")
                  setDateEnd("")
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Or date range:</span>
              <Input
                type="date"
                value={dateStart}
                onChange={(e) => {
                  setDateStart(e.target.value)
                  setMonthFilter("all") // Clear month when using custom range
                }}
                className="flex-1"
                placeholder="Start date"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={dateEnd}
                onChange={(e) => {
                  setDateEnd(e.target.value)
                  setMonthFilter("all") // Clear month when using custom range
                }}
                className="flex-1"
                placeholder="End date"
              />
            </div>
            {((monthFilter && monthFilter !== "all") || dateStart || dateEnd) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMonthFilter("all")
                  setDateStart("")
                  setDateEnd("")
                }}
              >
                Clear dates
              </Button>
            )}
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground mb-4">
            Showing {filteredHistory.length} of {recentHistory.length} transactions
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
                            <DropdownMenuItem onClick={() => handleViewDetails(cash)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {cash.status === "collected" && (
                              <DropdownMenuItem onClick={() => handleHandoff(cash.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Handed Off
                              </DropdownMenuItem>
                            )}
                            {cash.status === "handed_off" && (
                              <DropdownMenuItem onClick={() => handleUndoHandoff(cash.id)}>
                                <Clock className="h-4 w-4 mr-2" />
                                Undo Handoff
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

      {/* View Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-foreground" />
              Transaction Details
            </DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              {/* Amount & Status */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    ${parseFloat(selectedTransaction.amount).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {selectedTransaction.payment_for} Payment
                  </div>
                </div>
                {getStatusBadge(selectedTransaction.status)}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Collected By</div>
                  <div className="font-medium">{selectedTransaction.collected_by_name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Collected At</div>
                  <div className="font-medium">
                    {format(new Date(selectedTransaction.collected_at), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground">Description</div>
                  <div className="font-medium">{selectedTransaction.linked_item_description}</div>
                </div>
                {selectedTransaction.handed_off_to_name && (
                  <>
                    <div>
                      <div className="text-xs text-muted-foreground">Handed Off To</div>
                      <div className="font-medium">{selectedTransaction.handed_off_to_name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Handed Off At</div>
                      <div className="font-medium">
                        {selectedTransaction.handed_off_at &&
                          format(new Date(selectedTransaction.handed_off_at), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                  </>
                )}
                {selectedTransaction.notes && (
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground">Notes</div>
                    <div className="font-medium">{selectedTransaction.notes}</div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                {selectedTransaction.status === "collected" && (
                  <Button
                    onClick={() => {
                      handleHandoff(selectedTransaction.id)
                      setDetailsOpen(false)
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Handed Off
                  </Button>
                )}
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
