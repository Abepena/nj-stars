"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { ChevronLeft, Loader2, AlertCircle, CheckCircle } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ==================== Types ====================

interface FormData {
  first_name: string
  last_name: string
  date_of_birth: string
  email: string
  phone: string
  jersey_number: string
  position: string
  team_name: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relationship: string
  medical_notes: string
}

interface FormErrors {
  [key: string]: string
}

// ==================== Main Component ====================

export default function AddChildPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    email: "",
    phone: "",
    jersey_number: "",
    position: "",
    team_name: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "Parent/Guardian",
    medical_notes: "",
  })

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required"
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required"
    }
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = "Date of birth is required"
    }
    if (!formData.emergency_contact_name.trim()) {
      newErrors.emergency_contact_name = "Emergency contact name is required"
    }
    if (!formData.emergency_contact_phone.trim()) {
      newErrors.emergency_contact_phone = "Emergency contact phone is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const accessToken = (session as any)?.accessToken
      const response = await fetch(`${API_BASE}/api/portal/players/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/portal/children")
        }, 1500)
      } else {
        const data = await response.json()
        if (data.detail) {
          setSubmitError(data.detail)
        } else if (typeof data === 'object') {
          // Handle field-level errors from DRF
          const fieldErrors: FormErrors = {}
          for (const [key, value] of Object.entries(data)) {
            fieldErrors[key] = Array.isArray(value) ? value[0] : String(value)
          }
          setErrors(fieldErrors)
        } else {
          setSubmitError("Failed to add child. Please try again.")
        }
      }
    } catch (err) {
      console.error("Failed to add child:", err)
      setSubmitError("Unable to connect to server. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-500/50">
          <CardContent className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Child Added Successfully!</h2>
            <p className="text-muted-foreground">
              {formData.first_name} has been added to your profile.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/portal/children"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Children
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Add a Child</h1>
        <p className="text-muted-foreground mt-1">
          Add your child's profile to register them for events and manage their account
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <CardDescription>
                Enter your child's basic details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleChange("first_name", e.target.value)}
                    className={errors.first_name ? "border-destructive" : ""}
                  />
                  {errors.first_name && (
                    <p className="text-sm text-destructive">{errors.first_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleChange("last_name", e.target.value)}
                    className={errors.last_name ? "border-destructive" : ""}
                  />
                  {errors.last_name && (
                    <p className="text-sm text-destructive">{errors.last_name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange("date_of_birth", e.target.value)}
                  className={errors.date_of_birth ? "border-destructive" : ""}
                />
                {errors.date_of_birth && (
                  <p className="text-sm text-destructive">{errors.date_of_birth}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="For players 13+"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Information</CardTitle>
              <CardDescription>
                Optional team and position details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team_name">Team Name</Label>
                <Input
                  id="team_name"
                  value={formData.team_name}
                  onChange={(e) => handleChange("team_name", e.target.value)}
                  placeholder="e.g., U12 Elite"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jersey_number">Jersey Number</Label>
                  <Input
                    id="jersey_number"
                    value={formData.jersey_number}
                    onChange={(e) => handleChange("jersey_number", e.target.value)}
                    placeholder="e.g., 23"
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
                      <SelectItem value="PG">Point Guard</SelectItem>
                      <SelectItem value="SG">Shooting Guard</SelectItem>
                      <SelectItem value="SF">Small Forward</SelectItem>
                      <SelectItem value="PF">Power Forward</SelectItem>
                      <SelectItem value="C">Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Emergency Contact</CardTitle>
              <CardDescription>
                Required for safety during events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Contact Name *</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleChange("emergency_contact_name", e.target.value)}
                  className={errors.emergency_contact_name ? "border-destructive" : ""}
                />
                {errors.emergency_contact_name && (
                  <p className="text-sm text-destructive">{errors.emergency_contact_name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Contact Phone *</Label>
                  <Input
                    id="emergency_contact_phone"
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleChange("emergency_contact_phone", e.target.value)}
                    className={errors.emergency_contact_phone ? "border-destructive" : ""}
                  />
                  {errors.emergency_contact_phone && (
                    <p className="text-sm text-destructive">{errors.emergency_contact_phone}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                  <Select
                    value={formData.emergency_contact_relationship}
                    onValueChange={(value) => handleChange("emergency_contact_relationship", value)}
                  >
                    <SelectTrigger id="emergency_contact_relationship">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Parent/Guardian">Parent/Guardian</SelectItem>
                      <SelectItem value="Grandparent">Grandparent</SelectItem>
                      <SelectItem value="Aunt/Uncle">Aunt/Uncle</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Medical Information</CardTitle>
              <CardDescription>
                Important medical details (optional but recommended)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="medical_notes">Medical Notes</Label>
                <Textarea
                  id="medical_notes"
                  value={formData.medical_notes}
                  onChange={(e) => handleChange("medical_notes", e.target.value)}
                  placeholder="Medications, conditions, etc."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Error */}
          {submitError && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{submitError}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <Link href="/portal/children">
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Child"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
