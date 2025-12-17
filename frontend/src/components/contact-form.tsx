"use client"

import { useState } from "react"
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
import {
  MessageSquare,
  Send,
  Loader2,
  CheckCircle,
  Mail,
  Phone,
  HelpCircle,
  CreditCard,
  Settings,
  AlertTriangle,
  MessageCircle,
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const CATEGORIES = [
  { value: "general", label: "General Question", icon: HelpCircle, description: "Questions about our programs" },
  { value: "registration", label: "Registration & Events", icon: MessageCircle, description: "Tryouts, camps, tournaments" },
  { value: "payments", label: "Orders & Payments", icon: CreditCard, description: "Billing, refunds, merchandise" },
  { value: "portal", label: "Portal / Account Issues", icon: Settings, description: "Login, profile, access problems" },
  { value: "technical", label: "Website Issues", icon: AlertTriangle, description: "Bugs, errors, broken features" },
  { value: "feedback", label: "Feedback", icon: MessageSquare, description: "Suggestions and ideas" },
]

interface ContactFormProps {
  wrapInSection?: boolean
}

export function ContactForm({ wrapInSection = false }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/api/contact/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitted(true)
        setFormData({
          name: "",
          email: "",
          phone: "",
          category: "",
          subject: "",
          message: "",
        })
      } else {
        const data = await response.json()
        setError(data.message || "Something went wrong. Please try again.")
      }
    } catch (err) {
      setError("Unable to submit. Please check your connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  // Success state
  if (submitted) {
    const content = (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
          <p className="text-muted-foreground mb-6">
            Thank you for reaching out. We'll get back to you within 24-48 hours.
          </p>
          <Button onClick={() => setSubmitted(false)} variant="outline">
            Send Another Message
          </Button>
        </CardContent>
      </Card>
    )

    if (wrapInSection) {
      return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-7xl mx-auto">{content}</div>
        </section>
      )
    }
    return content
  }

  const formContent = (
    <div className="grid lg:grid-cols-5 gap-8">
      {/* Category Selection */}
      <div className="lg:col-span-2 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">How can we help?</h3>
          <p className="text-sm text-muted-foreground">
            Select a category to help us route your message to the right team.
          </p>
        </div>
        <div className="grid gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isSelected = formData.category === cat.value
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => handleChange("category", cat.value)}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{cat.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{cat.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Contact Form */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send us a message
          </CardTitle>
          <CardDescription>
            Fill out the form below and we'll respond as soon as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Name *</Label>
                <Input
                  id="contact-name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email *</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Phone (optional)</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange("category", value)}
                  required
                >
                  <SelectTrigger id="contact-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-subject">Subject *</Label>
              <Input
                id="contact-subject"
                value={formData.subject}
                onChange={(e) => handleChange("subject", e.target.value)}
                placeholder="Brief description of your inquiry"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-message">Message *</Label>
              <Textarea
                id="contact-message"
                value={formData.message}
                onChange={(e) => handleChange("message", e.target.value)}
                placeholder="Please provide as much detail as possible..."
                rows={5}
                required
              />
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !formData.category}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              We typically respond within 24-48 hours during business days.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )

  if (wrapInSection) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Get in Touch</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Have questions about our programs, need help with your account, or want to provide feedback?
              We're here to help.
            </p>
          </div>
          {formContent}
        </div>
      </section>
    )
  }

  return formContent
}
