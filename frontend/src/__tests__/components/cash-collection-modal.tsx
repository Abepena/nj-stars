"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Loader2, CheckCircle, AlertCircle } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

type PaymentFor = "registration" | "product" | "dues"

interface LinkedItem {
  id: number
  description: string
  amount: number
}

interface CashCollectionModalProps {
  trigger?: React.ReactNode
  paymentFor?: PaymentFor
  linkedItem?: LinkedItem
  eventId?: number
  onSuccess?: (cashPayment: CashPaymentResult) => void
}

interface CashPaymentResult {
  id: number
  amount: string
  payment_for: string
  linked_item_description: string
  status: string
}

export function CashCollectionModal({
  trigger,
  paymentFor: initialPaymentFor,
  linkedItem: initialLinkedItem,
  eventId,
  onSuccess,
}: CashCollectionModalProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [paymentFor, setPaymentFor] = useState<PaymentFor | "">(initialPaymentFor || "")
  const [linkedItem, setLinkedItem] = useState<LinkedItem | null>(initialLinkedItem || null)
  const [notes, setNotes] = useState("")

  // For searching items (when not pre-populated)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<LinkedItem[]>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    if (!paymentFor || !searchQuery.trim()) return

    setSearching(true)
    setError(null)

    try {
      const apiToken = (session as any)?.apiToken
      let endpoint = ""

      if (paymentFor === "registration") {
        endpoint = `/api/portal/admin/registrations/?search=${encodeURIComponent(searchQuery)}&payment_status=pending`
      } else if (paymentFor === "product") {
        endpoint = `/api/payments/orders/?search=${encodeURIComponent(searchQuery)}&status=pending`
      } else if (paymentFor === "dues") {
        endpoint = `/api/portal/dues/?search=${encodeURIComponent(searchQuery)}&has_balance=true`
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          Authorization: apiToken ? `Token ${apiToken}` : "",
        },
      })

      if (!response.ok) throw new Error("Search failed")

      const data = await response.json()
      const results = (data.results || []).map((item: any) => ({
        id: item.id,
        description: formatItemDescription(paymentFor, item),
        amount: parseFloat(item.amount_owed || item.total || item.balance || "0"),
      }))

      setSearchResults(results)
    } catch (err) {
      setError("Failed to search. Please try again.")
    } finally {
      setSearching(false)
    }
  }

  const formatItemDescription = (type: PaymentFor, item: any): string => {
    if (type === "registration") {
      return `${item.participant_first_name} ${item.participant_last_name} - ${item.event?.title || "Event"}`
    } else if (type === "product") {
      return `Order #${item.order_number} - ${item.shipping_name}`
    } else if (type === "dues") {
      return `${item.player?.first_name} ${item.player?.last_name} - Dues`
    }
    return `Item #${item.id}`
  }

  const handleCollectCash = async () => {
    if (!paymentFor || !linkedItem) {
      setError("Please select an item to collect payment for")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const apiToken = (session as any)?.apiToken

      const body: Record<string, any> = {
        payment_for: paymentFor,
        notes,
      }

      // Set the correct ID field based on payment type
      if (paymentFor === "registration") {
        body.registration_id = linkedItem.id
      } else if (paymentFor === "product") {
        body.order_id = linkedItem.id
      } else if (paymentFor === "dues") {
        body.dues_account_id = linkedItem.id
      }

      if (eventId) {
        body.event_id = eventId
      }

      const response = await fetch(`${API_BASE}/api/payments/cash/collect/`, {
        method: "POST",
        headers: {
          Authorization: apiToken ? `Token ${apiToken}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.detail || "Failed to record payment")
      }

      const result = await response.json()
      setSuccess(true)

      if (onSuccess) {
        onSuccess(result)
      }

      // Reset and close after delay
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setPaymentFor(initialPaymentFor || "")
        setLinkedItem(initialLinkedItem || null)
        setNotes("")
        setSearchQuery("")
        setSearchResults([])
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <DollarSign className="h-4 w-4 mr-2" />
            Collect Cash
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Collect Cash Payment
          </DialogTitle>
          <DialogDescription>
            Record a cash payment for an event registration, product order, or dues payment.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
            <p className="text-lg font-medium">Payment Recorded!</p>
            <p className="text-sm text-muted-foreground">
              ${linkedItem?.amount.toFixed(2)} collected successfully
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Payment Type Selection */}
            {!initialPaymentFor && (
              <div className="space-y-2">
                <Label htmlFor="payment-type">Payment Type</Label>
                <Select
                  value={paymentFor}
                  onValueChange={(value) => {
                    setPaymentFor(value as PaymentFor)
                    setLinkedItem(null)
                    setSearchResults([])
                    setSearchQuery("")
                  }}
                >
                  <SelectTrigger id="payment-type">
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registration">Event Registration</SelectItem>
                    <SelectItem value="product">Product Order</SelectItem>
                    <SelectItem value="dues">Dues Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Item Selection */}
            {paymentFor && !initialLinkedItem && (
              <div className="space-y-2">
                <Label>Search for Item</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={
                      paymentFor === "registration"
                        ? "Search by name or email..."
                        : paymentFor === "product"
                        ? "Search by order number..."
                        : "Search by player name..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button
                    variant="outline"
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                  >
                    {searching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Search"
                    )}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        className={`w-full p-3 text-left hover:bg-accent transition-colors ${
                          linkedItem?.id === item.id ? "bg-accent" : ""
                        }`}
                        onClick={() => setLinkedItem(item)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{item.description}</span>
                          <Badge variant="secondary">${item.amount.toFixed(2)}</Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Selected Item Display */}
            {linkedItem && (
              <div className="bg-accent/50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{linkedItem.description}</p>
                    <p className="text-xs text-muted-foreground capitalize">{paymentFor}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      ${linkedItem.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">Amount to collect</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this payment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              className="w-full"
              onClick={handleCollectCash}
              disabled={loading || !linkedItem}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Collect ${linkedItem?.amount.toFixed(2) || "0.00"} Cash
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
