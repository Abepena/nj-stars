"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface FadeInSectionProps {
  children: React.ReactNode
  className?: string
  /** Delay before animation starts (in ms) */
  delay?: number
  /** Direction to fade in from */
  direction?: "up" | "down" | "left" | "right"
  /** How far to translate from (in px) */
  distance?: number
  /** Duration of the animation (in ms) */
  duration?: number
  /** Threshold for intersection observer (0-1) */
  threshold?: number
}

/**
 * Wrapper component that fades in children when they enter the viewport.
 * Uses Intersection Observer for performant scroll-based animations.
 * Content is visible by default (for SSR/SEO), animation is a progressive enhancement.
 *
 * @example
 * <FadeInSection direction="up" delay={200}>
 *   <h2>This will fade in from below</h2>
 * </FadeInSection>
 */
export function FadeInSection({
  children,
  className,
  delay = 0,
  direction = "up",
  distance = 40,
  duration = 600,
  threshold = 0.1,
}: FadeInSectionProps) {
  // Track animation state: 'initial' (server/before mount), 'ready' (can animate), 'visible' (animated in)
  const [animationState, setAnimationState] = useState<'initial' | 'ready' | 'visible'>('initial')
  const ref = useRef<HTMLDivElement>(null)
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    // Skip if already triggered
    if (hasTriggeredRef.current) return

    const element = ref.current
    if (!element) return

    // Check if element is already in viewport on mount
    const rect = element.getBoundingClientRect()
    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0

    if (isInViewport) {
      // Element is visible on mount - animate immediately
      // First set to 'ready' to enable transition, then to 'visible'
      setAnimationState('ready')
      // Use requestAnimationFrame to ensure the 'ready' state renders first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          hasTriggeredRef.current = true
          setAnimationState('visible')
        })
      })
      return
    }

    // Element is below the fold - set up intersection observer
    setAnimationState('ready')

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true
          setAnimationState('visible')
          observer.disconnect()
        }
      },
      { threshold, rootMargin: '50px' }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold])

  const getTransform = () => {
    // Initial state (server) or visible: no transform
    if (animationState === 'initial' || animationState === 'visible') {
      return "translate(0, 0)"
    }

    // Ready to animate: apply initial offset
    switch (direction) {
      case "up":
        return `translateY(${distance}px)`
      case "down":
        return `translateY(-${distance}px)`
      case "left":
        return `translateX(${distance}px)`
      case "right":
        return `translateX(-${distance}px)`
      default:
        return `translateY(${distance}px)`
    }
  }

  // Calculate opacity: hidden only when in 'ready' state (waiting to animate)
  const opacity = animationState === 'ready' ? 0 : 1

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity,
        transform: getTransform(),
        // Only apply transition after initial render
        transition: animationState !== 'initial'
          ? `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`
          : undefined,
      }}
    >
      {children}
    </div>
  )
}
