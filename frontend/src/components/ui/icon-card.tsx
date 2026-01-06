import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface IconCardProps {
  icon: LucideIcon
  title: string
  description: string
  href?: string
  /** Accent color for hover states. Defaults to "primary" */
  accentColor?: "primary" | "secondary" | "success" | "accent" | "info" | "none"
  /** Card style variant. "default" uses corner glow, "merch" uses gradient border like MerchHype */
  variant?: "default" | "merch"
  className?: string
}

const accentColorClasses = {
  primary: {
    border: "hover:border-primary/50",
    iconBg: "",
    iconText: "",
    titleText: "",
  },
  secondary: {
    border: "hover:border-secondary/50",
    iconBg: "",
    iconText: "",
    titleText: "",
  },
  success: {
    border: "hover:border-success/50",
    iconBg: "",
    iconText: "",
    titleText: "",
  },
  accent: {
    border: "hover:border-accent/50",
    iconBg: "",
    iconText: "",
    titleText: "",
  },
  info: {
    border: "hover:border-info/50",
    iconBg: "",
    iconText: "",
    titleText: "",
  },
  none: {
    border: "",
    iconBg: "",
    iconText: "",
    titleText: "",
  },
}

export function IconCard({
  icon: Icon,
  title,
  description,
  href,
  accentColor = "primary",
  variant = "default",
  className,
}: IconCardProps) {
  const colors = accentColorClasses[accentColor] ?? accentColorClasses.primary

  const content = (
    <>
      <div className="w-12 h-12 card-subtle-gradient border border-white/[0.08] rounded-lg flex items-center justify-center mb-4 mx-auto">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed text-left">
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
    const innerClasses = "card-merch-style-inner p-6 text-center flex flex-col"

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
    "group card-corner-glow border border-white/[0.06] rounded-lg p-6 text-center transition-all duration-300 hover:translate-y-[-2px] hover:border-white/[0.1]",
    colors.border,
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
