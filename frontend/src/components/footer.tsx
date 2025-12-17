"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

export function Footer() {
  const [isLightMode, setIsLightMode] = useState(false)

  useEffect(() => {
    const updateTheme = () => {
      setIsLightMode(document.documentElement.classList.contains("light"))
    }

    // Initial check
    updateTheme()

    // Watch for theme changes
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  // Light mode: #285441 (dark forest green)
  // Dark mode: light greenish color for visibility
  const leagLogoFilter = isLightMode
    ? "brightness(0) saturate(100%) invert(27%) sepia(15%) saturate(1400%) hue-rotate(108deg) brightness(94%) contrast(89%)"
    : "brightness(0) saturate(100%) invert(85%) sepia(18%) saturate(747%) hue-rotate(88deg) brightness(101%) contrast(87%)"

  return (
    <footer className="bg-muted py-8 border-t border-border">
      <div className="container mx-auto px-4 text-center space-y-2">
        <p className="text-muted-foreground">
          © {new Date().getFullYear()} NJ Stars Elite Basketball. All rights reserved.
        </p>
        <p className="text-muted-foreground/60 text-sm flex items-center justify-center gap-1.5">
          Powered by{" "}
          <a
            href="https://leag.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center hover:opacity-80 transition-opacity"
          >
            <Image
              src="/brand/logos/leag-logo.svg"
              alt="LEAG"
              width={48}
              height={48}
              className="h-20 w-auto"
              style={{ filter: leagLogoFilter }}
            />
          </a>
        </p>
      </div>
    </footer>
  )
}
