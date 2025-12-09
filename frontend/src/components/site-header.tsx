"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { MobileNav } from "@/components/mobile-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { CartDrawer } from "@/components/cart-drawer"
import { useCart } from "@/lib/cart"
import { ShoppingCart } from "lucide-react"

const links = [
  { href: "/news", label: "News" },
  { href: "/shop", label: "Shop" },
  { href: "/events", label: "Events" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { cart } = useCart()
  const [textLogo, setTextLogo] = useState("/brand/logos/Text Logo.svg")
  const [cartOpen, setCartOpen] = useState(false)

  const itemCount = cart?.item_count || 0

  // Update logo based on theme (client-side only to avoid SSR issues)
  useEffect(() => {
    const updateLogo = () => {
      const isLight = document.documentElement.classList.contains("light")
      setTextLogo(isLight ? "/brand/logos/Text Logo Light.svg" : "/brand/logos/Text Logo.svg")
    }

    // Initial update
    updateLogo()

    // Watch for class changes on html element
    const observer = new MutationObserver(updateLogo)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const linkClasses = (href: string) =>
    [
      "text-foreground hover:text-foreground/80 transition-colors ease-in-out font-medium",
      pathname === href ? "border-b-2 border-primary" : "",
    ].join(" ").trim()

  return (
    <nav className="border-b border-border">
      <div className="container mx-auto px-4 py-2 relative">
        <div className="flex items-center justify-start">
          {/* Logo - text only */}
          <Link
            href="/"
            className="transition-opacity duration-200 ease-in-out hover:opacity-60"
          >
            <Image
              src={textLogo}
              alt="NJ Stars"
              width={120}
              height={38}
              className="w-[120px] h-[38px] md:w-[160px] md:h-[50px]"
            />
          </Link>
        </div>

        {/* Desktop Navigation - hidden on mobile */}
        <div className="hidden md:flex gap-6 items-center absolute right-4 top-1/2 -translate-y-1/2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={linkClasses(link.href)}>
              {link.label}
            </Link>
          ))}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Shopping Cart */}
          <Button
            variant="ghost"
            size="icon"
            className="group relative h-9 w-9"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5 text-primary transition-colors group-hover:text-foreground" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Button>

          {/* Sign In or Portal */}
          {!session ? (
            <Link href="/portal/login">
              <Button variant="ghost" size="sm" className="text-sm font-medium text-primary hover:bg-gradient-to-br hover:from-foreground/40 hover:to-primary hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ease-in-out">
                Sign In
              </Button>
            </Link>
          ) : (
            <Link href="/portal/login">
              <Button className="bg-gradient-to-br from-foreground/40 to-primary text-background font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ease-in-out">
                Portal
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Navigation & Actions - visible on mobile only, positioned on right */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 md:hidden flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Shopping Cart */}
          <Button
            variant="ghost"
            size="icon"
            className="group relative h-9 w-9"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5 text-primary transition-colors group-hover:text-foreground" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Button>

          {/* Sign In Link - only show if not authenticated */}
          {!session && (
            <Link href="/portal/login">
              <Button variant="ghost" size="sm" className="text-sm text-primary hover:bg-gradient-to-br hover:from-foreground/40 hover:to-primary hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ease-in-out">
                Sign In
              </Button>
            </Link>
          )}

          {/* Mobile Menu */}
          <MobileNav />
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </nav>
  )
}
