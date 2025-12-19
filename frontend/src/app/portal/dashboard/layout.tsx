"use client"

import { ReactNode, useEffect, useRef, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useTheme } from "@/components/theme-provider"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeLogo } from "@/components/ui/theme-logo"
import {
  Home,
  Users,
  CreditCard,
  ShoppingBag,
  Gift,
  User,
  LogOut,
  Shield,
  ClipboardList,
  Package,
  Menu,
  X,
  ChevronLeft,
  Crown,
  LayoutTemplate,
  Moon,
  Sun,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface PortalLayoutProps {
  children: ReactNode
}

const parentNavItems = [
  { href: "/portal/dashboard", label: "Dashboard", icon: Home },
  { href: "/portal/children", label: "My Children", icon: Users },
  { href: "/portal/billing", label: "Billing & Dues", icon: CreditCard },
  { href: "/portal/orders", label: "Orders", icon: ShoppingBag },
  { href: "/portal/credits", label: "Credits", icon: Gift },
  { href: "/portal/profile", label: "My Profile", icon: User },
]

const staffNavItems = [
  { href: "/portal/dashboard", label: "Admin Dashboard", icon: Shield },
  { href: "/portal/dashboard/check-ins", label: "Check-Ins", icon: ClipboardList },
  { href: "/portal/dashboard/roster", label: "Roster", icon: Users },
  { href: "/portal/dashboard/events", label: "Events", icon: ClipboardList },
]

const superuserNavItems = [
  { href: "/portal/examples", label: "Examples", icon: LayoutTemplate },
]

export default function PortalLayout({ children }: PortalLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const headerRef = useRef<HTMLElement | null>(null)

  // Keep a CSS variable in sync with the mobile header height for sticky offsets
  useEffect(() => {
    if (!headerRef.current) return

    const updateHeaderHeight = () => {
      const h = headerRef.current?.getBoundingClientRect().height || 0
      document.documentElement.style.setProperty("--portal-header-height", `${h}px`)
    }

    updateHeaderHeight()

    const observer = new ResizeObserver(() => updateHeaderHeight())
    observer.observe(headerRef.current)

    window.addEventListener("resize", updateHeaderHeight)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updateHeaderHeight)
    }
  }, [])

  // Check user roles
  const userRole = session?.user?.role || (session?.user as any)?.role || ""
  const isStaff = userRole === "staff" || (session?.user as any)?.isAdmin || false
  const isSuperuser = userRole === "superuser" || (session?.user as any)?.isSuperuser || false

  if (status === "loading") {
    return <PortalLoadingSkeleton />
  }

  if (status === "unauthenticated") {
    router.push("/portal/login")
    return null
  }

  const NavLink = ({ item }: { item: typeof parentNavItems[0] }) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
    const Icon = item.icon

    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-md transition-colors border",
          isActive
            ? "bg-muted text-foreground font-medium border-border"
            : "text-muted-foreground border-transparent hover:bg-muted/50 hover:text-foreground"
        )}
        onClick={() => setMobileNavOpen(false)}
      >
        <Icon className="h-5 w-5" />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg-dashboard))]">
      {/* Mobile Header */}
      <header
        ref={headerRef}
        className="lg:hidden sticky top-0 z-50 border-b backdrop-blur bg-[hsl(var(--bg-dashboard)/0.95)]"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            <ThemeLogo width={100} height={32} linkTo={null} />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileNavOpen && (
          <nav className="border-t px-4 py-4 space-y-1 bg-[hsl(var(--bg-dashboard))]">
            {parentNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}

            {isStaff && (
              <>
                <div className="my-4 border-t pt-4">
                  <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Staff Tools
                  </p>
                </div>
                {staffNavItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </>
            )}

            {isSuperuser && (
              <>
                <div className="my-4 border-t pt-4">
                  <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    <Crown className="h-3 w-3 inline mr-1" />
                    Superuser
                  </p>
                </div>
                {superuserNavItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </>
            )}

            <div className="pt-4 border-t mt-4 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-4 py-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            </div>

            {/* Powered by LEAG */}
            <div className="mt-auto pt-4 border-t px-4 py-3">
              <a
                href="https://leag.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                title="LEAG - Multi-tenant Sports Platform"
              >
                <span className="mr-1">Powered by</span>
                <Image
                  src="/brand/logos/leag-logo.svg"
                  alt="LEAG"
                  width={48}
                  height={20}
                  className="h-8 w-auto"
                  style={{ filter: "brightness(0) saturate(100%) invert(85%) sepia(18%) saturate(747%) hue-rotate(88deg) brightness(101%) contrast(87%)" }}
                />
              </a>
            </div>
          </nav>
        )}
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r bg-[hsl(var(--bg-dashboard))]">
          <div className="flex flex-col flex-1 overflow-y-auto">
            {/* Logo */}
            <div className="p-6 border-b">
              <Link href="/" className="flex items-center gap-2 group">
                <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <ThemeLogo width={148} height={46} linkTo={null} />
              </Link>
            </div>

            {/* User Info */}
            <div className="p-4 border-b bg-muted/30">
              <p className="font-medium truncate">
                {session?.user?.name || session?.user?.email?.split("@")[0]}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {session?.user?.email}
              </p>
              {isStaff && (
                <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <Shield className="h-3 w-3" />
                  Staff Member
                </span>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              {parentNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}

              {isStaff && (
                <>
                  <div className="my-4 pt-4 border-t">
                    <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Staff Tools
                    </p>
                  </div>
                  {staffNavItems.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                </>
              )}

              {isSuperuser && (
                <>
                  <div className="my-4 pt-4 border-t">
                    <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      <Crown className="h-3 w-3 inline mr-1" />
                      Superuser
                    </p>
                  </div>
                  {superuserNavItems.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                </>
              )}
            </nav>

            {/* Theme Toggle & Sign Out */}
            <div className="p-4 border-t space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            </div>

            {/* Powered by LEAG */}
            <div className="p-4 border-t mt-auto">
              <a
                href="https://leag.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                title="LEAG - Multi-tenant Sports Platform"
              >
                <span className="mr-1">Powered by</span>
                <Image
                  src="/brand/logos/leag-logo.svg"
                  alt="LEAG"
                  width={48}
                  height={20}
                  className="h-8 w-auto"
                  style={{ filter: "brightness(0) saturate(100%) invert(85%) sepia(18%) saturate(747%) hue-rotate(88deg) brightness(101%) contrast(87%)" }}
                />
              </a>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:pl-64 min-w-0">
          <div className="px-4 sm:px-6 lg:px-8 pt-0 pb-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function PortalLoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#23201D' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Loading portal...</p>
      </div>
    </div>
  )
}
