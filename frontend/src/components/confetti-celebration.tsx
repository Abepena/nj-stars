"use client"

import { useEffect, useState } from "react"

interface ConfettiPiece {
  id: number
  x: number
  delay: number
  duration: number
  color: string
  size: number
  rotation: number
}

// NJ Stars brand colors for confetti
const CONFETTI_COLORS = [
  "var(--primary)",      // Pink
  "var(--secondary)",    // Teal
  "var(--accent)",       // Hot pink
  "var(--tertiary)",     // Purple
  "#FFD700",             // Gold
  "#FFFFFF",             // White
]

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 8 + Math.random() * 8,
    rotation: Math.random() * 360,
  }))
}

export function ConfettiCelebration() {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Generate confetti on mount
    setConfetti(generateConfetti(50))

    // Hide after animation completes
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 4000)

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${piece.x}%`,
            top: "-20px",
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            transform: `rotate(${piece.rotation}deg)`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}

      {/* Burst effect from center */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`burst-${i}`}
            className="absolute w-3 h-3 rounded-full animate-burst"
            style={{
              backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              transform: `rotate(${i * 30}deg)`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
