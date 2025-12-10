"use client"

import { ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ChevronLeft, Eye } from "lucide-react"

interface ExamplesLayoutProps {
  children: ReactNode
}

/**
 * Layout for example/demo pages.
 * BLOCKED in production - only accessible in development mode.
 */
export default function ExamplesLayout({ children }: ExamplesLayoutProps) {
  const router = useRouter()
  const [isAllowed, setIsAllowed] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Block access in production
    const isDev = process.env.NODE_ENV === "development"
    const isPreview = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"

    // Allow in development or Vercel preview deployments
    if (isDev || isPreview) {
      setIsAllowed(true)
    } else {
      // In production, redirect to main dashboard
      router.replace("/portal/dashboard")
    }
    setIsChecking(false)
  }, [router])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!isAllowed) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Dev Mode Banner */}
      <div className="sticky top-0 z-50 bg-amber-500 text-amber-950 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Example Pages — Development Only
            </span>
          </div>
          <Badge variant="outline" className="bg-amber-400/50 border-amber-600 text-amber-900">
            <Eye className="h-3 w-3 mr-1" />
            Preview Mode
          </Badge>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              href="/portal/examples"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              All Examples
            </Link>
            <Link href="/portal/dashboard">
              <Button variant="outline" size="sm">
                Exit Examples
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
