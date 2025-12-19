"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  Sparkles,
  Calendar,
  Clock,
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface MerchDropSettings {
  is_active: boolean
  drop_date: string | null
  headline: string
  subheadline: string
  teaser_text: string
  is_countdown_active: boolean
  has_dropped: boolean
  updated_at: string
}

export default function MerchDropAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<MerchDropSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [isActive, setIsActive] = useState(false)
  const [dropDate, setDropDate] = useState("")
  const [dropTime, setDropTime] = useState("")
  const [headline, setHeadline] = useState("")
  const [subheadline, setSubheadline] = useState("")
  const [teaserText, setTeaserText] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/portal/login")
    }
  }, [status, router])

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/api/payments/merch-drop/`)
      if (!response.ok) throw new Error("Failed to fetch settings")
      const data = await response.json()
      setSettings(data)

      // Populate form
      setIsActive(data.is_active)
      if (data.drop_date) {
        const date = new Date(data.drop_date)
        setDropDate(format(date, "yyyy-MM-dd"))
        setDropTime(format(date, "HH:mm"))
      }
      setHeadline(data.headline)
      setSubheadline(data.subheadline)
      setTeaserText(data.teaser_text || "")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      // Combine date and time
      let dropDateTime: string | null = null
      if (dropDate && dropTime) {
        dropDateTime = `${dropDate}T${dropTime}:00`
      } else if (dropDate) {
        dropDateTime = `${dropDate}T12:00:00`
      }

      const apiToken = (session as any)?.apiToken
      const response = await fetch(`${API_BASE}/api/payments/merch-drop/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiToken ? `Token ${apiToken}` : "",
        },
        body: JSON.stringify({
          is_active: isActive,
          drop_date: dropDateTime,
          headline,
          subheadline,
          teaser_text: teaserText,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save settings")
      }

      const data = await response.json()
      setSettings(data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Back Link */}
      <Link
        href="/portal/dashboard"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Merch Drop Settings</h1>
          <p className="text-muted-foreground text-sm">
            Configure the upcoming merch drop announcement
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 rounded-lg bg-success/10 border border-success/20">
          <p className="text-sm text-success">Settings saved successfully!</p>
        </div>
      )}

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Drop Announcement</CardTitle>
          <CardDescription>
            When enabled, a countdown and hype section will appear on the shop
            page and homepage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is-active" className="text-base">
                Enable Drop Announcement
              </Label>
              <p className="text-sm text-muted-foreground">
                Show the countdown and hype section to visitors
              </p>
            </div>
            <Switch variant="dashboardSwitch"
              id="is-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <hr className="border-border" />

          {/* Drop Date & Time */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="drop-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Drop Date
              </Label>
              <Input
                id="drop-date"
                type="date"
                value={dropDate}
                onChange={(e) => setDropDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="drop-time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Drop Time
              </Label>
              <Input
                id="drop-time"
                type="time"
                value={dropTime}
                onChange={(e) => setDropTime(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <hr className="border-border" />

          {/* Headline */}
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="New Drop Incoming"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              Main text displayed in the announcement
            </p>
          </div>

          {/* Subheadline */}
          <div className="space-y-2">
            <Label htmlFor="subheadline">Subheadline</Label>
            <Input
              id="subheadline"
              value={subheadline}
              onChange={(e) => setSubheadline(e.target.value)}
              placeholder="Get ready. Something big is coming."
              maxLength={200}
            />
          </div>

          {/* Teaser Text */}
          <div className="space-y-2">
            <Label htmlFor="teaser-text">Teaser Text (Optional)</Label>
            <Textarea
              id="teaser-text"
              value={teaserText}
              onChange={(e) => setTeaserText(e.target.value)}
              placeholder="Add additional teaser copy..."
              rows={3}
            />
          </div>

          {/* Status Display */}
          {settings && (
            <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Current Status</p>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    settings.is_active
                      ? "bg-success/30 text-foreground border border-success/40"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {settings.is_active ? "Active" : "Inactive"}
                </span>
                {settings.is_countdown_active && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/30 text-foreground border border-warning/40">
                    Countdown Running
                  </span>
                )}
                {settings.has_dropped && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-tertiary/30 text-foreground border border-tertiary/40">
                    Dropped!
                  </span>
                )}
              </div>
              {settings.drop_date && (
                <p className="text-xs text-muted-foreground">
                  Scheduled:{" "}
                  {format(new Date(settings.drop_date), "PPP 'at' p")}
                </p>
              )}
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
