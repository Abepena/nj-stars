"use client"

import { usePathname } from "next/navigation"
import { LayoutShell } from "@/components/layout-shell"

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Dashboard routes have their own complete layout with sidebar
  // Don't wrap them with LayoutShell to avoid double navigation
  const isDashboardRoute = pathname?.startsWith("/portal/dashboard")

  if (isDashboardRoute) {
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
