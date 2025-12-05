"use client"

import type { ReactNode } from "react"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"

interface LayoutShellProps {
  children: ReactNode
}

export function LayoutShell({ children }: LayoutShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
