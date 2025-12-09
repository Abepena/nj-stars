"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { CartProvider } from "@/lib/cart"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider defaultTheme="dark" storageKey="nj-stars-theme">
        <CartProvider>
          {children}
        </CartProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
