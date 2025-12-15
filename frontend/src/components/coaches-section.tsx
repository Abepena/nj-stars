"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Instagram, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Coach } from "@/lib/api-client"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Fallback coaches data if API fails
const FALLBACK_COACHES: Coach[] = [
  {
    id: 1,
    name: "Kenneth Andrade",
    display_name: "Coach K",
    slug: "kenneth-andrade",
    role: "founder",
    title: "Founder & Coach",
    bio: "Kenneth \"Coach K\" Andrade is the founder of NJ Stars Elite AAU Basketball. His vision to create an elite youth basketball program in New Jersey has grown into a thriving organization that develops both athletes and young people.",
    photo_url: "",
    instagram_handle: "kenny_164",
    instagram_url: "https://instagram.com/kenny_164",
    specialties: "program development, team strategy, leadership, community building",
    specialties_list: ["program development", "team strategy", "leadership", "community building"],
    is_active: true,
    order: 0
  },
  {
    id: 2,
    name: "Trajan Chapman",
    display_name: "Tray",
    slug: "trajan-chapman",
    role: "head_coach",
    title: "Head Coach & Trainer",
    bio: "Trajan \"Tray\" Chapman is the head coach and lead trainer for NJ Stars Elite. With years of experience in player development and competitive coaching, Tray brings an intense focus on fundamentals, basketball IQ, and mental toughness to every session.",
    photo_url: "",
    instagram_handle: "traygotbounce",
    instagram_url: "https://instagram.com/traygotbounce",
    specialties: "player development, shooting mechanics, physical conditioning, offensive strategy",
    specialties_list: ["player development", "shooting mechanics", "physical conditioning", "offensive strategy"],
    is_active: true,
    order: 1
  },
  {
    id: 3,
    name: "Chris Morales",
    display_name: "Coach Cee",
    slug: "chris-morales",
    role: "skills_coach",
    title: "Skills Clinic Coach",
    bio: "Coach Cee specializes in skills development clinics and individual training. His approach focuses on building confidence through repetition and breaking down complex moves into learnable steps.",
    photo_url: "",
    instagram_handle: "coach.cee",
    instagram_url: "https://instagram.com/coach.cee",
    specialties: "skills clinics, individual training, footwork, ball handling",
    specialties_list: ["skills clinics", "individual training", "footwork", "ball handling"],
    is_active: true,
    order: 2
  }
]

