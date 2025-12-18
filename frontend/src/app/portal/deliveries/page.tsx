"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import {
  Package,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  User,
  Mail,
  Calendar,
  Loader2,
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ==================== Types ====================

type HandoffStatus = 'pending' | 'ready' | 'delivered'

interface HandoffItem {
  id: number
  order_number: string
  order_date: string
  customer_name: string
  customer_email: string
  product_name: string
  selected_size: string
  selected_color: string
  quantity: number
  handoff_status: HandoffStatus
  handoff_completed_at: string | null
  handoff_completed_by_name: string | null
  handoff_notes: string
}

// ==================== Status Config ====================

const statusConfig: Record<HandoffStatus, { label: string; icon: React.ComponentType<any>; color: string; bgColor: string; badgeClass: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-foreground', bgColor: 'bg-warning/30', badgeClass: 'bg-warning/30 text-foreground border-warning/40' },
  ready: { label: 'Ready', icon: Package, color: 'text-foreground', bgColor: 'bg-info/40', badgeClass: 'bg-info/40 text-foreground border-info/50' },
  delivered: { label: 'Delivered', icon: CheckCircle2, color: 'text-foreground', bgColor: 'bg-success/40', badgeClass: 'bg-success/40 text-foreground border-success/50' },
}

// ==================== Main Component ====================

export default function DeliveriesPage() {
  const { data: session } = useSession()
  const toast = useToast()
  const [items, setItems] = useState<HandoffItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<HandoffStatus | 'all'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set())

  // Fetch handoff items
  const fetchItems = async (status: HandoffStatus | 'all' = activeTab) => {
    if (!session) return

    try {
      setLoading(true)
      setError(null)

      const token = (session as any).accessToken
      const response = await fetch(
        `${API_BASE}/api/payments/handoffs/?status=${status}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.status === 403) {
        setError('Staff access required. Please contact an administrator.')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch deliveries')
      }

      const data = await response.json()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deliveries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchItems()
    }
  }, [session, activeTab])

  // Update handoff status
  const updateStatus = async (itemId: number, newStatus: HandoffStatus, notes?: string) => {
    if (!session) return

    setUpdatingIds(prev => new Set(prev).add(itemId))

    try {
      const token = (session as any).accessToken
      const response = await fetch(
        `${API_BASE}/api/payments/handoffs/${itemId}/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus, notes: notes || '' }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      toast.success(`Item marked as ${statusConfig[newStatus].label.toLowerCase()}`)

      // Refresh the list
      fetchItems()
    } catch (err) {
      toast.error('Failed to update status')
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  // Filter items by search query
  const filteredItems = items.filter(item => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.customer_name?.toLowerCase().includes(query) ||
      item.customer_email?.toLowerCase().includes(query) ||
      item.order_number?.toLowerCase().includes(query) ||
      item.product_name?.toLowerCase().includes(query)
    )
  })

  // Group items by order
  const groupedByOrder = filteredItems.reduce((acc, item) => {
    if (!acc[item.order_number]) {
      acc[item.order_number] = {
        order_number: item.order_number,
        order_date: item.order_date,
        customer_name: item.customer_name,
        customer_email: item.customer_email,
        items: [],
      }
    }
    acc[item.order_number].items.push(item)
    return acc
  }, {} as Record<string, { order_number: string; order_date: string; customer_name: string; customer_email: string; items: HandoffItem[] }>)

  const orderGroups = Object.values(groupedByOrder)

  // ==================== Render ====================

  if (!session) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg text-muted-foreground">
              Please log in to access deliveries
            </p>
            <Button asChild className="mt-4">
              <Link href="/portal/login">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/portal/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Local Deliveries</h1>
        <p className="text-muted-foreground">
          Manage in-person product handoffs to customers
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as HandoffStatus | 'all')}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="ready">Ready</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="py-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-2 text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && orderGroups.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg text-muted-foreground">
              {searchQuery
                ? 'No deliveries match your search'
                : activeTab === 'all'
                ? 'No local deliveries yet'
                : `No ${statusConfig[activeTab as HandoffStatus]?.label.toLowerCase()} deliveries`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Order Groups */}
      {!loading && !error && orderGroups.length > 0 && (
        <div className="space-y-4">
          {orderGroups.map((group) => (
            <Card key={group.order_number}>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Order {group.order_number}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {group.customer_name || 'Unknown'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {group.customer_email || 'No email'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(group.order_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {group.items.map((item) => {
                    const config = statusConfig[item.handoff_status]
                    const StatusIcon = config.icon
                    const isUpdating = updatingIds.has(item.id)

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.product_name}</span>
                            <Badge variant="outline" className={config.badgeClass}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {config.label}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {item.quantity}x
                            {item.selected_color && ` • ${item.selected_color}`}
                            {item.selected_size && ` • Size ${item.selected_size}`}
                          </div>
                          {item.handoff_status === 'delivered' && item.handoff_completed_at && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Delivered {new Date(item.handoff_completed_at).toLocaleString()}
                              {item.handoff_completed_by_name && ` by ${item.handoff_completed_by_name}`}
                            </div>
                          )}
                          {item.handoff_notes && (
                            <div className="text-xs text-muted-foreground mt-1 italic">
                              Note: {item.handoff_notes}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {item.handoff_status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatus(item.id, 'ready')}
                                disabled={isUpdating}
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Mark Ready'
                                )}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateStatus(item.id, 'delivered')}
                                disabled={isUpdating}
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle2 className="mr-1 h-4 w-4" />
                                    Delivered
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                          {item.handoff_status === 'ready' && (
                            <Button
                              size="sm"
                              onClick={() => updateStatus(item.id, 'delivered')}
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-1 h-4 w-4" />
                                  Mark Delivered
                                </>
                              )}
                            </Button>
                          )}
                          {item.handoff_status === 'delivered' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateStatus(item.id, 'pending')}
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Undo'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
