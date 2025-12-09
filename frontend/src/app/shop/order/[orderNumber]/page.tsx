"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutShell } from "@/components/layout-shell"
import { Skeleton } from "@/components/ui/skeleton"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface OrderItem {
  id: number
  product_name: string
  product_price: string
  quantity: number
  total_price: string
  product_image: string | null
}

interface Order {
  id: number
  order_number: string
  status: string
  status_display: string
  subtotal: string
  shipping: string
  tax: string
  total: string
  shipping_name: string | null
  shipping_email: string | null
  shipping_address_line1: string | null
  shipping_address_line2: string | null
  shipping_city: string | null
  shipping_state: string | null
  shipping_zip: string | null
  shipping_country: string | null
  items: OrderItem[]
  created_at: string
  updated_at: string
}

function OrderItemSkeleton() {
  return (
    <div className="flex gap-4 py-4 border-b border-border last:border-0">
      <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
    case 'delivered':
      return 'text-success bg-success/10'
    case 'pending':
    case 'processing':
      return 'text-warning bg-warning/10'
    case 'cancelled':
    case 'refunded':
      return 'text-destructive bg-destructive/10'
    default:
      return 'text-text-secondary bg-muted'
  }
}

function OrderContent() {
  const params = useParams()
  const orderNumber = params?.orderNumber as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrder() {
      if (!orderNumber) {
        setLoading(false)
        setError('No order number provided')
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/payments/orders/${orderNumber}/`)

        if (!response.ok) {
          if (response.status === 404) {
            setError('Order not found. Please check your order number.')
          } else {
            setError('Unable to load order details.')
          }
          setLoading(false)
          return
        }

        const data: Order = await response.json()
        setOrder(data)
      } catch (err) {
        console.error('Error fetching order:', err)
        setError('Unable to load order details.')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderNumber])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return <OrderPageSkeleton />
  }

  if (error) {
    return (
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-destructive"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <CardTitle className="text-2xl md:text-3xl">Order Not Found</CardTitle>
                <CardDescription className="text-base mt-2">
                  {error}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-6">
                <Link href="/shop">
                  <Button variant="cta">
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8 md:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Order Header Card */}
          <Card className="overflow-hidden">
            <CardHeader className="text-center pb-4">
              {/* Order Icon */}
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <CardTitle className="text-2xl md:text-3xl">Order Details</CardTitle>
              <CardDescription className="text-base mt-2">
                Order #{order?.order_number}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Status Badge */}
              {order && (
                <div className="flex justify-center">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status_display}
                  </span>
                </div>
              )}

              {order?.shipping_email && (
                <p className="text-center text-sm text-text-secondary">
                  Order placed by <span className="text-text-primary font-medium">{order.shipping_email}</span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Order Items Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Items Ordered</CardTitle>
                {order?.created_at && (
                  <span className="text-sm text-text-secondary">
                    {formatDate(order.created_at)}
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {/* Line Items */}
              <div className="divide-y divide-border">
                {order?.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      {/* Product Image */}
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                        {item.product_image ? (
                          <Image
                            src={item.product_image}
                            alt={item.product_name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Image
                              src="/brand/logos/logo square thick muted.svg"
                              alt={item.product_name}
                              fill
                              className="opacity-30 object-contain p-2"
                            />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm md:text-base line-clamp-2">
                          {item.product_name}
                        </h4>
                        <p className="text-sm text-text-secondary mt-1">
                          Qty: {item.quantity}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-medium text-sm md:text-base">
                          ${parseFloat(item.total_price).toFixed(2)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-text-secondary">
                            ${parseFloat(item.product_price).toFixed(2)} each
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-text-secondary text-center py-4">
                    No items to display
                  </p>
                )}
              </div>

              {/* Order Summary */}
              {order && (
                <div className="mt-6 pt-4 border-t border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Subtotal</span>
                    <span>${parseFloat(order.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Shipping</span>
                    <span className={parseFloat(order.shipping) === 0 ? 'text-success' : ''}>
                      {parseFloat(order.shipping) === 0 ? 'Free' : `$${parseFloat(order.shipping).toFixed(2)}`}
                    </span>
                  </div>
                  {parseFloat(order.tax) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Tax</span>
                      <span>${parseFloat(order.tax).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                    <span>Total</span>
                    <span>${parseFloat(order.total).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address Card */}
          {order?.shipping_address_line1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <address className="not-italic text-sm text-text-secondary space-y-0.5">
                  {order.shipping_name && (
                    <p className="font-medium text-text-primary">{order.shipping_name}</p>
                  )}
                  {order.shipping_address_line1 && <p>{order.shipping_address_line1}</p>}
                  {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
                  <p>
                    {[
                      order.shipping_city,
                      order.shipping_state,
                      order.shipping_zip,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {order.shipping_country && (
                    <p>{order.shipping_country}</p>
                  )}
                </address>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link href="/shop" className="flex-1">
              <Button variant="cta" className="w-full">
                Continue Shopping
              </Button>
            </Link>

            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function OrderPageSkeleton() {
  return (
    <section className="py-8 md:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <Card>
            <CardHeader className="text-center">
              <Skeleton className="mx-auto mb-4 w-20 h-20 rounded-full" />
              <Skeleton className="h-8 w-48 mx-auto mb-2" />
              <Skeleton className="h-5 w-64 mx-auto" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-28 mx-auto rounded-full" />
              <Skeleton className="h-4 w-2/3 mx-auto" />
            </CardContent>
          </Card>

          {/* Order Details Skeleton */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            </CardHeader>
            <CardContent>
              <OrderItemSkeleton />
              <OrderItemSkeleton />
              <div className="mt-6 pt-4 border-t border-border space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons Skeleton */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default function OrderDetailsPage() {
  return (
    <LayoutShell>
      <OrderContent />
    </LayoutShell>
  )
}
