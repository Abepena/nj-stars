"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"

// ==================== Main Component ====================

export default function SettingsPage() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

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

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
    // TODO: Sync with backend
  }

  const handlePrivacyChange = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }))
    // TODO: Sync with backend
  }

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
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
              >
                <Sun className="h-4 w-4 mr-1" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
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
                  Get notified about events you're registered for
                </p>
              </div>
              <Switch
                id="email-events"
                checked={notifications.emailEvents}
                onCheckedChange={() => handleNotificationChange('emailEvents')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-orders">Order Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Shipping confirmations and order status changes
                </p>
              </div>
              <Switch
                id="email-orders"
                checked={notifications.emailOrders}
                onCheckedChange={() => handleNotificationChange('emailOrders')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-newsletter">Newsletter</Label>
                <p className="text-sm text-muted-foreground">
                  Team news, announcements, and promotions
                </p>
              </div>
              <Switch
                id="email-newsletter"
                checked={notifications.emailNewsletter}
                onCheckedChange={() => handleNotificationChange('emailNewsletter')}
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
              <Switch
                id="push-reminders"
                checked={notifications.pushReminders}
                onCheckedChange={() => handleNotificationChange('pushReminders')}
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
                {privacy.showProfile ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                Profile Visibility
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow other team members to see your profile
              </p>
            </div>
            <Switch
              id="show-profile"
              checked={privacy.showProfile}
              onCheckedChange={() => handlePrivacyChange('showProfile')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-roster">Show on Team Roster</Label>
              <p className="text-sm text-muted-foreground">
                Display your player on the public team roster
              </p>
            </div>
            <Switch
              id="show-roster"
              checked={privacy.showOnRoster}
              onCheckedChange={() => handlePrivacyChange('showOnRoster')}
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
          <CardDescription>
            Manage your account security settings
          </CardDescription>
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
                {session?.user?.email || 'Manage social login connections'}
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
          <CardDescription>
            Irreversible actions for your account
          </CardDescription>
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
        Changes are saved automatically
      </p>
    </div>
  )
}
