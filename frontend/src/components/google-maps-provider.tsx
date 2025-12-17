"use client"

import { ReactNode } from "react"

interface GoogleMapsProviderProps {
  children: ReactNode
}

// Stub provider - maps are loaded individually by components that need them
export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  return <>{children}</>
}
