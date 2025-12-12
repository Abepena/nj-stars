"use client"

import { useEffect, useRef } from "react"

interface ShootingStarsProps {
  className?: string
  starCount?: number
  minSpeed?: number
  maxSpeed?: number
  minDelay?: number
  maxDelay?: number
}

export function ShootingStars({
  className = "",
  starCount = 20,
  minSpeed = 2,
  maxSpeed = 6,
  minDelay = 0,
  maxDelay = 8,
}: ShootingStarsProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Clear any existing stars
    container.innerHTML = ""

    // Create shooting stars
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement("div")
      star.className = "shooting-star"

      // Random starting position (top-right area for diagonal travel to bottom-left)
      const startX = Math.random() * 100 + 20 // Start from 20-120% (off-screen right)
      const startY = Math.random() * 50 - 20 // Start from -20% to 30% (upper area)

      // Random animation properties
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed)
      const delay = minDelay + Math.random() * (maxDelay - minDelay)
      const size = 1 + Math.random() * 2
      const tailLength = 80 + Math.random() * 120

      // The star (bright point at bottom-left of the streak)
      star.style.cssText = `
        position: absolute;
        left: ${startX}%;
        top: ${startY}%;
        width: ${size}px;
        height: ${size}px;
        background: white;
        border-radius: 50%;
        animation: shootingStar ${speed}s linear ${delay}s infinite;
        opacity: 0;
        box-shadow:
          0 0 ${size * 2}px rgba(255, 255, 255, 0.8),
          0 0 ${size * 4}px rgba(255, 255, 255, 0.4);
      `

      // Create tail - extends from star toward top-right (behind the direction of motion)
      // Star moves to bottom-left, so tail trails toward top-right
      const tail = document.createElement("div")
      tail.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: ${tailLength}px;
        height: 2px;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.3), transparent);
        transform: translateY(-50%) rotate(-45deg);
        transform-origin: left center;
        border-radius: 2px;
      `
      star.appendChild(tail)

      container.appendChild(star)
    }
  }, [starCount, minSpeed, maxSpeed, minDelay, maxDelay])

  return (
    <>
      <style jsx global>{`
        @keyframes shootingStar {
          0% {
            opacity: 0;
            transform: translate(0, 0);
          }
          2% {
            opacity: 1;
          }
          70% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translate(-150vw, 150vh);
          }
        }
      `}</style>
      <div
        ref={containerRef}
        className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
        aria-hidden="true"
      />
    </>
  )
}
