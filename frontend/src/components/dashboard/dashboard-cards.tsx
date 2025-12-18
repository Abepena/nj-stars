"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// ==================== Dashboard Action Card ====================
// Used for quick action items with icon, title, and optional description

interface DashboardActionCardProps {
  href?: string
  icon: LucideIcon
  title: string
  description?: string
  badge?: string
  badgeVariant?: "default" | "warning" | "destructive" | "outline"
  disabled?: boolean
  onClick?: () => void
  children?: React.ReactNode
  className?: string
}

export function DashboardActionCard({
  href,
  icon: Icon,
  title,
  description,
  badge,
  badgeVariant = "default",
  disabled = false,
  onClick,
  children,
  className,
}: DashboardActionCardProps) {
  const content = (
    <Card
      className={cn(
        "transition-all h-full",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:bg-success/10 hover:border-success/30 cursor-pointer",
        className
      )}
    >
      <CardContent className="flex flex-col items-center justify-center p-6 text-center">
        <div
          className={cn(
            "h-12 w-12 rounded-lg flex items-center justify-center mb-3 transition-colors",
            disabled
              ? "bg-muted"
              : "bg-muted group-hover:bg-success/30"
          )}
        >
          <Icon
            className={cn(
              "h-6 w-6 transition-colors",
              disabled
                ? "text-muted-foreground"
                : "text-muted-foreground group-hover:text-foreground"
            )}
          />
        </div>
        <h3 className="font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
        {badge && (
          <Badge variant={badgeVariant} className="mt-2">
            {badge}
          </Badge>
        )}
        {children}
      </CardContent>
    </Card>
  )

  if (disabled) {
    return <div className="group">{content}</div>
  }

  if (href) {
    return (
      <Link href={href} className="group">
        {content}
      </Link>
    )
  }

  return (
    <div className="group" onClick={onClick}>
      {content}
    </div>
  )
}

// ==================== Dashboard Link Card ====================
// Used for navigation items with icon, title, description, and arrow

interface DashboardLinkCardProps {
  href: string
  icon: LucideIcon
  title: string
  description?: string
  badge?: React.ReactNode
  highlight?: boolean
  className?: string
}

export function DashboardLinkCard({
  href,
  icon: Icon,
  title,
  description,
  badge,
  highlight = false,
  className,
}: DashboardLinkCardProps) {
  return (
    <Link href={href} className="group">
      <Card
        className={cn(
          "hover:bg-success/10 hover:border-success/30 transition-all cursor-pointer h-full",
          highlight && "border-warning/30",
          className
        )}
      >
        <CardContent className="flex items-center gap-4 p-6">
          <div className="h-12 w-12 rounded-lg bg-muted group-hover:bg-success/30 flex items-center justify-center shrink-0 transition-colors">
            <Icon className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            {badge}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
        </CardContent>
      </Card>
    </Link>
  )
}

// ==================== Dashboard Stat Card ====================
// Used for displaying statistics with icon, value, and label

interface DashboardStatCardProps {
  icon: LucideIcon
  title: string
  value: string | number
  description?: string
  highlight?: boolean
  className?: string
}

export function DashboardStatCard({
  icon: Icon,
  title,
  value,
  description,
  highlight = false,
  className,
}: DashboardStatCardProps) {
  return (
    <Card className={cn(highlight && "border-warning/30", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div
          className={cn(
            "text-xl sm:text-2xl font-bold",
            highlight && "text-foreground/70"
          )}
        >
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== Dashboard Section Header ====================
// Used for section titles with optional action button

interface DashboardSectionProps {
  title: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function DashboardSection({
  title,
  action,
  className,
  children,
}: DashboardSectionProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

// ==================== Dashboard Icon Button ====================
// Used for icon-only action buttons with consistent hover

interface DashboardIconButtonProps {
  icon: LucideIcon
  label: string
  onClick?: () => void
  variant?: "default" | "success" | "warning" | "destructive"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function DashboardIconButton({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  size = "md",
  className,
}: DashboardIconButtonProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const variantClasses = {
    default: "bg-muted hover:bg-success/30 text-muted-foreground hover:text-foreground",
    success: "bg-success/30 hover:bg-success/40 text-foreground",
    warning: "bg-warning/30 hover:bg-warning/40 text-foreground",
    destructive: "bg-destructive/30 hover:bg-destructive/40 text-foreground",
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full flex items-center justify-center transition-colors",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      title={label}
      aria-label={label}
    >
      <Icon className={iconSizes[size]} />
    </button>
  )
}