export function CoachesSection() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Track transition phases: 'idle' | 'fading-out' | 'fading-in'
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'fading-out' | 'fading-in'>('idle')
  const [displayIndex, setDisplayIndex] = useState(0)

  useEffect(() => {
    async function fetchCoaches() {
      try {
        const response = await fetch(`${API_URL}/api/coaches/`)
        if (!response.ok) {
          throw new Error("Failed to fetch coaches")
        }
        const data = await response.json()
        const fetchedCoaches = data.results || []
        // Use fallback if API returns empty
        setCoaches(fetchedCoaches.length > 0 ? fetchedCoaches : FALLBACK_COACHES)
      } catch (err) {
        // Use fallback coaches on error instead of showing error message
        console.warn("Failed to fetch coaches, using fallback data:", err)
        setCoaches(FALLBACK_COACHES)
        setError(null) // Don't show error UI, we have fallback
      } finally {
        setIsLoading(false)
      }
    }

    fetchCoaches()
  }, [])

  const changeCoach = (newIndex: number) => {
    if (transitionPhase !== 'idle' || newIndex === activeIndex) return

    // Start fade out
    setTransitionPhase('fading-out')

    // After fade out completes, switch and fade in
    setTimeout(() => {
      setDisplayIndex(newIndex)
      setActiveIndex(newIndex)
      setTransitionPhase('fading-in')

      // After fade in completes, return to idle
      setTimeout(() => {
        setTransitionPhase('idle')
      }, 300)
    }, 300)
  }

  const goToPrevious = () => {
    const newIndex = activeIndex === 0 ? coaches.length - 1 : activeIndex - 1
    changeCoach(newIndex)
  }

  const goToNext = () => {
    const newIndex = activeIndex === coaches.length - 1 ? 0 : activeIndex + 1
    changeCoach(newIndex)
  }

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <div className="h-9 w-64 bg-muted rounded mx-auto mb-2 animate-pulse" />
            <div className="h-5 w-96 max-w-full bg-muted rounded mx-auto animate-pulse" />
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center">
              <div className="w-72 h-96 md:w-80 md:h-[28rem] lg:w-96 lg:h-[32rem] bg-muted rounded-2xl animate-pulse" />
              <div className="flex-1 space-y-4 w-full">
                <div className="h-12 w-48 bg-muted rounded animate-pulse mx-auto md:mx-0" />
                <div className="h-6 w-32 bg-muted rounded animate-pulse mx-auto md:mx-0" />
                <div className="h-32 w-full bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <p className="text-center text-muted-foreground">{error}</p>
        </div>
      </section>
    )
  }

  if (coaches.length === 0) {
    return null
  }

  const currentCoach = coaches[displayIndex]

  // Determine opacity based on transition phase
  const getOpacity = () => {
    if (transitionPhase === 'fading-out') return 'opacity-0'
    if (transitionPhase === 'fading-in') return 'opacity-100'
    return 'opacity-100'
  }

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Meet Our Coaches</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Our experienced coaching staff is dedicated to developing elite basketball players
            through personalized training, competitive play, and character building.
          </p>
        </div>

        {/* Coach Spotlight */}
        <div className="max-w-5xl mx-auto">
          <div
            className={cn(
              "flex flex-col md:flex-row gap-6 md:gap-16 items-center transition-opacity duration-300 ease-in-out",
              getOpacity()
            )}
          >
            {/* Mobile: Image with arrows in gutters */}
            <div className="flex-shrink-0 w-full md:w-auto">
              <div className="flex items-center justify-center gap-2 md:gap-0">
                {/* Left Arrow - Mobile only */}
                {coaches.length > 1 && (
                  <button
                    onClick={goToPrevious}
                    disabled={transitionPhase !== 'idle'}
                    className="md:hidden w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50 flex-shrink-0"
                    aria-label="Previous coach"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                {/* Photo */}
                <div className="relative w-64 h-80 sm:w-72 sm:h-96 md:w-80 md:h-[28rem] lg:w-96 lg:h-[32rem] rounded-2xl overflow-hidden bg-card shadow-xl flex-shrink-0">
                  {currentCoach.photo_url ? (
                    <Image
                      src={currentCoach.photo_url}
                      alt={currentCoach.display_name || currentCoach.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted">
                      <Image
                        src="/brand/logos/logo square thick muted.svg"
                        alt={currentCoach.display_name || currentCoach.name}
                        width={140}
                        height={140}
                        className="opacity-30"
                      />
                    </div>
                  )}
                </div>

                {/* Right Arrow - Mobile only */}
                {coaches.length > 1 && (
                  <button
                    onClick={goToNext}
                    disabled={transitionPhase !== 'idle'}
                    className="md:hidden w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50 flex-shrink-0"
                    aria-label="Next coach"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Dots - Mobile only, below image */}
              {coaches.length > 1 && (
                <div className="flex justify-center gap-2 mt-4 md:hidden">
                  {coaches.map((coach, index) => (
                    <button
                      key={coach.id}
                      onClick={() => changeCoach(index)}
                      disabled={transitionPhase !== 'idle'}
                      className={cn(
                        "w-3 h-3 rounded-full transition-all duration-200",
                        index === activeIndex
                          ? "bg-primary scale-125"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      )}
                      aria-label={`View ${coach.display_name || coach.name}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Coach Info */}
            <div className="flex-1 text-center md:text-left min-w-0">
              {/* Name & Title */}
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                {currentCoach.display_name || currentCoach.name}
              </h3>
              {currentCoach.title && (
                <p className="text-primary font-medium text-lg md:text-xl mb-6">{currentCoach.title}</p>
              )}

              {/* Full Bio */}
              {currentCoach.bio && (
                <p className="text-muted-foreground mb-8 leading-relaxed text-base md:text-lg">
                  {currentCoach.bio}
                </p>
              )}

              {/* Specialties */}
              {currentCoach.specialties_list && currentCoach.specialties_list.length > 0 && (
                <div className="mb-8">
                  <p className="text-sm font-medium mb-3 text-foreground uppercase tracking-wide">Specialties</p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {currentCoach.specialties_list.map((specialty) => (
                      <Badge
                        key={specialty}
                        variant="outline"
                        className="text-sm px-3 py-1"
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Instagram Link */}
              {currentCoach.instagram_url && (
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                >
                  <a
                    href={currentCoach.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Opens in new window"
                  >
                    <Instagram className="mr-2 h-5 w-5" />
                    @{currentCoach.instagram_handle}
                    <span className="sr-only">(opens in new window)</span>
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Navigation: Arrows + Dots - Desktop only */}
          {coaches.length > 1 && (
            <div className="hidden md:flex justify-center items-center gap-6 mt-12">
              <button
                onClick={goToPrevious}
                disabled={transitionPhase !== 'idle'}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                aria-label="Previous coach"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex gap-2">
                {coaches.map((coach, index) => (
                  <button
                    key={coach.id}
                    onClick={() => changeCoach(index)}
                    disabled={transitionPhase !== 'idle'}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all duration-200",
                      index === activeIndex
                        ? "bg-primary scale-125"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                    aria-label={`View ${coach.display_name || coach.name}`}
                  />
                ))}
              </div>

              <button
                onClick={goToNext}
                disabled={transitionPhase !== 'idle'}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                aria-label="Next coach"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
