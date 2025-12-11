"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ShootingStars } from "@/components/ui/shooting-stars"
import { ThemeLogo } from "@/components/ui/theme-logo"
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get("next") || "/portal/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSocialSignIn = async (provider: 'google' | 'facebook' | 'apple') => {
    setLoading(true)
    setError("")
    try {
      await signIn(provider, { callbackUrl })
    } catch (error) {
      console.error(`${provider} sign-in error:`, error)
      setError(`Failed to sign in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`)
      setLoading(false)
    }
  }

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else if (result?.ok) {
        window.location.href = callbackUrl
      }
    } catch (error) {
      console.error("Sign-in error:", error)
      setError("An error occurred during sign-in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand/Hero (Desktop Only) - Clean, no animation */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] relative bg-[hsl(20,13%,7%)] overflow-hidden">
        {/* Subtle gradient overlay using site colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--text-primary)/0.1) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--text-primary)/0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <ThemeLogo width={180} height={56} className="w-[180px] h-[56px]" />

          {/* Main tagline */}
          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl xl:text-5xl font-bold text-[hsl(var(--text-primary))] leading-tight">
              Train Hard.
              <br />
              <span className="text-primary">Play Elite.</span>
            </h1>
            <p className="text-lg text-[hsl(var(--text-secondary))] leading-relaxed">
              Access your player portal to manage registrations, track schedules,
              and stay connected with your team.
            </p>
          </div>

          {/* Footer info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[hsl(var(--text-tertiary))] text-sm">
              <span className="h-px flex-1 bg-[hsl(var(--bg-tertiary))]" />
              <span>Trusted by families across New Jersey</span>
              <span className="h-px flex-1 bg-[hsl(var(--bg-tertiary))]" />
            </div>
            <div className="flex items-center justify-center gap-8 text-[hsl(var(--text-tertiary))]">
              <div className="text-center">
                <div className="text-2xl font-bold text-[hsl(var(--text-primary))]">200+</div>
                <div className="text-xs uppercase tracking-wider">Players</div>
              </div>
              <div className="h-8 w-px bg-[hsl(var(--bg-tertiary))]" />
              <div className="text-center">
                <div className="text-2xl font-bold text-[hsl(var(--text-primary))]">15+</div>
                <div className="text-xs uppercase tracking-wider">Teams</div>
              </div>
              <div className="h-8 w-px bg-[hsl(var(--bg-tertiary))]" />
              <div className="text-center">
                <div className="text-2xl font-bold text-[hsl(var(--text-primary))]">50+</div>
                <div className="text-xs uppercase tracking-wider">Events/Year</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form with shooting stars background */}
      <div className="flex-1 relative bg-[hsl(20,13%,9%)]">
        {/* Shooting stars background - always behind the form */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(20,13%,9%)] via-[hsl(20,11%,11%)] to-[hsl(20,13%,9%)]" />
          <ShootingStars starCount={15} minSpeed={3} maxSpeed={7} />
          {/* Subtle vignette for depth */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(20,13%,9%)/30%_100%)]" />
        </div>

        {/* Form container */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <ThemeLogo width={200} height={62} className="w-[200px] h-[62px] mx-auto" />
          </div>

          {/* Login Card */}
          <div className="w-full max-w-md">
            <div className="bg-[hsl(var(--bg-secondary))]/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-[hsl(var(--bg-tertiary))]">
              {/* Card Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-[hsl(var(--text-primary))] leading-tight text-center">
                  Train Hard.{" "}
                  <span className="text-primary">Play Elite.</span>
                </h1>
                <h2 className="mt-4 text-lg font-medium text-[hsl(var(--text-secondary))] text-center">
                  Sign in with email
                </h2>
              </div>

              {/* Credentials Form */}
              <form onSubmit={handleCredentialsSignIn} className="space-y-5">
                {/* Email Input */}
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
                      placeholder="Email"
                    />
                  </div>
                </div>

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
                      className="w-full pl-12 pr-12 py-3 bg-[hsl(var(--bg-tertiary))] border border-[hsl(var(--bg-tertiary))] rounded-xl text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                      placeholder="Password"
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
                  <div className="flex justify-end">
                    <Link
                      href="/portal/forgot-password"
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  variant="cta"
                  className="w-full py-3 font-medium rounded-xl transition-all"
                >
                  {loading ? "Signing in..." : "Get Started"}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[hsl(var(--bg-tertiary))]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-xs text-[hsl(var(--text-tertiary))] bg-[hsl(var(--bg-secondary))] uppercase tracking-wider">
                    Or sign in with
                  </span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {/* Google */}
                <Button
                  type="button"
                  onClick={() => handleSocialSignIn('google')}
                  disabled={loading}
                  variant="outline"
                  className="py-3 rounded-xl border-[hsl(var(--bg-tertiary))] hover:bg-[hsl(var(--bg-tertiary))] transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </Button>

                {/* Facebook */}
                <Button
                  type="button"
                  onClick={() => handleSocialSignIn('facebook')}
                  disabled={loading}
                  variant="outline"
                  className="py-3 rounded-xl border-[hsl(var(--bg-tertiary))] hover:bg-[hsl(var(--bg-tertiary))] transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </Button>

                {/* Apple */}
                <Button
                  type="button"
                  onClick={() => handleSocialSignIn('apple')}
                  disabled={loading}
                  variant="outline"
                  className="py-3 rounded-xl border-[hsl(var(--bg-tertiary))] hover:bg-[hsl(var(--bg-tertiary))] transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                </Button>
              </div>

              {/* Sign Up Link */}
              <p className="mt-8 text-center text-sm text-[hsl(var(--text-secondary))]">
                Don't have an account?{" "}
                <Link
                  href={`/portal/register${callbackUrl !== "/portal/dashboard" ? `?next=${encodeURIComponent(callbackUrl)}` : ""}`}
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Sign Up
                </Link>
              </p>
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
