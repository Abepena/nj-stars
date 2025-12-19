"use client"

import { useEffect, useState, ReactNode } from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Loader2,
  AlertCircle,
  Sparkles,
  Calendar,
  Clock,
  ChevronRight,
  Check,
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

interface MerchDropModalProps {
  trigger?: ReactNode
}

export function MerchDropModal({ trigger }: MerchDropModalProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
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

  // Fetch settings when dialog opens
  useEffect(() => {
    if (open) {
      fetchSettings()
    }
  }, [open])

  async function fetchSettings() {
    try {
      setLoading(true)
      setError(null)
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

  // Default trigger - matches admin dashboard card style
  const defaultTrigger = (
    <Card className="hover:bg-muted/50 hover:border-foreground/20 transition-all cursor-pointer h-full group">
      <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 h-full">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-muted group-hover:bg-success/30 flex items-center justify-center shrink-0 transition-colors">
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold transition-colors">Merch Drop</h3>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            Configure shop announcement
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
      </CardContent>
    </Card>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <span className="block text-foreground">Merch Drop Settings</span>
              <DialogDescription className="font-normal text-muted-foreground">
                Configure the upcoming merch drop announcement
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-px w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 rounded-lg bg-success/20 border border-success/30 flex items-center gap-3">
                <Check className="h-4 w-4 text-success flex-shrink-0" />
                <p className="text-sm text-foreground">Settings saved successfully!</p>
              </div>
            )}

            {/* Enable Toggle - Card style matching admin dashboard */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <Label htmlFor="is-active" className="text-sm font-medium text-foreground cursor-pointer">
                    Enable Drop Announcement
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Show countdown and hype section
                  </p>
                </div>
              </div>
              <Switch variant="dashboardSwitch"
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            {/* Status Display - Inline badges */}
            {settings && (
              <div className="flex flex-wrap items-center gap-2 px-1">
                <span className="text-xs text-muted-foreground">Status:</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    settings.is_active
                      ? "bg-success/30 text-foreground border border-success/40"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {settings.is_active ? "Active" : "Inactive"}
                </span>
                {settings.is_countdown_active && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning/30 text-foreground border border-warning/40">
                    Countdown Running
                  </span>
                )}
                {settings.has_dropped && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-tertiary/30 text-foreground border border-tertiary/40">
                    Dropped!
                  </span>
                )}
                {settings.drop_date && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(settings.drop_date), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                )}
              </div>
            )}

            <div className="border-t border-border" />

            {/* Drop Date & Time */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
                Schedule
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="drop-date" className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
                    <Calendar className="h-3 w-3" />
                    Drop Date
                  </Label>
                  <Input
                    id="drop-date"
                    type="date"
                    value={dropDate}
                    onChange={(e) => setDropDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="drop-time" className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
                    <Clock className="h-3 w-3" />
                    Drop Time
                  </Label>
                  <Input
                    id="drop-time"
                    type="time"
                    value={dropTime}
                    onChange={(e) => setDropTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Content Fields */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
                Content
              </p>
              <div className="space-y-4">
                {/* Headline */}
                <div className="space-y-1.5">
                  <Label htmlFor="headline" className="text-xs text-muted-foreground px-1">
                    Headline
                  </Label>
                  <Input
                    id="headline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="New Drop Incoming"
                    maxLength={100}
                  />
                </div>

                {/* Subheadline */}
                <div className="space-y-1.5">
                  <Label htmlFor="subheadline" className="text-xs text-muted-foreground px-1">
                    Subheadline
                  </Label>
                  <Input
                    id="subheadline"
                    value={subheadline}
                    onChange={(e) => setSubheadline(e.target.value)}
                    placeholder="Get ready. Something big is coming."
                    maxLength={200}
                  />
                </div>

                {/* Teaser Text */}
                <div className="space-y-1.5">
                  <Label htmlFor="teaser-text" className="text-xs text-muted-foreground px-1">
                    Teaser Text <span className="opacity-60">(Optional)</span>
                  </Label>
                  <Textarea
                    id="teaser-text"
                    value={teaserText}
                    onChange={(e) => setTeaserText(e.target.value)}
                    placeholder="Add additional teaser copy..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Save Button - Success variant for primary action */}
            <div className="pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                variant="success"
                className="w-full"
                size="lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
