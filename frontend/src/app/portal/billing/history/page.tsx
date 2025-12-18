"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DollarSign,
  ChevronLeft,
  AlertCircle,
  Filter,
  Calendar,
  Download
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ==================== Types ====================

interface Transaction {
  id: number
  transaction_type: string
  amount: string
  description: string
  balance_after: string
  created_at: string
  player_name?: string
}

interface DuesAccount {
  id: number
  player_name: string
  recent_transactions: Transaction[]
}

// ==================== Main Component ====================

export default function PaymentHistoryPage() {
  const { data: session } = useSession()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    async function fetchHistory() {
      if (!session) return

      try {
        setLoading(true)
        setError(null)

        const accessToken = (session as any)?.accessToken
        const response = await fetch(`${API_BASE}/api/portal/dues-accounts/`, {
          headers: {
            "Authorization": `Bearer ${accessToken || ""}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          const accounts: DuesAccount[] = data.results || data

          // Flatten all transactions with player names
          const allTransactions = accounts.flatMap(account =>
            (account.recent_transactions || []).map(tx => ({
              ...tx,
              player_name: account.player_name
            }))
          )

          // Sort by date descending
          allTransactions.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )

          setTransactions(allTransactions)
        } else {
          setError("Failed to load payment history")
        }
      } catch (err) {
        console.error("Failed to fetch history:", err)
        setError("Unable to connect to server")
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchHistory()
    }
  }, [session])

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    if (filter === "all") return true
    return tx.transaction_type === filter
  })

  // Group transactions by month
  const groupedTransactions = filteredTransactions.reduce((groups, tx) => {
    const date = new Date(tx.created_at)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    if (!groups[key]) {
      groups[key] = { label, transactions: [] }
    }
    groups[key].transactions.push(tx)
    return groups
  }, {} as Record<string, { label: string; transactions: Transaction[] }>)

  if (loading) {
    return <HistorySkeleton />
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
      {/* Back Link */}
      <Link
        href="/portal/billing"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Billing
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Payment History</h1>
          <p className="text-muted-foreground mt-1">
            View all charges, payments, and credits
          </p>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="charge">Charges Only</SelectItem>
                <SelectItem value="payment">Payments Only</SelectItem>
                <SelectItem value="credit">Credits Only</SelectItem>
                <SelectItem value="refund">Refunds Only</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {filteredTransactions.length} transaction(s)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No transactions</h3>
            <p className="text-muted-foreground">
              {filter === "all"
                ? "Your payment history will appear here"
                : `No ${filter} transactions found`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([key, group]) => (
            <div key={key}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {group.label}
              </h3>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {group.transactions.map((tx) => (
                      <TransactionRow key={tx.id} transaction={tx} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ==================== Transaction Row ====================

function TransactionRow({ transaction: tx }: { transaction: Transaction }) {
  const isPositive = tx.transaction_type === 'payment' || tx.transaction_type === 'credit' || tx.transaction_type === 'refund'
  const amount = parseFloat(tx.amount)

  const typeLabels: Record<string, string> = {
    charge: 'Charge',
    payment: 'Payment',
    credit: 'Credit',
    refund: 'Refund'
  }

  const typeColors: Record<string, string> = {
    charge: 'bg-warning/30 text-foreground border-warning/40',
    payment: 'bg-success/40 text-foreground border-success/50',
    credit: 'bg-info/40 text-foreground border-info/50',
    refund: 'bg-secondary/40 text-foreground border-secondary/50'
  }

  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
          isPositive ? 'bg-success/40 text-foreground' : 'bg-warning/30 text-foreground'
        }`}>
          <DollarSign className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium truncate">{tx.description}</p>
            <Badge variant="outline" className={`text-xs ${typeColors[tx.transaction_type] || ''}`}>
              {typeLabels[tx.transaction_type] || tx.transaction_type}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
            {tx.player_name && (
              <>
                <span>{tx.player_name}</span>
                <span>•</span>
              </>
            )}
            <span>
              {new Date(tx.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="text-right shrink-0 ml-4">
        <p className={`font-bold ${isPositive ? 'text-green-600' : 'text-amber-600'}`}>
          {isPositive ? '-' : '+'}${amount.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground">
          Bal: ${parseFloat(tx.balance_after).toFixed(2)}
        </p>
      </div>
    </div>
  )
}

// ==================== Loading Skeleton ====================

function HistorySkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />

      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-44" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div>
          <Skeleton className="h-4 w-32 mb-3" />
          <Card>
            <CardContent className="p-0">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center justify-between p-4 border-b last:border-0">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-48 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-5 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
