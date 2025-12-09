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
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          // Once visible, stop observing
          if (ref.current) {
            observer.unobserve(ref.current)
          }
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [threshold])

  const getTransform = () => {
    if (isVisible) return "translate(0, 0)"

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

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
