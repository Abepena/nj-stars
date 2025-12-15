"use client"

import { useState } from "react"
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
import { Loader2, Calendar, MapPin, DollarSign, Users, ArrowRight, Check, FileText, AlertCircle, LogIn } from "lucide-react"
import Link from "next/link"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

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
  participant_first_name: string
  participant_last_name: string
  participant_age: string
  participant_email: string
  participant_phone: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relationship: string
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
  const [formData, setFormData] = useState<FormData>({
    participant_first_name: "",
    participant_last_name: "",
    participant_age: "",
    participant_email: session?.user?.email || "",
    participant_phone: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    medical_notes: "",
  })

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
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
    // The waiver data will be submitted with the registration
    setStep("details")
  }

  const validateForm = (): boolean => {
    if (!formData.participant_first_name.trim()) {
      setError("Participant first name is required")
      return false
    }
    if (!formData.participant_last_name.trim()) {
      setError("Participant last name is required")
      return false
    }
    if (!formData.participant_age || parseInt(formData.participant_age) < 1) {
      setError("Please enter a valid age")
      return false
    }
    // Email required for guest registration
    if (!session && !formData.participant_email.trim()) {
      setError("Email is required for registration")
      return false
    }
    if (!formData.emergency_contact_name.trim()) {
      setError("Emergency contact name is required")
      return false
    }
    if (!formData.emergency_contact_phone.trim()) {
      setError("Emergency contact phone is required")
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const accessToken = (session as any)?.accessToken
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      // Only add auth header if logged in
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`
      }

      const response = await fetch(`${API_BASE}/api/events/registrations/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          event_slug: event.slug,
          participant_first_name: formData.participant_first_name,
          participant_last_name: formData.participant_last_name,
          participant_age: parseInt(formData.participant_age),
          participant_email: formData.participant_email || undefined,
          participant_phone: formData.participant_phone || undefined,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          emergency_contact_relationship: formData.emergency_contact_relationship || undefined,
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
      const accessToken = (session as any)?.accessToken
      const currentUrl = typeof window !== "undefined" ? window.location.origin : ""

      // Build headers - only include auth for logged-in users
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`
      }

      // Build request body - include email for guest checkout verification
      const requestBody: Record<string, unknown> = {
        event_slug: event.slug,
        registration_id: registrationId,
        success_url: `${currentUrl}/events?payment=success&event=${event.slug}`,
        cancel_url: `${currentUrl}/events?payment=cancelled&event=${event.slug}`,
      }
      // For guests, include email for verification
      if (!session && formData.participant_email) {
        requestBody.participant_email = formData.participant_email
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
    onOpenChange(false)
  }

  const formattedDate = format(new Date(event.start_datetime), "EEEE, MMMM d, yyyy")
  const formattedTime = `${format(new Date(event.start_datetime), "h:mm a")} - ${format(
    new Date(event.end_datetime),
    "h:mm a"
  )}`

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
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span>{event.location}</span>
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
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/portal/login?callbackUrl=${encodeURIComponent(`/events?highlight=${event.slug}`)}`}>
                        Sign In
                      </Link>
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
              <DialogTitle>Participant Information</DialogTitle>
              <DialogDescription>
                Enter details for the person attending this event
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium">
                    First Name *
                  </label>
                  <Input
                    id="firstName"
                    value={formData.participant_first_name}
                    onChange={(e) =>
                      handleInputChange("participant_first_name", e.target.value)
                    }
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Last Name *
                  </label>
                  <Input
                    id="lastName"
                    value={formData.participant_last_name}
                    onChange={(e) =>
                      handleInputChange("participant_last_name", e.target.value)
                    }
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="age" className="text-sm font-medium">
                    Age *
                  </label>
                  <Input
                    id="age"
                    type="number"
                    min="1"
                    max="99"
                    value={formData.participant_age}
                    onChange={(e) => handleInputChange("participant_age", e.target.value)}
                    placeholder="Age"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.participant_phone}
                    onChange={(e) =>
                      handleInputChange("participant_phone", e.target.value)
                    }
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email {!session && "*"}
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.participant_email}
                  onChange={(e) => handleInputChange("participant_email", e.target.value)}
                  placeholder="email@example.com"
                  required={!session}
                />
                {!session && (
                  <p className="text-xs text-muted-foreground">
                    Required for registration confirmation
                  </p>
                )}
              </div>

              <Separator />

              <h4 className="font-medium">Emergency Contact</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="emergencyName" className="text-sm font-medium">
                    Contact Name *
                  </label>
                  <Input
                    id="emergencyName"
                    value={formData.emergency_contact_name}
                    onChange={(e) =>
                      handleInputChange("emergency_contact_name", e.target.value)
                    }
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
                    onChange={(e) =>
                      handleInputChange("emergency_contact_phone", e.target.value)
                    }
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="relationship" className="text-sm font-medium">
                  Relationship
                </label>
                <Input
                  id="relationship"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) =>
                    handleInputChange("emergency_contact_relationship", e.target.value)
                  }
                  placeholder="Parent, Guardian, etc."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="medical" className="text-sm font-medium">
                  Medical Notes
                </label>
                <textarea
                  id="medical"
                  value={formData.medical_notes}
                  onChange={(e) => handleInputChange("medical_notes", e.target.value)}
                  placeholder="Any medical conditions we should know about..."
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <Separator />

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("confirm")}>
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
                You're registered for <span className="font-medium">{event.title}</span>.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <p>
                  <span className="font-medium">Date:</span> {formattedDate}
                </p>
                <p>
                  <span className="font-medium">Time:</span> {formattedTime}
                </p>
                {event.location && (
                  <p>
                    <span className="font-medium">Location:</span> {event.location}
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                A confirmation email has been sent. You can view your registered events in
                the portal.
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
