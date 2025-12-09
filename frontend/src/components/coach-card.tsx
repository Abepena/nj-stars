"use client"

import Image from "next/image"
import { Instagram } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Coach } from "@/lib/api-client"

interface CoachCardProps {
  coach: Coach
}

// Map role to display badge color
function getRoleBadgeStyle(role: string): string {
  const styles: Record<string, string> = {
    head_coach: "bg-accent text-accent-foreground",
    founder: "bg-primary text-primary-foreground",
    skills_coach: "bg-secondary text-secondary-foreground",
    assistant_coach: "bg-muted text-muted-foreground",
    trainer: "bg-tertiary text-tertiary-foreground",
  }
  return styles[role] || "bg-muted text-muted-foreground"
}

// Format role for display
function formatRole(role: string): string {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function CoachCard({ coach }: CoachCardProps) {
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg">
      {/* Photo */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        {coach.photo_url ? (
          <Image
            src={coach.photo_url}
            alt={coach.display_name || coach.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Image
              src="/brand/logos/logo square thick muted.svg"
              alt={coach.display_name || coach.name}
              width={120}
              height={120}
              className="opacity-30"
            />
          </div>
        )}

        {/* Role Badge Overlay */}
        <div className="absolute left-3 top-3">
          <Badge className={getRoleBadgeStyle(coach.role)}>
            {formatRole(coach.role)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Name & Title */}
        <div className="mb-2">
          <h3 className="text-xl font-bold">
            {coach.display_name || coach.name}
          </h3>
          {coach.title && (
            <p className="text-sm text-muted-foreground">{coach.title}</p>
          )}
        </div>

        {/* Bio (truncated) */}
        {coach.bio && (
          <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">
            {coach.bio}
          </p>
        )}

        {/* Specialties */}
        {coach.specialties_list && coach.specialties_list.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {coach.specialties_list.slice(0, 3).map((specialty) => (
              <Badge
                key={specialty}
                variant="outline"
                className="text-xs font-normal"
              >
                {specialty}
              </Badge>
            ))}
            {coach.specialties_list.length > 3 && (
              <Badge variant="outline" className="text-xs font-normal">
                +{coach.specialties_list.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Instagram Link */}
        {coach.instagram_url && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            asChild
          >
            <a
              href={coach.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram className="mr-2 h-4 w-4" />
              @{coach.instagram_handle}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
