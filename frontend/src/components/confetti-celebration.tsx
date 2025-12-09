"use client"

import { useEffect, useState } from "react"

interface ConfettiPiece {
  id: number
  x: number
  delay: number
  duration: number
  color: string
  width: number
  height: number
  rotation: number
  wobble: number
  shape: "rect" | "circle" | "strip"
}

// NJ Stars team colors - pink, teal, and accent colors
const TEAM_COLORS = [
  "#e84393",  // Hot pink (primary)
  "#00cec9",  // Teal (secondary)
  "#d63031",  // Red accent
  "#fdcb6e",  // Gold/amber
  "#ffffff",  // White
  "#e84393",  // Extra pink for more pink confetti
  "#00cec9",  // Extra teal for more teal confetti
]

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => {
    const shapes: ("rect" | "circle" | "strip")[] = ["rect", "circle", "strip"]
    const shape = shapes[Math.floor(Math.random() * shapes.length)]

    return {
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 1.2 + Math.random() * 1.5, // Faster: 1.2-2.7s instead of 2-4s
      color: TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)],
      width: shape === "strip" ? 3 : 6 + Math.random() * 6,
      height: shape === "strip" ? 12 + Math.random() * 8 : 6 + Math.random() * 6,
      rotation: Math.random() * 360,
      wobble: 15 + Math.random() * 30, // Horizontal wobble amount
      shape,
    }
  })
}

export function ConfettiCelebration() {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Generate more confetti pieces for denser effect
    setConfetti(generateConfetti(80))

    // Hide after animation completes
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 3500)

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute confetti-rain"
          style={{
            left: `${piece.x}%`,
            top: "-20px",
            width: `${piece.width}px`,
            height: `${piece.height}px`,
            backgroundColor: piece.color,
            borderRadius: piece.shape === "circle" ? "50%" : "2px",
            opacity: 0.9,
            ["--wobble" as string]: `${piece.wobble}px`,
            ["--rotation" as string]: `${piece.rotation}deg`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
