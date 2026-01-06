"use client"

import * as React from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * NeonCard - Opus Design System
 *
 * A premium card component with layered neon glow effects.
 * Designed for the Gen Z basketball audience with gaming-inspired aesthetics.
 *
 * Key differences from PremiumIconCard:
 * - Stacked box-shadows for authentic neon glow (not single shadow)
 * - CSS variable-driven theming for runtime color changes
 * - Progressive enhancement: works without JS, enhanced with it
 * - Composable: works as container or with built-in slots
 * - Animated border option for high-impact areas
 */

const neonCardVariants = cva(
  [
    "group relative overflow-hidden rounded-xl transition-all duration-300",
    "bg-gradient-to-br from-bg-secondary/90 to-bg-primary/95",
    "border border-white/[0.08]",
  ].join(" "),
  {
    variants: {
      glow: {
        none: "",
        subtle: "hover:shadow-[0_0_20px_hsl(var(--neon-pink)/0.15),0_0_40px_hsl(var(--neon-pink)/0.08)]",
        medium: "hover:shadow-[0_0_25px_hsl(var(--neon-pink)/0.25),0_0_50px_hsl(var(--neon-pink)/0.12)]",
        intense: [
          "shadow-[0_0_15px_hsl(var(--neon-pink)/0.1)]",
          "hover:shadow-[0_0_30px_hsl(var(--neon-pink)/0.35),0_0_60px_hsl(var(--neon-pink)/0.18),0_0_90px_hsl(var(--neon-pink)/0.08)]",
        ].join(" "),
        pulse: "animate-neon-pulse",
        dual: [
          "hover:shadow-[-8px_0_30px_hsl(var(--neon-cyan)/0.2),8px_0_30px_hsl(var(--neon-pink)/0.2),0_0_50px_hsl(var(--neon-purple)/0.1)]",
        ].join(" "),
      },
      color: {
        pink: "", // Default - uses --neon-pink
        cyan: [
          "hover:shadow-[0_0_25px_hsl(var(--neon-cyan)/0.25),0_0_50px_hsl(var(--neon-cyan)/0.12)]",
        ].join(" "),
        purple: [
          "hover:shadow-[0_0_25px_hsl(var(--neon-purple)/0.25),0_0_50px_hsl(var(--neon-purple)/0.12)]",
        ].join(" "),
      },
      border: {
        default: "hover:border-white/[0.15]",
        gradient: "neon-border-gradient",
        animated: "neon-border-animated",
      },
      hover: {
        lift: "hover:-translate-y-1",
        scale: "hover:scale-[1.02]",
        none: "",
      },
    },
    defaultVariants: {
      glow: "medium",
      color: "pink",
      border: "default",
      hover: "lift",
    },
  }
)

export interface NeonCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof neonCardVariants> {
  /** Render as a link */
  href?: string
  /** Make the entire card clickable (for accessibility with links) */
  asChild?: boolean
}

const NeonCard = React.forwardRef<HTMLDivElement, NeonCardProps>(
  ({ className, glow, color, border, hover, href, children, ...props }, ref) => {
    const cardClasses = cn(neonCardVariants({ glow, color, border, hover }), className)

    // Ambient glow layer - sits behind the card
    const ambientGlow = (
      <div
        className={cn(
          "absolute -inset-px rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 -z-10 blur-xl",
          color === "cyan"
            ? "bg-[hsl(var(--neon-cyan)/0.15)]"
            : color === "purple"
              ? "bg-[hsl(var(--neon-purple)/0.15)]"
              : "bg-[hsl(var(--neon-pink)/0.15)]"
        )}
        aria-hidden="true"
      />
    )

    // Scanline overlay for premium effect
    const scanlineOverlay = (
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)",
        }}
        aria-hidden="true"
      />
    )

    if (href) {
      return (
        <Link href={href} className={cardClasses} ref={ref as React.Ref<HTMLAnchorElement>} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
          {ambientGlow}
          {children}
          {scanlineOverlay}
        </Link>
      )
    }

    return (
      <div ref={ref} className={cardClasses} {...props}>
        {ambientGlow}
        {children}
        {scanlineOverlay}
      </div>
    )
  }
)
NeonCard.displayName = "NeonCard"

/**
 * NeonCardHeader - Optional header slot
 */
const NeonCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}
    {...props}
  />
))
NeonCardHeader.displayName = "NeonCardHeader"

/**
 * NeonCardTitle - Card title with optional chromatic effect
 */
interface NeonCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  chromatic?: boolean
}

const NeonCardTitle = React.forwardRef<HTMLHeadingElement, NeonCardTitleProps>(
  ({ className, chromatic = false, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-xl font-bold leading-tight tracking-tight text-foreground",
        chromatic && "chromatic-text",
        className
      )}
      data-text={chromatic ? children?.toString() : undefined}
      {...props}
    >
      {children}
    </h3>
  )
)
NeonCardTitle.displayName = "NeonCardTitle"

/**
 * NeonCardDescription - Subtle description text
 */
const NeonCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-text-secondary leading-relaxed", className)}
    {...props}
  />
))
NeonCardDescription.displayName = "NeonCardDescription"

/**
 * NeonCardContent - Main content area
 */
const NeonCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
NeonCardContent.displayName = "NeonCardContent"

/**
 * NeonCardFooter - Footer with optional glowing border
 */
interface NeonCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  glowBorder?: boolean
}

const NeonCardFooter = React.forwardRef<HTMLDivElement, NeonCardFooterProps>(
  ({ className, glowBorder = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center p-6 pt-4",
        glowBorder && "border-t border-white/[0.08]",
        className
      )}
      {...props}
    />
  )
)
NeonCardFooter.displayName = "NeonCardFooter"

/**
 * NeonBadge - Small badge with neon glow
 */
interface NeonBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "pink" | "cyan" | "purple"
}

const NeonBadge = React.forwardRef<HTMLSpanElement, NeonBadgeProps>(
  ({ className, variant = "pink", children, ...props }, ref) => {
    const variantClasses = {
      pink: "neon-badge",
      cyan: "neon-badge-cyan",
      purple: "bg-gradient-to-r from-[hsl(var(--neon-purple)/0.2)] to-[hsl(var(--neon-pink)/0.15)] border border-[hsl(var(--neon-purple)/0.4)] shadow-[0_0_10px_hsl(var(--neon-purple)/0.2)]",
    }

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-foreground",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)
NeonBadge.displayName = "NeonBadge"

export {
  NeonCard,
  NeonCardHeader,
  NeonCardTitle,
  NeonCardDescription,
  NeonCardContent,
  NeonCardFooter,
  NeonBadge,
  neonCardVariants,
}
