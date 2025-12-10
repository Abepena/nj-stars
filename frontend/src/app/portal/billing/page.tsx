"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Settings,
  History,
  Wallet,
  ToggleLeft
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ==================== Types ====================

interface DuesAccount {
  id: number
  player: number
  player_name: string
  balance: string
  is_good_standing: boolean
  last_payment_date: string | null
  recent_transactions: Transaction[]
}

interface Transaction {
  id: number
  transaction_type: string
  amount: string
  description: string
  balance_after: string
  created_at: string
}

interface SavedCard {
  id: number
  card_brand: string
  card_last4: string
  card_exp_month: number
  card_exp_year: number
  is_default: boolean
  nickname: string
  display_name: string
  is_expired: boolean
}

interface BillingData {
  total_balance: number
  auto_pay_enabled: boolean
  dues_accounts: DuesAccount[]
  saved_cards: SavedCard[]
}

interface UserProfile {
  auto_pay_enabled?: boolean
}

// ==================== Main Component ====================

export default function BillingPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoPayEnabled, setAutoPayEnabled] = useState(false)
  const [isUpdatingAutoPay, setIsUpdatingAutoPay] = useState(false)

  useEffect(() => {
    async function fetchBillingData() {
      if (!session) return

      try {
        setLoading(true)
        setError(null)

        const accessToken = (session as any)?.accessToken
        const headers = {
          "Authorization": `Bearer ${accessToken || ""}`,
          "Content-Type": "application/json",
        }

        // Fetch dues accounts, payment methods, and profile in parallel
        const [duesRes, cardsRes, profileRes] = await Promise.all([
          fetch(`${API_BASE}/api/portal/dues-accounts/`, { headers }),
          fetch(`${API_BASE}/api/portal/payment-methods/`, { headers }),
          fetch(`${API_BASE}/api/portal/profile/`, { headers }),
        ])

        const [dues, cards, profile]: [any, any, UserProfile] = await Promise.all([
          duesRes.ok ? duesRes.json() : { results: [] },
          cardsRes.ok ? cardsRes.json() : { results: [] },
          profileRes.ok ? profileRes.json() : {},
        ])

        const duesAccounts = dues.results || dues
        const savedCards = cards.results || cards

        // Calculate total balance
        const totalBalance = duesAccounts.reduce(
          (sum: number, acc: DuesAccount) => sum + parseFloat(acc.balance),
          0
        )

        setData({
          total_balance: totalBalance,
          auto_pay_enabled: profile.auto_pay_enabled || false,
          dues_accounts: duesAccounts,
          saved_cards: savedCards,
        })
        setAutoPayEnabled(profile.auto_pay_enabled || false)
      } catch (err) {
        console.error("Failed to fetch billing data:", err)
        setError("Unable to load billing information")
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchBillingData()
    }
  }, [session])

  const handleAutoPayToggle = async (enabled: boolean) => {
    setIsUpdatingAutoPay(true)
    try {
      const accessToken = (session as any)?.accessToken
      const response = await fetch(`${API_BASE}/api/portal/profile/`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${accessToken || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ auto_pay_enabled: enabled }),
      })

      if (response.ok) {
        setAutoPayEnabled(enabled)
      }
    } catch (err) {
      console.error("Failed to update auto-pay:", err)
    } finally {
      setIsUpdatingAutoPay(false)
    }
  }

  if (loading) {
    return <BillingSkeleton />
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  const hasBalance = data.total_balance > 0
  const defaultCard = data.saved_cards.find(c => c.is_default)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Billing & Dues</h1>
        <p className="text-muted-foreground mt-1">
          Manage payments, dues, and billing settings
        </p>
      </div>

      {/* Balance Overview */}
      <Card className={hasBalance ? "border-amber-500/50" : "border-green-500/50"}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Balance Due</p>
              <p className={`text-4xl font-bold ${hasBalance ? 'text-amber-600' : 'text-green-600'}`}>
                ${Math.abs(data.total_balance).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasBalance
                  ? `Across ${data.dues_accounts.filter(a => parseFloat(a.balance) > 0).length} account(s)`
                  : data.total_balance < 0 ? 'Credit on account' : 'All accounts paid in full!'
                }
              </p>
            </div>
            {hasBalance && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Link href="/portal/billing/pay">
                  <Button size="lg" className="w-full sm:w-auto">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Pay Now
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/portal/billing/payment-methods">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">Payment Methods</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {data.saved_cards.length} card(s) saved
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/billing/history">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <History className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">Payment History</h3>
                <p className="text-sm text-muted-foreground truncate">
                  View past transactions
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/credits">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">Credits & Promos</h3>
                <p className="text-sm text-muted-foreground truncate">
                  View available credits
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Auto-Pay Setting */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <ToggleLeft className="h-5 w-5" />
                Auto-Pay
              </CardTitle>
              <CardDescription>
                Automatically pay dues when they're charged
              </CardDescription>
            </div>
            <Switch
              checked={autoPayEnabled}
              onCheckedChange={handleAutoPayToggle}
              disabled={isUpdatingAutoPay || data.saved_cards.length === 0}
            />
          </div>
        </CardHeader>
        <CardContent>
          {data.saved_cards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add a payment method to enable auto-pay.{' '}
              <Link href="/portal/billing/payment-methods" className="text-primary hover:underline">
                Add a card
              </Link>
            </p>
          ) : autoPayEnabled ? (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>
                Auto-pay is enabled using{' '}
                <span className="font-medium">
                  {defaultCard?.display_name || 'your default card'}
                </span>
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              When enabled, dues will be automatically charged to your default payment method.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dues by Child */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dues by Child</CardTitle>
          <CardDescription>
            Individual account balances for each child
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.dues_accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No dues accounts found</p>
              <p className="text-sm">Add children to start tracking dues</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.dues_accounts.map((account) => {
                const balance = parseFloat(account.balance)
                return (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        account.is_good_standing
                          ? 'bg-green-100 text-green-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}>
                        {account.is_good_standing ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <AlertCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{account.player_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {account.is_good_standing ? 'Good standing' : 'Balance due'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        balance > 0 ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        ${Math.abs(balance).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {balance > 0 ? 'Due' : balance < 0 ? 'Credit' : 'Paid'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {data.dues_accounts.some(a => a.recent_transactions?.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
              <Link href="/portal/billing/history">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.dues_accounts
                .flatMap(a => a.recent_transactions?.map(t => ({ ...t, player: a.player_name })) || [])
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        tx.transaction_type === 'payment' || tx.transaction_type === 'credit'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}>
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.player} • {new Date(tx.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <p className={`font-medium shrink-0 ${
                      tx.transaction_type === 'payment' || tx.transaction_type === 'credit'
                        ? 'text-green-600'
                        : 'text-amber-600'
                    }`}>
                      {tx.transaction_type === 'payment' || tx.transaction_type === 'credit' ? '-' : '+'}
                      ${parseFloat(tx.amount).toFixed(2)}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ==================== Loading Skeleton ====================

function BillingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-12 w-40 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-5 flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-6 w-16 mb-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
