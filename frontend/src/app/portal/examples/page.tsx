"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Shield,
  User,
  Crown,
  ChevronRight,
  Eye,
  Palette
} from "lucide-react"

/**
 * Example pages index - shows all available user type demos
 */
export default function ExamplesIndexPage() {
  const examples = [
    {
      href: "/portal/examples/parent",
      title: "Parent Dashboard",
      description: "View as a parent managing their children's schedules, dues, and registrations",
      icon: Users,
      badge: "Most Common",
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
      features: ["2 children enrolled", "Balance due", "Upcoming events", "Auto-pay enabled"]
    },
    {
      href: "/portal/examples/player",
      title: "Player Dashboard",
      description: "View as a player (13+) with their own account managing their profile",
      icon: User,
      badge: "13+ Only",
      badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
      features: ["Own schedule view", "Personal dues", "Team info", "Check-in status"]
    },
    {
      href: "/portal/examples/staff",
      title: "Staff Dashboard",
      description: "View as a staff member with admin tools for check-ins and roster",
      icon: Shield,
      badge: "Admin Access",
      badgeColor: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
      features: ["Check-in management", "Full roster view", "Pending payments", "Today's events"]
    },
    {
      href: "/portal/examples/superuser",
      title: "Superuser Dashboard",
      description: "View as a superuser/admin with full system access and analytics",
      icon: Crown,
      badge: "Full Access",
      badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
      features: ["System stats", "All staff features", "Revenue metrics", "User management"]
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center border border-border">
            <Eye className="h-5 w-5 text-muted-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Portal Examples</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Preview how the portal looks for different user types. These pages use mock data
          and are only accessible in development mode. Use them to review the UI and UX
          before deploying.
        </p>
      </div>

      {/* Examples Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {examples.map((example) => {
          const Icon = example.icon
          return (
            <Link key={example.href} href={example.href}>
              <Card className="h-full hover:border-muted-foreground/30 transition-colors cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center border border-border group-hover:border-muted-foreground/30 transition-colors">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <Badge variant="outline" className={example.badgeColor}>
                      {example.badge}
                    </Badge>
                  </div>
                  <CardTitle className="flex items-center gap-2 mt-4">
                    {example.title}
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </CardTitle>
                  <CardDescription>{example.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {example.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Design System Link */}
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
              <Palette className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Design Consistency</h3>
              <p className="text-sm text-muted-foreground">
                All examples use the same component library (shadcn/ui) and follow
                the mobile-first design patterns established in the portal.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
