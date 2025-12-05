"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { MobileNav } from "@/components/mobile-nav"
import { ShoppingCart } from "lucide-react"

const links = [
  { href: "/news", label: "News" },
  { href: "/shop", label: "Shop" },
  { href: "/events", label: "Events" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const linkClasses = (href: string) =>
    [
      "hover:text-accent transition-colors font-medium",
      pathname === href ? "text-accent" : "",
    ].join(" ").trim()

  return (
    <nav className="border-b border-border">
      <div className="container mx-auto px-4 py-2 relative">
        <div className="flex items-center justify-start">
          {/* Logo - left aligned on all screen sizes, icon hidden on mobile */}
          <Link
            href="/"
            className="flex items-center gap-1 hover:scale-105 transition-transform"
          >
            <Image
              src="/brand/logos/NJ Icon.svg"
              alt="NJ Stars Icon"
              width={60}
              height={60}
              className="hidden md:block"
            />
            <Image
              src="/brand/logos/Text Logo.svg"
              alt="NJ Stars"
              width={160}
              height={50}
              className="block"
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

          {/* Shopping Cart */}
          <Link href="/shop">
            <Button variant="ghost" size="icon" className="h-9 w-9 hover:text-foreground hover:bg-gradient-to-br hover:from-foreground/40 hover:to-accent hover:shadow-lg hover:scale-105 transition-all">
              <ShoppingCart className="h-5 w-5 text-accent" />
            </Button>
          </Link>

          {/* Sign In or Portal */}
          {!session ? (
            <Link href="/portal/login">
              <Button variant="ghost" size="sm" className="text-sm font-medium text-accent hover:bg-gradient-to-br hover:from-foreground/40 hover:to-accent hover:shadow-lg hover:scale-105 transition-all">
                Sign In
              </Button>
            </Link>
          ) : (
            <Link href="/portal/login">
              <Button className="bg-gradient-to-br from-foreground/40 to-accent text-background font-semibold hover:shadow-lg hover:scale-105 transition-transform">
                Portal
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Navigation & Actions - visible on mobile only, positioned on right */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 md:hidden flex items-center gap-3">
          {/* Shopping Cart */}
          <Link href="/shop">
            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-gradient-to-br hover:from-foreground/40 hover:to-accent hover:shadow-lg hover:scale-105 transition-all">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </Button>
          </Link>

          {/* Sign In Link - only show if not authenticated */}
          {!session && (
            <Link href="/portal/login">
              <Button variant="ghost" size="sm" className="text-sm text-primary hover:bg-gradient-to-br hover:from-foreground/40 hover:to-accent hover:shadow-lg hover:scale-105 transition-all">
                Sign In
              </Button>
            </Link>
          )}

          {/* Mobile Menu */}
          <MobileNav />
        </div>
      </div>
    </nav>
  )
}
