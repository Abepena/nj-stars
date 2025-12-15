"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Menu, Sun, Moon, LayoutDashboard, Users, CreditCard, Calendar, Settings, LogOut } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { ThemeLogo } from "@/components/ui/theme-logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet"

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/news", label: "News" },
  { href: "/shop", label: "Shop" },
  { href: "/events", label: "Events" },
]

// User menu items for authenticated users
const userMenuItems = [
  { href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/children", label: "My Players", icon: Users },
  { href: "/portal/billing", label: "Billing & Orders", icon: CreditCard },
  { href: "#TODO-registrations", label: "My Registrations", icon: Calendar },
  { href: "#TODO-settings", label: "Settings", icon: Settings },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { data: session, status } = useSession()

  // Only render this nav on small screens to avoid off-canvas overflow on desktop
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    setMounted(true)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  if (!isMobile) return null

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!session?.user?.name) return "U"
    const names = session.user.name.split(" ")
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return names[0][0].toUpperCase()
  }

  const handleSignOut = async () => {
    setOpen(false)
    await signOut({ callbackUrl: "/" })
  }

  // Break up email to prevent mobile browser auto-linking
  // Inserts zero-width non-joiner after @ to break pattern detection
  const formatEmailForDisplay = (text: string | null | undefined) => {
    if (!text || !text.includes("@")) return text
    return text.replace("@", "@\u200C")
  }

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
      <SheetContent side="right" className="w-full max-w-xs sm:max-w-sm flex flex-col">
        <SheetHeader className="border-b border-border pb-4 flex-shrink-0">
          <div className="flex justify-center" onClick={() => setOpen(false)}>
            <ThemeLogo width={160} height={50} />
          </div>
        </SheetHeader>

        {/* User Profile Section (if authenticated) */}
        {session && (
          <div className="py-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={session.user?.image || undefined}
                  alt={session.user?.name || "User"}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-medium">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                {/* Apply email formatting to name too in case name is set to email */}
                <span className="text-sm font-medium text-foreground">
                  {formatEmailForDisplay(session.user?.name) || "User"}
                </span>
                {/* Prevent mobile browsers from auto-linking email as mailto */}
                <span className="text-xs text-muted-foreground">
                  {formatEmailForDisplay(session.user?.email)}
                </span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-2 mt-6 flex-1 overflow-y-auto min-h-0">
          {/* Main Navigation Links */}
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

          {/* User Menu Items (if authenticated) */}
          {session && (
            <>
              <div className="my-2 h-px bg-border" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                My Account
              </p>
              {userMenuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 text-base font-medium hover:text-primary transition-colors py-2"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className={isActive ? "text-primary" : ""}>
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </>
          )}

          {/* Theme Toggle */}
          <div className="my-2 h-px bg-border" />
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

        </nav>

        {/* Auth Section - Fixed at bottom */}
        <div className="pt-4 border-t border-border mt-auto flex-shrink-0">
          {session ? (
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
            </Button>
          ) : (
            <Link
              href={`/portal/login?next=${encodeURIComponent(pathname || "/")}`}
              onClick={() => setOpen(false)}
            >
              <Button
                variant="ghost"
                className="w-full text-sm font-medium text-primary hover:text-primary-foreground hover:bg-primary hover:shadow-md hover:shadow-primary/25 transition-all duration-200 ease-in-out"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
