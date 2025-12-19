"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { DateTimeInput } from "@/components/ui/datetime-input"
import { AddressInput, AddressData } from "@/components/ui/address-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  AlertCircle,
  Save,
  Loader2,
  MapPin,
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const EVENT_TYPE_OPTIONS = [
  { value: "tryout", label: "Tryout" },
  { value: "open_gym", label: "Open Gym" },
  { value: "tournament", label: "Tournament" },
  { value: "practice", label: "Practice" },
  { value: "camp", label: "Camp" },
  { value: "game", label: "Game" },
  { value: "skills", label: "Skills Training" },
  { value: "social", label: "Team Social" },
]

interface EventFormData {
  title: string
  description: string
  event_type: string
  start_datetime: string
  end_datetime: string
  location: string
  latitude: string
  longitude: string
  requires_payment: boolean
  price: string
  max_participants: string
  registration_open: boolean
  registration_deadline: string
  is_public: boolean
}

// Helper to format datetime for input[type="datetime-local"]
function formatDatetimeLocal(isoString: string): string {
  if (!isoString) return ""
  const date = new Date(isoString)
  // Format as YYYY-MM-DDTHH:mm
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Helper to convert datetime-local value to ISO string
function toISOString(datetimeLocal: string): string {
  if (!datetimeLocal) return ""
  return new Date(datetimeLocal).toISOString()
}

export default function EditEventPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params?.slug as string
  const isNewlyCreated = searchParams?.get("created") === "true"

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(
    isNewlyCreated ? "Event created successfully! You can now edit the details below." : null
  )

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    event_type: "practice",
    start_datetime: "",
    end_datetime: "",
    location: "",
    latitude: "",
    longitude: "",
    requires_payment: false,
    price: "0.00",
    max_participants: "",
    registration_open: false,
    registration_deadline: "",
    is_public: false,
  })

  useEffect(() => {
    async function fetchEvent() {
      if (!session || !slug) return

      try {
        setLoading(true)
        setError(null)

        const apiToken = (session as any)?.apiToken
        const response = await fetch(`${API_BASE}/api/events/${slug}/`, {
          headers: {
            Authorization: apiToken ? `Token ${apiToken}` : "",
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const event = await response.json()
          setFormData({
            title: event.title || "",
            description: event.description || "",
            event_type: event.event_type || "practice",
            start_datetime: formatDatetimeLocal(event.start_datetime),
            end_datetime: formatDatetimeLocal(event.end_datetime),
            location: event.location || "",
            latitude: event.latitude?.toString() || "",
            longitude: event.longitude?.toString() || "",
            requires_payment: event.requires_payment || false,
            price: event.price || "0.00",
            max_participants: event.max_participants?.toString() || "",
            registration_open: event.registration_open || false,
            registration_deadline: formatDatetimeLocal(event.registration_deadline),
            is_public: event.is_public || false,
          })
        } else if (response.status === 404) {
          setError("Event not found")
        } else if (response.status === 403) {
          setError("You don't have permission to edit this event")
        } else {
          setError("Failed to load event")
        }
      } catch (err) {
        console.error("Failed to fetch event:", err)
        setError("Unable to connect to server")
      } finally {
        setLoading(false)
      }
    }

    if (session && slug) {
      fetchEvent()
    }
  }, [session, slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      const apiToken = (session as any)?.apiToken

      // Build the payload
      const payload: Record<string, any> = {
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type,
        start_datetime: toISOString(formData.start_datetime),
        end_datetime: toISOString(formData.end_datetime),
        location: formData.location,
        requires_payment: formData.requires_payment,
        price: formData.requires_payment ? formData.price : "0.00",
        registration_open: formData.registration_open,
        is_public: formData.is_public,
      }

      // Optional fields
      if (formData.latitude) {
        payload.latitude = parseFloat(formData.latitude)
      }
      if (formData.longitude) {
        payload.longitude = parseFloat(formData.longitude)
      }
      if (formData.max_participants) {
        payload.max_participants = parseInt(formData.max_participants, 10)
      } else {
        payload.max_participants = null
      }
      if (formData.registration_deadline) {
        payload.registration_deadline = toISOString(formData.registration_deadline)
      } else {
        payload.registration_deadline = null
      }

      const response = await fetch(`${API_BASE}/api/events/${slug}/`, {
        method: "PUT",
        headers: {
          Authorization: apiToken ? `Token ${apiToken}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setSuccessMessage("Event updated successfully!")
        setTimeout(() => {
          router.push("/portal/dashboard/events")
        }, 1500)
      } else {
        const errorData = await response.json().catch(() => null)
        if (errorData) {
          // Format validation errors
          const messages = Object.entries(errorData)
            .map(([field, errors]) => {
              const errorList = Array.isArray(errors) ? errors : [errors]
              return `${field}: ${errorList.join(", ")}`
            })
            .join("; ")
          setError(messages || "Failed to update event")
        } else {
          setError("Failed to update event")
        }
      }
    } catch (err) {
      console.error("Failed to update event:", err)
      setError("Unable to connect to server")
    } finally {
      setSaving(false)
    }
  }

  const updateField = <K extends keyof EventFormData>(
    field: K,
    value: EventFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddressSelect = (data: AddressData) => {
    setFormData((prev) => ({
      ...prev,
      location: data.formatted_address,
      latitude: data.latitude?.toString() || "",
      longitude: data.longitude?.toString() || "",
    }))
  }

  if (loading) {
    return <EditEventSkeleton />
  }

  if (error && !formData.title) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Link href="/portal/dashboard/events">
          <Button>Back to Events</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/portal/dashboard/events"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Events
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Edit Event</h1>
        <p className="text-muted-foreground mt-1">
          Update event details below
        </p>
      </div>

      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-600 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {error && formData.title && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Event title, type, and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g., Summer Tryouts 2025"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type *</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => updateField("event_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe the event..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader>
            <CardTitle>Date & Time</CardTitle>
            <CardDescription>When the event takes place</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_datetime">Start Date & Time *</Label>
                <DateTimeInput
                  id="start_datetime"
                  value={formData.start_datetime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("start_datetime", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_datetime">End Date & Time *</Label>
                <DateTimeInput
                  id="end_datetime"
                  value={formData.end_datetime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("end_datetime", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration_deadline">Registration Deadline</Label>
              <DateTimeInput
                id="registration_deadline"
                value={formData.registration_deadline}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("registration_deadline", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to allow registration until event starts
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
            <CardDescription>Where the event takes place</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Address *</Label>
              <AddressInput
                id="location"
                value={formData.location}
                onChange={(value) => updateField("location", value)}
                onAddressSelect={handleAddressSelect}
                placeholder="Start typing venue address..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => updateField("latitude", e.target.value)}
                  placeholder="40.7128"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => updateField("longitude", e.target.value)}
                  placeholder="-74.0060"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Coordinates auto-fill when you select an address from suggestions
            </p>
          </CardContent>
        </Card>

        {/* Capacity & Payment */}
        <Card>
          <CardHeader>
            <CardTitle>Capacity & Payment</CardTitle>
            <CardDescription>Registration limits and pricing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="max_participants">Max Participants</Label>
              <Input
                id="max_participants"
                type="number"
                min="1"
                value={formData.max_participants}
                onChange={(e) => updateField("max_participants", e.target.value)}
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Requires Payment</Label>
                <p className="text-sm text-muted-foreground">
                  Charge a registration fee
                </p>
              </div>
              <Switch variant="dashboardSwitch"
                checked={formData.requires_payment}
                onCheckedChange={(checked) => updateField("requires_payment", checked)}
              />
            </div>

            {formData.requires_payment && (
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visibility & Status */}
        <Card>
          <CardHeader>
            <CardTitle>Visibility & Status</CardTitle>
            <CardDescription>Control who can see and register</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Public Event</Label>
                <p className="text-sm text-muted-foreground">
                  Show on public events page
                </p>
              </div>
              <Switch variant="dashboardSwitch"
                checked={formData.is_public}
                onCheckedChange={(checked) => updateField("is_public", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Registration Open</Label>
                <p className="text-sm text-muted-foreground">
                  Allow people to register
                </p>
              </div>
              <Switch variant="dashboardSwitch"
                checked={formData.registration_open}
                onCheckedChange={(checked) => updateField("registration_open", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/portal/dashboard/events">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

function EditEventSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Skeleton className="h-4 w-24" />
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}
