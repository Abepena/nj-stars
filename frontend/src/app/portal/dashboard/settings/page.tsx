"use client"

/**
 * Dashboard > Settings Tab
 *
 * User profile and settings for the dashboard tab navigation.
 */

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  LogOut,
  AlertCircle,
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface UserProfile {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string | null
  role: string
  date_joined: string
  address: {
    street: string | null
    city: string | null
    state: string | null
    zip_code: string | null
  } | null
  profile_completeness: number
  auto_pay_enabled: boolean
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      if (status === "loading") return
      if (!session) return

      try {
        setLoading(true)
        setError(null)

        const apiToken = session?.apiToken
        const response = await fetch(`${API_BASE}/api/portal/profile/`, {
          headers: {
            "Authorization": apiToken ? `Token ${apiToken}` : "",
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setProfile(data)
        } else {
          setError("Failed to load profile")
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err)
        setError("Unable to connect to server")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [session, status])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  if (status === "loading" || loading) {
    return <ProfileSkeleton />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  // Fallback to session data if API doesn't return profile
  const displayName = profile?.full_name || session?.user?.name || "User"
  const displayEmail = profile?.email || session?.user?.email || ""
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt={displayName}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-primary">{initials}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold truncate">{displayName}</h2>
          <p className="text-muted-foreground">{displayEmail}</p>
          {profile?.role && (
            <Badge variant="outline" className="mt-2 capitalize">
              {profile.role}
            </Badge>
          )}
        </div>
      </div>

      {/* Profile Completeness */}
      {profile && profile.profile_completeness < 100 && (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Profile Completeness</span>
              <span className="text-sm text-muted-foreground">
                {profile.profile_completeness}%
              </span>
            </div>
            <div className="h-2 bg-amber-200 dark:bg-amber-900/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${profile.profile_completeness}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Complete your profile for faster event registrations
            </p>
          </CardContent>
        </Card>
      )}

      {/* Profile Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileField
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={displayEmail}
            />
            <ProfileField
              icon={<Phone className="h-4 w-4" />}
              label="Phone"
              value={profile?.phone || "Not provided"}
            />
            {profile?.date_joined && (
              <ProfileField
                icon={<Calendar className="h-4 w-4" />}
                label="Member Since"
                value={new Date(profile.date_joined).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.address?.street ? (
              <div className="text-sm">
                <p>{profile.address.street}</p>
                <p>
                  {profile.address.city}, {profile.address.state}{" "}
                  {profile.address.zip_code}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No address on file</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Settings
          </CardTitle>
          <CardDescription>Manage your account preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Auto-Pay</p>
              <p className="text-sm text-muted-foreground">
                Automatically pay dues when due
              </p>
            </div>
            <Badge variant={profile?.auto_pay_enabled ? "default" : "outline"}>
              {profile?.auto_pay_enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card className="border-destructive/30">
        <CardContent className="py-4">
          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function ProfileField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium truncate">{value}</p>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-4 w-4 mt-1" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-48 mb-1" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-4">
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  )
}
