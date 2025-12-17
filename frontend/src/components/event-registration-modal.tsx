"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Calendar, MapPin, DollarSign, Users, ArrowRight, Check, FileText, AlertCircle, LogIn, Navigation } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Storage key for preserving form state during login
const FORM_STORAGE_KEY = "event_registration_form"

// Grade options
const GRADE_OPTIONS = ["3", "4", "5", "6", "7", "8"]

// Jersey size options matching the Google Form
const JERSEY_SIZE_OPTIONS = [
  { value: "youth_medium", label: "Youth Medium" },
  { value: "youth_large", label: "Youth Large" },
  { value: "adult_small", label: "Adult Small" },
  { value: "adult_medium", label: "Adult Medium" },
  { value: "adult_large", label: "Adult Large" },
  { value: "adult_xl", label: "Adult XL" },
]

interface Event {
  id: number
  title: string
  slug: string
  description: string
  event_type: string
  start_datetime: string
  end_datetime: string
  location: string
  price: string
  requires_payment: boolean
  spots_remaining: number | null
  is_registration_open: boolean
}

interface EventRegistrationModalProps {
  event: Event
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface FormData {
  // Player info
  player_first_name: string
  player_last_name: string
  player_dob: string
  player_grade: string
  player_jersey_size: string
  // Guardian info
  guardian_name: string
  guardian_email: string
  guardian_phone: string
  // Emergency contact (can be same as guardian)
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relationship: string
  // Medical
  medical_notes: string
}

type Step = "confirm" | "waiver" | "details" | "payment" | "success"

export function EventRegistrationModal({
  event,
  open,
  onOpenChange,
  onSuccess,
}: EventRegistrationModalProps) {
  const { data: session } = useSession()
  const [step, setStep] = useState<Step>("confirm")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [waiverAcknowledged, setWaiverAcknowledged] = useState(false)
  const [waiverSignerName, setWaiverSignerName] = useState("")
  const [registrationId, setRegistrationId] = useState<number | null>(null)
  const [useGuardianAsEmergency, setUseGuardianAsEmergency] = useState(true)
  const [formData, setFormData] = useState<FormData>({
    player_first_name: "",
    player_last_name: "",
    player_dob: "",
    player_grade: "",
    player_jersey_size: "",
    guardian_name: "",
    guardian_email: session?.user?.email || "",
    guardian_phone: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    medical_notes: "",
  })

  // Restore form data from localStorage on mount (for login redirect flow)
  useEffect(() => {
    if (typeof window === "undefined") return

    const savedData = localStorage.getItem(FORM_STORAGE_KEY)
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        // Only restore if it's for the same event
        if (parsed.eventSlug === event.slug) {
          setFormData(parsed.formData)
          setWaiverAcknowledged(parsed.waiverAcknowledged || false)
          setWaiverSignerName(parsed.waiverSignerName || "")
          setStep(parsed.step || "confirm")
          setUseGuardianAsEmergency(parsed.useGuardianAsEmergency ?? true)
          // Clear after restoring
          localStorage.removeItem(FORM_STORAGE_KEY)
        }
      } catch {
        localStorage.removeItem(FORM_STORAGE_KEY)
      }
    }
  }, [event.slug, open])

  // Update guardian email when session changes
  useEffect(() => {
    if (session?.user?.email && !formData.guardian_email) {
      setFormData(prev => ({ ...prev, guardian_email: session.user?.email || "" }))
    }
  }, [session, formData.guardian_email])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  // Save form state before redirecting to login
  const saveFormStateAndRedirect = () => {
    const stateToSave = {
      eventSlug: event.slug,
      formData,
      waiverAcknowledged,
      waiverSignerName,
      step,
      useGuardianAsEmergency,
    }
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(stateToSave))

    // Redirect to login with callback to return to this event
    const callbackUrl = `/events?highlight=${event.slug}&openRegistration=true`
    window.location.href = `/portal/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
  }

  // Determine next step after confirm
  const handleContinueFromConfirm = () => {
    // Always show waiver step for all registrations
    setStep("waiver")
  }

  // Validate waiver and continue to details
  const handleSignWaiver = () => {
    if (!waiverSignerName.trim()) {
      setError("Please enter your name to sign the waiver")
      return
    }
    if (!waiverAcknowledged) {
      setError("Please acknowledge that you have read and agree to the waiver")
      return
    }

    // Waiver is valid, continue to details
    setStep("details")
  }

  const validateForm = (): boolean => {
    // Player info
    if (!formData.player_first_name.trim()) {
      setError("Player's first name is required")
      return false
    }
    if (!formData.player_last_name.trim()) {
      setError("Player's last name is required")
      return false
    }
    if (!formData.player_dob) {
      setError("Player's date of birth is required")
      return false
    }
    if (!formData.player_grade) {
      setError("Player's grade is required")
      return false
    }
    if (!formData.player_jersey_size) {
      setError("Player's jersey size is required")
      return false
    }

    // Guardian info
    if (!formData.guardian_name.trim()) {
      setError("Guardian's full name is required")
      return false
    }
    if (!formData.guardian_email.trim()) {
      setError("Guardian's email is required")
      return false
    }
    if (!formData.guardian_phone.trim()) {
      setError("Guardian's phone number is required")
      return false
    }

    // Emergency contact (if different from guardian)
    if (!useGuardianAsEmergency) {
      if (!formData.emergency_contact_name.trim()) {
        setError("Emergency contact name is required")
        return false
      }
      if (!formData.emergency_contact_phone.trim()) {
        setError("Emergency contact phone is required")
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const apiToken = (session as any)?.apiToken
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      // Only add auth header if logged in
      if (apiToken) {
        headers.Authorization = `Token ${apiToken}`
      }

      // Determine emergency contact info
      const emergencyName = useGuardianAsEmergency ? formData.guardian_name : formData.emergency_contact_name
      const emergencyPhone = useGuardianAsEmergency ? formData.guardian_phone : formData.emergency_contact_phone
      const emergencyRelationship = useGuardianAsEmergency ? "Parent/Guardian" : formData.emergency_contact_relationship

      const response = await fetch(`${API_BASE}/api/events/registrations/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          event_slug: event.slug,
          // Map to backend field names
          participant_first_name: formData.player_first_name,
          participant_last_name: formData.player_last_name,
          participant_dob: formData.player_dob,
          participant_grade: formData.player_grade,
          participant_jersey_size: formData.player_jersey_size,
          participant_email: formData.guardian_email,
          participant_phone: formData.guardian_phone,
          guardian_name: formData.guardian_name,
          guardian_email: formData.guardian_email,
          guardian_phone: formData.guardian_phone,
          emergency_contact_name: emergencyName,
          emergency_contact_phone: emergencyPhone,
          emergency_contact_relationship: emergencyRelationship,
          medical_notes: formData.medical_notes || undefined,
          // Waiver data
          waiver_signed: waiverAcknowledged,
          waiver_signer_name: waiverSignerName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.waiver_signed?.[0] ||
            errorData.waiver_signer_name?.[0] ||
            errorData.event_slug?.[0] ||
            errorData.participant_email?.[0] ||
            errorData.detail ||
            errorData.error ||
            "Registration failed"
        )
      }

      // Registration successful - capture the ID for payment
      const registrationData = await response.json()
      setRegistrationId(registrationData.id)

      if (event.requires_payment) {
        setStep("payment")
      } else {
        setStep("success")
        onSuccess?.()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePayment = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const apiToken = (session as any)?.apiToken
      const currentUrl = typeof window !== "undefined" ? window.location.origin : ""

      // Build headers - only include auth for logged-in users
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (apiToken) {
        headers.Authorization = `Token ${apiToken}`
      }

      // Build request body - include email for guest checkout verification
      const requestBody: Record<string, unknown> = {
        event_slug: event.slug,
        registration_id: registrationId,
        success_url: `${currentUrl}/events?payment=success&event=${event.slug}`,
        cancel_url: `${currentUrl}/events?payment=cancelled&event=${event.slug}`,
      }
      // For guests, include email for verification
      if (!session && formData.guardian_email) {
        requestBody.participant_email = formData.guardian_email
      }

      const response = await fetch(`${API_BASE}/api/payments/event-checkout/`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Payment failed")
      }

      const data = await response.json()

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL received")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed")
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    // Reset state when closing
    setStep("confirm")
    setError(null)
    setWaiverAcknowledged(false)
    setWaiverSignerName("")
    setUseGuardianAsEmergency(true)
    setFormData({
      player_first_name: "",
      player_last_name: "",
      player_dob: "",
      player_grade: "",
      player_jersey_size: "",
      guardian_name: "",
      guardian_email: session?.user?.email || "",
      guardian_phone: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relationship: "",
      medical_notes: "",
    })
    onOpenChange(false)
  }

  const formattedDate = format(new Date(event.start_datetime), "EEEE, MMMM d, yyyy")
  const formattedTime = `${format(new Date(event.start_datetime), "h:mm a")} - ${format(
    new Date(event.end_datetime),
    "h:mm a"
  )}`

  // Helper to build Google Maps directions URL
  const getDirectionsUrl = (location: string) =>
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle>Register for Event</DialogTitle>
              <DialogDescription>
                Confirm event details before registering
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <h3 className="text-lg font-semibold">{event.title}</h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="font-medium">{formattedDate}</p>
                    <p className="text-muted-foreground">{formattedTime}</p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span>{event.location}</span>
                      <a
                        href={getDirectionsUrl(event.location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                      >
                        <Navigation className="w-3 h-3" />
                        Get Directions
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className={event.requires_payment ? "" : "text-success"}>
                    {event.requires_payment ? `$${event.price}` : "FREE"}
                  </span>
                </div>

                {event.spots_remaining !== null && (
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span
                      className={event.spots_remaining <= 5 ? "text-accent font-medium" : ""}
                    >
                      {event.spots_remaining} spots remaining
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Sign in prompt for guests */}
            {!session && (
              <>
                <Separator />
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <LogIn className="w-4 h-4" />
                    Have an account?
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sign in to speed up registration with saved info, or continue as a guest.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={saveFormStateAndRedirect}>
                      Sign In
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleContinueFromConfirm}>
                      Continue as Guest
                    </Button>
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {session && (
                <Button onClick={handleContinueFromConfirm}>
                  Continue
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
            </div>
          </>
        )}

        {step === "waiver" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Liability Waiver
              </DialogTitle>
              <DialogDescription>
                Please read and sign the waiver to continue
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4 max-h-64 overflow-y-auto text-sm space-y-3">
                <h4 className="font-semibold">NJ Stars Elite Basketball Liability Waiver</h4>
                <p>
                  By signing this waiver, I acknowledge and agree to the following:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>
                    <strong>Assumption of Risk:</strong> I understand that participation in basketball activities
                    involves inherent risks, including but not limited to physical injury, illness, or even death.
                    I voluntarily assume all such risks.
                  </li>
                  <li>
                    <strong>Release of Liability:</strong> I release and discharge NJ Stars Elite Basketball, its
                    coaches, staff, volunteers, and affiliates from any and all claims, damages, or liability
                    arising from participation in activities.
                  </li>
                  <li>
                    <strong>Medical Authorization:</strong> In case of emergency, I authorize NJ Stars Elite
                    Basketball staff to seek medical treatment for the participant.
                  </li>
                  <li>
                    <strong>Photo/Video Release:</strong> I grant permission for photos and videos taken during
                    events to be used for promotional purposes.
                  </li>
                  <li>
                    <strong>Code of Conduct:</strong> I agree that the participant will follow all rules and
                    demonstrate good sportsmanship at all times.
                  </li>
                </ol>
                <p className="text-xs text-muted-foreground mt-4">
                  Version 2024.1
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="waiver-acknowledge"
                    checked={waiverAcknowledged}
                    onChange={(e) => {
                      setWaiverAcknowledged(e.target.checked)
                      setError(null)
                    }}
                    className="mt-1 h-4 w-4 rounded border-input accent-primary"
                  />
                  <span className="text-sm leading-relaxed">
                    I have read and understand the above waiver and voluntarily agree to its terms
                    on behalf of myself and/or my child.
                  </span>
                </label>

                <div className="space-y-2">
                  <label htmlFor="signer-name" className="text-sm font-medium">
                    Full Legal Name (Electronic Signature) *
                  </label>
                  <Input
                    id="signer-name"
                    value={waiverSignerName}
                    onChange={(e) => {
                      setWaiverSignerName(e.target.value)
                      setError(null)
                    }}
                    placeholder="Enter your full legal name"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("confirm")}>
                Back
              </Button>
              <Button onClick={handleSignWaiver} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Signing...
                  </>
                ) : (
                  <>
                    Sign & Continue
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {step === "details" && (
          <>
            <DialogHeader>
              <DialogTitle>Registration Details</DialogTitle>
              <DialogDescription>
                Enter player and guardian information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {error}
                </div>
              )}

              {/* Player Information Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Player Information
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="playerFirstName" className="text-sm font-medium">
                      First Name *
                    </label>
                    <Input
                      id="playerFirstName"
                      value={formData.player_first_name}
                      onChange={(e) => handleInputChange("player_first_name", e.target.value)}
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="playerLastName" className="text-sm font-medium">
                      Last Name *
                    </label>
                    <Input
                      id="playerLastName"
                      value={formData.player_last_name}
                      onChange={(e) => handleInputChange("player_last_name", e.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="playerDob" className="text-sm font-medium">
                    Date of Birth *
                  </label>
                  <Input
                    id="playerDob"
                    type="date"
                    value={formData.player_dob}
                    onChange={(e) => handleInputChange("player_dob", e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="playerGrade" className="text-sm font-medium">
                      Grade *
                    </label>
                    <Select
                      value={formData.player_grade}
                      onValueChange={(value) => handleInputChange("player_grade", value)}
                    >
                      <SelectTrigger id="playerGrade">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADE_OPTIONS.map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            Grade {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="playerJerseySize" className="text-sm font-medium">
                      Jersey Size *
                    </label>
                    <Select
                      value={formData.player_jersey_size}
                      onValueChange={(value) => handleInputChange("player_jersey_size", value)}
                    >
                      <SelectTrigger id="playerJerseySize">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {JERSEY_SIZE_OPTIONS.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Guardian Information Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Parent/Guardian Information
                </h4>

                <div className="space-y-2">
                  <label htmlFor="guardianName" className="text-sm font-medium">
                    Full Name *
                  </label>
                  <Input
                    id="guardianName"
                    value={formData.guardian_name}
                    onChange={(e) => handleInputChange("guardian_name", e.target.value)}
                    placeholder="Full name"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="guardianEmail" className="text-sm font-medium">
                    Email *
                  </label>
                  <Input
                    id="guardianEmail"
                    type="email"
                    value={formData.guardian_email}
                    onChange={(e) => handleInputChange("guardian_email", e.target.value)}
                    placeholder="email@example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Registration confirmation will be sent here
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="guardianPhone" className="text-sm font-medium">
                    Phone Number *
                  </label>
                  <Input
                    id="guardianPhone"
                    type="tel"
                    value={formData.guardian_phone}
                    onChange={(e) => handleInputChange("guardian_phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <Separator />

              {/* Emergency Contact Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    Emergency Contact
                  </h4>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useGuardianAsEmergency}
                    onChange={(e) => setUseGuardianAsEmergency(e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <span className="text-sm">Same as parent/guardian above</span>
                </label>

                {!useGuardianAsEmergency && (
                  <div className="space-y-4 pl-7">
                    <div className="space-y-2">
                      <label htmlFor="emergencyName" className="text-sm font-medium">
                        Contact Name *
                      </label>
                      <Input
                        id="emergencyName"
                        value={formData.emergency_contact_name}
                        onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
                        placeholder="Full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="emergencyPhone" className="text-sm font-medium">
                        Contact Phone *
                      </label>
                      <Input
                        id="emergencyPhone"
                        type="tel"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="emergencyRelationship" className="text-sm font-medium">
                        Relationship
                      </label>
                      <Input
                        id="emergencyRelationship"
                        value={formData.emergency_contact_relationship}
                        onChange={(e) => handleInputChange("emergency_contact_relationship", e.target.value)}
                        placeholder="e.g., Aunt, Coach, Neighbor"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Medical Notes Section */}
              <div className="space-y-2">
                <label htmlFor="medical" className="text-sm font-medium">
                  Medical Notes (Optional)
                </label>
                <textarea
                  id="medical"
                  value={formData.medical_notes}
                  onChange={(e) => handleInputChange("medical_notes", e.target.value)}
                  placeholder="Allergies, medications, conditions we should know about..."
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <Separator />

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("waiver")}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Registering...
                  </>
                ) : event.requires_payment ? (
                  <>
                    Continue to Payment
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </div>
          </>
        )}

        {step === "payment" && (
          <>
            <DialogHeader>
              <DialogTitle>Payment Required</DialogTitle>
              <DialogDescription>
                Complete payment to confirm your registration
              </DialogDescription>
            </DialogHeader>

            <div className="py-8 text-center space-y-4">
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="text-3xl font-bold">${event.price}</div>
              <p className="text-muted-foreground">
                You&apos;ll be redirected to our secure payment processor
              </p>
              <Button onClick={handlePayment} size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  "Pay Now"
                )}
              </Button>

              <p className="text-xs text-muted-foreground">
                Your registration is saved. You can complete payment later from the portal if needed.
              </p>
            </div>

            <Separator />

            <div className="flex justify-start pt-4">
              <Button variant="ghost" onClick={() => setStep("details")} disabled={isSubmitting}>
                ← Back to Details
              </Button>
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="w-5 h-5 text-success" />
                Registration Complete!
              </DialogTitle>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <p className="text-muted-foreground">
                <span className="font-medium">{formData.player_first_name}</span> is registered for <span className="font-medium">{event.title}</span>.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <p>
                  <span className="font-medium">Date:</span> {formattedDate}
                </p>
                <p>
                  <span className="font-medium">Time:</span> {formattedTime}
                </p>
                {event.location && (
                  <p className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">Location:</span> {event.location}
                    <a
                      href={getDirectionsUrl(event.location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Navigation className="w-3 h-3" />
                      Directions
                    </a>
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                A confirmation email has been sent to {formData.guardian_email}.
              </p>
            </div>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
