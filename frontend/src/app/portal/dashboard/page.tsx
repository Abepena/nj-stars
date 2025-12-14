"use client"

/**
 * Dashboard Router
 *
 * Routes authenticated users to the appropriate dashboard based on their role.
 * Uses the example dashboards until real functionality is implemented.
 *
 * Role hierarchy:
 * - superuser: Full admin access (is_superuser=true)
 * - staff: Coach/staff access (role='staff' or is_staff=true)
 * - player: Player 13+ with own account (role='player')
 * - parent: Parent/guardian managing children (role='parent', default)
 */

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

// Import example dashboards
import PlayerExamplePage from "../examples/player/page"
import ParentExamplePage from "../examples/parent/page"
import StaffExamplePage from "../examples/staff/page"
import SuperuserExamplePage from "../examples/superuser/page"

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
  // 1. Superuser takes priority (full admin access)
  if (user.is_superuser) {
    return <SuperuserExamplePage />
  }

  // 2. Staff/Coach access (is_staff flag or staff role)
  if (user.is_staff || user.role === "staff") {
    return <StaffExamplePage />
  }

  // 3. Player (13+) with own account
  if (user.role === "player") {
    return <PlayerExamplePage />
  }

  // 4. Parent/Guardian (default)
  return <ParentExamplePage />
}
