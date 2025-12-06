"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutShell } from "@/components/layout-shell"
import { LoadingSpinner } from "@/components/loading-spinner"

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams?.get("session_id")

  return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              {/* Success Icon */}
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <CardTitle className="text-3xl">Order Successful!</CardTitle>
              <CardDescription className="text-base mt-2">
                Thank you for your purchase
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <p className="text-center text-text-secondary">
                Your order has been confirmed and you will receive an email confirmation shortly.
              </p>

              {sessionId && (
                <div className="bg-bg-tertiary p-4 rounded-lg">
                  <p className="text-sm text-text-secondary mb-2 text-center">Order Reference</p>
                  <p className="font-mono text-sm break-all text-center text-text-accent">{sessionId}</p>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-4">
                <Link href="/shop" className="block">
                  <Button className="w-full bg-gradient-to-br from-foreground/40 to-primary text-background font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
                    Continue Shopping
                  </Button>
                </Link>

                <Link href="/" className="block">
                  <Button variant="outline" className="w-full border-border text-accent hover:bg-gradient-to-br hover:from-foreground/40 hover:to-primary hover:shadow-lg hover:scale-[1.02] transition-all">
                    Return to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
  )
}

export default function SuccessPage() {
  return (
    <LayoutShell>
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading..." />
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </LayoutShell>
  )
}
