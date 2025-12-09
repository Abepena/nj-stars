"use client"

import { useEffect, useState } from "react"
import { CoachCard } from "@/components/coach-card"
import { CoachCardSkeleton } from "@/components/skeletons/coach-card-skeleton"
import type { Coach } from "@/lib/api-client"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export function CoachesSection() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCoaches() {
      try {
        const response = await fetch(`${API_URL}/api/coaches/`)
        if (!response.ok) {
          throw new Error("Failed to fetch coaches")
        }
        const data = await response.json()
        setCoaches(data.results || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load coaches")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCoaches()
  }, [])

  if (isLoading) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          {/* Section Header Skeleton */}
          <div className="mb-8 text-center">
            <div className="h-9 w-64 bg-muted rounded mx-auto mb-2 animate-pulse" />
            <div className="h-5 w-96 max-w-full bg-muted rounded mx-auto animate-pulse" />
          </div>

          {/* Coach Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <CoachCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <p className="text-center text-muted-foreground">{error}</p>
        </div>
      </section>
    )
  }

  if (coaches.length === 0) {
    return null
  }

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2">Meet Our Coaches</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our experienced coaching staff is dedicated to developing elite basketball players
            through personalized training, competitive play, and character building.
          </p>
        </div>

        {/* Coach Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {coaches.map((coach) => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>
      </div>
    </section>
  )
}
