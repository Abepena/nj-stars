"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, Sun, Moon } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet"

const navLinks = [
  { href: "/news", label: "News" },
  { href: "/shop", label: "Shop" },
  { href: "/events", label: "Events" },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [textLogo, setTextLogo] = useState("/brand/logos/Text Logo.svg")
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  // Only render this nav on small screens to avoid off-canvas overflow on desktop
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    setMounted(true)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Update logo based on theme (client-side only)
  useEffect(() => {
    const updateLogo = () => {
      const isLight = document.documentElement.classList.contains("light")
      setTextLogo(isLight ? "/brand/logos/Text Logo Light.svg" : "/brand/logos/Text Logo.svg")
    }

    updateLogo()

    const observer = new MutationObserver(updateLogo)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  if (!isMobile) return null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="md:hidden p-2"
          size="icon"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-xs sm:max-w-sm">
        <SheetHeader className="border-b border-border pb-4">
          <Link
            href="/"
            className="flex justify-center transition-opacity duration-200 ease-in-out hover:opacity-60"
          >
            <Image
              src={textLogo}
              alt="NJ Stars"
              width={160}
              height={50}
            />
          </Link>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-lg font-medium hover:text-primary transition-colors py-2"
              >
                <span className={isActive ? "border-b-2 border-primary pb-0.5" : ""}>
                  {link.label}
                </span>
              </Link>
            )
          })}

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center justify-between w-full py-2 text-lg font-medium hover:text-primary transition-colors"
          >
            <span>{mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            {mounted && (
              theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )
            )}
          </button>

          <div className="pt-4 border-t border-border">
            <Link href="/portal/login" onClick={() => setOpen(false)}>
              <Button
                variant="ghost"
                className="w-full text-sm font-medium text-primary hover:text-primary-foreground hover:bg-primary hover:shadow-md hover:shadow-primary/25 transition-all duration-200 ease-in-out"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
