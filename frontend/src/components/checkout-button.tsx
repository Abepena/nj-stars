"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ErrorMessage } from "@/components/error-message"

interface CheckoutButtonProps {
  productId: number
  productName: string
  price: number
  quantity?: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export function CheckoutButton({
  productId,
  productName,
  price,
  quantity = 1
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)

    try {
      // Call Django backend to create Stripe Checkout Session
      const response = await fetch(
        `${API_BASE_URL}/api/payments/checkout/product/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_id: productId,
            quantity,
            success_url: `${window.location.origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${window.location.origin}/shop/cancel`,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create checkout session")
      }

      const { url } = await response.json()

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      } else {
        throw new Error("No checkout URL received")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to initiate checkout. Please try again."
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-3">
      {error && <ErrorMessage error={error} className="text-sm" />}

      <Button
        onClick={handleCheckout}
        disabled={loading}
        size="lg"
        variant="cta"
        className="w-full"
      >
        {loading ? "Processing..." : `Buy Now - $${price.toFixed(2)}`}
      </Button>
    </div>
  )
}
