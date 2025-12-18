"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Check, Crown, Loader2 } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface SubscriptionPlan {
  id: number
  name: string
  slug: string
  description: string
  price: string
  billing_period: "monthly" | "seasonal" | "annual" | "one_time"
  is_team_dues: boolean
  payment_deadline: string | null
  features: string[]
  is_active: boolean
}

interface ActiveSubscription {
  id: number
  plan: SubscriptionPlan
  status: string
  current_period_end: string
  cancel_at_period_end: boolean
}

function formatPrice(price: string, period: string): string {
  const amount = parseFloat(price)
  const periodLabels: Record<string, string> = {
    monthly: "/mo",
    seasonal: "/season",
    annual: "/year",
    one_time: "",
  }
  return "$" + amount.toFixed(0) + (periodLabels[period] || "")
}

function getPeriodLabel(period: string): string {
  const labels: Record<string, string> = {
    monthly: "Monthly",
    seasonal: "Per Season",
    annual: "Annual",
    one_time: "One-Time",
  }
  return labels[period] || period
}

interface SubscriptionPlansProps {
  playerId?: number
  onCheckoutStart?: () => void
}

export function SubscriptionPlans({ playerId, onCheckoutStart }: SubscriptionPlansProps) {
  const { data: session } = useSession()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPlans() {
      try {
        setLoading(true)
        
        const plansRes = await fetch(API_BASE + "/api/payments/subscription-plans/")
        if (!plansRes.ok) throw new Error("Failed to fetch plans")
        const plansData = await plansRes.json()
        setPlans(plansData.results || plansData || [])

        if (session) {
          const accessToken = (session as any)?.accessToken
          if (accessToken) {
            try {
              const subRes = await fetch(API_BASE + "/api/portal/subscription/", {
                headers: { Authorization: "Bearer " + accessToken },
              })
              if (subRes.ok) {
                const subData = await subRes.json()
                if (subData && subData.status === "active") {
                  setActiveSubscription(subData)
                }
              }
            } catch {
              // No active subscription
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch subscription plans:", err)
        setError("Unable to load subscription plans")
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [session])

  const handleSubscribe = async (planId: number) => {
    if (!session) {
      window.location.href = "/portal/login?redirect=/portal/billing"
      return
    }

    setCheckoutLoading(planId)
    setError(null)

    try {
      const accessToken = (session as any)?.accessToken
      const response = await fetch(API_BASE + "/api/payments/checkout/subscription/", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + (accessToken || ""),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan_id: planId,
          player_id: playerId,
          success_url: window.location.origin + "/portal/billing?subscription=success",
          cancel_url: window.location.origin + "/portal/billing?subscription=cancelled",
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to start checkout")
      }

      const data = await response.json()
      
      onCheckoutStart?.()
      
      window.location.href = data.url
    } catch (err) {
      console.error("Checkout error:", err)
      setError(err instanceof Error ? err.message : "Failed to start checkout")
      setCheckoutLoading(null)
    }
  }

  if (loading) {
    return <SubscriptionPlansSkeleton />
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6 text-center text-destructive">
          {error}
        </CardContent>
      </Card>
    )
  }

  if (plans.length === 0) {
    return null
  }

  const teamDuesPlans = plans.filter((p) => p.is_team_dues)
  const subscriptionPlans = plans.filter((p) => !p.is_team_dues)

  return (
    <div className="space-y-6">
      {activeSubscription && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">
                    Active: {activeSubscription.plan.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activeSubscription.cancel_at_period_end
                      ? "Cancels at end of period"
                      : "Renews " + new Date(activeSubscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {subscriptionPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Membership Plans</CardTitle>
            <CardDescription>
              Choose a plan that works for your family
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subscriptionPlans.map((plan) => {
                const isCurrentPlan = activeSubscription?.plan.id === plan.id
                
                return (
                  <Card
                    key={plan.id}
                    className={"relative " + (
                      isCurrentPlan
                        ? "border-primary ring-2 ring-primary/20"
                        : "hover:border-primary/50"
                    ) + " transition-all"}
                  >
                    {isCurrentPlan && (
                      <Badge className="absolute -top-2 right-4 bg-primary">
                        Current Plan
                      </Badge>
                    )}
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{plan.name}</CardTitle>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">
                          {formatPrice(plan.price, plan.billing_period)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {getPeriodLabel(plan.billing_period)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-4">
                        {plan.description}
                      </p>
                      {plan.features && plan.features.length > 0 && (
                        <ul className="space-y-2 mb-4">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                      <Button
                        className="w-full"
                        variant={isCurrentPlan ? "outline" : "default"}
                        disabled={isCurrentPlan || checkoutLoading === plan.id}
                        onClick={() => handleSubscribe(plan.id)}
                      >
                        {checkoutLoading === plan.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : isCurrentPlan ? (
                          "Current Plan"
                        ) : (
                          "Subscribe"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {teamDuesPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Dues</CardTitle>
            <CardDescription>
              One-time payment to secure your team spot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {teamDuesPlans.map((plan) => (
                <Card key={plan.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{plan.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {plan.description}
                        </p>
                      </div>
                      <span className="text-xl font-bold">
                        {"$" + parseFloat(plan.price).toFixed(0)}
                      </span>
                    </div>
                    {plan.payment_deadline && (
                      <p className="text-sm text-amber-600 mb-3">
                        Due by: {new Date(plan.payment_deadline).toLocaleDateString()}
                      </p>
                    )}
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={checkoutLoading === plan.id}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {checkoutLoading === plan.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Pay Team Dues"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SubscriptionPlansSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
