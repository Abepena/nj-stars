"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { loadStripe } from "@stripe/stripe-js"

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

interface CheckoutButtonProps {
  productId: number
  productName: string
  price: number
  quantity?: number
}

export function CheckoutButton({
  productId,
  productName,
  price,
  quantity = 1
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)

    try {
      // Call backend to create Stripe Checkout Session
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/stripe/checkout/create-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_id: productId,
            quantity,
            success_url: `${window.location.origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${window.location.origin}/shop?canceled=true`,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }

      const { url } = await response.json()

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Checkout error:", error)
      alert("Failed to initiate checkout. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      size="lg"
      className="w-full bg-gradient-to-br from-foreground/40 to-accent text-background font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Processing..." : `Buy Now - $${price.toFixed(2)}`}
    </Button>
  )
}
