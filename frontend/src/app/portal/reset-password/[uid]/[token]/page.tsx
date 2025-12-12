"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShootingStars } from "@/components/ui/shooting-stars"
import { ThemeLogo } from "@/components/ui/theme-logo"
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const params = useParams()
  const router = useRouter()
  const { uid, token } = params as { uid: string; token: string }

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/password/reset/confirm/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid,
          token,
          new_password1: password,
          new_password2: confirmPassword,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/portal/login")
        }, 3000)
      } else {
        const data = await response.json()
        if (data.token) {
          setError("This reset link has expired or is invalid. Please request a new one.")
        } else if (data.new_password2) {
          setError(data.new_password2[0])
        } else if (data.new_password1) {
          setError(data.new_password1[0])
        } else {
          setError("Failed to reset password. Please try again.")
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
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
              Create New
              <br />
              <span className="text-primary">Password</span>
            </h1>
            <p className="text-lg text-[hsl(var(--text-secondary))] leading-relaxed">
              Choose a strong password to protect your account. We recommend using a mix of letters, numbers, and symbols.
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
              {success ? (
                /* Success State */
                <div className="text-center py-4">
                  <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-[hsl(var(--text-primary))] mb-4">
                    Password Reset!
                  </h2>
                  <p className="text-[hsl(var(--text-secondary))] mb-6">
                    Your password has been successfully reset. You&apos;ll be redirected to the login page shortly.
                  </p>
                  <Link href="/portal/login">
                    <Button variant="cta" className="w-full py-3 font-medium rounded-xl">
                      Go to Sign In
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Form Header */}
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[hsl(var(--text-primary))] leading-tight text-center">
                      Set New Password
                    </h1>
                    <h2 className="mt-4 text-lg font-medium text-[hsl(var(--text-secondary))] text-center">
                      Enter your new password below
                    </h2>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Password Input */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--text-tertiary))]" />
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={8}
                          className="w-full pl-12 pr-12 py-3 bg-[hsl(var(--bg-tertiary))] border border-[hsl(var(--bg-tertiary))] rounded-xl text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                          placeholder="New password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--text-secondary))] transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password Input */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--text-tertiary))]" />
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={8}
                          className="w-full pl-12 pr-12 py-3 bg-[hsl(var(--bg-tertiary))] border border-[hsl(var(--bg-tertiary))] rounded-xl text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--text-secondary))] transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Password Requirements */}
                    <div className="text-sm text-[hsl(var(--text-tertiary))]">
                      <p>Password must be at least 8 characters</p>
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-xl">
                        <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading}
                      variant="cta"
                      className="w-full py-3 font-medium rounded-xl transition-all"
                    >
                      {loading ? "Resetting..." : "Reset Password"}
                    </Button>
                  </form>
                </>
              )}

              {/* Back to Login (shown when not success) */}
              {!success && (
                <div className="mt-8 pt-6 border-t border-[hsl(var(--bg-tertiary))]">
                  <p className="text-center text-sm text-[hsl(var(--text-secondary))]">
                    Remember your password?{" "}
                    <Link
                      href="/portal/login"
                      className="font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Sign In
                    </Link>
                  </p>
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
      </div>
    </div>
  )
}
