"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
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
import { Loader2, Calendar, MapPin, DollarSign, Users, ArrowRight, Check, FileText, AlertCircle } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface WaiverStatus {
  has_signed_waiver: boolean
  waiver_signed_at: string | null
  waiver_version: string
  waiver_signer_name: string
  current_version: string
  needs_update: boolean
}

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
  const router = useRouter()
  const [step, setStep] = useState<Step>("confirm")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [waiverStatus, setWaiverStatus] = useState<WaiverStatus | null>(null)
  const [waiverLoading, setWaiverLoading] = useState(false)
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

  // Fetch waiver status when modal opens
  useEffect(() => {
    async function fetchWaiverStatus() {
      if (!session || !open) return

      setWaiverLoading(true)
      try {
        const accessToken = (session as any)?.accessToken
        const response = await fetch(`${API_BASE}/api/portal/waiver/status/`, {
          headers: {
            Authorization: `Bearer ${accessToken || ""}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setWaiverStatus(data)
          // Pre-fill signer name if they've signed before
          if (data.waiver_signer_name) {
            setWaiverSignerName(data.waiver_signer_name)
          }
        }
      } catch (err) {
        console.error("Failed to fetch waiver status:", err)
      } finally {
        setWaiverLoading(false)
      }
    }

    fetchWaiverStatus()
  }, [session, open])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  // Determine next step after confirm
  const handleContinueFromConfirm = () => {
    if (!session) {
      router.push("/portal/login")
      return
    }

    // If user hasn't signed waiver (or needs to update), show waiver step
    if (!waiverStatus?.has_signed_waiver || waiverStatus?.needs_update) {
      setStep("waiver")
    } else {
      setStep("details")
    }
  }

  // Sign waiver
  const handleSignWaiver = async () => {
    if (!waiverSignerName.trim()) {
      setError("Please enter your name to sign the waiver")
      return
    }
    if (!waiverAcknowledged) {
      setError("Please acknowledge that you have read and agree to the waiver")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const accessToken = (session as any)?.accessToken
      const response = await fetch(`${API_BASE}/api/portal/waiver/sign/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken || ""}`,
        },
        body: JSON.stringify({
          signer_name: waiverSignerName,
          acknowledged: waiverAcknowledged,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to sign waiver")
      }

      // Update local waiver status
      const data = await response.json()
      setWaiverStatus({
        ...waiverStatus!,
        has_signed_waiver: true,
        waiver_signed_at: data.waiver_signed_at,
        waiver_version: data.waiver_version,
        waiver_signer_name: data.waiver_signer_name,
        needs_update: false,
      })

      // Continue to details
      setStep("details")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign waiver")
    } finally {
      setIsSubmitting(false)
    }
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
    if (!session) {
      router.push("/portal/login")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const accessToken = (session as any)?.accessToken
      const response = await fetch(`${API_BASE}/api/events/registrations/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken || ""}`,
        },
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
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.event_slug?.[0] ||
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

      const response = await fetch(`${API_BASE}/api/payments/event-checkout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken || ""}`,
        },
        body: JSON.stringify({
          event_slug: event.slug,
          registration_id: registrationId,
          success_url: `${currentUrl}/events?payment=success&event=${event.slug}`,
          cancel_url: `${currentUrl}/events?payment=cancelled&event=${event.slug}`,
        }),
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

            <Separator />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleContinueFromConfirm} disabled={waiverLoading}>
                {waiverLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
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

              {waiverStatus?.needs_update && (
                <div className="text-sm text-warning bg-warning/10 px-3 py-2 rounded-md">
                  Our waiver has been updated. Please review and sign the new version.
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
                  Version {waiverStatus?.current_version || "2024.1"}
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
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.participant_email}
                  onChange={(e) => handleInputChange("participant_email", e.target.value)}
                  placeholder="email@example.com"
                />
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
                  Medical Notes / Allergies
                </label>
                <textarea
                  id="medical"
                  value={formData.medical_notes}
                  onChange={(e) => handleInputChange("medical_notes", e.target.value)}
                  placeholder="Any medical conditions or allergies we should know about..."
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
