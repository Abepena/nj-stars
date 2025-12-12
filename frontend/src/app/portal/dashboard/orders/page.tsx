"use client"

/**
 * Dashboard > Orders Tab
 *
 * Order history for the dashboard tab navigation.
 */

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Package,
  ChevronRight,
  AlertCircle,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ==================== Types ====================

type FulfillmentType = 'pod' | 'local'
type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'canceled' | 'refunded'

interface OrderItem {
  id: number
  product_name: string
  product_price: number
  selected_size: string
  selected_color: string
  quantity: number
  total_price: number
  product_image: string | null
  fulfillment_type: FulfillmentType
  fulfillment_display: string
  printify_line_item_id: string
}

interface Order {
  id: number
  order_number: string
  status: OrderStatus
  status_display: string
  subtotal: number
  shipping: number
  tax: number
  total: number
  shipping_name: string
  shipping_email: string
  shipping_address_line1: string
  shipping_address_line2: string
  shipping_city: string
  shipping_state: string
  shipping_zip: string
  shipping_country: string
  tracking_number: string
  tracking_url: string
  has_tracking: boolean
  printify_order_id: string
  has_pod_items: boolean
  has_local_items: boolean
  items: OrderItem[]
  notes: string
  created_at: string
  updated_at: string
}

// ==================== Status Config ====================

const statusConfig: Record<OrderStatus, { icon: React.ComponentType<any>; color: string; bgColor: string }> = {
  pending: { icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-100 dark:bg-amber-900/50' },
  paid: { icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/50' },
  processing: { icon: Package, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/50' },
  shipped: { icon: Truck, color: 'text-violet-500', bgColor: 'bg-violet-100 dark:bg-violet-900/50' },
  delivered: { icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-100 dark:bg-emerald-900/50' },
  canceled: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/50' },
  refunded: { icon: XCircle, color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-900/50' },
}

// ==================== Main Component ====================

export default function OrdersPage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrders() {
      if (!session) return

      try {
        setLoading(true)
        setError(null)

        const accessToken = (session as any)?.accessToken
        const response = await fetch(`${API_BASE}/api/payments/orders/`, {
          headers: {
            "Authorization": `Bearer ${accessToken || ""}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setOrders(data)
        } else if (response.status === 401) {
          setError("Please log in to view your orders")
        } else {
          setError("Failed to load orders")
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err)
        setError("Unable to connect to server")
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchOrders()
    }
  }, [session])

  if (loading) {
    return <OrdersSkeleton />
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Order History</h1>
        <p className="text-muted-foreground mt-1">
          Track your purchases and shipping status
        </p>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-4">
              Your order history will appear here after you make a purchase
            </p>
            <Button asChild>
              <Link href="/shop">Shop Now</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}

// ==================== Order Card ====================

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false)
  const config = statusConfig[order.status] || statusConfig.pending
  const StatusIcon = config.icon

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${config.bgColor}`}>
              <StatusIcon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Order {order.order_number}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className={config.color}>
              {order.status_display}
            </Badge>
            <span className="font-bold">${order.total.toFixed(2)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Fulfillment Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {order.has_pod_items && (
            <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400">
              <Truck className="h-3 w-3 mr-1" />
              Print on Demand
            </Badge>
          )}
          {order.has_local_items && (
            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
              <Package className="h-3 w-3 mr-1" />
              Coach Delivery
            </Badge>
          )}
        </div>

        {/* Tracking Info */}
        {order.has_tracking && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Tracking Number</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {order.tracking_number}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                  Track Package
                  <ExternalLink className="h-3 w-3 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Items Preview / Expanded */}
        <div className="space-y-3">
          {(expanded ? order.items : order.items.slice(0, 2)).map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {item.product_image ? (
                  <Image
                    src={item.product_image}
                    alt={item.product_name}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                ) : (
                  <Package className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.product_name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Qty: {item.quantity}</span>
                  {item.selected_size && <span>• {item.selected_size}</span>}
                  {item.selected_color && <span>• {item.selected_color}</span>}
                  <span className={`${item.fulfillment_type === 'pod' ? 'text-violet-500' : 'text-emerald-500'}`}>
                    • {item.fulfillment_display}
                  </span>
                </div>
              </div>
              <span className="text-sm font-medium">${item.total_price.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Show More / Less */}
        {order.items.length > 2 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show Less' : `Show ${order.items.length - 2} More Items`}
            <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </Button>
        )}

        {/* Order Summary (when expanded) */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{order.shipping === 0 ? 'Free' : `$${order.shipping.toFixed(2)}`}</span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>

            {/* Shipping Address */}
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-1">Shipping Address</p>
              <p className="text-sm text-muted-foreground">
                {order.shipping_name}<br />
                {order.shipping_address_line1}<br />
                {order.shipping_address_line2 && <>{order.shipping_address_line2}<br /></>}
                {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== Loading Skeleton ====================

function OrdersSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-5 w-28" />
              </div>
              <div className="space-y-3">
                {[1, 2].map(j => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-40 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-12" />
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
