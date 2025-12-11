"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeLogo } from "@/components/ui/theme-logo"
import { CheckCircle, XCircle, Mail } from "lucide-react"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const status = searchParams?.get("status")
  const message = searchParams?.get("message")

  const isSuccess = status === "success"
  const isError = status === "error"

  // Determine error message
  let errorMessage = "There was a problem verifying your email."
  if (message === "invalid_key") {
    errorMessage = "This verification link is invalid or has expired."
  } else if (message === "confirmation_failed") {
    errorMessage = "Email confirmation failed. Please try again."
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(20,13%,9%)] px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <ThemeLogo width={200} height={62} className="w-[200px] h-[62px] mx-auto" />
        </div>

        {/* Card */}
        <div className="bg-[hsl(var(--bg-secondary))]/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-[hsl(var(--bg-tertiary))]">
          {isSuccess ? (
            /* Success State */
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-[hsl(var(--text-primary))] mb-4">
                Email Verified!
              </h1>
              <p className="text-[hsl(var(--text-secondary))] mb-6">
                Your email has been successfully verified. You can now access all features of your account.
              </p>
              <Button asChild variant="cta" className="w-full">
                <Link href="/portal/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          ) : isError ? (
            /* Error State */
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-[hsl(var(--text-primary))] mb-4">
                Verification Failed
              </h1>
              <p className="text-[hsl(var(--text-secondary))] mb-6">
                {errorMessage}
              </p>
              <div className="space-y-3">
                <Button asChild variant="cta" className="w-full">
                  <Link href="/portal/login">Go to Login</Link>
                </Button>
                <p className="text-sm text-[hsl(var(--text-tertiary))]">
                  Need help?{" "}
                  <a href="mailto:support@njstarselite.com" className="text-primary hover:underline">
                    Contact Support
                  </a>
                </p>
              </div>
            </div>
          ) : (
            /* Pending/No Status State */
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-[hsl(var(--text-primary))] mb-4">
                Check Your Email
              </h1>
              <p className="text-[hsl(var(--text-secondary))] mb-6">
                We've sent a verification link to your email address. Click the link to verify your account.
              </p>
              <div className="space-y-3">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/portal/login">Back to Login</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Back to Home */}
        <p className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-[hsl(var(--text-tertiary))] hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  )
}
