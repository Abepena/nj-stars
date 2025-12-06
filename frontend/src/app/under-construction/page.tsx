"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export default function UnderConstructionPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating basketballs */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${4 + i * 0.5}s`,
            }}
          >
            <div className="w-8 h-8 md:w-12 md:h-12 opacity-20">
              <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
                <circle cx="50" cy="50" r="45" fill="currentColor" />
                <path
                  d="M50 5 Q50 50 50 95 M5 50 Q50 50 95 50 M15 15 Q50 50 85 85 M85 15 Q50 50 15 85"
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>
          </div>
        ))}

        {/* Construction pattern lines */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 35px,
                rgba(236, 72, 153, 0.3) 35px,
                rgba(236, 72, 153, 0.3) 70px
              )`
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* Logo */}
        <div className="mb-8 animate-bounce-slow">
          <Image
            src="/brand/logos/NJ Icon.svg"
            alt="NJ Stars"
            width={120}
            height={120}
            className="w-24 h-24 md:w-32 md:h-32"
          />
        </div>

        {/* Animated construction icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 md:w-48 md:h-48 relative">
            {/* Crane arm */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 origin-bottom animate-crane">
              <svg viewBox="0 0 100 120" className="w-20 h-24 md:w-28 md:h-32">
                {/* Crane tower */}
                <rect x="45" y="40" width="10" height="80" fill="hsl(var(--warning))" />
                {/* Crane arm */}
                <rect x="20" y="35" width="60" height="8" fill="hsl(var(--warning))" />
                {/* Crane hook line */}
                <line x1="70" y1="43" x2="70" y2="70" stroke="hsl(var(--text-secondary))" strokeWidth="2" />
                {/* Hook */}
                <path d="M65 70 Q65 80 70 80 Q75 80 75 70" fill="none" stroke="hsl(var(--text-secondary))" strokeWidth="3" />
                {/* Basketball being lifted */}
                <g className="animate-lift">
                  <circle cx="70" cy="95" r="12" fill="hsl(var(--primary))" />
                  <path
                    d="M70 83 Q70 95 70 107 M58 95 Q70 95 82 95"
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth="1.5"
                    fill="none"
                  />
                </g>
              </svg>
            </div>

            {/* Building blocks */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-secondary/80 animate-block-1 rounded-sm" />
              <div className="w-8 h-8 md:w-12 md:h-12 bg-primary/80 animate-block-2 rounded-sm" />
              <div className="w-8 h-8 md:w-12 md:h-12 bg-accent/80 animate-block-3 rounded-sm" />
            </div>
          </div>
        </div>

        {/* Text */}
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient">
          Under Construction
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-md">
          We're building something amazing for NJ Stars Elite.
          <br />
          Check back soon!
        </p>

        {/* Progress bar */}
        <div className="w-64 md:w-80 h-3 bg-muted rounded-full overflow-hidden mb-8">
          <div className="h-full bg-gradient-to-r from-primary to-secondary animate-progress rounded-full" />
        </div>

        {/* Social links placeholder */}
        <div className="flex gap-4 text-muted-foreground">
          <a
            href="https://instagram.com/njstarselite"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
        </div>

        {/* Coming soon date */}
        <p className="mt-8 text-sm text-muted-foreground/60">
          NJ Stars Elite &bull; Coming Soon 2025
        </p>
      </div>

      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes crane {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes lift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes block-1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes block-2 {
          0%, 100% { transform: translateY(0); }
          33% { transform: translateY(-8px); }
        }
        @keyframes block-3 {
          0%, 100% { transform: translateY(0); }
          66% { transform: translateY(-6px); }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 85%; }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animate-crane { animation: crane 4s ease-in-out infinite; }
        .animate-lift { animation: lift 2s ease-in-out infinite; }
        .animate-block-1 { animation: block-1 1.5s ease-in-out infinite; }
        .animate-block-2 { animation: block-2 1.8s ease-in-out infinite 0.3s; }
        .animate-block-3 { animation: block-3 2s ease-in-out infinite 0.6s; }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-progress { animation: progress 3s ease-out forwards; }
      `}</style>
    </div>
  )
}
