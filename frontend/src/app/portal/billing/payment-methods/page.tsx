"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  CreditCard,
  Plus,
  ChevronLeft,
  AlertCircle,
  Star,
  Trash2,
  Loader2,
  CheckCircle
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ==================== Types ====================

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

// Card brand icons (simplified text versions)
const cardBrandIcons: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  discover: "Discover",
  default: "Card"
}

// ==================== Main Component ====================

export default function PaymentMethodsPage() {
  const { data: session } = useSession()
  const [cards, setCards] = useState<SavedCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    fetchCards()
  }, [session])

  async function fetchCards() {
    if (!session) return

    try {
      setLoading(true)
      setError(null)

      const accessToken = (session as any)?.accessToken
      const response = await fetch(`${API_BASE}/api/portal/payment-methods/`, {
        headers: {
          "Authorization": `Bearer ${accessToken || ""}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCards(data.results || data)
      } else {
        setError("Failed to load payment methods")
      }
    } catch (err) {
      console.error("Failed to fetch cards:", err)
      setError("Unable to connect to server")
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (cardId: number) => {
    setActionLoading(cardId)
    try {
      const accessToken = (session as any)?.accessToken
      const response = await fetch(`${API_BASE}/api/portal/payment-methods/${cardId}/set_default/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken || ""}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Update local state
        setCards(cards.map(c => ({
          ...c,
          is_default: c.id === cardId
        })))
      }
    } catch (err) {
      console.error("Failed to set default:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (cardId: number) => {
    setActionLoading(cardId)
    try {
      const accessToken = (session as any)?.accessToken
      const response = await fetch(`${API_BASE}/api/portal/payment-methods/${cardId}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken || ""}`,
        },
      })

      if (response.ok) {
        setCards(cards.filter(c => c.id !== cardId))
      }
    } catch (err) {
      console.error("Failed to delete card:", err)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return <PaymentMethodsSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => fetchCards()}>Try Again</Button>
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
          <h1 className="text-2xl sm:text-3xl font-bold">Payment Methods</h1>
          <p className="text-muted-foreground mt-1">
            Manage your saved payment methods
          </p>
        </div>
        <Link href="/portal/billing/payment-methods/add">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add Card
          </Button>
        </Link>
      </div>

      {/* Cards List */}
      {cards.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No payment methods</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add a credit or debit card to make payments and enable auto-pay for dues.
            </p>
            <Link href="/portal/billing/payment-methods/add">
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Add Your First Card
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {cards.map((card) => (
            <Card
              key={card.id}
              className={card.is_expired ? "border-destructive/50 bg-destructive/5" : ""}
            >
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Card Icon */}
                  <div className="h-14 w-20 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {cardBrandIcons[card.card_brand.toLowerCase()] || card.card_brand}
                  </div>

                  {/* Card Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">
                        {card.nickname || `${card.card_brand} ****${card.card_last4}`}
                      </h3>
                      {card.is_default && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3" />
                          Default
                        </Badge>
                      )}
                      {card.is_expired && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {card.card_brand} ending in {card.card_last4}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expires {card.card_exp_month.toString().padStart(2, '0')}/{card.card_exp_year}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:shrink-0">
                    {!card.is_default && !card.is_expired && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(card.id)}
                        disabled={actionLoading === card.id}
                      >
                        {actionLoading === card.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Set as Default"
                        )}
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          disabled={actionLoading === card.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove payment method?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove {card.card_brand} ****{card.card_last4} from your account.
                            {card.is_default && " You'll need to set a new default payment method."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(card.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Your cards are secure</p>
              <p className="text-muted-foreground mt-1">
                We use Stripe to securely process and store your payment information.
                Your full card number is never stored on our servers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== Loading Skeleton ====================

function PaymentMethodsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      <div className="space-y-4">
        {[1, 2].map(i => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Skeleton className="h-14 w-20 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-28" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
