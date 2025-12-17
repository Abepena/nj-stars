"use client"

/**
 * Dashboard Router
 *
 * Routes authenticated users to the appropriate dashboard based on their role.
 *
 * Role hierarchy:
 * - superuser/staff: Full admin dashboard with management tools
 * - player: Player dashboard (13+ with own account)
 * - parent: Parent/guardian dashboard managing children (default)
 */

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

// Import dashboards
import AdminDashboard from "@/components/dashboard/admin-dashboard"
import PlayerExamplePage from "../examples/player/page"
import ParentExamplePage from "../examples/parent/page"

// Type for the extended session user
interface ExtendedUser {
  id?: string
  email?: string | null
  name?: string | null
  image?: string | null
  is_superuser?: boolean
  is_staff?: boolean
  role?: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/portal/login")
    }
  }, [status, router])

  // Show loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Not authenticated
  if (!session) {
    return null
  }

  // Get user details from session
  const user = session.user as ExtendedUser

  // Determine which dashboard to show based on role hierarchy
  // 1. Superuser or Staff - Full admin dashboard
  if (user.is_superuser || user.is_staff || user.role === "staff") {
    return <AdminDashboard />
  }

  // 2. Player (13+) with own account
  if (user.role === "player") {
    return <PlayerExamplePage />
  }

  // 3. Parent/Guardian (default)
  return <ParentExamplePage />
}
