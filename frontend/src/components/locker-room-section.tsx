"use client"

import { useState, useEffect } from "react"
import { MerchDropHype } from "@/components/merch-drop-hype"
import { FeaturedMerch } from "@/components/featured-merch"
import { isMerchDropAnnouncementActive } from "@/lib/merch-drop"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface MerchDropSettings {
  is_active: boolean
  drop_date: string | null
  has_dropped: boolean
}

/**
 * LockerRoomSection - Conditionally shows merch drop countdown OR featured products
 *
 * - During active countdown: Shows MerchDropHype component
 * - After countdown ends or when inactive: Shows FeaturedMerch component
 */
export function LockerRoomSection() {
  const [settings, setSettings] = useState<MerchDropSettings | null>(null)
  const [loading, setLoading] = useState(true)

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

  // Show nothing while loading to prevent flash
  if (loading) {
    return null
  }

  // If merch drop countdown is active, show the hype component only
  if (isMerchDropAnnouncementActive(settings)) {
    return (
      <MerchDropHype
        sectionTitle="The Locker Room"
        showSectionHeader
      />
    )
  }

  // Otherwise show the featured merch
  return <FeaturedMerch limit={6} showSeeMore wrapInSection />
}
