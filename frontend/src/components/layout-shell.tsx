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
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
