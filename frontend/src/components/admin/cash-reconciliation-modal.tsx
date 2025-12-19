"use client"

import { useEffect, useState, ReactNode } from "react"
import { useSession } from "next-auth/react"
import { format, endOfMonth, isWithinInterval, subMonths } from "date-fns"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DollarSign,
  ChevronRight,
  ChevronDown,
  Search,
  Users,
  CheckCircle,
  Clock,
  MoreHorizontal,
  AlertCircle,
  CalendarIcon,
  Eye,
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

interface CashReconciliationModalProps {
  trigger?: ReactNode
  pendingCount?: number
}

export function CashReconciliationModal({ trigger, pendingCount = 0 }: CashReconciliationModalProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

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
  const [selectedTransaction, setSelectedTransaction] = useState<CashPayment | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [animatingIds, setAnimatingIds] = useState<Set<number>>(new Set())

  // Fetch data when sheet opens
  useEffect(() => {
    if (open && session) {
      fetchData()
    }
  }, [open, session])

  // Refetch when limit filter changes
  useEffect(() => {
    if (session && !loading && open) {
      fetchHistory()
    }
  }, [limitFilter])

  const fetchData = async (showLoading = true) => {
    if (!session) return
    if (showLoading) setLoading(true)
    setError(null)

    try {
      const apiToken = (session as any)?.apiToken
      const headers = {
        Authorization: apiToken ? `Token ${apiToken}` : "",
      }

      const pageSize = limitFilter === "all" ? 1000 : parseInt(limitFilter)

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
      if (showLoading) setLoading(false)
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
    setAnimatingIds(prev => new Set(prev).add(cashId))

    const cashPayment = pendingCash.find(c => c.id === cashId) || recentHistory.find(c => c.id === cashId)
    const amount = cashPayment ? parseFloat(cashPayment.amount) : 0

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

      setTimeout(() => {
        setPendingCash(prev => prev.filter(c => c.id !== cashId))
        setRecentHistory(prev => {
          const exists = prev.some(c => c.id === cashId)
          if (exists) {
            return prev.map(c =>
              c.id === cashId ? { ...c, status: "handed_off", status_display: "Handed Off" } : c
            )
          }
          if (cashPayment) {
            return [{ ...cashPayment, status: "handed_off", status_display: "Handed Off" }, ...prev]
          }
          return prev
        })
        setStats(prev => ({
          ...prev,
          totalPending: Math.max(0, prev.totalPending - amount),
          totalHandedOff: prev.totalHandedOff + amount,
          pendingCount: Math.max(0, prev.pendingCount - 1),
        }))

        setAnimatingIds(prev => {
          const next = new Set(prev)
          next.delete(cashId)
          return next
        })

        fetchData(false)
      }, 600)

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update")
      setAnimatingIds(prev => {
        const next = new Set(prev)
        next.delete(cashId)
        return next
      })
      fetchData(false)
    }
  }

  const handleUndoHandoff = async (cashId: number) => {
    const cashPayment = recentHistory.find(c => c.id === cashId)
    const amount = cashPayment ? parseFloat(cashPayment.amount) : 0

    if (cashPayment) {
      const revertedPayment = { ...cashPayment, status: "collected", status_display: "Collected", handed_off_to: null, handed_off_to_name: null, handed_off_at: null }
      setPendingCash(prev => [...prev, revertedPayment])
      setRecentHistory(prev => prev.map(c =>
        c.id === cashId ? revertedPayment : c
      ))
      setStats(prev => ({
        ...prev,
        totalPending: prev.totalPending + amount,
        totalHandedOff: Math.max(0, prev.totalHandedOff - amount),
        pendingCount: prev.pendingCount + 1,
      }))
    }

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

      fetchData(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update")
      fetchData(false)
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

    let matchesDateRange = true
    const cashDate = new Date(cash.collected_at)

    if (monthFilter && monthFilter !== "all") {
      const [year, month] = monthFilter.split("-").map(Number)
      const monthStart = new Date(year, month - 1, 1)
      const monthEnd = endOfMonth(monthStart)
      matchesDateRange = isWithinInterval(cashDate, { start: monthStart, end: monthEnd })
    } else {
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

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i)
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy"),
    }
  })

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

  // Default trigger if none provided
  const defaultTrigger = (
    <Card className={`hover:bg-muted/50 hover:border-foreground/20 transition-all cursor-pointer h-full group ${pendingCount > 0 ? "border-amber-500/30" : ""}`}>
      <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-muted group-hover:bg-success/30 flex items-center justify-center shrink-0 transition-colors">
          <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold transition-colors">Cash Reconciliation</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {pendingCount > 0 ? (
              <Badge variant="warning">
                {pendingCount} pending
              </Badge>
            ) : (
              <span className="truncate">Track and reconcile cash</span>
            )}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
      </CardContent>
    </Card>
  )

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {trigger || defaultTrigger}
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-4xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
              Cash Reconciliation
            </SheetTitle>
            <SheetDescription>
              Track and reconcile cash payments collected by staff
            </SheetDescription>
          </SheetHeader>

          {loading ? (
            <CashModalSkeleton />
          ) : (
            <div className="space-y-6">
              {error && (
                <Card className="border-red-500/50 bg-red-500/10">
                  <CardContent className="p-4 flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                  </CardContent>
                </Card>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-warning/30 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-foreground" />
                      </div>
                      <div>
                        <div className="text-lg font-bold">${stats.totalPending.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-success/40 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-foreground" />
                      </div>
                      <div>
                        <div className="text-lg font-bold">${stats.totalHandedOff.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Handed Off</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-info/40 flex items-center justify-center">
                        <Users className="h-4 w-4 text-foreground" />
                      </div>
                      <div>
                        <div className="text-lg font-bold">{stats.pendingCount}</div>
                        <div className="text-xs text-muted-foreground">Items</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Handoff Section */}
              <Card>
                <Collapsible open={pendingExpanded} onOpenChange={setPendingExpanded}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4 text-foreground" />
                            Pending Handoff
                          </CardTitle>
                          <CardDescription className="text-xs">
                            ${stats.totalPending.toFixed(2)} from {pendingCash.length} payments
                          </CardDescription>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            pendingExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {pendingCash.length === 0 ? (
                        <p className="text-center text-muted-foreground py-6 text-sm">
                          No pending cash to collect. All payments have been handed off!
                        </p>
                      ) : (
                        <>
                          <div className="flex justify-end mb-3">
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
                                  <TableHead className="text-xs">Date</TableHead>
                                  <TableHead className="text-xs">Staff</TableHead>
                                  <TableHead className="text-xs">Description</TableHead>
                                  <TableHead className="text-xs text-right">Amount</TableHead>
                                  <TableHead className="text-xs text-right">Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pendingCash.map((cash) => (
                                  <TableRow
                                    key={cash.id}
                                    className={`
                                      transition-all duration-500
                                      ${animatingIds.has(cash.id)
                                        ? "bg-green-500/10 opacity-70"
                                        : ""
                                      }
                                    `}
                                  >
                                    <TableCell className="text-xs">
                                      {format(new Date(cash.collected_at), "MMM d")}
                                    </TableCell>
                                    <TableCell className="text-xs font-medium">{cash.collected_by_name}</TableCell>
                                    <TableCell className="text-xs max-w-[150px] truncate">
                                      {cash.linked_item_description}
                                    </TableCell>
                                    <TableCell className="text-xs text-right font-bold text-green-600">
                                      ${parseFloat(cash.amount).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <button
                                        onClick={() => !animatingIds.has(cash.id) && handleHandoff(cash.id)}
                                        disabled={animatingIds.has(cash.id)}
                                        className={`
                                          h-6 w-6 rounded-full flex items-center justify-center
                                          transition-all duration-300 ease-out
                                          ${animatingIds.has(cash.id)
                                            ? "bg-green-500 border-2 border-green-500"
                                            : "bg-transparent border-2 border-muted-foreground/40 hover:border-green-500 hover:bg-green-500/10"
                                          }
                                        `}
                                      >
                                        <CheckCircle
                                          className={`
                                            h-4 w-4 transition-all duration-300
                                            ${animatingIds.has(cash.id)
                                              ? "text-white"
                                              : "text-muted-foreground/40"
                                            }
                                          `}
                                        />
                                      </button>
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
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4 text-foreground" />
                            By Staff
                          </CardTitle>
                          <CardDescription className="text-xs">Cash totals per staff member</CardDescription>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            staffExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {staffSummary.length === 0 ? (
                        <p className="text-center text-muted-foreground py-6 text-sm">
                          No cash payments recorded yet
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Staff</TableHead>
                                <TableHead className="text-xs text-right">Collected</TableHead>
                                <TableHead className="text-xs text-right">Handed Off</TableHead>
                                <TableHead className="text-xs text-right">Pending</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {staffSummary.map((staff) => (
                                <TableRow key={staff.staff_id}>
                                  <TableCell className="text-xs">
                                    <div className="font-medium">{staff.staff_name}</div>
                                  </TableCell>
                                  <TableCell className="text-xs text-right">
                                    ${staff.total_collected.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-xs text-right text-green-600">
                                    ${staff.total_handed_off.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-xs text-right text-amber-600 font-medium">
                                    ${staff.pending_amount.toFixed(2)}
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

              {/* Transaction History */}
              <Card>
                <CardHeader className="py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">Cash Transactions</CardTitle>
                      <CardDescription className="text-xs">All cash payments</CardDescription>
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
                  <div className="flex flex-col gap-3 mb-4">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 h-8 text-sm"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="collected">Pending</SelectItem>
                          <SelectItem value="handed_off">Handed Off</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={limitFilter} onValueChange={setLimitFilter}>
                        <SelectTrigger className="w-[100px] h-8 text-xs">
                          <SelectValue placeholder="Show" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">Last 10</SelectItem>
                          <SelectItem value="50">Last 50</SelectItem>
                          <SelectItem value="all">All</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Select
                        value={monthFilter}
                        onValueChange={(val) => {
                          setMonthFilter(val)
                          if (val) {
                            setDateStart("")
                            setDateEnd("")
                          }
                        }}
                      >
                        <SelectTrigger className="w-[150px] h-8 text-xs">
                          <CalendarIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                          <SelectValue placeholder="Month" />
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
                      {((monthFilter && monthFilter !== "all") || dateStart || dateEnd) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            setMonthFilter("all")
                            setDateStart("")
                            setDateEnd("")
                          }}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">
                    Showing {filteredHistory.length} of {recentHistory.length} transactions
                  </p>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Staff</TableHead>
                          <TableHead className="text-xs">Description</TableHead>
                          <TableHead className="text-xs text-right">Amount</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredHistory.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-20 text-center text-muted-foreground text-sm">
                              No cash transactions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredHistory.map((cash) => (
                            <TableRow key={cash.id}>
                              <TableCell className="text-xs">
                                {format(new Date(cash.collected_at), "MMM d")}
                              </TableCell>
                              <TableCell className="text-xs font-medium">{cash.collected_by_name}</TableCell>
                              <TableCell className="text-xs max-w-[120px] truncate">
                                {cash.linked_item_description}
                              </TableCell>
                              <TableCell className="text-xs text-right font-bold">
                                ${parseFloat(cash.amount).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-xs">{getStatusBadge(cash.status)}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
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
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-foreground" />
              Transaction Details
            </DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    ${parseFloat(selectedTransaction.amount).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {selectedTransaction.payment_for} Payment
                  </div>
                </div>
                {getStatusBadge(selectedTransaction.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
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
                          format(new Date(selectedTransaction.handed_off_at), "MMM d 'at' h:mm a")}
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
    </>
  )
}

function CashModalSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-16 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="py-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
