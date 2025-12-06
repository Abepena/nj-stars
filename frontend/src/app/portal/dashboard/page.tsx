"use client"

import { useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/portal/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isAdmin = session.user?.role === "admin"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link href="/" className="text-2xl font-bold text-accent">
              NJ Stars
            </Link>
            <p className="text-sm text-muted-foreground">Portal Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{session.user?.name || session.user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {session.user?.role || "member"}
              </p>
            </div>
            <Button onClick={() => signOut({ callbackUrl: "/" })} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {session.user?.name?.split(" ")[0] || "User"}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with NJ Stars
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Your scheduled activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3</div>
              <p className="text-sm text-muted-foreground mt-1">
                Next event in 2 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team News</CardTitle>
              <CardDescription>Latest updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">5</div>
              <p className="text-sm text-muted-foreground mt-1">
                Unread announcements
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
              <CardDescription>Coaching fees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">Paid</div>
              <p className="text-sm text-muted-foreground mt-1">
                Next payment due: Feb 1
              </p>
            </CardContent>
          </Card>

          {/* Admin-Only Section */}
          {isAdmin && (
            <>
              <Card className="md:col-span-2 lg:col-span-3 border-accent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    Admin Controls
                  </CardTitle>
                  <CardDescription>
                    Administrative functions and dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="w-full">
                      Manage Events
                    </Button>
                    <Button variant="outline" className="w-full">
                      Manage Roster
                    </Button>
                    <Button variant="outline" className="w-full">
                      View Orders
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Quick Actions for All Users */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and links</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button variant="outline" className="w-full">
                  View Schedule
                </Button>
                <Button variant="outline" className="w-full">
                  Team Roster
                </Button>
                <Button variant="outline" className="w-full">
                  Messages
                </Button>
                <Button variant="outline" className="w-full">
                  Payment History
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
