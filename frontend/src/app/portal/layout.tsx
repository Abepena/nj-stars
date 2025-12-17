"use client"

import { usePathname } from "next/navigation"
import { LayoutShell } from "@/components/layout-shell"

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Routes that have their own complete layout (don't wrap with LayoutShell)
  const selfContainedRoutes = [
    "/portal/dashboard",  // Dashboard has sidebar layout (includes /admin)
    "/portal/login",      // Full-screen auth page
    "/portal/register",   // Full-screen auth page
  ]

  const isSelfContained = selfContainedRoutes.some(route =>
    pathname?.startsWith(route)
  )

  if (isSelfContained) {
    return <>{children}</>
  }

  return (
    <LayoutShell>
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </LayoutShell>
  )
}
