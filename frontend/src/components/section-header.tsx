import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  /** Main title text */
  title: string
  /** Optional subtitle/description */
  subtitle?: string
  /** Additional CSS classes */
  className?: string
  /** Title alignment - defaults to center */
  align?: "left" | "center" | "right"
  /** Size variant */
  size?: "default" | "lg" | "sm"
}

/**
 * Consistent section header component for page sections.
 * Use this for major content sections like "The Huddle", "The Locker Room", etc.
 *
 * @example
 * <SectionHeader title="The Huddle" subtitle="Latest news and updates" />
 * <SectionHeader title="The Locker Room" align="left" size="lg" />
 */
export function SectionHeader({
  title,
  subtitle,
  className,
  align = "center",
  size = "default",
}: SectionHeaderProps) {
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }

  const titleSizes = {
    sm: "text-2xl md:text-3xl",
    default: "text-3xl md:text-4xl",
    lg: "text-4xl md:text-5xl",
  }

  const subtitleSizes = {
    sm: "text-base",
    default: "text-lg md:text-xl",
    lg: "text-xl md:text-2xl",
  }

  const spacingSizes = {
    sm: "mb-6",
    default: "mb-8 md:mb-12",
    lg: "mb-12 md:mb-16",
  }

  return (
    <div className={cn(alignClasses[align], spacingSizes[size], className)}>
      <h2 className={cn("font-bold tracking-tight", titleSizes[size])}>
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "text-muted-foreground mt-2 md:mt-4",
            subtitleSizes[size]
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
