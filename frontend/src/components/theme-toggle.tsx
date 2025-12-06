"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [theme, setThemeState] = React.useState<"dark" | "light">("dark")

  // Initialize theme from DOM on mount
  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    const isLight = document.documentElement.classList.contains("light")
    setThemeState(isLight ? "light" : "dark")

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark")
      const isLight = document.documentElement.classList.contains("light")
      setThemeState(isLight ? "light" : "dark")
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setThemeState(newTheme)

    // Update localStorage
    localStorage.setItem("nj-stars-theme", newTheme)

    // Update DOM
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(newTheme)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="relative"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
