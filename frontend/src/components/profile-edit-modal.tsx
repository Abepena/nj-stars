"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, User, Save } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const POSITIONS = [
  { value: "PG", label: "Point Guard (PG)" },
  { value: "SG", label: "Shooting Guard (SG)" },
  { value: "SF", label: "Small Forward (SF)" },
  { value: "PF", label: "Power Forward (PF)" },
  { value: "C", label: "Center (C)" },
]

interface PlayerProfile {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  jersey_number?: string
  position?: string
  medical_notes?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relationship?: string
}

interface ProfileEditModalProps {
  player: PlayerProfile
  onSave?: (updatedPlayer: PlayerProfile) => void
  trigger?: React.ReactNode
  apiToken?: string
}

export function ProfileEditModal({
  player,
  onSave,
  trigger,
  apiToken
}: ProfileEditModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    first_name: player.first_name || "",
    last_name: player.last_name || "",
    email: player.email || "",
    phone: player.phone || "",
    jersey_number: player.jersey_number || "",
    position: player.position || "",
    medical_notes: player.medical_notes || "",
    emergency_contact_name: player.emergency_contact_name || "",
    emergency_contact_phone: player.emergency_contact_phone || "",
    emergency_contact_relationship: player.emergency_contact_relationship || "",
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (apiToken) {
        headers["Authorization"] = `Token ${apiToken}`
      }

      const response = await fetch(`${API_BASE}/api/portal/players/${player.id}/`, {
        method: "PATCH",
        headers,
        credentials: "include",
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedPlayer = await response.json()
        onSave?.({ ...player, ...updatedPlayer })
        setOpen(false)
      } else {
        const data = await response.json()
        setError(data.detail || data.message || "Failed to update profile")
      }
    } catch (err) {
      setError("Unable to save. Please check your connection.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setFormData({
        first_name: player.first_name || "",
        last_name: player.last_name || "",
        email: player.email || "",
        phone: player.phone || "",
        jersey_number: player.jersey_number || "",
        position: player.position || "",
        medical_notes: player.medical_notes || "",
        emergency_contact_name: player.emergency_contact_name || "",
        emergency_contact_phone: player.emergency_contact_phone || "",
        emergency_contact_relationship: player.emergency_contact_relationship || "",
      })
      setError(null)
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <User className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Player Profile</DialogTitle>
          <DialogDescription>
            Update {player.first_name}&apos;s profile information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="player@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Basketball Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jersey_number">Jersey Number</Label>
              <Input
                id="jersey_number"
                value={formData.jersey_number}
                onChange={(e) => handleChange("jersey_number", e.target.value)}
                placeholder="23"
                maxLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={formData.position}
                onValueChange={(value) => handleChange("position", value)}
              >
                <SelectTrigger id="position">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value}>
                      {pos.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Medical Notes */}
          <div className="space-y-2">
            <Label htmlFor="medical_notes">Medical Notes / Allergies</Label>
            <Textarea
              id="medical_notes"
              value={formData.medical_notes}
              onChange={(e) => handleChange("medical_notes", e.target.value)}
              placeholder="Any medical conditions, allergies, or notes coaches should know..."
              rows={2}
            />
          </div>

          {/* Emergency Contact */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium mb-3">Emergency Contact</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleChange("emergency_contact_name", e.target.value)}
                  placeholder="Contact name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleChange("emergency_contact_phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="emergency_contact_relationship">Relationship</Label>
              <Input
                id="emergency_contact_relationship"
                value={formData.emergency_contact_relationship}
                onChange={(e) => handleChange("emergency_contact_relationship", e.target.value)}
                placeholder="e.g., Mother, Father, Guardian"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
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
      </DialogContent>
    </Dialog>
  )
}
