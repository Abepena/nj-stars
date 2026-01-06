"use client"

import * as React from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  /** Force a specific theme, ignoring user preference. Used for single-theme sites. */
  forcedTheme?: "dark" | "light"
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  /** Whether theme is forced (hides toggle UI) */
  isForced: boolean
}

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
  isForced: false,
}

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "nj-stars-theme",
  forcedTheme,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(
    () => forcedTheme || (typeof window !== "undefined" && (localStorage.getItem(storageKey) as Theme)) || defaultTheme
  )

  React.useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    // If theme is forced, always use forced theme
    const effectiveTheme = forcedTheme || theme

    if (effectiveTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(effectiveTheme)
  }, [theme, forcedTheme])

  const value = {
    theme: forcedTheme || theme,
    setTheme: (theme: Theme) => {
      if (forcedTheme) return // Don't allow changes when forced
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    isForced: !!forcedTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)

  if (context === undefined) {
    // During build/SSR, return default values
    if (typeof window === "undefined") {
      return initialState
    }
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}
