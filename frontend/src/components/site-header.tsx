"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeLogo } from "@/components/ui/theme-logo";
import { BagDrawer } from "@/components/bag-drawer";
import { useBag } from "@/lib/bag";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingBag,
  User,
  LayoutDashboard,
  ShoppingCart,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Calendar,
} from "lucide-react";

const links = [
  { href: "/about", label: "About" },
  { href: "/news", label: "News" },
  { href: "/shop", label: "Shop" },
  { href: "/events", label: "Events" },
];

// User dropdown menu items
const userMenuItems = [
  { href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/children", label: "My Players", icon: Users },
  { href: "/portal/billing", label: "Billing & Orders", icon: CreditCard },
  { href: "#TODO-registrations", label: "My Registrations", icon: Calendar },
  { href: "#TODO-settings", label: "Settings", icon: Settings },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { bag, isBagOpen, setIsBagOpen } = useBag();

  const itemCount = bag?.item_count || 0;

  const linkClasses = (href: string) =>
    [
      "text-foreground hover:text-foreground/80 transition-colors ease-in-out font-medium",
      pathname === href ? "border-b-2 border-primary" : "",
    ]
      .join(" ")
      .trim();

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!session?.user?.name) return "U";
    const names = session.user.name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-2 relative">
        <div className="flex items-center justify-start">
          {/* Logo - theme-aware */}
          <ThemeLogo
            width={120}
            height={38}
            className="w-[120px] h-[38px] md:w-[160px] md:h-[50px]"
          />
        </div>

        {/* Desktop Navigation - hidden on mobile */}
        <div className="hidden md:flex gap-6 items-center absolute right-4 top-1/2 -translate-y-1/2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClasses(link.href)}
            >
              {link.label}
            </Link>
          ))}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Shopping Bag */}
          <Button
            variant="ghost"
            size="icon"
            className="group relative h-9 w-9"
            onClick={() => setIsBagOpen(true)}
            aria-label={itemCount > 0 ? `Shopping bag with ${itemCount} item${itemCount !== 1 ? 's' : ''}` : "Shopping bag (empty)"}
          >
            <ShoppingBag className="h-5 w-5 text-foreground transition-colors group-hover:text-foreground/80" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground" aria-hidden="true">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Button>

          {/* User Avatar with Dropdown or Sign In */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full p-0 hover:ring-2 hover:ring-muted-foreground/30 transition-all"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={session.user?.image || undefined}
                      alt={session.user?.name || "User"}
                    />
                    <AvatarFallback className="bg-muted text-foreground text-sm font-medium border border-border">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user?.name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userMenuItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      href={item.href}
                      className="flex items-center cursor-pointer"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-muted-foreground focus:text-foreground cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href={`/portal/login?next=${encodeURIComponent(pathname || "/")}`}
            >
              <Button
                variant="ghost"
                size="sm"
                className="text-sm font-medium text-primary hover:text-primary-foreground hover:bg-primary hover:shadow-md hover:shadow-primary/25 transition-all duration-200 ease-in-out"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Navigation & Actions - visible on mobile only, positioned on right */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 md:hidden flex items-center gap-3">
          {/* Shopping Bag */}
          <Button
            variant="ghost"
            size="icon"
            className="group relative h-9 w-9"
            onClick={() => setIsBagOpen(true)}
            aria-label={itemCount > 0 ? `Shopping bag with ${itemCount} item${itemCount !== 1 ? 's' : ''}` : "Shopping bag (empty)"}
          >
            <ShoppingBag className="h-5 w-5 text-foreground transition-colors group-hover:text-foreground/80" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground" aria-hidden="true">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Button>

          {/* Mobile Menu */}
          <MobileNav />
        </div>
      </div>

      {/* Bag Drawer */}
      <BagDrawer open={isBagOpen} onOpenChange={setIsBagOpen} />
    </nav>
  );
}
