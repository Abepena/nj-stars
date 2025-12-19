"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { AddressInput, AddressData } from "@/components/ui/address-input"
import {
  ChevronLeft,
  Bell,
  Mail,
  Shield,
  Smartphone,
  Moon,
  Sun,
  Palette,
  Eye,
  EyeOff,
  Lock,
  AlertTriangle,
  User,
  MapPin,
  Phone,
  Loader2,
  Check,
  LayoutDashboard,
  Gamepad2,
  Users,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface ProfileData {
  first_name: string
  last_name: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    zip_code: string
  }
}

// Extended user type
interface ExtendedUser {
  id?: string
  email?: string | null
  name?: string | null
  is_superuser?: boolean
  is_staff?: boolean
  role?: string
}

// ==================== Main Component ====================

export default function SettingsPage() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

  const user = session?.user as ExtendedUser | undefined

  // Profile data
  const [profile, setProfile] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zip_code: "",
    },
  })
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Full address string for display
  const [fullAddress, setFullAddress] = useState("")

  // Notification preferences (would be synced with backend)
  const [notifications, setNotifications] = useState({
    emailEvents: true,
    emailOrders: true,
    emailNewsletter: true,
    pushReminders: true,
  })

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showOnRoster: true,
  })

  // Dashboard & Role settings
  const [dashboardSettings, setDashboardSettings] = useState({
    playerProfileEnabled: false,  // Opt-in to player view for adult leagues
    showParentDashboard: false,   // Show parent dashboard tab for staff/players
  })

  // Age info from profile
  const [isAdult, setIsAdult] = useState<boolean | null>(null)
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(null)

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      if (!session) return

      try {
        setProfileLoading(true)
        const apiToken = (session as any)?.apiToken
        const response = await fetch(`${API_BASE}/api/portal/profile/`, {
          headers: {
            Authorization: apiToken ? `Token ${apiToken}` : "",
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setProfile({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            phone: data.phone || "",
            address: {
              street: data.address?.street || "",
              city: data.address?.city || "",
              state: data.address?.state || "",
              zip_code: data.address?.zip_code || "",
            },
          })
          // Build full address string
          if (data.address?.street) {
            const parts = [
              data.address.street,
              data.address.city,
              data.address.state,
              data.address.zip_code,
            ].filter(Boolean)
            setFullAddress(parts.join(", "))
          }
          // Set dashboard settings from profile
          setDashboardSettings({
            playerProfileEnabled: data.player_profile_enabled ?? false,
            showParentDashboard: data.show_parent_dashboard ?? false,
          })

          // Set age info
          setIsAdult(data.is_adult ?? null)
          setDateOfBirth(data.date_of_birth ?? null)
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [session])

  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
    setProfileSaved(false)
  }

  const handleAddressSelect = (data: AddressData) => {
    setProfile((prev) => ({
      ...prev,
      address: {
        street: data.street_address || "",
        city: data.city || "",
        state: data.state || "",
        zip_code: data.zip_code || "",
      },
    }))
    setFullAddress(data.formatted_address)
    setProfileSaved(false)
  }

  const saveProfile = async () => {
    if (!session) return

    try {
      setProfileSaving(true)
      setProfileError(null)

      const apiToken = (session as any)?.apiToken
      const response = await fetch(`${API_BASE}/api/portal/profile/`, {
        method: "PATCH",
        headers: {
          Authorization: apiToken ? `Token ${apiToken}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          address: profile.address,
        }),
      })

      if (response.ok) {
        setProfileSaved(true)
        setTimeout(() => setProfileSaved(false), 3000)
      } else {
        const data = await response.json()
        setProfileError(data.detail || "Failed to save profile")
      }
    } catch (err) {
      setProfileError("Failed to connect to server")
    } finally {
      setProfileSaving(false)
    }
  }

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
    // TODO: Sync with backend
  }

  const handlePrivacyChange = (key: keyof typeof privacy) => {
    setPrivacy((prev) => ({ ...prev, [key]: !prev[key] }))
    // TODO: Sync with backend
  }

  const handlePlayerProfileToggle = async () => {
    const newValue = !dashboardSettings.playerProfileEnabled
    setDashboardSettings((prev) => ({
      ...prev,
      playerProfileEnabled: newValue,
    }))

    // Sync with backend
    try {
      const apiToken = (session as any)?.apiToken
      await fetch(`${API_BASE}/api/portal/profile/`, {
        method: "PATCH",
        headers: {
          Authorization: apiToken ? `Token ${apiToken}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ player_profile_enabled: newValue }),
      })
    } catch (err) {
      console.error("Failed to update player profile setting:", err)
      // Revert on error
      setDashboardSettings((prev) => ({
        ...prev,
        playerProfileEnabled: !newValue,
      }))
    }
  }

  const handleParentDashboardToggle = async () => {
    const newValue = !dashboardSettings.showParentDashboard
    setDashboardSettings((prev) => ({
      ...prev,
      showParentDashboard: newValue,
    }))

    // Sync with backend
    try {
      const apiToken = (session as any)?.apiToken
      const response = await fetch(`${API_BASE}/api/portal/profile/`, {
        method: "PATCH",
        headers: {
          Authorization: apiToken ? `Token ${apiToken}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ show_parent_dashboard: newValue }),
      })

      if (!response.ok) {
        const data = await response.json()
        console.error("Failed to update parent dashboard setting:", data)
        // Revert on error
        setDashboardSettings((prev) => ({
          ...prev,
          showParentDashboard: !newValue,
        }))
      }
    } catch (err) {
      console.error("Failed to update parent dashboard setting:", err)
      // Revert on error
      setDashboardSettings((prev) => ({
        ...prev,
        showParentDashboard: !newValue,
      }))
    }
  }

  // Determine if user can see the player opt-in option
  // Show for parents, coaches, and staff (not admins who already have full access)
  const canOptInAsPlayer =
    user?.role === "parent" ||
    user?.role === "coach" ||
    user?.role === "staff" ||
    (user?.is_staff && !user?.is_superuser)

  // Determine if user can see the parent dashboard opt-in option
  // Show for staff/coaches and players who are 18+
  const canShowParentDashboard =
    isAdult === true && (
      user?.role === "coach" ||
      user?.role === "staff" ||
      user?.role === "player" ||
      (user?.is_staff && !user?.is_superuser)
    )

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back Link */}
      <Link
        href="/portal/dashboard"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences and notifications
        </p>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your name, phone, and address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    value={profile.first_name}
                    onChange={(e) => handleProfileChange("first_name", e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    value={profile.last_name}
                    onChange={(e) => handleProfileChange("last_name", e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => handleProfileChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <AddressInput
                  id="address"
                  value={fullAddress}
                  onChange={setFullAddress}
                  onAddressSelect={handleAddressSelect}
                  placeholder="Start typing your address..."
                />
                {profile.address.street && (
                  <p className="text-xs text-muted-foreground">
                    {profile.address.street}, {profile.address.city}, {profile.address.state}{" "}
                    {profile.address.zip_code}
                  </p>
                )}
              </div>

              {profileError && (
                <p className="text-sm text-destructive">{profileError}</p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={saveProfile} disabled={profileSaving}>
                  {profileSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : profileSaved ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dashboard & Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard & Roles
          </CardTitle>
          <CardDescription>
            Configure your dashboard views and role settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Role Display */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Your Role</Label>
              <p className="text-sm text-muted-foreground">
                Your current role in the organization
              </p>
            </div>
            <Badge variant="secondary" className="capitalize">
              {user?.is_superuser
                ? "Admin"
                : user?.is_staff
                  ? "Staff"
                  : user?.role || "Parent"}
            </Badge>
          </div>

          {/* Player Profile Opt-in (for parents/coaches/staff) */}
          {canOptInAsPlayer && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="player-profile" className="flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4" />
                    Enable Player Profile
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Create a player profile for adult leagues and tournaments
                  </p>
                </div>
                <Switch variant="dashboardSwitch"
                  id="player-profile"
                  checked={dashboardSettings.playerProfileEnabled}
                  onCheckedChange={handlePlayerProfileToggle}
                />
              </div>
              {dashboardSettings.playerProfileEnabled && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                  <p>
                    You now have access to the <strong>Player</strong> dashboard view.
                    Visit your dashboard to switch between views using the tabs at the top.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Parent Dashboard Opt-in (for staff/coaches/adult players) */}
          {canShowParentDashboard && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="parent-dashboard" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Show Parent Dashboard
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Access parent features to manage family registrations
                  </p>
                </div>
                <Switch variant="dashboardSwitch"
                  id="parent-dashboard"
                  checked={dashboardSettings.showParentDashboard}
                  onCheckedChange={handleParentDashboardToggle}
                />
              </div>
              {dashboardSettings.showParentDashboard && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                  <p>
                    You now have access to the <strong>Parent</strong> dashboard view.
                    Visit your dashboard to switch between views using the tabs at the top.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Age restriction notice for under-18 users */}
          {isAdult === false && user?.role === "player" && (
            <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
              <p>
                Parent dashboard features are available for users 18 and older.
              </p>
            </div>
          )}

          {/* Info for admins */}
          {user?.is_superuser && (
            <div className="bg-secondary/10 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">
                As an Admin, you have access to all dashboard views.
                Use the tabs on your dashboard to switch between Admin, Staff, Parent, and Player views.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how the app looks on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Theme</Label>
              <p className="text-sm text-muted-foreground">
                Choose between light and dark mode
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-4 w-4 mr-1" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-4 w-4 mr-1" />
                Dark
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choose what notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Notifications */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Notifications
            </h4>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-events">Event Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about events you&apos;re registered for
                </p>
              </div>
              <Switch variant="dashboardSwitch"
                id="email-events"
                checked={notifications.emailEvents}
                onCheckedChange={() => handleNotificationChange("emailEvents")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-orders">Order Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Shipping confirmations and order status changes
                </p>
              </div>
              <Switch variant="dashboardSwitch"
                id="email-orders"
                checked={notifications.emailOrders}
                onCheckedChange={() => handleNotificationChange("emailOrders")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-newsletter">Newsletter</Label>
                <p className="text-sm text-muted-foreground">
                  Team news, announcements, and promotions
                </p>
              </div>
              <Switch variant="dashboardSwitch"
                id="email-newsletter"
                checked={notifications.emailNewsletter}
                onCheckedChange={() => handleNotificationChange("emailNewsletter")}
              />
            </div>
          </div>

          <Separator />

          {/* Push Notifications */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Push Notifications
            </h4>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-reminders">Event Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Reminders before your registered events
                </p>
              </div>
              <Switch variant="dashboardSwitch"
                id="push-reminders"
                checked={notifications.pushReminders}
                onCheckedChange={() => handleNotificationChange("pushReminders")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy
          </CardTitle>
          <CardDescription>
            Control your visibility and data sharing preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-profile" className="flex items-center gap-2">
                {privacy.showProfile ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                Profile Visibility
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow other team members to see your profile
              </p>
            </div>
            <Switch variant="dashboardSwitch"
              id="show-profile"
              checked={privacy.showProfile}
              onCheckedChange={() => handlePrivacyChange("showProfile")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-roster">Show on Team Roster</Label>
              <p className="text-sm text-muted-foreground">
                Display your player on the public team roster
              </p>
            </div>
            <Switch variant="dashboardSwitch"
              id="show-roster"
              checked={privacy.showOnRoster}
              onCheckedChange={() => handlePrivacyChange("showOnRoster")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Password</Label>
              <p className="text-sm text-muted-foreground">
                Change your account password
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/portal/forgot-password">Change Password</Link>
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Connected Accounts</Label>
              <p className="text-sm text-muted-foreground">
                {session?.user?.email || "Manage social login connections"}
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Delete Account</Label>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" size="sm" disabled>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Notice */}
      <p className="text-xs text-muted-foreground text-center">
        Profile changes require clicking &quot;Save Changes&quot;. Other settings save automatically.
      </p>
    </div>
  )
}
