"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutShell } from "@/components/layout-shell"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfettiCelebration } from "@/components/confetti-celebration"

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams?.get("session_id")

  return (
    <>
      {/* Confetti celebration */}
      <ConfettiCelebration />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto overflow-hidden">
            <CardHeader className="text-center">
              {/* Animated Success Icon */}
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-success/20 flex items-center justify-center animate-success-pulse">
                <svg
                  className="w-12 h-12 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                    className="animate-[draw-check_0.5s_ease-out_0.3s_forwards]"
                    style={{
                      strokeDasharray: 24,
                      strokeDashoffset: 24,
                    }}
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
    </>
  )
}

function SuccessPageSkeleton() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <Skeleton className="mx-auto mb-4 w-16 h-16 rounded-full" />
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-5 w-64 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <div className="flex flex-col gap-3 pt-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
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
      <Suspense fallback={<SuccessPageSkeleton />}>
        <SuccessContent />
      </Suspense>
    </LayoutShell>
  )
}
