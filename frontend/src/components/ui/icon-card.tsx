import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface IconCardProps {
  icon: LucideIcon
  title: string
  description: string
  href?: string
  /** Accent color for hover states. Defaults to "primary" */
  accentColor?: "primary" | "secondary" | "success" | "accent" | "none"
  className?: string
}

const accentColorClasses = {
  primary: {
    border: "hover:border-primary/50",
    iconBg: "group-hover:bg-primary/10",
    iconText: "group-hover:text-primary",
    titleText: "group-hover:text-primary",
  },
  secondary: {
    border: "hover:border-secondary/50",
    iconBg: "group-hover:bg-secondary/10",
    iconText: "group-hover:text-secondary",
    titleText: "group-hover:text-secondary",
  },
  success: {
    border: "hover:border-success/50",
    iconBg: "group-hover:bg-success/10",
    iconText: "group-hover:text-success",
    titleText: "group-hover:text-success",
  },
  accent: {
    border: "hover:border-accent/50",
    iconBg: "group-hover:bg-accent/10",
    iconText: "group-hover:text-accent",
    titleText: "group-hover:text-accent",
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
  className,
}: IconCardProps) {
  const colors = accentColorClasses[accentColor]

  const content = (
    <>
      <div
        className={cn(
          "w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4 mx-auto transition-colors",
          colors.iconBg
        )}
      >
        <Icon
          className={cn(
            "w-6 h-6 text-muted-foreground transition-colors",
            colors.iconText
          )}
        />
      </div>
      <h3
        className={cn(
          "text-lg font-semibold mb-2 transition-colors",
          colors.titleText
        )}
      >
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed text-left">
        {description}
      </p>
    </>
  )

  const cardClasses = cn(
    "group bg-card border border-border rounded-xl p-6 text-center transition-all",
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
