"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShootingStars } from "@/components/ui/shooting-stars"
import { ThemeLogo } from "@/components/ui/theme-logo"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/password/reset/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      // Always show success message to prevent email enumeration
      setSubmitted(true)
    } catch (err) {
      // Still show success to prevent email enumeration
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand/Hero (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] relative bg-[hsl(20,13%,7%)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--text-primary)/0.1) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--text-primary)/0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <ThemeLogo width={180} height={56} className="w-[180px] h-[56px]" />
          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl xl:text-5xl font-bold text-[hsl(var(--text-primary))] leading-tight">
              Reset Your
              <br />
              <span className="text-primary">Password</span>
            </h1>
            <p className="text-lg text-[hsl(var(--text-secondary))] leading-relaxed">
              Don&apos;t worry, it happens to the best of us. Enter your email and we&apos;ll send you instructions to reset your password.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[hsl(var(--text-tertiary))] text-sm">
              <span className="h-px flex-1 bg-[hsl(var(--bg-tertiary))]" />
              <span>Trusted by families across New Jersey</span>
              <span className="h-px flex-1 bg-[hsl(var(--bg-tertiary))]" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form with shooting stars */}
      <div className="flex-1 relative bg-[hsl(20,13%,9%)]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(20,13%,9%)] via-[hsl(20,11%,11%)] to-[hsl(20,13%,9%)]" />
          <ShootingStars starCount={15} minSpeed={3} maxSpeed={7} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(20,13%,9%)/30%_100%)]" />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <ThemeLogo width={200} height={62} className="w-[200px] h-[62px] mx-auto" />
          </div>

          {/* Card */}
          <div className="w-full max-w-md">
            <div className="bg-[hsl(var(--bg-secondary))]/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-[hsl(var(--bg-tertiary))]">
              {!submitted ? (
                <>
                  {/* Form Header */}
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[hsl(var(--text-primary))] leading-tight text-center">
                      Forgot Password?
                    </h1>
                    <h2 className="mt-4 text-lg font-medium text-[hsl(var(--text-secondary))] text-center">
                      No worries, we&apos;ll help you reset it
                    </h2>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--text-tertiary))]" />
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pl-12 pr-4 py-3 bg-[hsl(var(--bg-tertiary))] border border-[hsl(var(--bg-tertiary))] rounded-xl text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                          placeholder="Enter your email address"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading}
                      variant="cta"
                      className="w-full py-3 font-medium rounded-xl transition-all"
                    >
                      {loading ? "Sending..." : "Send Reset Instructions"}
                    </Button>
                  </form>
                </>
              ) : (
                /* Success State */
                <div className="text-center py-4">
                  <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-[hsl(var(--text-primary))] mb-4">
                    Check Your Email
                  </h2>
                  <p className="text-[hsl(var(--text-secondary))] mb-2">
                    We&apos;ve sent password reset instructions to:
                  </p>
                  <p className="text-primary font-medium mb-6">{email}</p>
                  <div className="bg-[hsl(var(--bg-tertiary))] rounded-xl p-4 text-sm text-[hsl(var(--text-secondary))] space-y-2">
                    <p>
                      If an account exists with this email, you&apos;ll receive instructions shortly.
                    </p>
                    <p className="text-[hsl(var(--text-tertiary))]">
                      Don&apos;t see it? Check your spam folder.
                    </p>
                  </div>
                </div>
              )}

              {/* Back to Login */}
              <div className="mt-8 pt-6 border-t border-[hsl(var(--bg-tertiary))]">
                <Link
                  href="/portal/login"
                  className="flex items-center justify-center gap-2 text-[hsl(var(--text-secondary))] hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
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
      </div>
    </div>
  )
}
