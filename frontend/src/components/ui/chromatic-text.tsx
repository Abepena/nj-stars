"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * ChromaticText - Opus Design System
 *
 * Creates a chromatic aberration (RGB split) effect on text.
 * Inspired by glitch aesthetics, gaming UIs, and neon signage.
 *
 * The effect works by layering pseudo-elements with offset colors:
 * - Main text: Pure white
 * - ::before: Cyan layer, clipped to top half, offset left
 * - ::after: Pink layer, clipped to bottom half, offset right
 *
 * This creates the illusion of misregistered color channels,
 * similar to old CRT monitors or VHS artifacts.
 */

const chromaticTextVariants = cva(
  "relative inline-block font-bold text-foreground",
  {
    variants: {
      intensity: {
        subtle: "chromatic-subtle",
        medium: "chromatic-text-static",
        strong: "chromatic-text",
        extreme: "chromatic-extreme",
      },
      glow: {
        none: "",
        pink: "neon-text-pink",
        cyan: "neon-text-cyan",
        dual: "[text-shadow:0_0_20px_hsl(var(--neon-pink)/0.5),-4px_0_30px_hsl(var(--neon-cyan)/0.4),4px_0_30px_hsl(var(--neon-pink)/0.4)]",
      },
      size: {
        sm: "text-lg md:text-xl",
        md: "text-2xl md:text-3xl",
        lg: "text-4xl md:text-5xl",
        xl: "text-5xl md:text-6xl lg:text-7xl",
        "2xl": "text-6xl md:text-7xl lg:text-8xl",
      },
    },
    defaultVariants: {
      intensity: "medium",
      glow: "none",
      size: "lg",
    },
  }
)

export interface ChromaticTextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof chromaticTextVariants> {
  /** The element type to render */
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "p"
  /** Disable animation (static chromatic effect) */
  static?: boolean
}

/**
 * ChromaticText creates a glitch-style text effect with RGB color separation.
 *
 * @example
 * ```tsx
 * <ChromaticText as="h1" intensity="strong" glow="dual" size="xl">
 *   GAME ON
 * </ChromaticText>
 * ```
 */
function ChromaticText({
  className,
  intensity,
  glow,
  size,
  as: Component = "span",
  static: isStatic = false,
  children,
  ...props
}: ChromaticTextProps) {
  // For the chromatic effect to work, we need to pass the text content
  // as a data attribute so CSS ::before and ::after can access it
  const textContent = typeof children === "string" ? children : undefined

  // Override intensity to static version if requested
  const effectiveIntensity =
    isStatic && intensity === "strong" ? "medium" : intensity

  return (
    <Component
      className={cn(
        chromaticTextVariants({ intensity: effectiveIntensity, glow, size }),
        "tracking-tight",
        className
      )}
      data-text={textContent}
      {...props}
    >
      {children}
    </Component>
  )
}
ChromaticText.displayName = "ChromaticText"

/**
 * GlitchText - More aggressive glitch effect with animation
 *
 * Uses CSS custom properties for fine-tuned control over the effect.
 * Includes random-feeling animation via keyframes.
 */
interface GlitchTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "p"
}

function GlitchText({
  className,
  as: Component = "span",
  children,
  ...props
}: GlitchTextProps) {
  const textContent = typeof children === "string" ? children : undefined

  return (
    <Component
      className={cn(
        "glitch-title text-4xl md:text-5xl lg:text-6xl font-bold",
        className
      )}
      data-text={textContent}
      {...props}
    >
      {children}
    </Component>
  )
}
GlitchText.displayName = "GlitchText"

/**
 * NeonText - Simple neon glow effect without chromatic aberration
 */
const neonTextVariants = cva("font-bold", {
  variants: {
    color: {
      pink: "text-[hsl(var(--neon-pink))] neon-text-pink",
      cyan: "text-[hsl(var(--neon-cyan))] neon-text-cyan",
      white: "text-foreground [text-shadow:0_0_10px_rgba(255,255,255,0.8),0_0_20px_rgba(255,255,255,0.5),0_0_40px_rgba(255,255,255,0.3)]",
    },
    pulse: {
      true: "animate-pulse",
      false: "",
    },
  },
  defaultVariants: {
    color: "pink",
    pulse: false,
  },
})

interface NeonTextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof neonTextVariants> {
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "p"
}

function NeonText({
  className,
  color,
  pulse,
  as: Component = "span",
  ...props
}: NeonTextProps) {
  return (
    <Component
      className={cn(neonTextVariants({ color, pulse }), className)}
      {...props}
    />
  )
}
NeonText.displayName = "NeonText"

export { ChromaticText, GlitchText, NeonText, chromaticTextVariants, neonTextVariants }
