"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutShell } from "@/components/layout-shell"

export default function CancelPage() {
  return (
    <LayoutShell>
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              {/* Cancel Icon */}
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-warning"
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
              <CardTitle className="text-3xl">Checkout Canceled</CardTitle>
              <CardDescription className="text-base mt-2">
                Your order was not completed
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <p className="text-center text-text-secondary">
                No charges were made. You can continue shopping or try again when you're ready.
              </p>

              <div className="flex flex-col gap-3 pt-4">
                <Link href="/shop" className="block">
                  <Button variant="cta" className="w-full">
                    Back to Shop
                  </Button>
                </Link>

                <Link href="/" className="block">
                  <Button variant="outline" className="w-full">
                    Return to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </LayoutShell>
  )
}
