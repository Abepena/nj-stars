"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Calendar,
  Package,
  DollarSign,
  ClipboardCheck,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Clock,
  CheckCircle,
  MessageSquare,
  HelpCircle,
  CreditCard,
  Settings,
  AlertTriangle,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  FileText,
  BarChart3,
  ExternalLink,
  Activity,
  Send,
  Mail,
  Loader2,
  Check,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { DualListPanel, DualListItem } from "@/components/dashboard/dual-list-panel"
import { PaymentLinkGenerator } from "@/components/payment-link-generator"
import { MerchDropModal } from "@/components/admin/merch-drop-modal"
import { CashReconciliationModal } from "@/components/admin/cash-reconciliation-modal"
import { PriorityDropdown, type Priority } from "@/components/ui/priority-dropdown"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ==================== Types ====================

interface AdminStats {
  total_players: number
  todays_events: number
  pending_payments: number
  check_ins_today: number
  pending_cash_handoffs: number
}

interface PendingCheckIn {
  id: number
  event_title: string
  participant_name: string
  event_date: string
}

interface ActiveCheckIn {
  id: number
  participant_name: string
  event_title: string
  checked_in_at: string
}

interface RecentRegistration {
  id: number
  participant_first_name: string
  participant_last_name: string
  event_title: string
  registered_at: string
}

interface ContactSubmission {
  id: number
  name: string
  email: string
  category: string
  subject: string
  message: string
  priority: Priority
  status: string
  created_at: string
  time_since_created: string
}

interface StaffDashboardData {
  admin_stats: AdminStats
  pending_check_ins: PendingCheckIn[]
  active_check_ins: ActiveCheckIn[]
  recent_registrations: RecentRegistration[]
}

// Category icons mapping
const CATEGORY_ICONS: Record<string, typeof HelpCircle> = {
  general: HelpCircle,
  registration: MessageCircle,
  payments: CreditCard,
  portal: Settings,
  technical: AlertTriangle,
  feedback: MessageSquare,
  other: HelpCircle,
}

// #TODO: Styles for unimplemented features - change to normal styling once wired up
const TODO_CARD_STYLES = "border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50"
const TODO_ICON_BG = "bg-rose-500/10"
const TODO_ICON_COLOR = "text-rose-400"
const TODO_BADGE = "bg-rose-100 text-rose-700 border-rose-200"

