"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { BagProvider } from "@/lib/bag"
import { ToastProvider } from "@/components/ui/toast"
import { GoogleMapsProvider } from "@/components/google-maps-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider defaultTheme="dark" storageKey="nj-stars-theme" forcedTheme="dark">
        <ToastProvider>
          <BagProvider>
            <GoogleMapsProvider>
              {children}
            </GoogleMapsProvider>
          </BagProvider>
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
