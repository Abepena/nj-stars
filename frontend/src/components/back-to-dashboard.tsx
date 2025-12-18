"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface BackToDashboardProps {
  className?: string
  label?: string
}

export function BackToDashboard({
  className,
  label = "Back to Dashboard"
}: BackToDashboardProps) {
  return (
    <Link
      href="/portal/dashboard"
      className={cn(
        "inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
    >
      <ChevronLeft className="h-4 w-4 mr-1" />
      {label}
    </Link>
  )
}