// ==================== Main Component ====================

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [data, setData] = useState<StaffDashboardData | null>(null)
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([])
  const [totalNewIssues, setTotalNewIssues] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Contact submission reply state
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [replySuccess, setReplySuccess] = useState(false)

  // Check-in management state
  const [pendingCheckIns, setPendingCheckIns] = useState<DualListItem[]>([])
  const [activeCheckIns, setActiveCheckIns] = useState<DualListItem[]>([])

  // Initialize check-in lists when data loads
  useEffect(() => {
    if (data) {
      setPendingCheckIns(
        (data.pending_check_ins || []).map((ci) => ({
          id: ci.id,
          title: ci.participant_name,
          subtitle: ci.event_title,
          icon: Clock,
        }))
      )
      setActiveCheckIns(
        (data.active_check_ins || []).map((ci) => ({
          id: ci.id,
          title: ci.participant_name,
          subtitle: `In since ${new Date(ci.checked_in_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          })}`,
          icon: CheckCircle,
        }))
      )
    }
  }, [data])

  // Handle toggle check-in/check-out
  const handleToggleCheckIn = async (item: DualListItem, checked: boolean) => {
    if (checked) {
      // Check in: move from pending to active
      setPendingCheckIns((prev) => prev.filter((i) => i.id !== item.id))
      setActiveCheckIns((prev) => [
        {
          ...item,
          subtitle: `In since ${new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          })}`,
          icon: CheckCircle,
        },
        ...prev,
      ])
      // TODO: Call API to record check-in
    } else {
      // Check out: move from active to pending
      setActiveCheckIns((prev) => prev.filter((i) => i.id !== item.id))
      setPendingCheckIns((prev) => [
        ...prev,
        {
          ...item,
          subtitle: "Ready to check in",
          icon: Clock,
        },
      ])
      // TODO: Call API to record check-out
    }
  }

  useEffect(() => {
    async function fetchDashboardData() {
      if (!session) return

      try {
        setLoading(true)
        setError(null)

        const apiToken = (session as any)?.apiToken

        // Fetch both dashboard data and contact submissions in parallel
        const [dashboardRes, contactRes] = await Promise.all([
          fetch(`${API_BASE}/api/portal/dashboard/staff/`, {
            headers: {
              "Authorization": `Token ${apiToken || ""}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${API_BASE}/api/contact/admin/?limit=5`, {
            headers: {
              "Authorization": `Token ${apiToken || ""}`,
              "Content-Type": "application/json",
            },
          }),
        ])

        if (dashboardRes.ok) {
          const dashboardData = await dashboardRes.json()
          setData(dashboardData)
        } else if (dashboardRes.status === 403) {
          setError("You don't have permission to access this page")
          return
        } else {
          setError("Failed to load dashboard data")
          return
        }

        if (contactRes.ok) {
          const contactData = await contactRes.json()
          setContactSubmissions(contactData.submissions || [])
          setTotalNewIssues(contactData.total_new || 0)
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err)
        setError("Unable to connect to server")
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchDashboardData()
    }
  }, [session])

  // Handle expanding/collapsing a submission
  const toggleSubmission = (id: number) => {
    if (expandedSubmissionId === id) {
      setExpandedSubmissionId(null)
      setReplyText("")
      setReplySuccess(false)
    } else {
      setExpandedSubmissionId(id)
      setReplyText("")
      setReplySuccess(false)
    }
  }

  // Handle sending a reply
  const handleSendReply = async (submission: ContactSubmission) => {
    if (!replyText.trim() || !session) return

    setSendingReply(true)
    setReplySuccess(false)

    try {
      const apiToken = (session as any)?.apiToken
      const response = await fetch(`${API_BASE}/api/contact/${submission.id}/reply/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${apiToken || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: replyText,
        }),
      })

      if (response.ok) {
        setReplySuccess(true)
        setReplyText("")
        // Update the submission status locally
        setContactSubmissions(prev =>
          prev.map(s =>
            s.id === submission.id ? { ...s, status: "in_progress" } : s
          )
        )
        // Auto-collapse after 2 seconds
        setTimeout(() => {
          setExpandedSubmissionId(null)
          setReplySuccess(false)
        }, 2000)
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to send reply")
      }
    } catch (err) {
      console.error("Failed to send reply:", err)
      alert("Failed to send reply. Please try again.")
    } finally {
      setSendingReply(false)
    }
  }

  // Mark submission as resolved
  const handleMarkResolved = async (submission: ContactSubmission) => {
    if (!session) return

    try {
      const apiToken = (session as any)?.apiToken
      const response = await fetch(`${API_BASE}/api/contact/${submission.id}/status/`, {
        method: "PATCH",
        headers: {
          "Authorization": `Token ${apiToken || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "resolved" }),
      })

      if (response.ok) {
        // Remove from list or update status
        setContactSubmissions(prev => prev.filter(s => s.id !== submission.id))
        setTotalNewIssues(prev => Math.max(0, prev - 1))
        setExpandedSubmissionId(null)
      }
    } catch (err) {
      console.error("Failed to update status:", err)
    }
  }

  // Handle priority update
  const handlePriorityUpdate = async (submissionId: number, newPriority: Priority) => {
    if (!session) return

    try {
      const apiToken = (session as any)?.apiToken
      const response = await fetch(`${API_BASE}/api/contact/admin/${submissionId}/`, {
        method: "PATCH",
        headers: {
          "Authorization": `Token ${apiToken || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priority: newPriority }),
      })

      if (response.ok) {
        // Update priority locally
        setContactSubmissions(prev =>
          prev.map(s =>
            s.id === submissionId ? { ...s, priority: newPriority } : s
          )
        )
      }
    } catch (err) {
      console.error("Failed to update priority:", err)
    }
  }

  if (loading) {
    return <AdminDashboardSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Link href="/portal/dashboard">
          <Button variant="outline">Go to Dashboard</Button>
        </Link>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { admin_stats, pending_check_ins, recent_registrations } = data

  // #TODO: Mock data for revenue card - wire up to real analytics endpoint
  const revenueData = {
    mtd: 12450,
    lastMonth: 10200,
    ytd: 148500,
    activeSubscriptions: 47,
    monthlyGoal: 15000,
  }
  const revenueProgress = Math.min((revenueData.mtd / revenueData.monthlyGoal) * 100, 100)
  const revenueChange = ((revenueData.mtd - revenueData.lastMonth) / revenueData.lastMonth) * 100

  // #TODO: Mock data for top events - wire up to real analytics endpoint
  const topEvents = [
    { id: 1, title: "Winter Training Camp", registrations: 45, revenue: 2250 },
    { id: 2, title: "Holiday Clinic", registrations: 32, revenue: 1600 },
    { id: 3, title: "Skills Assessment", registrations: 28, revenue: 840 },
  ]

  // #TODO: Mock data for recent activity - wire up to real activity log
  const recentActivity = [
    { id: 1, action: "New registration", detail: "John D. registered for Winter Camp", time: "2 min ago" },
    { id: 2, action: "Payment received", detail: "$50.00 from Sarah M.", time: "15 min ago" },
    { id: 3, action: "Event created", detail: "Spring Tryouts added by Admin", time: "1 hour ago" },
  ]

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Control Center</h1>
        <p className="text-muted-foreground mt-1">
          Manage operations, view analytics, and monitor activity
        </p>
      </div>

      {/* Revenue Card - #TODO: Wire up to real analytics */}
      <Card className={TODO_CARD_STYLES}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <div className="h-8 w-8 rounded-md bg-rose-500/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-rose-400" />
              </div>
              Revenue Overview
              <Badge variant="outline" className={TODO_BADGE}>#TODO</Badge>
            </CardTitle>
            <span className="text-sm text-muted-foreground">December 2025</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Month to Date</p>
              <p className="text-xl sm:text-2xl font-bold">${revenueData.mtd.toLocaleString()}</p>
              <div className="flex items-center gap-1 text-xs sm:text-sm">
                {revenueChange >= 0 ? (
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                )}
                <span className={revenueChange >= 0 ? "text-success" : "text-destructive"}>
                  {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(1)}%
                </span>
                <span className="text-muted-foreground hidden sm:inline">vs last month</span>
              </div>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Last Month</p>
              <p className="text-xl sm:text-2xl font-bold">${revenueData.lastMonth.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Year to Date</p>
              <p className="text-xl sm:text-2xl font-bold">${revenueData.ytd.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Active Subs</p>
              <p className="text-xl sm:text-2xl font-bold">{revenueData.activeSubscriptions}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Goal Progress</span>
              <span className="font-medium">{revenueProgress.toFixed(0)}%</span>
            </div>
            <Progress value={revenueProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              ${(revenueData.monthlyGoal - revenueData.mtd).toLocaleString()} remaining to reach ${revenueData.monthlyGoal.toLocaleString()} goal
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid - Working */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{admin_stats.total_players}</div>
            <p className="text-xs text-muted-foreground">Total registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Today&apos;s Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">{admin_stats.todays_events}</div>
            <p className="text-xs text-muted-foreground">Scheduled today</p>
          </CardContent>
        </Card>

        <Card className={admin_stats.pending_payments > 0 ? "border-amber-500/30" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending Dues</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className={`text-xl sm:text-2xl font-bold ${admin_stats.pending_payments > 0 ? "text-foreground/70" : ""}`}>
              {admin_stats.pending_payments}
            </div>
            <p className="text-xs text-muted-foreground">Accounts with balance</p>
          </CardContent>
        </Card>

        <Card className={totalNewIssues > 0 ? "border-amber-500/30" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Open Issues</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className={`text-xl sm:text-2xl font-bold ${totalNewIssues > 0 ? "text-foreground/70" : ""}`}>
              {totalNewIssues}
            </div>
            <p className="text-xs text-muted-foreground">Contact submissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-4">
          <Link href="/portal/dashboard/check-ins" className="group block h-full">
            <Card className="hover:bg-muted/50 hover:border-foreground/20 transition-all cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-muted flex items-center justify-center mb-2 sm:mb-3 transition-colors group-hover:bg-success/30">
                  <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground transition-colors group-hover:text-foreground" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold transition-colors">Check-Ins</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {pending_check_ins.length} pending
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/portal/dashboard/roster" className="group block h-full">
            <Card className="hover:bg-muted/50 hover:border-foreground/20 transition-all cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-muted flex items-center justify-center mb-2 sm:mb-3 transition-colors group-hover:bg-success/30">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground transition-colors group-hover:text-foreground" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold transition-colors">Roster</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {admin_stats.total_players} players
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/portal/dashboard/events" className="group block h-full">
            <Card className="hover:bg-muted/50 hover:border-foreground/20 transition-all cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-muted flex items-center justify-center mb-2 sm:mb-3 transition-colors group-hover:bg-success/30">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground transition-colors group-hover:text-foreground" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold transition-colors">Events</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Manage schedule
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/portal/dashboard/printify" className="group block h-full">
            <Card className="hover:bg-muted/50 hover:border-foreground/20 transition-all cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-muted flex items-center justify-center mb-2 sm:mb-3 transition-colors group-hover:bg-success/30">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground transition-colors group-hover:text-foreground" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold transition-colors">Manage Products</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Printify sync & activate
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/portal/dashboard/admin/users" className="group block h-full">
            <Card className="hover:bg-muted/50 hover:border-foreground/20 transition-all cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-muted flex items-center justify-center mb-2 sm:mb-3 transition-colors group-hover:bg-success/30">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground transition-colors group-hover:text-foreground" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold transition-colors">Manage Users</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Roles & guardians
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* #TODO: Billing Admin - wire up to billing admin page */}
          <Card className={`${TODO_CARD_STYLES} cursor-not-allowed h-full`}>
            <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 text-center">
              <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg ${TODO_ICON_BG} flex items-center justify-center mb-2 sm:mb-3`}>
                <CreditCard className={`h-5 w-5 sm:h-6 sm:w-6 ${TODO_ICON_COLOR}`} />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-muted-foreground flex flex-wrap items-center justify-center gap-1">
                Billing
                <Badge variant="outline" className={`${TODO_BADGE} text-[10px] sm:text-xs`}>#TODO</Badge>
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                <span className="hidden sm:inline">Invoices & payments</span>
                <span className="sm:hidden">Invoices</span>
              </p>
            </CardContent>
          </Card>

          {/* #TODO: Orders - wire up to orders management page */}
          <Card className={`${TODO_CARD_STYLES} cursor-not-allowed h-full`}>
            <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 text-center">
              <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg ${TODO_ICON_BG} flex items-center justify-center mb-2 sm:mb-3`}>
                <ShoppingBag className={`h-5 w-5 sm:h-6 sm:w-6 ${TODO_ICON_COLOR}`} />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-muted-foreground flex flex-wrap items-center justify-center gap-1">
                Orders
                <Badge variant="outline" className={`${TODO_BADGE} text-[10px] sm:text-xs`}>#TODO</Badge>
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Shop orders
              </p>
            </CardContent>
          </Card>

          {/* #TODO: Reports - wire up to analytics/reports page */}
          <Card className={`${TODO_CARD_STYLES} cursor-not-allowed h-full`}>
            <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 text-center">
              <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg ${TODO_ICON_BG} flex items-center justify-center mb-2 sm:mb-3`}>
                <BarChart3 className={`h-5 w-5 sm:h-6 sm:w-6 ${TODO_ICON_COLOR}`} />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-muted-foreground flex flex-wrap items-center justify-center gap-1">
                Reports
                <Badge variant="outline" className={`${TODO_BADGE} text-[10px] sm:text-xs`}>#TODO</Badge>
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Analytics
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Secondary Actions Row - Working features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Merch Drop Settings - Modal */}
        <MerchDropModal />

        {/* Payment Link Generator - Working */}
        <PaymentLinkGenerator />

        {/* Cash Reconciliation - Modal */}
        <div className="sm:col-span-2 lg:col-span-1">
          <CashReconciliationModal pendingCount={admin_stats.pending_cash_handoffs} />
        </div>
      </div>

{/* Pending Issues (Contact Submissions) - Working with inline reply */}
      {contactSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                  Pending Issues
                </CardTitle>
                <CardDescription>
                  Click to expand and reply directly
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-muted text-foreground border-border text-sm">
                {totalNewIssues} new
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {contactSubmissions.map((submission) => {
                const CategoryIcon = CATEGORY_ICONS[submission.category] || HelpCircle
                const isExpanded = expandedSubmissionId === submission.id

                return (
                  <div key={submission.id} className="space-y-0">
                    {/* Collapsed Row - Clickable */}
                    <div
                      onClick={() => toggleSubmission(submission.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isExpanded
                          ? "border-foreground/30 bg-foreground/5 rounded-b-none"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon - hidden on mobile */}
                        <div className={`hidden sm:flex h-9 w-9 rounded-lg items-center justify-center shrink-0 ${
                          isExpanded ? "bg-foreground/10" : "bg-muted"
                        }`}>
                          <CategoryIcon className={`h-4 w-4 ${
                            isExpanded ? "text-foreground" : "text-muted-foreground"
                          }`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          {/* Title - full width on mobile */}
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-foreground leading-snug">
                              {submission.subject}
                            </p>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            )}
                          </div>
                          {/* Meta row */}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <p className="text-sm text-muted-foreground">
                              {submission.name}
                            </p>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">
                              {submission.time_since_created}
                            </span>
                            {/* Priority only on desktop */}
                            <div className="hidden sm:block ml-auto">
                              <PriorityDropdown
                                value={submission.priority}
                                onChange={(newPriority) => handlePriorityUpdate(submission.id, newPriority)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="border border-t-0 border-foreground/20 rounded-b-lg p-4 bg-card">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Left: Message Details */}
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                From
                              </p>
                              <p className="font-medium">{submission.name}</p>
                              <a
                                href={`mailto:${submission.email}`}
                                className="text-sm text-foreground/70 hover:text-foreground hover:underline"
                              >
                                {submission.email}
                              </a>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                Category
                              </p>
                              <Badge variant="outline" className="capitalize">
                                {submission.category}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                Message
                              </p>
                              <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                                {submission.message || "No message content"}
                              </div>
                            </div>
                          </div>

                          {/* Right: Reply Form */}
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                Reply
                              </p>
                              <Textarea
                                placeholder={`Type your reply to ${submission.name}...`}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="min-h-[120px] resize-none"
                                disabled={sendingReply || replySuccess}
                              />
                            </div>

                            {replySuccess ? (
                              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-foreground">
                                <Check className="h-4 w-4" />
                                <span className="text-sm font-medium">Reply sent successfully!</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => handleSendReply(submission)}
                                  disabled={!replyText.trim() || sendingReply}
                                  className="flex-1"
                                  variant="success"
                                >
                                  {sendingReply ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-4 w-4 mr-2" />
                                      Send Reply
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleMarkResolved(submission)}
                                  disabled={sendingReply}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Mark Resolved
                                </Button>
                              </div>
                            )}

                            <p className="text-xs text-muted-foreground">
                              <Mail className="h-3 w-3 inline mr-1" />
                              Reply will be sent to {submission.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

{/* Check-In Management - Same as Staff Dashboard */}
      <DualListPanel
        title="Check-In Management"
        description="Tap the circle to check players in or out"
        icon={ClipboardCheck}
        leftLabel="Pending"
        leftItems={pendingCheckIns}
        leftEmptyMessage="No pending check-ins"
        rightLabel="Checked In"
        rightItems={activeCheckIns}
        rightEmptyMessage="No active check-ins"
        onToggleItem={handleToggleCheckIn}
      />

{/* Two Column Layout: Top Events + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Events - #TODO: Wire up to analytics */}
        <Card className={TODO_CARD_STYLES}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <div className="h-8 w-8 rounded-md bg-rose-500/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-rose-400" />
                  </div>
                  Top Events
                  <Badge variant="outline" className={TODO_BADGE}>#TODO</Badge>
                </CardTitle>
                <CardDescription>
                  Best performing events this month
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topEvents.map((event, idx) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.registrations} registrations
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${event.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity - #TODO: Wire up to activity log */}
        <Card className={TODO_CARD_STYLES}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <div className="h-8 w-8 rounded-md bg-rose-500/10 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-rose-400" />
                  </div>
                  Recent Activity
                  <Badge variant="outline" className={TODO_BADGE}>#TODO</Badge>
                </CardTitle>
                <CardDescription>
                  Latest platform activity
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  <div className="h-2 w-2 rounded-full bg-foreground/40 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground truncate">{activity.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

{/* Recent Registrations - Working */}
      {recent_registrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              Recent Registrations
            </CardTitle>
            <CardDescription>
              Latest event registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recent_registrations.slice(0, 5).map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {reg.participant_first_name} {reg.participant_last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{reg.event_title}</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(reg.registered_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Management Section - Static Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Content Management</h2>
        </div>
        <a
          href="/cms-admin/"
          target="_blank"
          rel="noopener noreferrer"
          className="group block"
        >
          <Card className="hover:bg-muted/50 hover:border-foreground/20 transition-all">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Wagtail CMS</p>
                <p className="text-sm text-muted-foreground">Edit pages, blog posts, and images</p>
              </div>
              <ExternalLink className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </a>
      </div>
    </div>
  )
}

// ==================== Loading Skeleton ====================

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 sm:h-8 w-48 sm:w-64 mb-2" />
        <Skeleton className="h-4 w-64 sm:w-80" />
      </div>

      {/* Revenue Card Skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i}>
                <Skeleton className="h-3 sm:h-4 w-20 sm:w-24 mb-1" />
                <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
              </div>
            ))}
          </div>
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
              <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <Skeleton className="h-6 sm:h-8 w-10 sm:w-12 mb-1" />
              <Skeleton className="h-3 w-16 sm:w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <Skeleton className="h-6 w-32 mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-6 flex flex-col items-center">
                <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg mb-2 sm:mb-3" />
                <Skeleton className="h-4 sm:h-5 w-20 sm:w-24 mb-1" />
                <Skeleton className="h-3 sm:h-4 w-14 sm:w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
              <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 sm:h-5 w-28 sm:w-32 mb-1" />
                <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40 mb-1" />
          <Skeleton className="h-4 w-48 sm:w-56" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                <div className="min-w-0">
                  <Skeleton className="h-4 sm:h-5 w-28 sm:w-32 mb-1" />
                  <Skeleton className="h-3 sm:h-4 w-32 sm:w-40" />
                </div>
              </div>
              <Skeleton className="h-5 sm:h-6 w-14 sm:w-16 shrink-0" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
