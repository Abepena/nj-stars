"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { BagProvider } from "@/lib/bag"
import { ToastProvider } from "@/components/ui/toast"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider defaultTheme="dark" storageKey="nj-stars-theme">
        <ToastProvider>
          <BagProvider>
            {children}
          </BagProvider>
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
