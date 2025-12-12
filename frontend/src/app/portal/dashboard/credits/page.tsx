"use client"

/**
 * Dashboard > Credits Tab
 *
 * Credits & rewards management for the dashboard tab navigation.
 */

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Gift,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ==================== Types ====================

interface PromoCredit {
  id: number
  credit_type: string
  amount: string
  remaining_amount: string
  description: string
  expires_at: string | null
  is_active: boolean
  is_expired: boolean
  created_at: string
}

const creditTypeLabels: Record<string, { label: string; color: string }> = {
  referral: { label: 'Referral Bonus', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' },
  loyalty: { label: 'Loyalty Reward', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400' },
  promo: { label: 'Promotional', color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' },
  adjustment: { label: 'Adjustment', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' },
}

// ==================== Main Component ====================

export default function CreditsPage() {
  const { data: session } = useSession()
  const [credits, setCredits] = useState<PromoCredit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCredits() {
      if (!session) return

      try {
        setLoading(true)
        setError(null)

        const accessToken = (session as any)?.accessToken
        const response = await fetch(`${API_BASE}/api/portal/promo-credits/`, {
          headers: {
            "Authorization": `Bearer ${accessToken || ""}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setCredits(data.results || data)
        } else {
          setError("Failed to load credits")
        }
      } catch (err) {
        console.error("Failed to fetch credits:", err)
        setError("Unable to connect to server")
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchCredits()
    }
  }, [session])

  if (loading) {
    return <CreditsSkeleton />
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

  // Calculate totals
  const activeCredits = credits.filter(c => c.is_active && !c.is_expired)
  const totalAvailable = activeCredits.reduce(
    (sum, c) => sum + parseFloat(c.remaining_amount),
    0
  )
  const usedCredits = credits.filter(c => !c.is_active || c.is_expired)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Credits & Rewards</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your promotional credits and rewards
        </p>
      </div>

      {/* Total Available */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
              <Gift className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available Credits</p>
              <p className="text-4xl font-bold text-primary">
                ${totalAvailable.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {activeCredits.length} active credit(s)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Credits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Active Credits
          </CardTitle>
          <CardDescription>
            Credits available to use on your next payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeCredits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No active credits</p>
              <p className="text-sm">Earn credits through referrals and promotions!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCredits.map((credit) => (
                <CreditCard key={credit.id} credit={credit} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Used/Expired Credits */}
      {usedCredits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5" />
              Past Credits
            </CardTitle>
            <CardDescription>
              Credits that have been used or expired
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 opacity-70">
              {usedCredits.map((credit) => (
                <CreditCard key={credit.id} credit={credit} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How to Earn */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">How to Earn Credits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Gift className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium">Refer a Friend</h4>
                <p className="text-sm text-muted-foreground">
                  Get $25 credit when a referred family registers
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium">Early Payment</h4>
                <p className="text-sm text-muted-foreground">
                  Earn loyalty rewards for on-time payments
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== Credit Card Component ====================

function CreditCard({ credit }: { credit: PromoCredit }) {
  const remaining = parseFloat(credit.remaining_amount)
  const original = parseFloat(credit.amount)
  const used = original - remaining
  const typeInfo = creditTypeLabels[credit.credit_type] || {
    label: credit.credit_type,
    color: 'bg-gray-100 text-gray-700'
  }

  const isExpired = credit.is_expired
  const isUsed = !credit.is_active && !isExpired

  return (
    <div className={`p-4 rounded-lg border ${
      isExpired || isUsed ? 'bg-muted/50' : 'bg-card'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="outline" className={typeInfo.color}>
              {typeInfo.label}
            </Badge>
            {isExpired && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                Expired
              </Badge>
            )}
            {isUsed && (
              <Badge variant="secondary">Used</Badge>
            )}
          </div>
          <p className="font-medium">{credit.description}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Added {new Date(credit.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
            {credit.expires_at && (
              <> • Expires {new Date(credit.expires_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}</>
            )}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-xl font-bold ${
            credit.is_active && !isExpired ? 'text-green-600' : 'text-muted-foreground'
          }`}>
            ${remaining.toFixed(2)}
          </p>
          {used > 0 && (
            <p className="text-xs text-muted-foreground">
              of ${original.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== Loading Skeleton ====================

function CreditsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-24 mb-1" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-4 w-48 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
