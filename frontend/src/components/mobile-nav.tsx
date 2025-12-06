"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu } from "lucide-react"
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

  // Only render this nav on small screens to avoid off-canvas overflow on desktop
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
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
              src="/brand/logos/Text Logo.svg"
              alt="NJ Stars"
              width={160}
              height={50}
            />
          </Link>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-lg font-medium hover:text-primary transition-colors py-2"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-border">
            <Link href="/portal/login" onClick={() => setOpen(false)}>
              <Button className="bg-gradient-to-br from-foreground/40 to-primary text-background font-semibold w-full hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ease-in-out">
                Portal Login
              </Button>
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
