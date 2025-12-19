"use client"

import { useState, useEffect, useCallback } from "react"
import { ShootingStars } from "@/components/ui/shooting-stars"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface MerchDropSettings {
  is_active: boolean
  drop_date: string | null
  headline: string
  subheadline: string
  teaser_text: string
  is_countdown_active: boolean
  has_dropped: boolean
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface MerchDropHypeProps {
  /** Full viewport height (for shop page) */
  fullHeight?: boolean
  /** Custom title override (e.g., "The Locker Room" for homepage) */
  sectionTitle?: string
  /** Show section header with title */
  showSectionHeader?: boolean
}

export function MerchDropHype({
  fullHeight = false,
  sectionTitle,
  showSectionHeader = false,
}: MerchDropHypeProps) {
  const [settings, setSettings] = useState<MerchDropSettings | null>(null)
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch(`${API_BASE}/api/payments/merch-drop/`)
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error("Failed to fetch merch drop settings:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  // Calculate time left
  const calculateTimeLeft = useCallback(() => {
    if (!settings?.drop_date) return null

    const dropTime = new Date(settings.drop_date).getTime()
    const now = new Date().getTime()
    const difference = dropTime - now

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    }
  }, [settings?.drop_date])

  // Update countdown every second
  useEffect(() => {
    if (!settings?.is_countdown_active) return

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    return () => clearInterval(timer)
  }, [settings?.is_countdown_active, calculateTimeLeft])

  // Don't render if not active or still loading
  if (loading || !settings?.is_active) {
    return null
  }

  const showCountdown = settings.is_countdown_active && timeLeft

  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/30 ${
        fullHeight
          ? "min-h-[calc(100vh-4rem)] flex items-center"
          : "py-16 md:py-24"
      }`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 rounded-full bg-primary/5 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-72 md:h-72 rounded-full bg-secondary/5 blur-3xl animate-pulse-slow delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 md:w-48 md:h-48 rounded-full bg-tertiary/5 blur-2xl animate-pulse-slow delay-2000" />

        {/* Shooting stars layer */}
        <ShootingStars starCount={12} minSpeed={3} maxSpeed={7} className="opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--bg-primary)/0.6)_100%)]" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                             linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '4rem 4rem',
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header (for homepage) */}
        {showSectionHeader && sectionTitle && (
          <div className="mb-10">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
              Coming Soon
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {sectionTitle}
            </h2>
          </div>
        )}

        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 md:mb-8 animate-fade-in-up">
            <span className="relative inline-block pb-3 md:pb-4">
              {settings.headline}
              <span className="absolute left-0 bottom-0 h-1 w-full rounded-full bg-gradient-to-r from-primary/90 via-primary/60 to-transparent shadow-[0_0_18px_hsl(var(--primary)/0.35)]" />
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 md:mb-12 max-w-xl animate-fade-in-up delay-100">
            {settings.subheadline}
          </p>

          {/* Countdown */}
          {showCountdown && (
            <div className="w-full max-w-lg mb-8 md:mb-12 animate-fade-in-up delay-200">
              <div className="grid grid-cols-4 gap-2 sm:gap-4">
                <CountdownUnit value={timeLeft.days} label="Days" />
                <CountdownUnit value={timeLeft.hours} label="Hours" />
                <CountdownUnit value={timeLeft.minutes} label="Mins" />
                <CountdownUnit value={timeLeft.seconds} label="Secs" />
              </div>
            </div>
          )}

          {/* Teaser text */}
          {settings.teaser_text && (
            <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md animate-fade-in-up delay-300">
              {settings.teaser_text}
            </p>
          )}
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  )
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full aspect-square flex items-center justify-center rounded-xl bg-card border border-border shadow-lg overflow-hidden group">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Number */}
        <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-mono font-bold tabular-nums">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="mt-2 text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
    </div>
  )
}
