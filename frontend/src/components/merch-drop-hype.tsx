"use client"

import { useState, useEffect, useCallback } from "react"
import { isMerchDropAnnouncementActive } from "@/lib/merch-drop"

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
    if (Number.isNaN(dropTime)) return null
    const now = new Date().getTime()
    const difference = dropTime - now

    if (difference <= 0) return null

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    }
  }, [settings?.drop_date])

  // Update countdown every second
  useEffect(() => {
    if (!settings?.drop_date) return

    const intervalMs = settings.is_countdown_active ? 1000 : 30000
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, intervalMs)

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    return () => clearInterval(timer)
  }, [settings?.drop_date, settings?.is_countdown_active, calculateTimeLeft])

  // Don't render if not active or still loading
  if (loading || !isMerchDropAnnouncementActive(settings)) {
    return null
  }

  const showCountdown = settings.is_countdown_active && timeLeft
  const layoutClassName = showCountdown
    ? "lg:grid-cols-[1.1fr_0.9fr]"
    : "lg:grid-cols-1"
  const kickerText = !showSectionHeader ? (sectionTitle ?? "Merch Drop") : null

  return (
    <section
      className={`relative overflow-hidden section-glow-spot ${
        fullHeight
          ? "min-h-[calc(100vh-4rem)] flex items-center"
          : "py-16 md:py-24"
      }`}
    >
      {/* Pink-dominant ambient glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-32 h-72 w-72 rounded-full bg-[hsl(var(--primary)/0.08)] blur-[140px]" />
        <div className="absolute -bottom-40 -right-32 h-80 w-80 rounded-full bg-[hsl(var(--primary)/0.12)] blur-[160px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header (for homepage) */}
        {showSectionHeader && sectionTitle && (
          <div className="mb-10 text-center lg:text-left">
            <p className="text-xs font-medium text-white/60 uppercase tracking-[0.4em] mb-3">
              Coming Soon
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {sectionTitle}
            </h2>
          </div>
        )}

        <div className="relative mx-auto max-w-6xl">
          {/* Pink-focused gradient border */}
          <div className="rounded-3xl p-[1px] bg-gradient-to-br from-[hsl(var(--neon-pink)/0.6)] via-[hsl(var(--neon-pink)/0.3)] to-[hsl(var(--neon-pink)/0.1)]">
            {/* Panel with pink glow */}
            <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-gradient-to-b from-bg-secondary/80 to-bg-primary/90 backdrop-blur-xl border border-white/[0.05] shadow-[0_0_60px_hsl(var(--neon-pink)/0.15)]">
              {/* Inner ambient glows - pink only */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 -right-20 h-52 w-52 rounded-full bg-[hsl(var(--neon-pink)/0.15)] blur-3xl" />
                <div className="absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-[hsl(var(--neon-pink)/0.1)] blur-3xl" />
              </div>

              <div className="relative px-6 py-10 md:px-10 md:py-14">
                <div className={`grid gap-10 items-center ${layoutClassName}`}>
                  <div className="text-center lg:text-left">
                    {kickerText && (
                      <div className="inline-flex items-center gap-3 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-[10px] uppercase tracking-[0.35em] text-foreground/80 mb-6">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.8)]" />
                        <span>{kickerText}</span>
                      </div>
                    )}

                    {/* Main headline with extreme chromatic glitch effect */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 md:mb-8 animate-fade-in-up">
                      <span
                        className="chromatic-extreme relative inline-block pb-3 md:pb-4"
                        data-text={settings.headline}
                      >
                        {settings.headline}
                        <span className="absolute left-0 -bottom-1 h-1 w-full rounded-full bg-gradient-to-r from-primary/90 via-primary/60 to-transparent shadow-[0_0_18px_hsl(var(--neon-pink)/0.4)]" />
                      </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-6 md:mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-in-up delay-100">
                      {settings.subheadline}
                    </p>

                    {/* Teaser text */}
                    {settings.teaser_text && (
                      <p className="text-sm sm:text-base text-muted-foreground/90 max-w-md mx-auto lg:mx-0 animate-fade-in-up delay-200">
                        {settings.teaser_text}
                      </p>
                    )}
                  </div>

                  {/* Countdown */}
                  {showCountdown && (
                    <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto animate-fade-in-up delay-200">
                      <div className="grid grid-cols-4 gap-3 sm:gap-4">
                        <CountdownUnit value={timeLeft.days} label="Days" />
                        <CountdownUnit value={timeLeft.hours} label="Hours" />
                        <CountdownUnit value={timeLeft.minutes} label="Mins" />
                        <CountdownUnit value={timeLeft.seconds} label="Secs" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Pink-themed countdown tile */}
      <div className="w-full aspect-square rounded-xl p-[1px] bg-gradient-to-br from-[hsl(var(--neon-pink)/0.5)] to-[hsl(var(--neon-pink)/0.15)] transition-transform duration-300 hover:-translate-y-1 shadow-[0_0_25px_hsl(var(--neon-pink)/0.2)]">
        <div className="w-full h-full rounded-[calc(0.75rem-1px)] bg-gradient-to-b from-bg-secondary/90 to-bg-primary/95 backdrop-blur-sm flex items-center justify-center border border-white/[0.05]">
          <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-mono font-bold tabular-nums text-foreground [text-shadow:0_0_20px_hsl(var(--neon-pink)/0.4)]">
            {value.toString().padStart(2, "0")}
          </span>
        </div>
      </div>
      <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-[0.35em]">
        {label}
      </span>
    </div>
  )
}
