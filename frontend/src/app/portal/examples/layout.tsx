"use client"

import { ReactNode, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ChevronLeft, Crown, Lock } from "lucide-react"

interface ExamplesLayoutProps {
  children: ReactNode
}

/**
 * Layout for example/demo pages.
 * Requires superuser privileges to access.
 */
export default function ExamplesLayout({ children }: ExamplesLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAllowed, setIsAllowed] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    // Check if user is superuser
    const userRole = session?.user?.role || (session?.user as any)?.role || ""
    const isSuperuser = userRole === "superuser" || (session?.user as any)?.isSuperuser || false

    if (isSuperuser) {
      setIsAllowed(true)
    } else {
      // Non-superusers are redirected to dashboard
      setIsAllowed(false)
    }
    setIsChecking(false)
  }, [session, status, router])

  if (status === "loading" || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
          <p className="text-muted-foreground mb-6">
            This section is only accessible to superusers. If you believe you should have access,
            please contact an administrator.
          </p>
          <Link href="/portal/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Superuser Mode Banner */}
      <div className="sticky top-0 z-50 bg-amber-500 text-amber-950 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Example Pages — Superuser Only
            </span>
          </div>
          <Badge variant="outline" className="bg-amber-400/50 border-amber-600 text-amber-900">
            <Crown className="h-3 w-3 mr-1" />
            Superuser Access
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
