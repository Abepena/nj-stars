import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface PremiumIconCardProps {
  icon: LucideIcon
  title: string
  description: string
  href?: string
  /** Accent color for primary interactions. Defaults to "primary" */
  accentColor?: "primary" | "secondary" | "success" | "accent" | "info" | "warning"
  /** Icon size in pixels. Defaults to 56 */
  iconSize?: number
  /** Card style variant. "default" uses corner glow, "merch" uses gradient border like MerchHype */
  variant?: "default" | "merch"
  className?: string
}

const accentColorClasses = {
  primary: {
    border: "hover:border-primary/40",
    titleText: "group-hover:text-primary",
    accentGlow: "group-hover:shadow-[0_12px_48px_rgba(227,24,95,0.15)]",
  },
  secondary: {
    border: "hover:border-secondary/40",
    titleText: "group-hover:text-secondary",
    accentGlow: "group-hover:shadow-[0_12px_48px_rgba(188,180,235,0.15)]",
  },
  success: {
    border: "hover:border-success/40",
    titleText: "group-hover:text-success",
    accentGlow: "group-hover:shadow-[0_12px_48px_rgba(139,195,74,0.15)]",
  },
  accent: {
    border: "hover:border-accent/40",
    titleText: "group-hover:text-accent",
    accentGlow: "group-hover:shadow-[0_12px_48px_rgba(227,69,69,0.15)]",
  },
  info: {
    border: "hover:border-info/40",
    titleText: "group-hover:text-info",
    accentGlow: "group-hover:shadow-[0_12px_48px_rgba(66,165,245,0.15)]",
  },
  warning: {
    border: "hover:border-warning/40",
    titleText: "group-hover:text-warning",
    accentGlow: "group-hover:shadow-[0_12px_48px_rgba(255,152,0,0.15)]",
  },
}

export function PremiumIconCard({
  icon: Icon,
  title,
  description,
  href,
  accentColor = "primary",
  iconSize = 56,
  variant = "default",
  className,
}: PremiumIconCardProps) {
  const colors = accentColorClasses[accentColor] ?? accentColorClasses.primary

  const content = (
    <>
      {/* Icon badge */}
      <div className="w-12 h-12 bg-card border border-border/60 rounded-lg flex items-center justify-center mb-4 mx-auto">
        <Icon
          size={24}
          className="text-text-secondary"
        />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold mb-2 text-foreground">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-text-secondary leading-relaxed text-left">
        {description}
      </p>
    </>
  )

  // Merch style: gradient border wrapper with inner content
  if (variant === "merch") {
    const wrapperClasses = cn(
      "group card-merch-style transition-all duration-300 overflow-hidden",
      "hover:translate-y-[-4px] hover:shadow-[0_0_40px_hsl(var(--neon-pink)/0.2)]",
      className
    )
    const innerClasses = "card-merch-style-inner px-5 pb-5 pt-5 text-center"

    if (href) {
      return (
        <Link href={href} className={wrapperClasses}>
          <div className={innerClasses}>{content}</div>
        </Link>
      )
    }
    return (
      <div className={wrapperClasses}>
        <div className={innerClasses}>{content}</div>
      </div>
    )
  }

  // Default style: corner glow
  const cardClasses = cn(
    "group relative card-corner-glow border border-white/[0.06] rounded-lg p-6 transition-all duration-300 overflow-hidden",
    "hover:border-white/[0.12] hover:translate-y-[-4px]",
    colors.border,
    colors.accentGlow,
    className
  )

  if (href) {
    return (
      <Link href={href} className={cardClasses}>
        {content}
      </Link>
    )
  }

  return <div className={cardClasses}>{content}</div>
}
