"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ShootingStars } from "@/components/ui/shooting-stars"
import { ThemeLogo } from "@/components/ui/theme-logo"
import { Mail, Lock, Eye, EyeOff, User, Phone, CheckCircle, Users, UserCircle, ArrowLeft } from "lucide-react"

type Role = "parent" | "player" | null

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get("next") || "/portal/dashboard"

  const [selectedRole, setSelectedRole] = useState<Role>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/registration/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password1: formData.password,
          password2: formData.confirmPassword,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          role: selectedRole,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        // Auto sign in after registration
        setTimeout(async () => {
          const result = await signIn("credentials", {
            email: formData.email,
            password: formData.password,
            redirect: false,
          })
          if (result?.ok) {
            router.push(callbackUrl)
          }
        }, 2000)
      } else {
        const data = await response.json()
        // Handle specific error messages from dj-rest-auth
        if (data.email) {
          setError(data.email[0])
        } else if (data.password1) {
          setError(data.password1[0])
        } else if (data.non_field_errors) {
          setError(data.non_field_errors[0])
        } else {
          setError("Registration failed. Please try again.")
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
              Join the
              <br />
              <span className="text-primary">NJ Stars Family</span>
            </h1>
            <p className="text-lg text-[hsl(var(--text-secondary))] leading-relaxed">
              Create your account to register for events, manage your players, and stay connected with our elite basketball community.
            </p>
          </div>
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
                    Welcome to NJ Stars!
                  </h2>
                  <p className="text-[hsl(var(--text-secondary))] mb-6">
                    Your account has been created successfully. Redirecting you to your dashboard...
                  </p>
                </div>
              ) : !selectedRole ? (
                /* Step 1: Role Selection */
                <div>
                  <div className="mb-6 text-center">
                    <h1 className="text-3xl font-bold text-[hsl(var(--text-primary))] leading-tight">
                      Train Hard.{" "}
                      <span className="text-primary">Play Elite.</span>
                    </h1>
                    <h2 className="mt-4 text-lg font-medium text-[hsl(var(--text-secondary))]">
                      I am signing up as a...
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {/* Parent/Guardian Option */}
                    <button
                      type="button"
                      onClick={() => setSelectedRole("parent")}
                      className="w-full p-6 rounded-xl border-2 border-[hsl(var(--bg-tertiary))] bg-[hsl(var(--bg-tertiary))]/30 hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Users className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[hsl(var(--text-primary))]">
                            Parent / Guardian
                          </h3>
                          <p className="text-sm text-[hsl(var(--text-secondary))]">
                            Register and manage your children's activities
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Player Option */}
                    <button
                      type="button"
                      onClick={() => setSelectedRole("player")}
                      className="w-full p-6 rounded-xl border-2 border-[hsl(var(--bg-tertiary))] bg-[hsl(var(--bg-tertiary))]/30 hover:border-secondary/50 hover:bg-secondary/5 transition-all group text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                          <UserCircle className="h-7 w-7 text-secondary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[hsl(var(--text-primary))]">
                            Player (13+)
                          </h3>
                          <p className="text-sm text-[hsl(var(--text-secondary))]">
                            Manage your own profile and registrations
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Sign In Link */}
                  <p className="mt-8 text-center text-sm text-[hsl(var(--text-secondary))]">
                    Already have an account?{" "}
                    <Link
                      href={`/portal/login${callbackUrl !== "/portal/dashboard" ? `?next=${encodeURIComponent(callbackUrl)}` : ""}`}
                      className="font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              ) : (
                /* Step 2: Registration Form */
                <>
                  {/* Back Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole(null)}
                    className="flex items-center gap-1 text-sm text-[hsl(var(--text-tertiary))] hover:text-primary transition-colors mb-4"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>

                  {/* Form Header */}
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold text-[hsl(var(--text-primary))] leading-tight text-center">
                      Train Hard.{" "}
                      <span className="text-primary">Play Elite.</span>
                    </h1>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        selectedRole === "parent" ? "bg-primary/10" : "bg-secondary/10"
                      }`}>
                        {selectedRole === "parent" ? (
                          <Users className={`h-4 w-4 text-primary`} />
                        ) : (
                          <UserCircle className={`h-4 w-4 text-secondary`} />
                        )}
                      </div>
                      <span className="text-lg font-medium text-[hsl(var(--text-secondary))]">
                        {selectedRole === "parent" ? "Parent / Guardian" : "Player (13+)"}
                      </span>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--text-tertiary))]" />
                        <input
                          name="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          className="w-full pl-12 pr-4 py-3 bg-[hsl(var(--bg-tertiary))] border border-[hsl(var(--bg-tertiary))] rounded-xl text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                          placeholder="First name"
                        />
                      </div>
                      <div className="relative">
                        <input
                          name="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-[hsl(var(--bg-tertiary))] border border-[hsl(var(--bg-tertiary))] rounded-xl text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                          placeholder="Last name"
                        />
                      </div>
                    </div>

                    {/* Email Input */}
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--text-tertiary))]" />
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-4 py-3 bg-[hsl(var(--bg-tertiary))] border border-[hsl(var(--bg-tertiary))] rounded-xl text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                        placeholder="Email address"
                      />
                    </div>

                    {/* Phone Input (Required) */}
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--text-tertiary))]" />
                      <input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-4 py-3 bg-[hsl(var(--bg-tertiary))] border border-[hsl(var(--bg-tertiary))] rounded-xl text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                        placeholder="Phone number"
                      />
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--text-tertiary))]" />
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={8}
                        className="w-full pl-12 pr-12 py-3 bg-[hsl(var(--bg-tertiary))] border border-[hsl(var(--bg-tertiary))] rounded-xl text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                        placeholder="Password (8+ characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--text-secondary))] transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>

                    {/* Confirm Password */}
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--text-tertiary))]" />
                      <input
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        minLength={8}
                        className="w-full pl-12 pr-12 py-3 bg-[hsl(var(--bg-tertiary))] border border-[hsl(var(--bg-tertiary))] rounded-xl text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--text-secondary))] transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
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
                      {loading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>

                  {/* Divider */}
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-[hsl(var(--bg-tertiary))]" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-4 text-xs text-[hsl(var(--text-tertiary))] bg-[hsl(var(--bg-secondary))] uppercase tracking-wider">
                        Or sign up with
                      </span>
                    </div>
                  </div>

                  {/* Social Buttons */}
                  {/* #TODO: Research Instagram and TikTok login options - target demographic is GenZ players */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* #TODO: Configure Google OAuth credentials in Google Cloud Console */}
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

                    {/* #TODO: Configure Apple Sign In - requires Apple Developer account and domain verification */}
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

                  {/* Sign In Link */}
                  <p className="mt-6 text-center text-sm text-[hsl(var(--text-secondary))]">
                    Already have an account?{" "}
                    <Link
                      href={`/portal/login${callbackUrl !== "/portal/dashboard" ? `?next=${encodeURIComponent(callbackUrl)}` : ""}`}
                      className="font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Sign In
                    </Link>
                  </p>
                </>
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
