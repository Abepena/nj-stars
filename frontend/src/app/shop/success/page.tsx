"use client"

import { Suspense, useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutShell } from "@/components/layout-shell"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfettiCelebration } from "@/components/confetti-celebration"
import { useBag, getPendingCheckoutItems, clearPendingCheckoutItems } from "@/lib/bag"
import { useToast } from "@/components/ui/toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Log for debugging - can remove in production
const DEBUG = process.env.NODE_ENV === 'development'

interface LineItem {
  name: string
  description: string
  image: string | null
  quantity: number
  unit_price: number
  total: number
}

interface ShippingDetails {
  name: string | null
  address: {
    line1: string | null
    line2: string | null
    city: string | null
    state: string | null
    postal_code: string | null
    country: string | null
  } | null
}

interface CustomerDetails {
  email: string | null
  name: string | null
}

interface CheckoutSession {
  id: string
  status: string
  payment_status: string
  amount_total: number
  currency: string
  line_items: LineItem[]
  shipping: ShippingDetails | null
  customer: CustomerDetails | null
  created: number
  purchased_item_ids?: number[]
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

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams?.get("session_id")
  const [session, setSession] = useState<CheckoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const { removeItems, refreshBag } = useBag()
  const { info } = useToast()
  const itemsRemoved = useRef(false)
  const toastShown = useRef(false)

  useEffect(() => {
    async function fetchCheckoutSession() {
      if (!sessionId) {
        if (DEBUG) console.log('No session ID provided')
        setLoading(false)
        return
      }

      // Get pending checkout items from localStorage (stored before Stripe redirect)
      const pendingItems = getPendingCheckoutItems()
      if (DEBUG) console.log('Pending checkout items from localStorage:', pendingItems)

      let sessionData: CheckoutSession | null = null

      try {
        if (DEBUG) console.log('Fetching checkout session:', sessionId)
        const response = await fetch(`${API_BASE_URL}/api/payments/checkout/session/${sessionId}/`)

        if (response.ok) {
          sessionData = await response.json()
          if (DEBUG) console.log('Checkout session data:', sessionData)
          setSession(sessionData)
        } else {
          // Stripe session retrieval failed (common in test mode)
          // We can still clear the bag using localStorage fallback
          if (DEBUG) console.log('Stripe session fetch failed, using localStorage fallback')
          if (!toastShown.current) {
            toastShown.current = true
            info('Order details unavailable in test mode', 5000)
          }
        }
      } catch (err) {
        console.error('Error fetching checkout session:', err)
        if (!toastShown.current) {
          toastShown.current = true
          info('Order details could not be loaded', 5000)
        }
      }

      // Remove purchased items - use Stripe data if available, otherwise use localStorage
      if (!itemsRemoved.current) {
        itemsRemoved.current = true

        // Determine which items to remove
        const itemsToRemove = sessionData?.purchased_item_ids?.length
          ? sessionData.purchased_item_ids
          : pendingItems

        if (itemsToRemove.length > 0) {
          if (DEBUG) console.log('Removing items:', itemsToRemove)
          try {
            await removeItems(itemsToRemove)
            if (DEBUG) console.log('Items removed successfully')
          } catch (err) {
            if (DEBUG) console.log('Items removal attempted:', err)
          }
        }

        // Clear the localStorage after attempting removal
        clearPendingCheckoutItems()

        // Always refresh the bag to sync with backend state
        try {
          await refreshBag()
          if (DEBUG) console.log('Bag refreshed')
        } catch (err) {
          if (DEBUG) console.log('Bag refresh failed:', err)
        }
      }

      setLoading(false)
    }

    fetchCheckoutSession()
  }, [sessionId, removeItems, refreshBag, info])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      {/* Confetti celebration */}
      <ConfettiCelebration />

      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Success Header Card */}
            <Card className="overflow-hidden">
              <CardHeader className="text-center pb-4">
                {/* Animated Success Icon */}
                <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-success/20 flex items-center justify-center animate-success-pulse">
                  <svg
                    className="w-12 h-12 text-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                      className="animate-[draw-check_0.5s_ease-out_0.3s_forwards]"
                      style={{
                        strokeDasharray: 24,
                        strokeDashoffset: 24,
                      }}
                    />
                  </svg>
                </div>
                <CardTitle className="text-2xl md:text-3xl">Order Successful!</CardTitle>
                <CardDescription className="text-base mt-2">
                  Thank you for your purchase
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-center text-text-secondary">
                  Your order has been confirmed and you will receive an email confirmation shortly.
                </p>

                {session?.customer?.email && (
                  <p className="text-center text-sm text-text-secondary">
                    Confirmation sent to <span className="text-text-primary font-medium">{session.customer.email}</span>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Order Details Card */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Order Details</CardTitle>
                  {session?.created && (
                    <span className="text-sm text-text-secondary">
                      {formatDate(session.created)}
                    </span>
                  )}
                </div>
                {sessionId && (
                  <p className="text-xs font-mono text-text-tertiary mt-1">
                    Order #{sessionId.slice(-8).toUpperCase()}
                  </p>
                )}
              </CardHeader>

              <CardContent>
                {/* Line Items */}
                <div className="divide-y divide-border">
                  {loading ? (
                    <>
                      <OrderItemSkeleton />
                      <OrderItemSkeleton />
                    </>
                  ) : session?.line_items && session.line_items.length > 0 ? (
                    session.line_items.map((item, index) => (
                      <div key={index} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                        {/* Product Image */}
                        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Image
                                src="/brand/logos/logo square thick muted.svg"
                                alt={item.name}
                                fill
                                className="opacity-30 object-contain p-2"
                              />
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm md:text-base line-clamp-2">
                            {item.name}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                          <p className="text-sm text-text-secondary mt-1">
                            Qty: {item.quantity}
                          </p>
                        </div>

                        {/* Price */}
                        <div className="text-right flex-shrink-0">
                          <p className="font-medium text-sm md:text-base">
                            ${item.total.toFixed(2)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-text-secondary">
                              ${item.unit_price.toFixed(2)} each
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
                {session && (
                  <div className="mt-6 pt-4 border-t border-border space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Subtotal</span>
                      <span>${session.amount_total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Shipping</span>
                      <span className="text-success">Free</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                      <span>Total</span>
                      <span>${session.amount_total.toFixed(2)} {session.currency}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address Card */}
            {session?.shipping?.address && (
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
                    {session.shipping.name && (
                      <p className="font-medium text-text-primary">{session.shipping.name}</p>
                    )}
                    {session.shipping.address.line1 && <p>{session.shipping.address.line1}</p>}
                    {session.shipping.address.line2 && <p>{session.shipping.address.line2}</p>}
                    <p>
                      {[
                        session.shipping.address.city,
                        session.shipping.address.state,
                        session.shipping.address.postal_code,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {session.shipping.address.country && (
                      <p>{session.shipping.address.country}</p>
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
    </>
  )
}

function SuccessPageSkeleton() {
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
              <Skeleton className="h-5 w-full" />
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
              <Skeleton className="h-3 w-24 mt-1" />
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

export default function SuccessPage() {
  return (
    <LayoutShell>
      <Suspense fallback={<SuccessPageSkeleton />}>
        <SuccessContent />
      </Suspense>
    </LayoutShell>
  )
}
