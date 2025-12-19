"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { AddressInput, AddressData } from "@/components/ui/address-input"
import { DateTimeInput } from "@/components/ui/datetime-input"
import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const EVENT_TYPES = [
  { value: "tryout", label: "Tryout" },
  { value: "open_gym", label: "Open Gym" },
  { value: "tournament", label: "Tournament" },
  { value: "practice", label: "Practice" },
  { value: "camp", label: "Camp" },
  { value: "game", label: "Game" },
  { value: "skills", label: "Skills Session" },
  { value: "social", label: "Team Social" },
]

interface EventFormData {
  title: string
  description: string
  event_type: string
  start_datetime: string
  end_datetime: string
  location: string
  latitude: number | null
  longitude: number | null
  requires_payment: boolean
  price: string
  max_participants: string
  registration_open: boolean
  is_public: boolean
}

export function NewEventSection() {
  const { data: session } = useSession()

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    event_type: "practice",
    start_datetime: "",
    end_datetime: "",
    location: "",
    latitude: null,
    longitude: null,
    requires_payment: false,
    price: "",
    max_participants: "",
    registration_open: true,
    is_public: true,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (field: keyof EventFormData, value: string | boolean | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleAddressSelect = (data: AddressData) => {
    setFormData((prev) => ({
      ...prev,
      location: data.formatted_address,
      latitude: data.latitude,
      longitude: data.longitude,
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError("Event title is required")
      return false
    }
    if (!formData.description.trim()) {
      setError("Event description is required")
      return false
    }
    if (!formData.start_datetime) {
      setError("Start date and time is required")
      return false
    }
    if (!formData.end_datetime) {
      setError("End date and time is required")
      return false
    }
    if (new Date(formData.end_datetime) <= new Date(formData.start_datetime)) {
      setError("End time must be after start time")
      return false
    }
    if (!formData.location.trim()) {
      setError("Location is required")
      return false
    }
    if (formData.requires_payment && (!formData.price || parseFloat(formData.price) <= 0)) {
      setError("Please enter a valid price for paid events")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const apiToken = (session as any)?.apiToken
      const response = await fetch(`${API_BASE}/api/events/`, {
        method: "POST",
        headers: {
          Authorization: apiToken ? `Token ${apiToken}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          event_type: formData.event_type,
          start_datetime: new Date(formData.start_datetime).toISOString(),
          end_datetime: new Date(formData.end_datetime).toISOString(),
          location: formData.location,
          latitude: formData.latitude,
          longitude: formData.longitude,
          requires_payment: formData.requires_payment,
          price: formData.requires_payment ? parseFloat(formData.price) : null,
          max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
          registration_open: formData.registration_open,
          is_public: formData.is_public,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        // Reset form
        setFormData({
          title: "",
          description: "",
          event_type: "practice",
          start_datetime: "",
          end_datetime: "",
          location: "",
          latitude: null,
          longitude: null,
          requires_payment: false,
          price: "",
          max_participants: "",
          registration_open: true,
          is_public: true,
        })
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const data = await response.json()
        setError(data.detail || data.error || "Failed to create event")
      }
    } catch (err) {
      setError("Failed to connect to server")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-3">
          <Check className="h-6 w-6" />
        </div>
        <h3 className="font-semibold mb-1">Event Created!</h3>
        <p className="text-sm text-muted-foreground">Your event has been created successfully</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-foreground">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-sm">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g., Summer Basketball Camp"
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm">Description *</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe the event..."
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event_type" className="text-sm">Event Type *</Label>
            <select
              id="event_type"
              value={formData.event_type}
              onChange={(e) => handleChange("event_type", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Date & Location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-foreground">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Date, Time & Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start_datetime" className="text-sm">Start Date & Time *</Label>
              <DateTimeInput
                id="start_datetime"
                value={formData.start_datetime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("start_datetime", e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_datetime" className="text-sm">End Date & Time *</Label>
              <DateTimeInput
                id="end_datetime"
                value={formData.end_datetime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("end_datetime", e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location" className="text-sm">Location *</Label>
            <AddressInput
              id="location"
              value={formData.location}
              onChange={(value) => handleChange("location", value)}
              onAddressSelect={handleAddressSelect}
              placeholder="Start typing venue address..."
              className="h-9"
            />
            {formData.latitude && formData.longitude && (
              <p className="text-xs text-muted-foreground">
                📍 Coordinates: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Registration & Payment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-foreground">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Registration & Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="requires_payment" className="text-sm">Paid Event</Label>
              <p className="text-xs text-muted-foreground">
                Require payment to register
              </p>
            </div>
            <Switch variant="dashboardSwitch"
              id="requires_payment"
              checked={formData.requires_payment}
              onCheckedChange={(checked) => handleChange("requires_payment", checked)}
            />
          </div>

          {formData.requires_payment && (
            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-sm">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
                placeholder="0.00"
                className="h-9"
              />
            </div>
          )}

          <Separator />

          <div className="space-y-1.5">
            <Label htmlFor="max_participants" className="text-sm flex items-center gap-1">
              <Users className="h-3 w-3" />
              Max Participants
            </Label>
            <Input
              id="max_participants"
              type="number"
              min="1"
              value={formData.max_participants}
              onChange={(e) => handleChange("max_participants", e.target.value)}
              placeholder="Leave blank for unlimited"
              className="h-9"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="registration_open" className="text-sm">Registration Open</Label>
              <p className="text-xs text-muted-foreground">
                Allow users to register
              </p>
            </div>
            <Switch variant="dashboardSwitch"
              id="registration_open"
              checked={formData.registration_open}
              onCheckedChange={(checked) => handleChange("registration_open", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_public" className="text-sm">Public Event</Label>
              <p className="text-xs text-muted-foreground">
                Show on public calendar
              </p>
            </div>
            <Switch variant="dashboardSwitch"
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) => handleChange("is_public", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating Event...
          </>
        ) : (
          <>
            <Calendar className="h-4 w-4 mr-2" />
            Create Event
          </>
        )}
      </Button>
    </form>
  )
}
