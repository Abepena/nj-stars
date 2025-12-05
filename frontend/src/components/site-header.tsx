"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MobileNav } from "@/components/mobile-nav"

const links = [
  { href: "/news", label: "News" },
  { href: "/shop", label: "Shop" },
  { href: "/events", label: "Events" },
]

export function SiteHeader() {
  const pathname = usePathname()

  const linkClasses = (href: string) =>
    [
      "hover:text-accent transition-colors font-medium",
      pathname === href ? "text-accent" : "",
    ].join(" ").trim()

  return (
    <nav className="border-b border-border">
      <div className="container mx-auto px-4 py-2 relative">
        <div className="flex items-center justify-center md:justify-start">
          {/* Logo - text centered on mobile, icon appears from md up */}
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
              className="block mx-auto md:mx-0"
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
          <Link href="/portal/login">
            <Button className="bg-gradient-to-br from-foreground/40 to-accent text-background font-semibold hover:shadow-lg hover:scale-105 transition-transform">
              Portal Login
            </Button>
          </Link>
        </div>

        {/* Mobile Navigation - visible on mobile only, positioned on right */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 md:hidden">
          <MobileNav />
        </div>
      </div>
    </nav>
  )
}
