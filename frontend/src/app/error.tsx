"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LayoutShell } from "@/components/layout-shell"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <LayoutShell>
      <section className="py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-8xl font-bold text-destructive mb-4">500</h1>
          <h2 className="text-3xl font-semibold mb-4">Something Went Wrong</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            An unexpected error occurred. Please try again later.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="cta" size="lg" onClick={reset}>
              Try Again
            </Button>
            <Link href="/">
              <Button variant="outline" size="lg">
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </LayoutShell>
  )
}
