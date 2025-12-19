"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function GradientGridDemo() {
  return (
    <div className="gradient-grid-bg min-h-screen flex flex-col items-center justify-center px-4">
      {/* Content overlay */}
      <div className="relative z-10 text-center space-y-6 max-w-2xl">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white">
            Gradient Grid Background
          </h1>
          <p className="text-xl text-text-secondary">
            Static premium gradient with pink-dominant grid pattern
          </p>
        </div>

        <div className="space-y-3 text-left bg-bg-secondary/50 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-primary">Features:</h2>
          <ul className="space-y-2 text-text-secondary text-sm">
            <li>✦ No animations - clean static background</li>
            <li>✦ Pink-dominant grid (primary color focus)</li>
            <li>✦ Subtle cyan accents for depth</li>
            <li>✦ Lighter black base (8% → 12% lightness gradient)</li>
            <li>✦ Radial gradient highlights at 20/30, 80/70 positions</li>
            <li>✦ Fixed background attachment for parallax effect</li>
            <li>✦ Two grid scales: 80px (primary) and 160px (secondary)</li>
          </ul>
        </div>

        <div className="pt-4">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              ← Back to Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid reference lines (optional visual aid) */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(0deg, transparent 24%, rgba(255,0,0,.05) 25%, rgba(255,0,0,.05) 26%, transparent 27%, transparent 74%, rgba(255,0,0,.05) 75%, rgba(255,0,0,.05) 76%, transparent 77%, transparent),
              linear-gradient(90deg, transparent 24%, rgba(255,0,0,.05) 25%, rgba(255,0,0,.05) 26%, transparent 27%, transparent 74%, rgba(255,0,0,.05) 75%, rgba(255,0,0,.05) 76%, transparent 77%, transparent)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>
    </div>
  )
}
