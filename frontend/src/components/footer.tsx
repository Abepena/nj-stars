"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Instagram } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/shop", label: "Shop" },
  { href: "/contact", label: "Contact Us" },
]

export function Footer() {
  const [isLightMode, setIsLightMode] = useState(false)
  const [instagramUrl, setInstagramUrl] = useState<string>("")

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

  // Fetch site settings for Instagram URL
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch(`${API_BASE}/api/settings/`)
        if (response.ok) {
          const data = await response.json()
          setInstagramUrl(data.instagram_url || "")
        }
      } catch {
        // Silently fail - Instagram link just won't show
      }
    }
    fetchSettings()
  }, [])

  // Light mode: #285441 (dark forest green)
  // Dark mode: light greenish color for visibility
  const leagLogoFilter = isLightMode
    ? "brightness(0) saturate(100%) invert(27%) sepia(15%) saturate(1400%) hue-rotate(108deg) brightness(94%) contrast(89%)"
    : "brightness(0) saturate(100%) invert(85%) sepia(18%) saturate(747%) hue-rotate(88deg) brightness(101%) contrast(87%)"

  return (
    <footer className="bg-background py-8 border-t border-border">
      <div className="container mx-auto px-4 space-y-6">
        {/* Footer Links & Social */}
        <nav className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
          )}
        </nav>

        {/* Copyright & Powered By */}
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-sm">
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
      </div>
    </footer>
  )
}
